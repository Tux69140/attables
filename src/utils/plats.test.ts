/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Convive, CourseKey, DishVerdict, Invitation, PlatFiche } from '../types/models';
import {
  cleDePlat,
  compterFiltres,
  enregistrerFiche,
  platsProches,
  rechercherPlats,
  renommerIdee,
  repertoirePlats,
  trouverFiche,
} from './plats';

test('cleDePlat ignore casse et espaces', () => {
  assert.equal(cleDePlat('tarte Tatin  '), cleDePlat('Tarte tatin'));
  assert.equal(cleDePlat('TARTE TATIN'), cleDePlat('Tarte tatin'));
});

test('cleDePlat ignore la forme de l\'apostrophe', () => {
  assert.equal(cleDePlat('Pâté d\'Henri'), cleDePlat('Pâté d’Henri'));
});

test('cleDePlat ignore les tirets', () => {
  assert.equal(cleDePlat('Pot-au-feu'), cleDePlat('pot au feu'));
  assert.equal(cleDePlat('Pot–au–feu'), cleDePlat('pot au feu'));
});

test('trouverFiche retrouve un plat écrit autrement', () => {
  const fiche: PlatFiche = { id: 'plat-1', libelle: 'Tarte Tatin', services: ['dessert'], allergenes: [] };
  assert.equal(trouverFiche([fiche], 'tarte tatin'), fiche);
  assert.equal(trouverFiche([fiche], 'Tarte aux pommes'), undefined);
});

const AUJ = '2026-11-17';
const paul: Convive = { id: 'conv-paul', nomAffiche: 'Paul', contraintesIds: [], contrainteLibre: '' };
const parId = new Map([[paul.id, paul]]);
let n = 0;
const inv = (
  date: string,
  course: CourseKey,
  plat: string,
  options: { statut?: Invitation['statut']; verdict?: DishVerdict; hote?: string } = {}
): Invitation => ({
  id: `inv-${++n}`,
  statut: options.statut ?? 'realisee',
  date,
  hoteType: options.hote ? 'autre' : 'moi',
  hoteLabel: options.hote ?? 'Moi',
  convivesIds: [paul.id],
  menu: { [course]: plat },
  ...(options.verdict ? { menuVerdicts: { [course]: options.verdict } } : {}),
});
const fiche = (libelle: string, services: CourseKey[] = ['plat'], allergenes: string[] = []): PlatFiche => ({
  id: `plat-${libelle}`,
  libelle,
  services,
  allergenes,
});
const repertoire = (invitations: Invitation[], plats: PlatFiche[] = []) =>
  repertoirePlats(invitations, plats, parId, 6, AUJ);
const etat = (invitations: Invitation[], plats: PlatFiche[] = []) => repertoire(invitations, plats)[0];

test('états', () => {
  assert.equal(etat([inv('2026-10-18', 'plat', 'Risotto')]).etat, 'recent');
  assert.equal(etat([inv('2026-03-06', 'plat', 'Risotto')]).etat, 'peut_revenir');
  assert.equal(etat([inv('2026-10-18', 'plat', 'Risotto', { verdict: 'a_eviter' })]).etat, 'a_eviter');
  const prevu = etat([inv('2026-11-28', 'plat', 'Risotto', { statut: 'prevue' })]);
  assert.equal(prevu.etat, 'prevu');
  assert.equal(prevu.prevuLe, '2026-11-28');
  assert.equal(etat([], [fiche('Pot-au-feu')]).etat, 'idee');
  assert.equal(etat([inv('2026-10-18', 'plat', 'Risotto', { verdict: 'coup_de_coeur' })]).coupDeCoeur, true);
});

test('variantes d’un même plat', () => {
  const liste = repertoire(
    [inv('2026-10-18', 'dessert', 'Tarte tatin'), inv('2026-09-12', 'dessert', 'TARTE TATIN')],
    [fiche('tarte Tatin  ', ['dessert'])]
  );
  assert.equal(liste.length, 1);
  assert.ok(liste[0].fiche);
  assert.equal(liste[0].apparitions.length, 2);
});

