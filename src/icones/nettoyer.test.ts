/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { ICONES } from './donnees';
import { nettoyerSvg, serialiserSvg } from './nettoyer';
import { ICONE_SERVICE } from './services';

const REQUISES = [
  'calendar-days', 'users-round', 'hand-platter', 'settings', 'search', 'plus', 'triangle-alert',
  'check', 'heart', 'thumbs-up', 'ban', 'clock', 'pencil', 'trash-2', 'undo-2', 'copy',
  'clipboard-copy', 'share-2', 'download', 'upload', 'repeat', 'shield-check', 'arrow-left',
  'chevron-right', 'chevron-down', 'x', 'ellipsis-vertical', 'house', 'utensils', 'cooking-pot',
  'soup', 'wine', 'leaf', 'sun', 'star', 'user-round', 'martini', 'salad', 'cheese', 'cake-slice',
  'wheat', 'shrimp', 'egg', 'fish', 'milk', 'bean', 'nut', 'shell', 'flask-conical', 'flower-2',
  'ham', 'beef', 'wheat-off', 'milk-off', 'nut-off',
  'arachide', 'celeri', 'moutarde', 'sesame', 'ail', 'chocolat', 'assemblee',
  // pictogrammes au choix pour les contraintes personnelles
  'carrot', 'apple', 'cherry', 'citrus', 'banana', 'grape', 'leafy-green', 'sprout', 'flame',
  'candy', 'coffee', 'drumstick', 'croissant', 'cookie', 'hop', 'tag',
  // site de présentation
  'wifi-off', 'lock-open', 'external-link', 'chevron-left', 'pause', 'play',
];

test('nettoyerSvg garde la géométrie', () => {
  const source = readFileSync(new URL('./svg/wheat.svg', import.meta.url), 'utf8');
  const elements = nettoyerSvg(source);
  assert.equal(elements.length, 8);
  assert.ok(elements.every(([balise]) => balise === 'path'));
  assert.deepEqual(elements[0], ['path', { d: 'M2 22 16 8' }]);
});

test('nettoyerSvg ignore le reste', () => {
  const source =
    '<svg><!-- c --><script>x</script><path d="M1 1" onclick="x" style="a" class="b"/>' +
    '<g><circle cx="1" cy="2" r="3"/></g><text>t</text></svg>';
  assert.deepEqual(nettoyerSvg(source), [
    ['path', { d: 'M1 1' }],
    ['circle', { cx: '1', cy: '2', r: '3' }],
  ]);
});

test('serialiserSvg échappe et applique les attributs', () => {
  const svg = serialiserSvg([['path', { d: 'M1 1"' }]], { class: 'x' });
  assert.ok(svg.includes('d="M1 1&quot;"'));
  assert.ok(svg.includes('class="x"'));
  assert.ok(svg.includes('stroke-width="2"'));
  assert.ok(svg.includes('aria-hidden="true"'));
});

test('toutes les icônes requises existent', () => {
  const icones = ICONES as Record<string, unknown[]>;
  for (const nom of [...REQUISES, ...Object.values(ICONE_SERVICE)]) {
    assert.ok(icones[nom]?.length, `icône manquante : ${nom}`);
  }
});
