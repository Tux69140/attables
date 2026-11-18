/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Invitation, MenuCourses, PlatFiche } from '../types/models';
import { getDishSuggestions, getElapsedTimeInfo } from './dishes';

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

test('getElapsedTimeInfo compte les jours civils malgré le passage à l’heure d’été', () => {
  const tz = process.env.TZ;
  process.env.TZ = 'Europe/Paris';
  try {
    assert.equal(getElapsedTimeInfo('2026-03-28', '2026-03-30').daysAgo, 2);
    assert.equal(getElapsedTimeInfo('2026-03-29', '2026-03-30').label, 'il y a 1 jour');
    assert.equal(getElapsedTimeInfo('2026-10-24', '2026-10-26').daysAgo, 2);
  } finally {
    if (tz === undefined) delete process.env.TZ;
    else process.env.TZ = tz;
  }
});
