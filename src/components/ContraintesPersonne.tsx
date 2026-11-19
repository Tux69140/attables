/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Ce qu'une personne ne mange pas : liste de ses éléments (contraintes propres à elle seule),
 * feuille « + Ajouter » et édition d'un élément.
 */
import React, { useEffect, useRef, useState } from 'react';
import type { NomIcone } from '../icones/donnees';
import type { ContrainteConvive } from '../types/models';
import {
  ALLERGENES,
  allergeneDeReference,
  avecSaisieAutre,
  dejaPresent,
  estAutre,
  iconeContrainte,
  idAutre,
  libelleAllergene,
  libelleAutre,
  memeAllergene,
  REGIMES,
} from '../utils/allergenes';
import { normalizeForCompare } from '../utils/dishes';
import { ceQueNeMangePas } from '../utils/elision';
import { ChoixAllergenes, ChoixPictogramme } from './ChoixAllergenes';
import { Puces } from './Controles';
import { Icone } from './Icone';
import { IconAlert, IconClose, IconPlus } from './Icons';
import { BottomSheet } from './SharedUI';

/** Forme comparable d'un élément : champs dans un ordre fixe, sans pictogramme absent. */
export function formeElement(c: ContrainteConvive): ContrainteConvive {
  return {
    id: c.id,
    libelle: c.libelle,
    niveau: c.niveau,
    allergenes: c.allergenes,
    ...(c.icone ? { icone: c.icone } : {}),
  };
}

export const memesElements = (a: ContrainteConvive[], b: ContrainteConvive[]) =>
  JSON.stringify(a.map(formeElement)) === JSON.stringify(b.map(formeElement));

/** « viande, poissons » ; un sigle (FODMAP) garde ses capitales. */
const enMinuscule = (s: string) => (s.length > 1 && s[1] === s[1].toLocaleLowerCase('fr') ? s[0].toLocaleLowerCase('fr') + s.slice(1) : s);
const listeAllergenes = (c: ContrainteConvive) => c.allergenes.map((a) => enMinuscule(libelleAllergene(a))).join(', ');

/** Le niveau en mots : « ⚠ Allergie » en rouge plein, « Évite » en bleu de préférence. */
const MotNiveau: React.FC<{ strict: boolean }> = ({ strict }) =>
  strict ? (
    <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--alerte)] text-[var(--on-alerte)] text-[13px] font-bold whitespace-nowrap">
      <IconAlert size={14} />
      Allergie
    </span>
  ) : (
    <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--pref-bg)] text-[var(--pref)] text-[13px] font-bold whitespace-nowrap">
      Évite
    </span>
  );