test('plats mangés chez les autres', () => {
  const plat = etat([inv('2026-09-12', 'plat', 'Risotto', { hote: 'Paul & Julie' })]);
  assert.equal(plat.apparitions[0].hoteLabel, 'Chez Paul & Julie');
  assert.deepEqual(plat.apparitions[0].convives, ['Paul']);
});

test('compterFiltres', () => {
  const liste = repertoire(
    [inv('2026-10-18', 'plat', 'Risotto', { verdict: 'coup_de_coeur' }), inv('2026-03-06', 'entree', 'Velouté')],
    [fiche('Pot-au-feu')]
  );
  assert.deepEqual(compterFiltres(liste), { tous: 3, idees: 1, coeur: 1, peut_revenir: 1, a_eviter: 0 });
});

test('rechercherPlats', () => {
  const liste = repertoire([inv('2025-04-14', 'plat', 'Blanquette de veau')]);
  assert.deepEqual(rechercherPlats(liste, 'blanq'), { resultats: liste, proposerEnregistrement: true });
  assert.equal(rechercherPlats(liste, 'blanquette de veau').proposerEnregistrement, false);
  assert.deepEqual(rechercherPlats(liste, '   '), { resultats: liste, proposerEnregistrement: false });
});

test('platsProches : mêmes mots', () => {
  const lasagnes = repertoire([inv('2026-10-18', 'plat', 'Lasagnes aux légumes')]);
  assert.equal(platsProches(lasagnes, 'Lasagne aux légume')[0]?.libelle, 'Lasagnes aux légumes');
  assert.equal(platsProches(lasagnes, 'lasagnes aux légumes').length, 0);
  // Nom tapé contenu dans un plat connu : proposé (simple suggestion, l'enregistrement reste possible).
  const grilles = repertoire([inv('2026-10-18', 'plat', 'Lasagnes aux légumes grillés')]);
  assert.equal(platsProches(grilles, 'Lasagne aux légumes')[0]?.libelle, 'Lasagnes aux légumes grillés');
  const poires = repertoire([inv('2026-10-18', 'dessert', 'Tarte aux poires')]);
  assert.equal(platsProches(poires, 'Tarte aux pommes').length, 0);
});

test('rechercherPlats tolère une faute de frappe et l\'ordre des mots', () => {
  const liste = repertoire([inv('2026-11-28', 'apero', 'Velouté de potimarron en verrine')]);
  assert.equal(rechercherPlats(liste, 'potimaron').resultats.length, 1);
  assert.equal(rechercherPlats(liste, 'potimarons').resultats.length, 1);
  assert.equal(rechercherPlats(liste, 'potimar').resultats.length, 1);
  assert.equal(rechercherPlats(liste, 'verrine potimarron').resultats.length, 1);
  assert.equal(rechercherPlats(liste, 'potiron').resultats.length, 0);
  assert.equal(rechercherPlats(liste, 'velouté de carottes').resultats.length, 0);
  assert.equal(rechercherPlats(liste, 'potimaron').proposerEnregistrement, true);
});

