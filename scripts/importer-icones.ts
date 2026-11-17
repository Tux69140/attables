/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Convertit les SVG de src/icones/svg/ en données TypeScript (src/icones/donnees.ts).
 * À relancer (`pnpm icones`) après l'ajout ou la modification d'un SVG ; le résultat est commité.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { nettoyerSvg } from '../src/icones/nettoyer';

const dossier = fileURLToPath(new URL('../src/icones/svg/', import.meta.url));
const sortie = fileURLToPath(new URL('../src/icones/donnees.ts', import.meta.url));

const noms = readdirSync(dossier)
  .filter((f) => f.endsWith('.svg'))
  .map((f) => f.slice(0, -4))
  .sort();

const lignes = noms.map((nom) => {
  const elements = nettoyerSvg(readFileSync(`${dossier}${nom}.svg`, 'utf8'));
  if (elements.length === 0) throw new Error(`SVG vide après nettoyage : ${nom}`);
  return `  '${nom}': ${JSON.stringify(elements)},`;
});

const contenu = `/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * FICHIER GÉNÉRÉ par \`pnpm icones\` depuis src/icones/svg/ — ne pas modifier à la main.
 * Icônes Lucide © Lucide Contributors, licence ISC (voir LICENCE-lucide.txt) ;
 * arachide, céleri, moutarde, sésame, FODMAP et assemblée : dessins Attablés, GPL-3.0-or-later.
 */
import type { ElementSvg } from './nettoyer';

export const ICONES = {
${lignes.join('\n')}
} satisfies Record<string, ElementSvg[]>;

export type NomIcone = keyof typeof ICONES;
`;

writeFileSync(sortie, contenu);
console.log(`${noms.length} icônes écrites dans src/icones/donnees.ts`);
