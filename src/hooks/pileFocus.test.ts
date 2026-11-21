/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cibleTabulation, creerPileFocus } from './pileFocus';

test('seule la couche du dessus gère la tabulation', () => {
  const pile = creerPileFocus();
  const a = pile.empiler();
  const b = pile.empiler();
  assert.equal(pile.estAuSommet(a), false);
  assert.equal(pile.estAuSommet(b), true);
  pile.retirer(b);
  assert.equal(pile.estAuSommet(a), true);
});

test('retirer une couche du milieu garde le sommet', () => {
  const pile = creerPileFocus();
  const a = pile.empiler();
  const b = pile.empiler();
  const c = pile.empiler();
  pile.retirer(b);
  assert.equal(pile.estAuSommet(c), true);
  pile.retirer(c);
  assert.equal(pile.estAuSommet(a), true);
});

test('cibleTabulation boucle aux extrémités seulement', () => {
  assert.equal(cibleTabulation(3, 2, false), 0);
  assert.equal(cibleTabulation(3, 0, true), 2);
  assert.equal(cibleTabulation(3, 1, false), null);
  assert.equal(cibleTabulation(3, 1, true), null);
  assert.equal(cibleTabulation(3, -1, false), 0);
  assert.equal(cibleTabulation(3, -1, true), 2);
  assert.equal(cibleTabulation(0, -1, false), null);
});

test('cibleTabulation donne chaque pas quand la liste ne suit pas le document', () => {
  assert.equal(cibleTabulation(3, 1, false, true), 2);
  assert.equal(cibleTabulation(3, 1, true, true), 0);
  assert.equal(cibleTabulation(3, 2, false, true), 0);
  assert.equal(cibleTabulation(3, 0, true, true), 2);
  assert.equal(cibleTabulation(3, -1, false, true), 0);
  assert.equal(cibleTabulation(0, -1, false, true), null);
});

test('sommet donne la couche du dessus, null sans couche', () => {
  const pile = creerPileFocus();
  assert.equal(pile.sommet(), null);
  const a = pile.empiler();
  const b = pile.empiler();
  assert.equal(pile.sommet(), b);
  pile.retirer(b);
  assert.equal(pile.sommet(), a);
  pile.retirer(a);
  assert.equal(pile.sommet(), null);
});
