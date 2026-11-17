/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import React, { useState } from 'react';
import { ICONE_SERVICE } from '../icones/services';
import { COURSE_KEYS, COURSE_LABELS, type ContrainteTag, type CourseKey } from '../types/models';
import { formatDishInput } from '../utils/dishes';
import { cleDePlat, platProche, type PlatConnu } from '../utils/plats';
import { ChoixAllergenes } from './ChoixAllergenes';
import { Icone } from './Icone';
import { BottomSheet } from './SharedUI';

export interface ValeursPlat {
  libelle: string;
  services: CourseKey[];
  allergenes: string[];
}

interface FormulairePlatProps {
  initial: ValeursPlat;
  /** Faux pour un plat servi ou prévu : son nom vient des menus. */
  nomModifiable: boolean;
  allergenesOuverts: boolean;
  /** Clé du plat modifié (absente pour un nouveau plat). */
  cleActuelle?: string;
  liste: PlatConnu[];
  contraintes: ContrainteTag[];
  erreur?: string;
  libelleBouton: string;
  onEnregistrer: (v: ValeursPlat) => void;
  onOuvrirPlat: (cle: string) => void;
}

const FormulairePlat: React.FC<FormulairePlatProps> = ({
  initial,
  nomModifiable,
  allergenesOuverts,
  cleActuelle,
  liste,
  contraintes,
  erreur,
  libelleBouton,
  onEnregistrer,
  onOuvrirPlat,
}) => {
  const [libelle, setLibelle] = useState(initial.libelle);
  const [services, setServices] = useState<CourseKey[]>(initial.services);
  const [allergenes, setAllergenes] = useState<string[]>(initial.allergenes);

  const cle = cleDePlat(libelle);
  const connu = !cleActuelle && cle ? liste.find((p) => p.cle === cle) : undefined;
  const proche = nomModifiable && !connu ? platProche(liste.filter((p) => p.cle !== cleActuelle), libelle) : undefined;
  const valide = Boolean(cle) && services.length > 0;

  const basculer = (k: CourseKey) =>
    setServices((prev) => (prev.includes(k) ? prev.filter((s) => s !== k) : COURSE_KEYS.filter((c) => c === k || prev.includes(c))));

  const enregistrer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valide) return;
    onEnregistrer({ libelle: formatDishInput(libelle), services, allergenes });
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
          {proche && (
            <p className="mt-1.5 text-[14px] text-[var(--ink)] flex flex-wrap items-center gap-x-2">
              <span>Vous voulez dire « {proche.libelle} » ?</span>
              <button
                type="button"
                onClick={() => onOuvrirPlat(proche.cle)}
                className="min-h-[36px] font-semibold text-[var(--primary-ink)] underline underline-offset-2"
              >
                Voir ce plat
              </button>
            </p>
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
                className={`min-h-[40px] px-3.5 rounded-full border text-[14px] font-semibold flex items-center gap-1.5 transition-colors ${
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
        contraintes={contraintes}
        inclurePersonnels
        replie={!allergenesOuverts}
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

/** Feuille d'enregistrement ou de modification d'une fiche de plat. */
export const FeuillePlat: React.FC<
  FormulairePlatProps & { ouverte: boolean; titre: string; onFermer: () => void }
> = ({ ouverte, titre, onFermer, ...formulaire }) => (
  <BottomSheet open={ouverte} title={titre} zClass="z-[55]" onClose={onFermer}>
    <FormulairePlat key={`${formulaire.cleActuelle ?? 'nouveau'}-${formulaire.initial.libelle}`} {...formulaire} />
  </BottomSheet>
);
