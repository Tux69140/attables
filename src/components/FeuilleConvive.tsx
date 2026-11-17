/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import React, { useState } from 'react';
import type { ContrainteTag, Convive, Foyer } from '../types/models';
import { IconAlert, IconCheck } from './Icons';
import { BottomSheet } from './SharedUI';

interface FormulaireConviveProps {
  convive?: Convive;
  foyerIdInitial?: string;
  foyers: Foyer[];
  contraintes: ContrainteTag[];
  onEnregistrer: (c: Convive) => void;
}

/** Formulaire de création ou de modification d'un convive (sans feuille autour). */
export const FormulaireConvive: React.FC<FormulaireConviveProps> = ({
  convive,
  foyerIdInitial,
  foyers,
  contraintes,
  onEnregistrer,
}) => {
  const [nom, setNom] = useState(convive?.nomAffiche ?? '');
  const [foyerId, setFoyerId] = useState(convive?.foyerId ?? foyerIdInitial ?? '');
  const [tags, setTags] = useState<string[]>(convive ? [...convive.contraintesIds] : []);
  const [libre, setLibre] = useState(convive?.contrainteLibre ?? '');

  const basculerTag = (tagId: string) =>
    setTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));

  const enregistrer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;
    onEnregistrer({
      id: convive?.id ?? `conv-${Date.now()}`,
      nomAffiche: nom.trim(),
      foyerId: foyerId || undefined,
      contraintesIds: tags,
      contrainteLibre: libre.trim(),
    });
  };

  return (
    <form onSubmit={enregistrer} className="flex flex-col gap-4">
      <div>
        <label htmlFor="convive-nom" className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-1">
          Nom affiché
        </label>
        <input
          id="convive-nom"
          type="text"
          required
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Prénom, nom ou pseudo…"
          className="w-full min-h-[46px] px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[15px] text-[var(--ink)] focus:outline-none focus:border-[var(--primary-ink)]"
        />
      </div>

      <div>
        <label htmlFor="convive-foyer" className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-1">
          Foyer (optionnel)
        </label>
        <select
          id="convive-foyer"
          value={foyerId}
          onChange={(e) => setFoyerId(e.target.value)}
          className="w-full min-h-[46px] px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[15px] text-[var(--ink)] focus:outline-none focus:border-[var(--primary-ink)]"
        >
          <option value="">Sans foyer</option>
          {foyers.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[14px] font-semibold text-[var(--ink-muted)]">Contraintes alimentaires</span>
        <div className="flex flex-wrap gap-2">
          {contraintes.map((tag) => {
            const selected = tags.includes(tag.id);
            const isStrict = tag.niveau === 'strict';
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => basculerTag(tag.id)}
                aria-pressed={selected}
                className={`min-h-[44px] px-3.5 rounded-xl border text-[14px] font-semibold inline-flex items-center gap-1.5 transition-colors ${
                  selected
                    ? isStrict
                      ? 'bg-[var(--error-bg)] border-[var(--error)] text-[var(--error)]'
                      : 'bg-[var(--pref-bg)] border-[var(--pref)] text-[var(--pref)]'
                    : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--ink)]'
                }`}
              >
                {isStrict && <IconAlert size={15} />}
                {selected && !isStrict && <IconCheck size={15} />}
                <span>{tag.libelle}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="convive-libre" className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-1">
          Note libre (goûts, précisions…)
        </label>
        <textarea
          id="convive-libre"
          rows={2}
          value={libre}
          onChange={(e) => setLibre(e.target.value)}
          placeholder="Ex. N’aime pas la coriandre, tolère le fromage de chèvre…"
          className="w-full p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[15px] text-[var(--ink)] focus:outline-none focus:border-[var(--primary-ink)]"
        />
      </div>

      <button
        type="submit"
        className="min-h-[48px] w-full rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold text-[15px] mt-1 active:scale-[0.98] transition-transform"
      >
        {convive ? 'Enregistrer les modifications' : 'Ajouter le convive'}
      </button>
    </form>
  );
};

/** Feuille de création ou de modification d'un convive. */
export const FeuilleConvive: React.FC<FormulaireConviveProps & { ouverte: boolean; onFermer: () => void }> = ({
  ouverte,
  onFermer,
  ...formulaire
}) => (
  <BottomSheet
    open={ouverte}
    title={formulaire.convive ? 'Modifier le convive' : 'Nouveau convive'}
    zClass="z-[55]"
    onClose={onFermer}
  >
    <FormulaireConvive key={formulaire.convive?.id ?? 'nouveau'} {...formulaire} />
  </BottomSheet>
);
