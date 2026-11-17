/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Invitation } from '../types/models';
import { getElapsedTimeInfo } from './dishes';
import { delaiRelatif, estAMarquer, formatDateCourte, formatJourMois, moisAvantRetour, trierAVenir } from './dates';

const AUJ = '2026-11-17';
const inv = (date: string, statut: Invitation['statut'] = 'prevue'): Invitation => ({
  id: `inv-${date}-${statut}`,
  statut,
  date,
  hoteType: 'moi',
  hoteLabel: 'Moi',
  convivesIds: [],
  menu: {},
});

test('delaiRelatif', () => {
  assert.equal(delaiRelatif('2026-11-17', AUJ), 'aujourd’hui');
  assert.equal(delaiRelatif('2026-11-18', AUJ), 'demain');
  assert.equal(delaiRelatif('2026-11-28', AUJ), 'dans 11 jours');
  assert.equal(delaiRelatif('2026-11-16', AUJ), 'hier');
  assert.equal(delaiRelatif('2026-11-15', AUJ), 'il y a 2 jours');
});

test('delaiRelatif traverse un changement d’heure', () => {
  assert.equal(delaiRelatif('2026-10-27', '2026-10-24'), 'dans 3 jours');
  assert.equal(delaiRelatif('2027-03-29', '2027-03-27'), 'dans 2 jours');
});

test('estAMarquer : prévue et date atteinte', () => {
  assert.equal(estAMarquer(inv('2026-11-17'), AUJ), true);
  assert.equal(estAMarquer(inv('2026-11-15'), AUJ), true);
  assert.equal(estAMarquer(inv('2026-11-18'), AUJ), false);
  assert.equal(estAMarquer(inv('2026-11-15', 'realisee'), AUJ), false);
});

test('trierAVenir : à marquer d’abord, puis futures par date', () => {
  const dates = ['2026-11-28', '2026-11-15', '2026-11-17', '2026-12-12', '2026-11-10'];
  assert.deepEqual(
    trierAVenir(dates.map((d) => inv(d)), AUJ).map((i) => i.date),
    ['2026-11-10', '2026-11-15', '2026-11-17', '2026-11-28', '2026-12-12']
  );
});

test('formatDateCourte', () => {
  assert.equal(formatDateCourte('2026-11-28'), 'sam. 28 nov.');
  assert.equal(formatDateCourte('2026-12-12'), 'sam. 12 déc.');
});

test('getElapsedTimeInfo accepte une date du jour', () => {
  assert.equal(getElapsedTimeInfo('2026-11-15', AUJ).daysAgo, 2);
});

test('formatJourMois : année seulement si différente', () => {
  assert.equal(formatJourMois('2026-10-18', AUJ), '18 oct.');
  assert.equal(formatJourMois('2025-04-14', AUJ), '14 avr. 2025');
});

test('moisAvantRetour : jusqu’à la fin du délai de prescription', () => {
  assert.equal(moisAvantRetour('2026-10-18', 6, AUJ), 5);
  assert.equal(moisAvantRetour('2026-11-10', 6, AUJ), 6);
  assert.equal(moisAvantRetour('2026-05-20', 6, AUJ), 1);
});
