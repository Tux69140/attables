/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import React, { useState } from 'react';
import type { NomIcone } from '../icones/donnees';
import type { ContrainteTag } from '../types/models';
import { choixAllergenes, iconeContrainte, PICTOS_CONTRAINTE } from '../utils/allergenes';
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
    <span className="text-[12px] font-semibold leading-tight">{libelle}</span>
  </button>
);

const Groupe: React.FC<{ titre: string; children: React.ReactNode }> = ({ titre, children }) => (
  <div className="flex flex-col gap-2">
    <span className="text-[13px] font-bold text-[var(--ink-muted)]">{titre}</span>
    <div className="grid grid-cols-4 gap-2">{children}</div>
  </div>
);

/** Grille d'allergènes à cocher : référence, puis (facultatif) les contraintes personnelles. */
export const ChoixAllergenes: React.FC<{
  valeur: string[];
  onChange: (v: string[]) => void;
  contraintes: ContrainteTag[];
  inclurePersonnels: boolean;
  replie?: boolean;
}> = ({ valeur, onChange, contraintes, inclurePersonnels, replie = false }) => {
  const [ouvert, setOuvert] = useState(!replie);
  const { reglementaires, autres, personnels } = choixAllergenes(contraintes);
  const basculer = (id: string) => onChange(valeur.includes(id) ? valeur.filter((v) => v !== id) : [...valeur, id]);

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
          {valeur.length > 0 && <span className="text-[var(--ink-muted)] font-normal"> · {valeur.length} choisi{valeur.length > 1 ? 's' : ''}</span>}
        </span>
        <IconChevronDown size={18} className="text-[var(--ink-muted)]" />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      <Groupe titre="Allergènes réglementaires">
        {reglementaires.map((a) => (
          <Tuile key={a.id} icone={a.icone} libelle={a.libelle} choisie={valeur.includes(a.id)} onClick={() => basculer(a.id)} />
        ))}
      </Groupe>
      <Groupe titre="Autres">
        {autres.map((a) => (
          <Tuile key={a.id} icone={a.icone} libelle={a.libelle} choisie={valeur.includes(a.id)} onClick={() => basculer(a.id)} />
        ))}
      </Groupe>
      {inclurePersonnels && personnels.length > 0 && (
        <Groupe titre="Mes contraintes">
          {personnels.map((t) => (
            <Tuile key={t.id} icone={iconeContrainte(t)} libelle={t.libelle} choisie={valeur.includes(t.id)} onClick={() => basculer(t.id)} />
          ))}
        </Groupe>
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
  <div role="radiogroup" aria-label="Pictogramme" className="grid grid-cols-4 gap-2">
    <Tuile icone={auto} libelle="Automatique" choisie={valeur === undefined} onClick={() => onChange(undefined)} radio />
    {PICTOS_CONTRAINTE.map((p) => (
      <Tuile key={p.icone} icone={p.icone} libelle={p.libelle} choisie={valeur === p.icone} onClick={() => onChange(p.icone)} radio />
    ))}
  </div>
);
