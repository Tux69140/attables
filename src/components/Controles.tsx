/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import React from 'react';
import type { NomIcone } from '../icones/donnees';
import { Icone } from './Icone';

/**
 * Contrôles de sélection dont l'état choisi se lit sans dépendre d'un fond pâle :
 * onglets soulignés de safran, puces pleines couleur encre.
 */

interface OptionOnglet<T extends string> {
  id: T;
  label: string;
  compte?: number;
}

export function Onglets<T extends string>({
  options,
  valeur,
  onChange,
  ariaLabel,
}: {
  options: OptionOnglet<T>[];
  valeur: T;
  onChange: (id: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex gap-6 border-b border-[var(--border)]">
      {options.map((option) => {
        const actif = option.id === valeur;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={actif}
            onClick={() => onChange(option.id)}
            className={`relative min-h-[44px] -mb-px flex items-center gap-2 text-[16px] transition-colors ${
              actif ? 'font-bold text-[var(--ink)]' : 'font-semibold text-[var(--ink-muted)]'
            }`}
          >
            <span>{option.label}</span>
            {option.compte !== undefined && (
              <span
                className={`min-w-[22px] h-[22px] px-1.5 rounded-full text-[13px] font-bold tabular-nums flex items-center justify-center ${
                  actif
                    ? 'bg-[var(--primary)] text-[var(--on-primary)]'
                    : 'bg-[var(--surface-elevated)] text-[var(--ink-muted)]'
                }`}
              >
                {option.compte}
              </span>
            )}
            <span
              aria-hidden="true"
              className={`absolute left-0 right-0 bottom-0 h-[3px] rounded-full ${
                actif ? 'bg-[var(--primary)]' : 'bg-transparent'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

interface OptionPuce<T extends string> {
  id: T;
  label: string;
  icone?: NomIcone;
  /** `alerte` : icône rouge tant que la puce n'est pas sélectionnée (ex. filtre « Allergies »). */
  ton?: 'neutre' | 'alerte';
}

export function Puces<T extends string>({
  options,
  valeur,
  onChange,
  ariaLabel,
}: {
  options: OptionPuce<T>[];
  valeur: T;
  onChange: (id: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const choisie = option.id === valeur;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={choisie}
            onClick={() => onChange(option.id)}
            className={`min-h-[40px] px-3.5 rounded-full border text-[14px] font-semibold flex items-center gap-1.5 transition-colors ${
              choisie
                ? 'bg-[var(--ink)] border-[var(--ink)] text-[var(--card)]'
                : 'bg-[var(--card)] border-[var(--border)] text-[var(--ink)]'
            }`}
          >
            {option.icone && (
              <Icone
                nom={option.icone}
                size={16}
                className={!choisie && option.ton === 'alerte' ? 'text-[var(--alerte)]' : undefined}
              />
            )}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
