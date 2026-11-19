/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import React, { useState } from 'react';
import { FOYER_COLORS, FOYER_PICTOS, Foyer, FoyerColorId, FoyerPictoId } from '../types/models';
import { FoyerPictoIcon, IconCheck } from './Icons';
import { BottomSheet, FoyerTile } from './SharedUI';

/** Formulaire de création ou de modification d'un foyer (sans feuille autour). */
export const FormulaireFoyer: React.FC<{ foyer?: Foyer; onEnregistrer: (f: Foyer) => void }> = ({
  foyer,
  onEnregistrer,
}) => {
  const [nom, setNom] = useState(foyer?.nom ?? '');
  const [couleur, setCouleur] = useState<FoyerColorId>(foyer?.couleur ?? 'lagon');
  const [picto, setPicto] = useState<FoyerPictoId>(foyer?.picto ?? 'maison');

  const enregistrer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;
    onEnregistrer({ id: foyer?.id ?? `foyer-${Date.now()}`, nom: nom.trim(), couleur, picto });
  };

  return (
    <form onSubmit={enregistrer} className="flex flex-col gap-4">
      <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)]">
        <FoyerTile color={couleur} picto={picto} sizePx={44} />
        <div className="text-[16px] font-semibold text-[var(--ink)] break-words min-w-0">{nom.trim() || 'Aperçu du pavé'}</div>
      </div>

      <div>
        <label htmlFor="foyer-nom" className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-1">
          Nom du foyer
        </label>
        <input
          id="foyer-nom"
          type="text"
          required
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex. Famille Martin, Paul & Julie…"
          className="w-full min-h-[46px] px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[15px] text-[var(--ink)] focus:outline-none focus:border-[var(--primary-ink)]"
        />
      </div>

      <div>
        <span className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-2">Couleur du pavé</span>
        <div className="grid grid-cols-4 gap-2.5">
          {FOYER_COLORS.map((c) => {
            const selected = couleur === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCouleur(c.id)}
                aria-label={c.label}
                aria-pressed={selected}
                className={`min-h-[46px] rounded-xl flex items-center justify-center border-2 transition-transform active:scale-95 ${
                  selected ? 'border-[var(--ink)] scale-[1.03]' : 'border-transparent'
                }`}
                style={{ backgroundColor: c.hex, color: 'var(--encre-tuile)' }}
              >
                {selected ? <IconCheck size={20} /> : <span className="text-[13px] font-semibold">{c.label}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-2">Pictogramme</span>
        <div className="grid grid-cols-4 gap-2">
          {FOYER_PICTOS.map((p) => {
            const selected = picto === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPicto(p.id)}
                aria-pressed={selected}
                className={`min-h-[54px] px-2 py-1.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-colors ${
                  selected
                    ? 'bg-[var(--ink)] border-[var(--ink)] text-[var(--card)]'
                    : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--ink-muted)]'
                }`}
              >
                <FoyerPictoIcon picto={p.id} size={20} />
                <span className="text-[13px] font-medium break-words min-w-0 max-w-full">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        className="min-h-[48px] w-full rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold text-[15px] mt-1 active:scale-[0.98] transition-transform"
      >
        {foyer ? 'Enregistrer les modifications' : 'Créer le foyer'}
      </button>
    </form>
  );
};

/** Feuille de création ou de modification d'un foyer. */
export const FeuilleFoyer: React.FC<{
  ouverte: boolean;
  foyer?: Foyer;
  onEnregistrer: (f: Foyer) => void;
  onFermer: () => void;
}> = ({ ouverte, foyer, onEnregistrer, onFermer }) => (
  <BottomSheet open={ouverte} title={foyer ? 'Modifier le foyer' : 'Nouveau foyer'} zClass="z-[55]" onClose={onFermer}>
    <FormulaireFoyer key={foyer?.id ?? 'nouveau'} foyer={foyer} onEnregistrer={onEnregistrer} />
  </BottomSheet>
);
