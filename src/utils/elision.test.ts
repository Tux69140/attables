/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ceQueNeMangePas, dePrenom, prenomElide } from './elision';

test('dePrenom élide devant une voyelle, accentuée ou non, et devant un h', () => {
  assert.equal(dePrenom('Anne'), 'd’Anne');
  assert.equal(dePrenom('Éric'), 'd’Éric');
  assert.equal(dePrenom('Hugo'), 'd’Hugo');
  assert.equal(dePrenom('Élodie'), 'd’Élodie');
  assert.equal(dePrenom('Océane'), 'd’Océane');
  assert.equal(dePrenom('Œdipe'), 'd’Œdipe');
});

test('dePrenom n’élide pas devant une consonne', () => {
  assert.equal(dePrenom('Paul'), 'de Paul');
  assert.equal(dePrenom('Léa'), 'de Léa');
});

test('dePrenom : le y s’élide devant une consonne, pas devant une voyelle', () => {
  assert.equal(dePrenom('Yann'), 'de Yann');
  assert.equal(dePrenom('Yasmine'), 'de Yasmine');
  assert.equal(dePrenom('Yoann'), 'de Yoann');
  assert.equal(dePrenom('Yvon'), 'd’Yvon');
  assert.equal(dePrenom('Yves'), 'd’Yves');
});

test('dePrenom ignore les espaces autour et tolère le vide', () => {
  assert.equal(dePrenom('  Anne '), 'd’Anne');
  assert.equal(dePrenom(''), 'de ');
  assert.equal(prenomElide(''), false);
});

test('ceQueNeMangePas', () => {
  assert.equal(ceQueNeMangePas('Léa'), 'Ce que Léa ne mange pas');
  assert.equal(ceQueNeMangePas('Anne'), 'Ce qu’Anne ne mange pas');
  assert.equal(ceQueNeMangePas('Éric'), 'Ce qu’Éric ne mange pas');
  assert.equal(ceQueNeMangePas('Hugo'), 'Ce qu’Hugo ne mange pas');
  assert.equal(ceQueNeMangePas('Yann'), 'Ce que Yann ne mange pas');
  assert.equal(ceQueNeMangePas(''), 'Ce que cette personne ne mange pas');
});
