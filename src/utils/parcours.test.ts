/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Convive, Foyer, Invitation } from '../types/models';
import { etatParcours, resumeProches } from './parcours';

const convive = (id: string, nomAffiche: string, foyerId?: string): Convive => ({
  id,
  nomAffiche,
  foyerId,
  contraintes: [],
  contrainteLibre: '',
});
const foyer = (id: string, nom: string): Foyer => ({ id, nom, couleur: 'corail', picto: 'maison' });
const invitation = (statut: Invitation['statut']): Invitation => ({
  id: `inv-${statut}`,
  statut,
  date: '2026-11-28',
  hoteType: 'moi',
  hoteLabel: 'Moi',
  convivesIds: ['conv-nadia'],
  menu: {},
});
const nadia = convive('conv-nadia', 'Nadia');

test('carnet vide', () => {
  assert.deepEqual(etatParcours({ convives: [], invitations: [] }), {
    proches: false,
    invitation: false,
    realisee: false,
    etapeCourante: 1,
    affichage: 'complet',
  });
});

test('convives sans invitation', () => {
  const e = etatParcours({ convives: [nadia], invitations: [] });
  assert.equal(e.etapeCourante, 2);
  assert.equal(e.affichage, 'complet');
});

test('une invitation à venir', () => {
  const e = etatParcours({ convives: [nadia], invitations: [invitation('prevue')] });
  assert.equal(e.etapeCourante, 3);
  assert.equal(e.affichage, 'ligne');
});

test('une invitation réalisée', () => {
  const e = etatParcours({ convives: [nadia], invitations: [invitation('prevue'), invitation('realisee')] });
  assert.equal(e.etapeCourante, null);
  assert.equal(e.affichage, 'aucun');
});

test('resumeProches : un foyer et une personne', () => {
  const martin = foyer('foyer-martin', 'Famille Martin');
  assert.equal(
    resumeProches({ foyers: [martin], convives: [convive('conv-marc', 'Marc', martin.id), nadia] }),
    'Famille Martin et Nadia sont dans le carnet.'
  );
});

test('resumeProches : une seule personne', () => {
  assert.equal(resumeProches({ foyers: [], convives: [nadia] }), 'Nadia est dans le carnet.');
});

test('resumeProches : au-delà de deux', () => {
  const martin = foyer('foyer-martin', 'Famille Martin');
  const pj = foyer('foyer-pj', 'Paul & Julie');
  const convives = [convive('c1', 'Marc', martin.id), convive('c2', 'Paul', pj.id), nadia, convive('c3', 'Tom')];
  assert.equal(
    resumeProches({ foyers: [martin, pj], convives }),
    'Famille Martin, Paul & Julie et 2 autres sont dans le carnet.'
  );
});
