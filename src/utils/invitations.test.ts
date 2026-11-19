/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Invitation } from '../types/models';
import { construireInvitation, invitationVide, memeInvitation, type ChampsInvitation } from './invitations';

function champs(surcharge: Partial<ChampsInvitation> = {}): ChampsInvitation {
  return {
    date: '2026-11-19',
    titre: '',
    note: '',
    hoteType: 'moi',
    hoteLabel: '',
    convivesIds: [],
    menu: {},
    menuVerdicts: {},
    ...surcharge,
  };
}

function inv(surcharge: Partial<Invitation> = {}): Invitation {
  return {
    id: 'inv-1',
    statut: 'prevue',
    date: '2026-11-19',
    hoteType: 'moi',
    hoteLabel: 'Moi',
    convivesIds: [],
    menu: {},
    ...surcharge,
  };
}

test('invitationVide : un brouillon neuf est vide', () => {
  assert.equal(invitationVide(inv()), true);
});

test('invitationVide : un convive, un plat, un titre ou une note la rendent non vide', () => {
  assert.equal(invitationVide(inv({ convivesIds: ['conv-1'] })), false);
  assert.equal(invitationVide(inv({ menu: { plat: 'Gratin' } })), false);
  assert.equal(invitationVide(inv({ titre: 'Anniversaire' })), false);
  assert.equal(invitationVide(inv({ note: 'Apporter du vin' })), false);
});

test('invitationVide : un plat vide ou blanc ne compte pas', () => {
  assert.equal(invitationVide(inv({ menu: { plat: '  ', dessert: '' } })), true);
});

test('memeInvitation : même contenu, identifiants différents', () => {
  assert.equal(memeInvitation(inv({ id: 'a', menu: { plat: 'Gratin' } }), inv({ id: 'b', menu: { plat: 'Gratin' } })), true);
});

test('memeInvitation : un plat différent', () => {
  assert.equal(memeInvitation(inv({ menu: { plat: 'Gratin' } }), inv({ menu: { plat: 'Quiche' } })), false);
});

test('memeInvitation : un verdict différent', () => {
  const a = inv({ menu: { plat: 'Gratin' }, menuVerdicts: { plat: 'bien' } });
  const b = inv({ menu: { plat: 'Gratin' }, menuVerdicts: { plat: 'a_eviter' } });
  assert.equal(memeInvitation(a, b), false);
  assert.equal(memeInvitation(inv({ verdict: 'bien' }), inv({ verdict: 'coup_de_coeur' })), false);
});

test('memeInvitation : le statut compte, pas l\'ordre des convives ni les clés absentes ou undefined', () => {
  assert.equal(memeInvitation(inv({ statut: 'realisee' }), inv({ statut: 'prevue' })), false);
  assert.equal(memeInvitation(inv({ convivesIds: ['a', 'b'] }), inv({ convivesIds: ['b', 'a'] })), true);
  assert.equal(memeInvitation(inv({ titre: undefined, menuVerdicts: undefined }), inv()), true);
});

test('construireInvitation : nettoie le menu et ne garde que les verdicts des plats présents', () => {
  const r = construireInvitation(
    champs({ menu: { plat: 'gratin dauphinois', dessert: '  ' }, menuVerdicts: { plat: 'bien', dessert: 'bien' } }),
    'inv-9',
    'prevue',
    new Set(),
  );
  assert.equal(r.id, 'inv-9');
  assert.deepEqual(Object.keys(r.menu), ['plat']);
  assert.deepEqual(r.menuVerdicts, { plat: 'bien' });
  assert.equal(r.hoteLabel, 'Moi');
  assert.equal(r.titre, undefined);
});

test('construireInvitation : un identifiant de convive absent des personnes connues est ignoré', () => {
  const r = construireInvitation(
    champs({ convivesIds: ['conv-1', 'conv-annule', 'conv-2'] }),
    'inv-9',
    'prevue',
    new Set(['conv-1', 'conv-2']),
  );
  assert.deepEqual(r.convivesIds, ['conv-1', 'conv-2']);
  // La personne créée puis annulée n'empêche plus l'invitation d'être vue comme vide ou inchangée.
  const seulAnnule = construireInvitation(champs({ convivesIds: ['conv-annule'] }), 'inv-9', 'prevue', new Set());
  assert.equal(invitationVide(seulAnnule), true);
  assert.equal(memeInvitation(seulAnnule, construireInvitation(champs(), 'inv-8', 'prevue', new Set())), true);
});
