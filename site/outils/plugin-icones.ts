/*
 * Copyright (C) 2026 Stéphane MICHEL
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import type { Plugin } from 'vite';
import { remplacerIcones } from './icones.ts';

/** Pictogrammes du site : `<svg data-icone="…">` remplacés au build par les icônes de l'appli. */
export function pluginIcones(): Plugin {
  return { name: 'attables-icones', transformIndexHtml: (html) => remplacerIcones(html) };
}