test('platsProches : nom partiel ou faute de frappe', () => {
  const veloute = repertoire([inv('2026-11-28', 'apero', 'Velouté de potimarron en verrine')]);
  assert.equal(platsProches(veloute, 'Potimar')[0]?.libelle, 'Velouté de potimarron en verrine');
  assert.equal(platsProches(veloute, 'Potimaron')[0]?.libelle, 'Velouté de potimarron en verrine');
  assert.equal(platsProches(veloute, 'velouté potimaron')[0]?.libelle, 'Velouté de potimarron en verrine');
  assert.equal(platsProches(veloute, 'Potiron').length, 0);
  assert.equal(platsProches(veloute, 'Pot').length, 0);
  assert.equal(platsProches(veloute, 'Velouté de potimarron en verrine maison')[0]?.libelle, 'Velouté de potimarron en verrine');
  // Mêmes mots d'abord, puis le plat le plus proche (le moins de mots en plus).
  const deux = repertoire([
    inv('2026-10-18', 'plat', 'Lasagnes aux légumes grillés'),
    inv('2026-10-11', 'plat', 'Lasagnes aux légumes'),
  ]);
  assert.equal(platsProches(deux, 'Lasagne aux légume')[0]?.libelle, 'Lasagnes aux légumes');
  const tartes = repertoire([
    inv('2026-10-18', 'dessert', 'Tarte aux pommes caramélisées'),
    inv('2026-10-11', 'dessert', 'Tarte Tatin'),
  ]);
  assert.equal(platsProches(tartes, 'Tarte')[0]?.libelle, 'Tarte Tatin');
});

test('platsProches propose tous les plats proches, du plus proche au moins proche, 5 au plus', () => {
  const potimarrons = repertoire([
    inv('2026-11-28', 'apero', 'Velouté de potimarron en verrine'),
    inv('2026-10-11', 'plat', 'Potimarron farci'),
  ]);
  assert.deepEqual(platsProches(potimarrons, 'Potimaron').map((p) => p.libelle), ['Potimarron farci', 'Velouté de potimarron en verrine']);
  // Plat connu contenu dans le nom tapé : proposé aussi, après ceux qui contiennent le nom tapé.
  assert.deepEqual(platsProches(potimarrons, 'Potimarron farci au four').map((p) => p.libelle), ['Potimarron farci']);
  assert.deepEqual(platsProches(potimarrons, 'Potimarron').map((p) => p.libelle), ['Potimarron farci', 'Velouté de potimarron en verrine']);
  const deux = repertoire([
    inv('2026-10-18', 'plat', 'Lasagnes aux légumes grillés'),
    inv('2026-10-11', 'plat', 'Lasagnes aux légumes'),
  ]);
  assert.deepEqual(platsProches(deux, 'Lasagne aux légume').map((p) => p.libelle), ['Lasagnes aux légumes', 'Lasagnes aux légumes grillés']);
  const tartes = repertoire(
    ['Tatin', 'aux pommes', 'aux poires', 'au citron', 'aux fraises', 'aux mirabelles', 'aux noix'].map((g, i) =>
      inv(`2026-10-${String(10 + i)}`, 'dessert', `Tarte ${g}`)
    )
  );
  assert.equal(platsProches(tartes, 'Tarte').length, 5);
  assert.equal(platsProches(tartes, 'tarte aux pommes').some((p) => p.libelle === 'Tarte aux pommes'), false);
});

test('enregistrerFiche fusionne', () => {
  const res = enregistrerFiche([fiche('Tarte Tatin', ['dessert'])], { libelle: 'tarte tatin', services: ['entree'], allergenes: ['oeufs'] }, 'plat-2');
  assert.equal(res.length, 1);
  assert.deepEqual(res[0].services, ['dessert', 'entree']);
  assert.deepEqual(res[0].allergenes, ['oeufs']);
  const ajout = enregistrerFiche([], { libelle: '  blanquette  ', services: ['plat'], allergenes: [] }, 'plat-3');
  assert.deepEqual(ajout, [{ id: 'plat-3', libelle: 'Blanquette', services: ['plat'], allergenes: [] }]);
});

test('renommerIdee', () => {
  const plats = [fiche('Pot-au-feu'), fiche('Blanquette')];
  assert.equal(renommerIdee(plats, 'plat-Blanquette', 'pot au feu'), 'existe');
  const res = renommerIdee(plats, 'plat-Blanquette', 'blanquette de veau');
  assert.notEqual(res, 'existe');
  assert.equal((res as PlatFiche[])[1].libelle, 'Blanquette de veau');
});
