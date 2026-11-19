/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Ce qu'une personne ne mange pas : édition de ses éléments (contraintes propres à elle seule).
 */
import React, { useState } from 'react';
import type { NomIcone } from '../icones/donnees';
import type { ContrainteConvive, ContrainteNiveau } from '../types/models';
import { estAutre, iconeContrainte } from '../utils/allergenes';
import { ChoixAllergenes, ChoixPictogramme } from './ChoixAllergenes';
import { Puces } from './Controles';

/** Édition d'un élément d'une personne : libellé, niveau, pictogramme et allergènes concernés. */
export const FormulaireElement: React.FC<{
  contrainte: ContrainteConvive;
  onEnregistrer: (c: ContrainteConvive) => void;
}> = ({ contrainte, onEnregistrer }) => {
  const [libelle, setLibelle] = useState(contrainte.libelle);
  const [niveau, setNiveau] = useState<ContrainteNiveau>(contrainte.niveau);
  const [icone, setIcone] = useState<NomIcone | undefined>(contrainte.icone);
  const [allergenes, setAllergenes] = useState<string[]>(contrainte.allergenes);
  // Les aliments libres de l'élément restent proposés, même décochés.
  const [libres] = useState(() => contrainte.allergenes.filter(estAutre));
  const auto = iconeContrainte({ allergenes });

  const enregistrer = (e: React.FormEvent) => {
    e.preventDefault();
    const propre = libelle.trim();
    if (!propre) return;
    const { icone: _ancienne, ...reste } = contrainte;
    onEnregistrer({ ...reste, libelle: propre, niveau, allergenes, ...(icone ? { icone } : {}) });
  };

  return (
    <form onSubmit={enregistrer} className="flex flex-col gap-4">
      <div>
        <label htmlFor="contrainte-libelle" className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-1">
          Libellé
        </label>
        <input
          id="contrainte-libelle"
          type="text"
          required
          value={libelle}
          onChange={(e) => setLibelle(e.target.value)}
          className="w-full min-h-[46px] px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[15px] text-[var(--ink)] focus:outline-none focus:border-[var(--primary-ink)]"
        />
      </div>
      <Puces
        ariaLabel="Niveau"
        valeur={niveau}
        onChange={setNiveau}
        options={[
          { id: 'strict', label: 'Allergie stricte', icone: 'triangle-alert', ton: 'alerte' },
          { id: 'preference', label: 'Préférence' },
        ]}
      />
      <div className="flex flex-col gap-2">
        <span className="text-[14px] font-semibold text-[var(--ink-muted)]">Pictogramme</span>
        <ChoixPictogramme valeur={icone} auto={auto} onChange={setIcone} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[14px] font-semibold text-[var(--ink-muted)]">Allergènes concernés</span>
        <p className="text-[13px] text-[var(--ink-muted)] -mt-1">Un plat qui en contient déclenchera une alerte.</p>
        <ChoixAllergenes valeur={allergenes} onChange={setAllergenes} libresConnus={libres} />
      </div>
      <button
        type="submit"
        className="min-h-[48px] w-full rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold text-[15px] active:scale-[0.98] transition-transform"
      >
        Enregistrer
      </button>
    </form>
  );
};
