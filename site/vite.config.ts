/*
 * Copyright (C) 2026 Stéphane MICHEL
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { pluginNotes } from './outils/plugin-notes.ts';
import { pluginApk } from './outils/apk.ts';

const ici = (chemin: string) => fileURLToPath(new URL(chemin, import.meta.url));
const { version } = JSON.parse(readFileSync(ici('../package.json'), 'utf8')) as { version: string };

// Site de présentation : plusieurs pages HTML, TypeScript simple, sans framework.
export default defineConfig({
  root: ici('.'),
  plugins: [
    pluginNotes(ici('../fastlane/metadata/android/fr-FR/changelogs')),
    pluginApk({ version, dossierApk: ici('../dist-android'), fichierEmpreinte: ici('../src-tauri/empreinte-cle-android.txt') }),
  ],
  publicDir: ici('./public'),
  build: {
    outDir: ici('../dist-site'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: ici('./index.html'),
        'notes-de-version': ici('./notes-de-version.html'),
        'mentions-legales': ici('./mentions-legales.html'),
        confidentialite: ici('./confidentialite.html'),
        'conditions-utilisation': ici('./conditions-utilisation.html'),
      },
    },
  },
});
