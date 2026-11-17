/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import React from 'react';
import { ICONES, type NomIcone } from '../icones/donnees';

interface IconeProps {
  nom: NomIcone;
  size?: number;
  className?: string;
  /** Remplissage translucide (ex. cœur « coup de cœur »). */
  plein?: boolean;
}

/** Pictogramme au trait (Lucide ou dessin maison), décoratif : masqué aux lecteurs d'écran. */
export const Icone: React.FC<IconeProps> = ({ nom, size = 20, className = '', plein = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={plein ? 'currentColor' : 'none'}
    fillOpacity={plein ? 0.25 : undefined}
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    {ICONES[nom].map(([balise, attributs], i) => React.createElement(balise, { key: i, ...attributs }))}
  </svg>
);
