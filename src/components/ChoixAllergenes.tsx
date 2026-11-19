/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import React, { useState } from 'react';
import type { NomIcone } from '../icones/donnees';
import {
  choixAllergenes,
  estAutre,
  iconeAllergene,
  idDepuisSaisieAutre,
  libelleAllergene,
  memeAllergene,
  PICTOS_CONTRAINTE,
} from '../utils/allergenes';
import { Icone } from './Icone';
import { IconChevronDown } from './Icons';

const Tuile: React.FC<{ icone: NomIcone; libelle: string; choisie: boolean; onClick: () => void; radio?: boolean }> = ({
  icone,
  libelle,
  choisie,
  onClick,
  radio,
}) => (
  <button
    type="button"
    onClick={onClick}
    {...(radio ? { role: 'radio', 'aria-checked': choisie } : { 'aria-pressed': choisie })}
    className={`min-h-[64px] px-1 py-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-colors ${
      choisie
        ? 'bg-[var(--ink)] border-[var(--ink)] text-[var(--card)]'
        : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--ink)]'
    }`}
  >
    <Icone nom={icone} size={22} className={choisie ? undefined : 'text-[var(--primary-ink)]'} />
    <span className="text-[13px] font-semibold leading-tight">{libelle}</span>
  </button>
);

const Groupe: React.FC<{ titre: string; children: React.ReactNode }> = ({ titre, children }) => (
  <div className="flex flex-col gap-2">
    <span className="text-[13px] font-bold text-[var(--ink-muted)]">{titre}</span>
    <div className="grille-tuiles">{children}</div>
  </div>
);