/** Section « Ce que Léa ne mange pas » : une ligne par élément, puis « + Ajouter ». */
export const ElementsPersonne: React.FC<{
  prenom: string;
  contraintes: ContrainteConvive[];
  onOuvrir: (c: ContrainteConvive) => void;
  onRetirer: (id: string) => void;
  onAjouter: () => void;
}> = ({ prenom, contraintes, onOuvrir, onRetirer, onAjouter }) => {
  const boutonAjouter = useRef<HTMLButtonElement>(null);
  // Le bouton « Retirer » disparaît avec sa ligne : le focus passe à « + Ajouter ».
  const [retrait, setRetrait] = useState(0);
  useEffect(() => {
    if (retrait > 0) boutonAjouter.current?.focus();
  }, [retrait]);

  return (
    <section aria-labelledby="titre-elements-personne" className="flex flex-col gap-2">
      <h3 id="titre-elements-personne" className="text-[14px] font-semibold text-[var(--ink-muted)]">
        {ceQueNeMangePas(prenom)}
      </h3>
      {contraintes.length === 0 ? (
        <p className="text-[14px] text-[var(--ink-muted)]">Rien de noté pour l’instant.</p>
      ) : (
        <ul className="rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] divide-y divide-[var(--border)]">
          {contraintes.map((c) => {
            const strict = c.niveau === 'strict';
            const liste = c.allergenes.length > 1 ? listeAllergenes(c) : '';
            return (
              <li key={c.id} className="flex items-stretch">
                <button
                  type="button"
                  onClick={() => onOuvrir(c)}
                  aria-label={`${c.libelle}${liste ? ` (${liste})` : ''}, ${strict ? 'allergie' : 'évite'}`}
                  className="flex-1 min-w-0 min-h-[52px] pl-3 pr-1 py-2 flex items-center gap-2.5 text-left"
                >
                  <Icone nom={iconeContrainte(c)} size={20} className="shrink-0 text-[var(--primary-ink)]" />
                  <span className="flex-1 min-w-0 break-words">
                    <span className="block text-[15px] font-semibold text-[var(--ink)] leading-snug">{c.libelle}</span>
                    {liste && <span className="block text-[13px] text-[var(--ink-muted)] leading-snug">{liste}</span>}
                  </span>
                  <MotNiveau strict={strict} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRetirer(c.id);
                    setRetrait((n) => n + 1);
                  }}
                  aria-label={`Retirer ${c.libelle}`}
                  className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[var(--ink-muted)]"
                >
                  <IconClose size={18} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <button
        ref={boutonAjouter}
        type="button"
        onClick={onAjouter}
        className="self-start min-h-[44px] px-3.5 rounded-xl border border-dashed border-[var(--primary-ink)] text-[var(--primary-ink)] font-semibold text-[15px] inline-flex items-center gap-2"
      >
        <IconPlus size={18} />
        Ajouter
      </button>
    </section>
  );
};

/** Édition d'un élément d'une personne : libellé, niveau, allergènes concernés et pictogramme. */
export const FormulaireElement: React.FC<{
  valeur: ContrainteConvive;
  onChange: (c: ContrainteConvive) => void;
  libresConnus: string[];
  /** Texte du champ « Autre… », tenu par la feuille pour être pris en compte à l'enregistrement. */
  autre: string;
  onAutreChange: (v: string) => void;
  onValider: () => void;
}> = ({ valeur, onChange, libresConnus, autre, onAutreChange, onValider }) => {
  // Les aliments libres de l'élément restent proposés, même décochés.
  const [libres] = useState(() => {
    const propres = valeur.allergenes.filter(estAutre);
    return [...propres, ...libresConnus.filter((l) => !propres.some((p) => memeAllergene(p, l)))];
  });
  const changer = (modif: Partial<ContrainteConvive>) => onChange({ ...valeur, ...modif });
  const changerIcone = (icone: NomIcone | undefined) => {
    const { icone: _ancienne, ...reste } = valeur;
    onChange(icone ? { ...reste, icone } : reste);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onValider();
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <label htmlFor="contrainte-libelle" className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-1">
          Libellé
        </label>
        <input
          id="contrainte-libelle"
          type="text"
          value={valeur.libelle}
          onChange={(e) => changer({ libelle: e.target.value })}
          className="w-full min-h-[46px] px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[15px] text-[var(--ink)] focus:outline-none focus:border-[var(--primary-ink)]"
        />
      </div>
      <Puces
        ariaLabel="Niveau"
        valeur={valeur.niveau}
        onChange={(niveau) => changer({ niveau })}
        options={[
          { id: 'strict', label: 'Allergie', icone: 'triangle-alert', ton: 'alerte' },
          { id: 'preference', label: 'Évite' },
        ]}
      />
      <div className="flex flex-col gap-2">
        <span className="text-[14px] font-semibold text-[var(--ink-muted)]">Allergènes concernés</span>
        <p className="text-[13px] text-[var(--ink-muted)] -mt-1">Un plat qui en contient déclenchera une alerte.</p>
        <ChoixAllergenes valeur={valeur.allergenes} onChange={(allergenes) => changer({ allergenes })} libresConnus={libres} autreLibre autre={autre} onAutreChange={onAutreChange} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[14px] font-semibold text-[var(--ink-muted)]">Pictogramme</span>
        <ChoixPictogramme valeur={valeur.icone} auto={iconeContrainte({ allergenes: valeur.allergenes })} onChange={changerIcone} />
      </div>
      <button
        type="submit"
        className="min-h-[48px] w-full rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold text-[15px] active:scale-[0.98] transition-transform"
      >
        Valider
      </button>
    </form>
  );
};

/**
 * Feuille d'édition d'un élément, montée seulement quand elle est ouverte. Valider ou fermer
 * (Retour, voile, Échap, Fermer) applique les changements à la fiche affichée.
 */
export const FeuilleElement: React.FC<{
  element: ContrainteConvive;
  libresConnus: string[];
  onAppliquer: (c: ContrainteConvive) => void;
  onFermer: () => void;
}> = ({ element, libresConnus, onAppliquer, onFermer }) => {
  const [brouillon, setBrouillon] = useState(element);
  const [autre, setAutre] = useState('');
  const fermer = () => {
    // Un texte resté dans « Autre… » compte comme si « Ajouter » avait été touché.
    const allergenes = avecSaisieAutre(brouillon.allergenes, autre, libresConnus);
    const final = formeElement({ ...brouillon, allergenes, libelle: brouillon.libelle.trim() || element.libelle });
    if (!memesElements([final], [element])) onAppliquer(final);
    onFermer();
  };
  return (
    <BottomSheet open title={`Modifier « ${element.libelle} »`} zClass="z-[60]" onClose={fermer}>
      <FormulaireElement
        valeur={brouillon}
        onChange={setBrouillon}
        libresConnus={libresConnus}
        autre={autre}
        onAutreChange={setAutre}
        onValider={fermer}
      />
    </BottomSheet>
  );
};

interface Choix {
  libelle: string;
  allergenes: string[];
  icone?: NomIcone;
}

const TuileChoix: React.FC<{ icone: NomIcone; libelle: string; onClick: () => void }> = ({ icone, libelle, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="min-h-[64px] px-1 py-2 rounded-xl border bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--ink)] flex flex-col items-center justify-center gap-1 text-center active:scale-[0.98] transition-transform"
  >
    <Icone nom={icone} size={22} className="text-[var(--primary-ink)]" />
    <span className="text-[13px] font-semibold leading-tight break-words max-w-full">{libelle}</span>
  </button>
);

const GroupeChoix: React.FC<{ titre: string; choix: Choix[]; onChoisir: (c: Choix) => void }> = ({ titre, choix, onChoisir }) =>
  choix.length === 0 ? null : (
    <div className="flex flex-col gap-2">
      <h3 tabIndex={-1} className="text-[14px] font-bold text-[var(--ink-muted)] focus:outline-none">
        {titre}
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {choix.map((c) => (
          <TuileChoix key={c.allergenes.join('|') + c.libelle} icone={iconeContrainte(c)} libelle={c.libelle} onClick={() => onChoisir(c)} />
        ))}
      </div>
    </div>
  );

/**
 * Feuille « + Ajouter », montée seulement quand elle est ouverte : un aliment, un régime ou « Autre… »,
 * puis le niveau (« Allergie » ou « Évite », sans présélection). Un choix déjà présent n'est pas reproposé.
 */
export const FeuilleAjoutElement: React.FC<{
  prenom: string;
  contraintes: ContrainteConvive[];
  libresConnus: string[];
  onAjouter: (c: ContrainteConvive) => void;
  onFermer: () => void;
}> = ({ prenom, contraintes, libresConnus, onAjouter, onFermer }) => {
  const [choix, setChoix] = useState<Choix | null>(null);
  const [autre, setAutre] = useState('');
  const [erreur, setErreur] = useState('');
  const titreNiveau = useRef<HTMLHeadingElement>(null);
  const grille = useRef<HTMLDivElement>(null);
  const [retourGrille, setRetourGrille] = useState(false);

  // Le bouton touché disparaît avec la grille : le focus va au titre de l'étape suivante, et inversement
  // (au premier titre de la grille, pas au champ « Autre… » qui ouvrirait le clavier).
  useEffect(() => {
    if (choix) titreNiveau.current?.focus();
    else if (retourGrille) grille.current?.querySelector('h3')?.focus();
  }, [choix, retourGrille]);

  const libre = (c: Choix) => !dejaPresent(contraintes, c.allergenes);
  const depuisAllergene = (groupe: 'reglementaire' | 'autre'): Choix[] =>
    ALLERGENES.filter((a) => a.groupe === groupe).map((a) => ({ libelle: a.libelle, allergenes: [a.id] })).filter(libre);
  const regimes: Choix[] = REGIMES.map((r) => ({ libelle: r.libelle, allergenes: r.allergenes, icone: r.icone })).filter(libre);
  const connus: Choix[] = libresConnus.map((id) => ({ libelle: libelleAutre(id), allergenes: [id] })).filter(libre);

  const choisirAutre = (e: React.FormEvent) => {
    e.preventDefault();
    const texte = autre.trim();
    if (!texte) return;
    const cle = normalizeForCompare(texte);
    const idReference = allergeneDeReference(texte);
    const reference = ALLERGENES.find((a) => a.id === idReference);
    const regime = REGIMES.find((r) => normalizeForCompare(r.libelle) === cle);
    const connu = libresConnus.find((l) => memeAllergene(l, idAutre(texte)));
    const c: Choix = reference
      ? { libelle: reference.libelle, allergenes: [reference.id] }
      : regime
        ? { libelle: regime.libelle, allergenes: regime.allergenes, icone: regime.icone }
        : { libelle: libelleAutre(connu ?? idAutre(texte)), allergenes: [connu ?? idAutre(texte)] };
    if (!libre(c)) {
      setErreur(`« ${c.libelle} » est déjà dans la liste.`);
      return;
    }
    setChoix(c);
  };

  const ajouter = (niveau: ContrainteConvive['niveau']) => {
    if (!choix) return;
    onAjouter({
      id: `ctr-${Date.now()}`,
      libelle: choix.libelle,
      niveau,
      allergenes: choix.allergenes,
      ...(choix.icone ? { icone: choix.icone } : {}),
    });
    onFermer();
  };

  return (
    <BottomSheet open title={`Ajouter pour ${prenom || 'cette personne'}`} zClass="z-[60]" onClose={onFermer}>
      {choix ? (
        <div className="flex flex-col gap-3 pb-2">
          <h3
            ref={titreNiveau}
            tabIndex={-1}
            className="flex items-center gap-2.5 text-[17px] font-bold text-[var(--ink)] focus:outline-none"
          >
            <Icone nom={iconeContrainte(choix)} size={22} className="shrink-0 text-[var(--primary-ink)]" />
            <span className="break-words min-w-0">{choix.libelle}</span>
          </h3>
          {choix.allergenes.length > 1 && (
            <p className="text-[14px] text-[var(--ink-muted)] -mt-1">{choix.allergenes.map((a) => enMinuscule(libelleAllergene(a))).join(', ')}</p>
          )}
          <p className="text-[14px] text-[var(--ink-muted)]">
            Une allergie déclenche une alerte rouge ; « Évite » reste une simple information.
          </p>
          <button
            type="button"
            onClick={() => ajouter('strict')}
            className="min-h-[52px] w-full rounded-xl bg-[var(--alerte)] text-[var(--on-alerte)] font-bold text-[16px] inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <IconAlert size={18} />
            Allergie
          </button>
          <button
            type="button"
            onClick={() => ajouter('preference')}
            className="min-h-[52px] w-full rounded-xl bg-[var(--pref-bg)] text-[var(--pref)] font-bold text-[16px] active:scale-[0.98] transition-transform"
          >
            Évite
          </button>
          <button
            type="button"
            onClick={() => {
              setChoix(null);
              setRetourGrille(true);
            }}
            className="self-center min-h-[44px] px-3.5 rounded-xl text-[15px] font-semibold text-[var(--ink-muted)]"
          >
            Choisir autre chose
          </button>
        </div>
      ) : (
        <div ref={grille} className="flex flex-col gap-4 pb-2">
          <GroupeChoix titre="Allergènes" choix={depuisAllergene('reglementaire')} onChoisir={setChoix} />
          <GroupeChoix titre="Autres aliments" choix={depuisAllergene('autre')} onChoisir={setChoix} />
          <GroupeChoix titre="Régimes" choix={regimes} onChoisir={setChoix} />
          <GroupeChoix titre="Déjà notés ailleurs" choix={connus} onChoisir={setChoix} />
          <form onSubmit={choisirAutre} className="flex flex-col gap-1">
            <label htmlFor="element-autre" className="text-[14px] font-bold text-[var(--ink-muted)]">
              Autre…
            </label>
            <div className="flex gap-2">
              <input
                id="element-autre"
                type="text"
                value={autre}
                onChange={(e) => {
                  setAutre(e.target.value);
                  setErreur('');
                }}
                placeholder="Ex. Kiwi, coriandre…"
                aria-invalid={erreur ? true : undefined}
                aria-describedby={erreur ? 'element-autre-erreur' : undefined}
                className="flex-1 min-w-0 min-h-[46px] px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[15px] text-[var(--ink)] focus:outline-none focus:border-[var(--primary-ink)]"
              />
              <button
                type="submit"
                className="shrink-0 min-h-[46px] px-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--ink)] font-semibold text-[15px]"
              >
                Choisir
              </button>
            </div>
            {erreur && (
              <p id="element-autre-erreur" className="text-[14px] font-semibold text-[var(--error)]">
                {erreur}
              </p>
            )}
          </form>
        </div>
      )}
    </BottomSheet>
  );
};
