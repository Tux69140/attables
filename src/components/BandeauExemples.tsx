/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import React from 'react';
import { IconUtensils } from './Icons';

interface BandeauExemplesProps {
  demo: boolean;
  onEffacer: () => void;
  onMasquer: () => void;
}

export const BandeauExemples: React.FC<BandeauExemplesProps> = ({
  demo,
  onEffacer,
  onMasquer,
}) => (
  <section
    aria-label="Données d’exemple"
    className="mb-4 p-3.5 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex flex-col gap-3"
  >
    <div className="flex items-start gap-3">
      <IconUtensils size={20} className="text-[var(--primary)] shrink-0 mt-0.5" />
      <div>
        <p className="text-[15px] font-semibold text-[var(--ink)]">
          Marc, Sophie et les autres sont des exemples.
        </p>
        {demo && (
          <p className="text-[14px] text-[var(--ink-muted)]">
            Démo : rien n’est gardé.
          </p>
        )}
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onEffacer}
        className="flex-1 min-w-[160px] min-h-[44px] px-3 py-2 leading-tight rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold text-[15px] active:scale-[0.98] transition-transform"
      >
        Effacer les exemples
      </button>
      <button
        type="button"
        onClick={onMasquer}
        className="flex-1 min-w-[160px] min-h-[44px] px-3 py-2 leading-tight rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--ink)] font-semibold text-[15px] active:scale-[0.98] transition-transform"
      >
        Masquer ce bandeau
      </button>
    </div>
  </section>
);
