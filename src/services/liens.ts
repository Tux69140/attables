// Copyright (C) 2026 Stéphane MICHEL
// SPDX-License-Identifier: GPL-3.0-or-later

import { openUrl } from '@tauri-apps/plugin-opener';

export const URL_NOTES_DE_VERSION = 'https://attables.biovibralyon.fr/notes-de-version.html';

/**
 * Ouvre un lien dans le navigateur du système (Tauri) ou dans un nouvel onglet (web).
 * Ne rejette jamais : si l'ouverture native échoue, on se replie sur `window.open`.
 */
export async function ouvrirLien(url: string): Promise<void> {
  if ('__TAURI_INTERNALS__' in window) {
    try {
      await openUrl(url);
      return;
    } catch {
      // Repli ci-dessous.
    }
  }
  window.open(url, '_blank', 'noopener');
}
