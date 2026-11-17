/*
 * Copyright (C) 2026 Stéphane MICHEL
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import type { Plugin } from 'vite';
import { lireNotes, notesEnHtml } from './notes.ts';

// Remplace `<!-- NOTES -->` par les notes de version lues dans les changelogs fastlane.
export function pluginNotes(dossier: string): Plugin {
  return {
    name: 'attables-notes-de-version',
    transformIndexHtml(html, ctx) {
      if (!ctx.filename.endsWith('notes-de-version.html')) return html;
      return html.replace('<!-- NOTES -->', notesEnHtml(lireNotes(dossier)));
    },
  };
}
