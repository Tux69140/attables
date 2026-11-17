/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { type FoyerColorId, getFoyerColorHex } from '../types/models';

const canaux = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** Mélange de deux couleurs #RRGGBB, `proportionA` de la première (calculé en JS : pas de color-mix() sur les anciennes WebView). */
export function melanger(hexA: string, hexB: string, proportionA: number): string {
  const a = canaux(hexA);
  const b = canaux(hexB);
  return (
    '#' +
    a
      .map((c, i) => Math.round(c * proportionA + b[i] * (1 - proportionA)).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

/** Fond d'en-tête d'une carte de foyer : sa couleur très diluée dans la carte. */
export function teinteFoyer(couleur: FoyerColorId, sombre: boolean): string {
  const hex = getFoyerColorHex(couleur);
  return sombre ? melanger(hex, '#162131', 0.22) : melanger(hex, '#FFFFFF', 0.14);
}