/** Tuile pleine largeur « Aucun de ces allergènes » : exclusive, elle remplace toute la sélection. */
const TuileAucun: React.FC<{ choisie: boolean; onClick: () => void }> = ({ choisie, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={choisie}
    className={`min-h-[52px] w-full px-3.5 py-2 rounded-xl border flex items-center justify-center gap-2 text-center transition-colors ${
      choisie
        ? 'bg-[var(--ink)] border-[var(--ink)] text-[var(--card)]'
        : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--ink)]'
    }`}
  >
    <Icone nom="check" size={20} className={choisie ? undefined : 'text-[var(--primary-ink)]'} />
    <span className="text-[14px] font-semibold leading-tight">Aucun de ces allergènes</span>
  </button>
);

/**
 * Grille d'allergènes à cocher : référence, puis les aliments libres déjà connus.
 * `aucun` ajoute la tuile « Aucun de ces allergènes » (fiche de plat), exclusive des allergènes ;
 * `autreLibre` ajoute le champ « Autre… » qui coche l'allergène de référence qu'il désigne, sinon crée un aliment libre.
 */
export const ChoixAllergenes: React.FC<{
  valeur: string[];
  onChange: (v: string[]) => void;
  libresConnus: string[];
  replie?: boolean;
  aucun?: { valeur: boolean; onChange: (v: boolean) => void };
  autreLibre?: boolean;
  /** Texte du champ « Autre… », tenu par le parent pour qu'un texte non ajouté soit pris en compte à l'enregistrement (`avecSaisieAutre`). */
  autre?: string;
  onAutreChange?: (v: string) => void;
}> = ({ valeur, onChange, libresConnus, replie = false, aucun, autreLibre = false, autre: autreParent, onAutreChange }) => {
  const [ouvert, setOuvert] = useState(!replie);
  const [ajoutes, setAjoutes] = useState<string[]>([]);
  const [autreLocal, setAutreLocal] = useState('');
  const autre = autreParent ?? autreLocal;
  const setAutre = onAutreChange ?? setAutreLocal;
  // Un aliment libre ajouté ici reste proposé, même décoché.
  const connus = [...libresConnus];
  for (const id of ajoutes) if (!connus.some((c) => memeAllergene(c, id))) connus.push(id);
  const { reglementaires, autres, libres } = choixAllergenes(connus);
  // Un aliment libre écrit autrement (casse, accents) compte comme le même.
  const choisi = (id: string) => valeur.some((v) => memeAllergene(v, id));
  const changer = (v: string[]) => {
    if (v.length > 0 && aucun?.valeur) aucun.onChange(false);
    onChange(v);
  };
  const basculer = (id: string) => changer(choisi(id) ? valeur.filter((v) => !memeAllergene(v, id)) : [...valeur, id]);
  const basculerAucun = () => {
    if (!aucun) return;
    if (aucun.valeur) {
      aucun.onChange(false);
      return;
    }
    onChange([]);
    aucun.onChange(true);
  };
  const ajouterAutre = () => {
    const texte = autre.trim();
    if (!texte) return;
    const id = idDepuisSaisieAutre(texte, connus);
    if (estAutre(id) && !connus.some((c) => memeAllergene(c, id))) setAjoutes((prev) => [...prev, id]);
    if (!choisi(id)) changer([...valeur, id]);
    setAutre('');
  };

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        aria-expanded={false}
        className="w-full min-h-[48px] px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[15px] font-semibold text-[var(--ink)] flex items-center justify-between gap-2"
      >
        <span>
          Allergènes (facultatif)
          {aucun?.valeur && <span className="text-[var(--ink-muted)] font-normal"> · aucun</span>}
          {valeur.length > 0 && <span className="text-[var(--ink-muted)] font-normal"> · {valeur.length} choisi{valeur.length > 1 ? 's' : ''}</span>}
        </span>
        <IconChevronDown size={18} className="text-[var(--ink-muted)]" />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {aucun && <TuileAucun choisie={aucun.valeur} onClick={basculerAucun} />}
      <Groupe titre="Allergènes réglementaires">
        {reglementaires.map((a) => (
          <Tuile key={a.id} icone={a.icone} libelle={a.libelle} choisie={choisi(a.id)} onClick={() => basculer(a.id)} />
        ))}
      </Groupe>
      <Groupe titre="Autres">
        {autres.map((a) => (
          <Tuile key={a.id} icone={a.icone} libelle={a.libelle} choisie={choisi(a.id)} onClick={() => basculer(a.id)} />
        ))}
      </Groupe>
      {libres.length > 0 && (
        <Groupe titre="Déjà notés ailleurs">
          {libres.map((id) => (
            <Tuile key={id} icone={iconeAllergene(id)} libelle={libelleAllergene(id)} choisie={choisi(id)} onClick={() => basculer(id)} />
          ))}
        </Groupe>
      )}
      {autreLibre && (
        // Pas de <form> : la grille se trouve déjà dans un formulaire. Entrée ajoute l'aliment, sans enregistrer la fiche.
        <div className="flex flex-col gap-1">
          <label htmlFor="allergene-autre" className="text-[13px] font-bold text-[var(--ink-muted)]">
            Autre…
          </label>
          <div className="flex gap-2">
            <input
              id="allergene-autre"
              type="text"
              value={autre}
              onChange={(e) => setAutre(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                ajouterAutre();
              }}
              placeholder="Ex. Kiwi, coriandre…"
              className="flex-1 min-w-0 min-h-[46px] px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[15px] text-[var(--ink)] focus:outline-none focus:border-[var(--primary-ink)]"
            />
            <button
              type="button"
              onClick={ajouterAutre}
              className="shrink-0 min-h-[46px] px-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--ink)] font-semibold text-[15px]"
            >
              Ajouter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/** Grille « Pictogramme » d'une contrainte : choix unique, ou automatique (déduit des allergènes liés). */
export const ChoixPictogramme: React.FC<{
  valeur: NomIcone | undefined;
  auto: NomIcone;
  onChange: (v: NomIcone | undefined) => void;
}> = ({ valeur, auto, onChange }) => (
  <div role="radiogroup" aria-label="Pictogramme" className="grille-tuiles">
    <Tuile icone={auto} libelle="Automatique" choisie={valeur === undefined} onClick={() => onChange(undefined)} radio />
    {PICTOS_CONTRAINTE.map((p) => (
      <Tuile key={p.icone} icone={p.icone} libelle={p.libelle} choisie={valeur === p.icone} onClick={() => onChange(p.icone)} radio />
    ))}
  </div>
);
