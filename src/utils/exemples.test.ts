/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyData, createSampleData, getDefaultContraintes } from '../services/storage';
import type { Convive, Invitation } from '../types/models';
import { effacerExemples, resteDesExemples } from './exemples';

test('resteDesExemples détecte les données d\'exemple', () => {
  assert.equal(resteDesExemples(createSampleData()), true);
  assert.equal(resteDesExemples(createEmptyData()), false);
});

test('effacerExemples vide foyers, convives et invitations', () => {
  const exemple = createSampleData();
  const res = effacerExemples(exemple);
  assert.deepEqual(res.foyers, []);
  assert.deepEqual(res.convives, []);
  assert.deepEqual(res.invitations, []);
  assert.deepEqual(res.contraintes, getDefaultContraintes());
  assert.deepEqual(res.settings, exemple.settings);
  assert.equal(resteDesExemples(res), false);
});

test('un convive utilisateur rattaché à un foyer d\'exemple perd son foyer', () => {
  const data = createSampleData();
  const mien: Convive = {
    id: 'conv-1700000000000',
    nomAffiche: 'Moi',
    foyerId: 'foyer-martin',
    contraintesIds: [],
    contrainteLibre: '',
  };
  data.convives.push(mien);
  const res = effacerExemples(data);
  assert.equal(res.convives.length, 1);
  assert.equal(res.convives[0].id, mien.id);
  assert.equal(res.convives[0].foyerId, undefined);
});

test('un exemple renommé est tout de même effacé', () => {
  const data = createSampleData();
  data.foyers = data.foyers.map((f) => (f.id === 'foyer-martin' ? { ...f, nom: 'Ma famille' } : f));
  const res = effacerExemples(data);
  assert.deepEqual(res.foyers, []);
});

test('une invitation utilisateur garde son libellé d\'hôte mais perd la référence', () => {
  const data = createSampleData();
  const inv: Invitation = {
    id: 'inv-1700000000000',
    statut: 'prevue',
    date: '2026-12-01',
    hoteType: 'autre',
    hoteLabel: 'Claire & Tom',
    hoteRefType: 'foyer',
    hoteRefId: 'foyer-claire-tom',
    convivesIds: [],
    menu: {},
  };
  data.invitations.push(inv);
  const res = effacerExemples(data);
  assert.equal(res.invitations.length, 1);
  assert.equal(res.invitations[0].hoteRefType, undefined);
  assert.equal(res.invitations[0].hoteRefId, undefined);
  assert.equal(res.invitations[0].hoteLabel, 'Claire & Tom');
});

test('une référence d\'hôte vers un convive d\'exemple est retirée', () => {
  const data = createSampleData();
  data.invitations.push({
    id: 'inv-1700000000001',
    statut: 'prevue',
    date: '2026-12-01',
    hoteType: 'autre',
    hoteLabel: 'Paul',
    hoteRefType: 'convive',
    hoteRefId: 'conv-paul',
    convivesIds: [],
    menu: {},
  });
  const res = effacerExemples(data);
  assert.equal(res.invitations[0].hoteRefType, undefined);
  assert.equal(res.invitations[0].hoteRefId, undefined);
});

test('les convives d\'exemple sont retirés des invitations utilisateur', () => {
  const data = createSampleData();
  data.invitations.push({
    id: 'inv-1700000000002',
    statut: 'prevue',
    date: '2026-12-01',
    hoteType: 'moi',
    hoteLabel: 'Moi',
    convivesIds: ['conv-paul', 'conv-julie'],
    menu: {},
  });
  const res = effacerExemples(data);
  assert.deepEqual(res.invitations[0].convivesIds, []);
});

test('l\'entrée n\'est pas mutée', () => {
  const data = createSampleData();
  data.convives.push({
    id: 'conv-1700000000000',
    nomAffiche: 'Moi',
    foyerId: 'foyer-martin',
    contraintesIds: [],
    contrainteLibre: '',
  });
  const copie = structuredClone(data);
  effacerExemples(data);
  assert.deepEqual(data, copie);
});
