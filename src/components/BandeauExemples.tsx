/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import React from 'react';
import { IconUtensils } from './Icons';

interface BandeauExemplesProps {
  demo: boolean;
  /** Efface les exemples (avec annulation) : le parcours guidé prend le relais. */
  onCommencer: () => void;
  onMasquer: () => void;
}

export const BandeauExemples: React.FC<BandeauExemplesProps> = ({ demo, onCommencer, onMasquer }) => (
  <section aria-label="Données d’exemple" className="carte mb-4 p-3.5 flex flex-col gap-3">
    <div className="flex items-start gap-3">
      <IconUtensils size={20} className="text-[var(--primary-ink)] shrink-0 mt-0.5" />
      <div>
        <p className="text-[15px] font-bold text-[var(--ink)]">Vous visitez avec des exemples.</p>
        <p className="text-[14px] text-[var(--ink-muted)] leading-snug">
          Marc, Sophie, Léa… sont fictifs. Ouvrez une invitation pour voir les allergies et les plats déjà servis.
          {demo && ' Démo : rien n’est gardé.'}
        </p>
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onCommencer}
        className="flex-1 min-h-[44px] px-3 py-2 leading-tight rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--ink)] font-semibold text-[15px] active:scale-[0.98] transition-transform"
      >
        Commencer avec mes proches
      </button>
      <button
        type="button"
        onClick={onMasquer}
        className="min-h-[44px] px-3 rounded-xl text-[var(--ink-muted)] font-semibold text-[15px] underline underline-offset-2"
      >
        Masquer
      </button>
    </div>
  </section>
);
