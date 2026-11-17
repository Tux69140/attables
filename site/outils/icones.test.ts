/*
 * Copyright (C) 2026 Stéphane MICHEL
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { remplacerIcones } from './icones.ts';

test('remplace et garde la classe', () => {
  const html = remplacerIcones('<p><svg data-icone="heart" class="a" aria-hidden="true"></svg></p>');
  assert.ok(html.includes('class="a"'));
  assert.ok(html.includes('stroke="currentColor"'));
  assert.ok(html.includes('<path'));
  assert.ok(!html.includes('data-icone'));
});

test('refuse un nom inconnu', () => {
  assert.throws(() => remplacerIcones('<svg data-icone="licorne"></svg>'), /Icône inconnue : licorne/);
});

test('laisse le reste intact', () => {
  const autre = '<svg class="deco" viewBox="0 0 220 140"><path d="M1 1"/></svg><p>texte</p>';
  assert.equal(remplacerIcones(autre), autre);
});
