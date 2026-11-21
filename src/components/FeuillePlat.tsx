/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import React, { useImperativeHandle, useRef, useState } from 'react';
import { ICONE_SERVICE } from '../icones/services';
import { COURSE_KEYS, COURSE_LABELS, type CourseKey } from '../types/models';
import { avecSaisieAutre } from '../utils/allergenes';
import { formatDishInput } from '../utils/dishes';
import { cleDePlat, platsProches, type PlatConnu, type ValeursPlat } from '../utils/plats';
import { ChoixAllergenes } from './ChoixAllergenes';
import { Icone } from './Icone';
import { BottomSheet } from './SharedUI';

export type { ValeursPlat };

interface FormulairePlatProps {
  initial: ValeursPlat;
  /** Faux pour un plat servi ou au menu d'une invitation à venir : son nom vient des menus. */
  nomModifiable: boolean;
  allergenesOuverts: boolean;
  /** Clé du plat modifié (absente pour un nouveau plat). */
  cleActuelle?: string;
  liste: PlatConnu[];
  /** Aliments libres déjà portés par des personnes ou des plats. */
  libresConnus: string[];
  erreur?: string;
  libelleBouton: string;
  /** Chaque enregistrement est suivi du bandeau « Plat enregistré · Annuler ». Renvoie `false` si la feuille reste ouverte (erreur affichée). */
  onEnregistrer: (v: ValeursPlat) => boolean | void;
  onOuvrirPlat: (cle: string) => void;
}

/** Ce que la feuille autour du formulaire peut lui demander. */
interface PoigneePlat {
  /**
   * Fermeture (Retour, voile, Échap, Fermer) : fiche inchangée ou invalide (sans nom ni service) → `onFermer` ;
   * sinon enregistrement, comme « Enregistrer ». Renvoie `false` si la feuille reste ouverte (erreur affichée).
   */
  fermer: () => boolean;
}

const memesListes = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((x) => b.includes(x));

