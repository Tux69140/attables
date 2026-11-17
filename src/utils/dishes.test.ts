/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Invitation, MenuCourses, PlatFiche } from '../types/models';
import { getDishSuggestions } from './dishes';

const inv = (id: string, menu: MenuCourses, statut: Invitation['statut'] = 'realisee'): Invitation => ({
  id,
  statut,
  date: '2026-10-18',
  hoteType: 'moi',
  hoteLabel: 'Moi',
  convivesIds: [],
  menu,
});
const invitations = [inv('i1', { entree: 'Velouté', dessert: 'Tarte Tatin' }), inv('i2', { dessert: 'Mousse au chocolat noir' })];

test('suggestions limitées au service', () => {
  const labels = getDishSuggestions(invitations, '', 'entree').map((s) => s.label);
  assert.deepEqual(labels, ['Velouté']);
});

test('les fiches du service sont proposées comme idées', () => {
  const potAuFeu: PlatFiche = { id: 'p1', libelle: 'Pot-au-feu', services: ['plat'], allergenes: [] };
  const pourPlat = getDishSuggestions(invitations, '', 'plat', [potAuFeu]);
  assert.deepEqual(pourPlat, [{ label: 'Pot-au-feu', course: 'plat', count: 0, idee: true }]);
  assert.equal(getDishSuggestions(invitations, '', 'entree', [potAuFeu]).some((s) => s.label === 'Pot-au-feu'), false);
});

test('pas de doublon fiche / invitation', () => {
  const mousse: PlatFiche = { id: 'p2', libelle: 'mousse au chocolat noir', services: ['dessert'], allergenes: [] };
  const res = getDishSuggestions(invitations, 'mousse', 'dessert', [mousse]);
  assert.equal(res.length, 1);
  assert.equal(res[0].idee, false);
});
