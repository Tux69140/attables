/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ContrainteConvive, ContrainteNiveau, Convive, Invitation, MenuCourses, PlatFiche } from '../types/models';
import { aggregateConstraints, buildAiPromptMarkdown, getDishSuggestions, getElapsedTimeInfo } from './dishes';

const c = (id: string, nom: string, note: string, ...els: ContrainteConvive[]): Convive => ({ id, nomAffiche: nom, contraintes: els, contrainteLibre: note });
const el = (id: string, libelle: string, niveau: ContrainteNiveau, allergenes: string[]): ContrainteConvive => ({ id, libelle, niveau, allergenes });
const lea = c('conv-lea', 'Léa', 'pas de coriandre', el('ctr-1', 'Arachides', 'strict', ['arachides']), el('ctr-2', 'Lait', 'preference', ['lait']));
const nadia = c('conv-nadia', 'Nadia', '', el('ctr-3', 'arachides', 'strict', ['arachides']));
const marc = c('conv-marc', 'Marc', '');
const tablee = [lea, nadia, marc];
const parId = new Map(tablee.map((g) => [g.id, g]));

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

test('aggregateConstraints regroupe par libellé et détaille par personne', () => {
  const r = aggregateConstraints(['conv-lea', 'conv-nadia', 'conv-marc'], parId);
  assert.deepEqual(
    r.strict.map((g) => [g.cle, g.libelle, g.icone, g.guests.map((x) => x.nomAffiche)]),
    [['arachides', 'Arachides', 'arachide', ['Léa', 'Nadia']]]
  );
  assert.deepEqual(r.preferences.map((g) => [g.libelle, g.guests.map((x) => x.nomAffiche)]), [['Lait', ['Léa']]]);
  assert.deepEqual(
    r.parPersonne.map((p) => [p.guest.nomAffiche, p.strict.map((e) => e.id), p.evite.map((e) => e.id), p.note]),
    [
      ['Léa', ['ctr-1'], ['ctr-2'], 'pas de coriandre'],
      ['Nadia', ['ctr-3'], [], ''],
    ]
  );
  assert.deepEqual(r.freeNotes.map((n) => [n.guest.nomAffiche, n.note]), [['Léa', 'pas de coriandre']]);
});

test('buildAiPromptMarkdown anonymisé : nombre de personnes, sans prénom', () => {
  const texte = buildAiPromptMarkdown({
    options: { mealType: 'Dîner', seasonOrTheme: '', timeOrBudget: '', freeInstruction: '', anonymize: true },
    hoteType: 'moi',
    hoteLabel: 'Moi',
    date: '2026-11-28',
    selectedGuests: tablee,
    constraints: aggregateConstraints(tablee.map((g) => g.id), parId),
    servedDishes: [],
    currentMenu: {},
    prescriptionMois: 6,
  });
  assert.ok(texte.includes('Arachides (2 personnes)'));
  assert.ok(texte.includes('Lait (1 personne)'));
  assert.ok(!texte.includes('Léa'));
  assert.ok(!texte.includes('Nadia'));
});
