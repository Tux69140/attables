/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Pont natif Android (interface JavaScript ajoutée par MainActivity) : absent
// dans un navigateur, d'où l'appel optionnel.
declare global {
  interface Window {
    AttablesAndroid?: { barresSysteme(sombre: boolean): void };
  }
}

/** Indique à Android le thème effectif pour que les icônes des barres système restent lisibles. */
export function signalerThemeAuxBarres(sombre: boolean): void {
  try {
    window.AttablesAndroid?.barresSysteme(sombre);
  } catch {
    // Pont indisponible : sans effet.
  }
}
