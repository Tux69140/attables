/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { melanger, teinteFoyer } from './teinte';

test('melanger pondère chaque canal', () => {
  assert.equal(melanger('#FF7A5C', '#FFFFFF', 0.14), '#FFECE8');
  assert.equal(melanger('#2BBFB0', '#162131', 0.22), '#1B444D');
  assert.equal(melanger('#000000', '#FFFFFF', 0), '#FFFFFF');
});

test('teinteFoyer pâle en clair, sombre en sombre', () => {
  assert.equal(teinteFoyer('corail', false), '#FFECE8');
  assert.equal(teinteFoyer('lagon', true), '#1B444D');
});