const FormulairePlat: React.FC<FormulairePlatProps & { onFermer: () => void; ref?: React.Ref<PoigneePlat> }> = ({
  initial,
  nomModifiable,
  allergenesOuverts,
  cleActuelle,
  liste,
  libresConnus,
  erreur,
  libelleBouton,
  onEnregistrer,
  onOuvrirPlat,
  onFermer,
  ref,
}) => {
  const [libelle, setLibelle] = useState(initial.libelle);
  const [services, setServices] = useState<CourseKey[]>(initial.services);
  const [allergenes, setAllergenes] = useState<string[]>(initial.allergenes);
  const [sansAllergene, setSansAllergene] = useState(initial.sansAllergene);
  const [autre, setAutre] = useState('');

  const cle = cleDePlat(libelle);
  const connu = !cleActuelle && cle ? liste.find((p) => p.cle === cle) : undefined;
  const proches = nomModifiable && !connu ? platsProches(liste.filter((p) => p.cle !== cleActuelle), libelle) : [];
  const valide = Boolean(cle) && services.length > 0;

  const basculer = (k: CourseKey) =>
    setServices((prev) => (prev.includes(k) ? prev.filter((s) => s !== k) : COURSE_KEYS.filter((c) => c === k || prev.includes(c))));

  // Un texte resté dans « Autre… » compte comme si « Ajouter » avait été touché.
  const construire = (): ValeursPlat => {
    const finaux = avecSaisieAutre(allergenes, autre, libresConnus);
    return { libelle: formatDishInput(libelle), services, allergenes: finaux, sansAllergene: sansAllergene && finaux.length === 0 };
  };

  const inchangee = (v: ValeursPlat) =>
    v.libelle === formatDishInput(initial.libelle) &&
    memesListes(v.services, initial.services) &&
    memesListes(v.allergenes, initial.allergenes) &&
    v.sansAllergene === (initial.sansAllergene && initial.allergenes.length === 0);

  useImperativeHandle(ref, () => ({
    fermer: () => {
      const v = construire();
      if (!valide || inchangee(v)) {
        onFermer();
        return true;
      }
      return onEnregistrer(v) !== false;
    },
  }));

  const enregistrer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valide) return;
    onEnregistrer(construire());
  };

  return (
    <form onSubmit={enregistrer} className="flex flex-col gap-4">
      {nomModifiable && (
        <div>
          <label htmlFor="plat-nom" className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-1">
            Nom du plat
          </label>
          <input
            id="plat-nom"
            type="text"
            required
            value={libelle}
            onChange={(e) => setLibelle(e.target.value)}
            onBlur={() => setLibelle((v) => formatDishInput(v))}
            className="w-full min-h-[46px] px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[15px] text-[var(--ink)] focus:outline-none focus:border-[var(--primary-ink)]"
          />
          {connu && (
            <p className="mt-1.5 text-[14px] text-[var(--ink-muted)]">
              « {connu.libelle} » est déjà connu : sa fiche sera complétée.
            </p>
          )}
          {proches.length === 1 && (
            <p className="mt-1.5 text-[14px] text-[var(--ink)] flex flex-wrap items-center gap-x-2">
              <span>Vous voulez dire « {proches[0].libelle} » ?</span>
              <BoutonVoirPlat plat={proches[0]} onOuvrirPlat={onOuvrirPlat} />
            </p>
          )}
          {proches.length > 1 && (
            <div className="mt-1.5 text-[14px] text-[var(--ink)]">
              <p id="plats-proches">Vous voulez dire :</p>
              <ul aria-labelledby="plats-proches" className="mt-0.5">
                {proches.map((p) => (
                  <li key={p.cle} className="min-h-[44px] flex flex-wrap items-center justify-between gap-x-3">
                    <span className="min-w-0">« {p.libelle} »</span>
                    <BoutonVoirPlat plat={p} onOuvrirPlat={onOuvrirPlat} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-[14px] font-semibold text-[var(--ink-muted)]">Pour quel service ? (un ou plusieurs)</span>
        <div role="group" aria-label="Services" className="flex flex-wrap gap-2">
          {COURSE_KEYS.map((k) => {
            const choisi = services.includes(k);
            return (
              <button
                key={k}
                type="button"
                aria-pressed={choisi}
                onClick={() => basculer(k)}
                className={`min-h-[44px] px-3.5 rounded-full border text-[14px] font-semibold flex items-center gap-1.5 transition-colors ${
                  choisi
                    ? 'bg-[var(--ink)] border-[var(--ink)] text-[var(--card)]'
                    : 'bg-[var(--card)] border-[var(--border)] text-[var(--ink)]'
                }`}
              >
                <Icone nom={ICONE_SERVICE[k]} size={16} />
                {COURSE_LABELS[k]}
              </button>
            );
          })}
        </div>
      </div>

      <ChoixAllergenes
        valeur={allergenes}
        onChange={setAllergenes}
        libresConnus={libresConnus}
        replie={!allergenesOuverts}
        aucun={{ valeur: sansAllergene, onChange: setSansAllergene }}
        autreLibre
        autre={autre}
        onAutreChange={setAutre}
      />

      {erreur && <p className="text-[14px] font-semibold text-[var(--error)]">{erreur}</p>}

      <button
        type="submit"
        disabled={!valide}
        className="min-h-[48px] w-full rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold text-[15px] active:scale-[0.98] transition-transform disabled:opacity-50"
      >
        {libelleBouton}
      </button>
    </form>
  );
};

/** « Voir ce plat » : lien d'un plat proposé ; zone tactile de 44 px par un pseudo-élément invisible. */
const BoutonVoirPlat: React.FC<{ plat: PlatConnu; onOuvrirPlat: (cle: string) => void }> = ({ plat, onOuvrirPlat }) => (
  <button
    type="button"
    onClick={() => onOuvrirPlat(plat.cle)}
    aria-label={`Voir ce plat : ${plat.libelle}`}
    className="relative min-h-[36px] font-semibold text-[var(--primary-ink)] underline underline-offset-2 after:absolute after:-inset-y-1 after:inset-x-0 after:content-['']"
  >
    Voir ce plat
  </button>
);

/** Feuille d'enregistrement ou de modification d'une fiche de plat : sa fermeture passe par la fiche (`PoigneePlat`). */
export const FeuillePlat: React.FC<
  FormulairePlatProps & { ouverte: boolean; titre: string; onFermer: () => void }
> = ({ ouverte, titre, onFermer, ...formulaire }) => {
  const fiche = useRef<PoigneePlat>(null);
  return (
    <BottomSheet
      open={ouverte}
      title={titre}
      zClass="z-[55]"
      onClose={() => (fiche.current ? fiche.current.fermer() : (onFermer(), true))}
    >
      <FormulairePlat
        key={`${formulaire.cleActuelle ?? 'nouveau'}-${formulaire.initial.libelle}`}
        ref={fiche}
        {...formulaire}
        onFermer={onFermer}
      />
    </BottomSheet>
  );
};
