/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Nettoyage des SVG recopiés (Lucide, dessins maison) : on ne garde que les
 * formes géométriques et leurs coordonnées. Tout le reste (commentaires,
 * scripts, styles, classes, gestionnaires d'événements, texte) est ignoré.
 */

export type BaliseSvg = 'path' | 'circle' | 'rect' | 'line' | 'polyline' | 'polygon' | 'ellipse';
export type ElementSvg = [BaliseSvg, Record<string, string>];

const BALISES = new Set<string>(['path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse']);
const ATTRIBUTS = new Set([
  'd', 'cx', 'cy', 'r', 'x', 'y', 'width', 'height', 'rx', 'ry', 'x1', 'y1', 'x2', 'y2', 'points',
]);

export function nettoyerSvg(source: string): ElementSvg[] {
  const sansCommentaires = source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '');
  const elements: ElementSvg[] = [];
  for (const m of sansCommentaires.matchAll(/<([a-zA-Z]+)\b([^>]*?)\/?>/g)) {
    const balise = m[1];
    if (!BALISES.has(balise)) continue;
    const attributs: Record<string, string> = {};
    for (const a of m[2].matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) {
      if (ATTRIBUTS.has(a[1])) attributs[a[1]] = a[2];
    }
    elements.push([balise as BaliseSvg, attributs]);
  }
  return elements;
}

function echapper(valeur: string): string {
  return valeur
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const ATTRIBUTS_RACINE: Record<string, string> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
  'aria-hidden': 'true',
};

export function serialiserSvg(elements: ElementSvg[], attributs: Record<string, string> = {}): string {
  const racine = Object.entries({ ...ATTRIBUTS_RACINE, ...attributs })
    .map(([k, v]) => `${k}="${echapper(v)}"`)
    .join(' ');
  const corps = elements
    .map(([balise, attrs]) => {
      const a = Object.entries(attrs)
        .map(([k, v]) => `${k}="${echapper(v)}"`)
        .join(' ');
      return `<${balise} ${a}/>`;
    })
    .join('');
  return `<svg ${racine}>${corps}</svg>`;
}
