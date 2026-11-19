/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ContrainteConvive, ContrainteNiveau, Convive, PlatFiche } from '../types/models';
import {
  affaiblissements,
  alimentsLibresConnus,
  choixAllergenes,
  conflitsPlat,
  dejaPresent,
  iconeContrainte,
  idAutre,
  libelleAllergene,
  memeAllergene,
  REGIMES,
  resumeAllergiesStrictes,
} from './allergenes';

const c = (id: string, nom: string, ...els: ContrainteConvive[]): Convive => ({ id, nomAffiche: nom, contraintes: els, contrainteLibre: '' });
const el = (id: string, libelle: string, niveau: ContrainteNiveau, allergenes: string[]): ContrainteConvive => ({ id, libelle, niveau, allergenes });

test('conflitsPlat : allergie stricte d\'une personne', () => {
  const lea = c('conv-lea', 'Léa', el('ctr-1', 'Arachides', 'strict', ['arachides']));
  const r = conflitsPlat(['arachides'], [lea]);
  assert.deepEqual(r.map((x) => [x.allergeneId, x.niveau, x.convives.map((g) => g.id)]), [['arachides', 'strict', ['conv-lea']]]);
});

test('conflitsPlat : même aliment, niveaux propres à chacun', () => {
  const lea = c('conv-lea', 'Léa', el('ctr-1', 'Lait', 'strict', ['lait']));
  const marc = c('conv-marc', 'Marc', el('ctr-2', 'Lait', 'preference', ['lait']));
  const r = conflitsPlat(['lait'], [lea, marc]);
  assert.deepEqual(r.map((x) => [x.niveau, x.convives.map((g) => g.nomAffiche)]), [['strict', ['Léa']], ['preference', ['Marc']]]);
});

test('conflitsPlat : aliment libre, casse et accents différents', () => {
  const lea = c('conv-lea', 'Léa', el('ctr-1', 'Kiwi', 'strict', ['autre:kiwi']));
  assert.equal(conflitsPlat(['autre:Kiwi'], [lea]).length, 1);
});

test('conflitsPlat : régime ajusté pour une seule personne', () => {
  const lea = c('conv-lea', 'Léa', el('ctr-1', 'Végétarienne', 'preference', ['viande', 'crustaces', 'mollusques']));
  assert.equal(conflitsPlat(['poissons'], [lea]).length, 0);
  assert.equal(conflitsPlat(['viande'], [lea]).length, 1);
});

test('conflitsPlat : aucun faux positif', () => {
  const paul = c('conv-paul', 'Paul', el('ctr-1', 'Crustacés', 'strict', ['crustaces']));
  assert.deepEqual(conflitsPlat(['arachides', 'gluten'], [paul]), []);
});

test('conflitsPlat : strict avant préférence, une allergie l\'emporte pour une même personne', () => {
  const lea = c('conv-lea', 'Léa', el('ctr-1', 'Arachides', 'strict', ['arachides']), el('ctr-2', 'Végan', 'preference', REGIMES[1].allergenes));
  const sophie = c('conv-sophie', 'Sophie', el('ctr-3', 'Lait', 'preference', ['lait']));
  const r = conflitsPlat(['lait', 'arachides'], [lea, sophie]);
  assert.deepEqual(r.map((x) => [x.allergeneId, x.niveau]), [['arachides', 'strict'], ['lait', 'preference']]);
  const lait = c('conv-x', 'X', el('ctr-4', 'Végan', 'preference', ['lait']), el('ctr-5', 'Lait', 'strict', ['lait']));
  assert.deepEqual(conflitsPlat(['lait'], [lait]).map((x) => x.niveau), ['strict']);
});

test('idAutre / libelleAllergene / memeAllergene', () => {
  assert.equal(idAutre('  kiwi '), 'autre:Kiwi');
  assert.equal(libelleAllergene('autre:Kiwi'), 'Kiwi');
  assert.equal(libelleAllergene('oeufs'), 'Œufs');
  assert.ok(memeAllergene('autre:Céleri rave', 'autre:celeri rave'));
  assert.ok(!memeAllergene('autre:Kiwi', 'kiwi'));
});

test('alimentsLibresConnus : réunion sans doublon, triée', () => {
  const lea = c('conv-lea', 'Léa', el('ctr-1', 'Kiwi', 'strict', ['autre:Kiwi']));
  const plats = [{ id: 'p', libelle: 'Salade', services: ['entree'], allergenes: ['autre:kiwi', 'autre:Ananas', 'oeufs'] }] as PlatFiche[];
  assert.deepEqual(alimentsLibresConnus([lea], plats), ['autre:Ananas', 'autre:Kiwi']);
});

test('choixAllergenes', () => {
  const res = choixAllergenes(['autre:Kiwi']);
  assert.deepEqual(res.libres, ['autre:Kiwi']);
  assert.equal(res.reglementaires.length, 14);
  assert.equal(res.autres.length, 4);
});

test('iconeContrainte : choisie, sinon celle de l\'unique allergène, sinon l\'étiquette', () => {
  assert.equal(iconeContrainte({ icone: 'ail', allergenes: [] }), 'ail');
  assert.equal(iconeContrainte({ allergenes: ['arachides'] }), 'arachide');
  assert.equal(iconeContrainte({ allergenes: ['autre:Kiwi'] }), 'tag');
  assert.equal(iconeContrainte({ allergenes: ['viande', 'poissons'] }), 'tag');
});

test('régimes pré-remplis : Végétarien et Végan', () => {
  assert.deepEqual(
    REGIMES.map((r) => [r.id, r.libelle, r.allergenes, r.icone]),
    [
      ['vegetarien', 'Végétarien', ['viande', 'poissons', 'crustaces', 'mollusques'], 'leaf'],
      ['vegan', 'Végan', ['viande', 'poissons', 'crustaces', 'mollusques', 'oeufs', 'lait'], 'sprout'],
    ]
  );
});

test('resumeAllergiesStrictes : deux premières puis le reste', () => {
  const lea = c('conv-lea', 'Léa');
  const paul = c('conv-paul', 'Paul');
  const nadia = c('conv-nadia', 'Nadia');
  const groupe = (libelle: string, guests: Convive[]) => ({ cle: libelle.toLowerCase(), libelle, icone: 'tag' as const, guests });
  const strict = [groupe('Arachides', [lea]), groupe('Fruits à coque', [nadia]), groupe('Crustacés', [paul]), groupe('Gluten', [nadia])];
  assert.deepEqual(resumeAllergiesStrictes(strict), {
    texte: 'Arachides (Léa) · Fruits à coque (Nadia)',
    reste: 2,
  });
  assert.deepEqual(resumeAllergiesStrictes(strict.slice(0, 1)), { texte: 'Arachides (Léa)', reste: 0 });
});

test('affaiblissements', () => {
  const ara = el('ctr-1', 'Arachides', 'strict', ['arachides']);
  const vegan = el('ctr-2', 'Végan', 'strict', ['viande', 'oeufs', 'lait']);
  const lait = el('ctr-3', 'Lait', 'preference', ['lait']);
  assert.deepEqual(affaiblissements([ara, vegan, lait], [vegan, lait]), ['Arachides']); // retirée
  assert.deepEqual(affaiblissements([ara], [{ ...ara, niveau: 'preference' }]), ['Arachides']); // passée à « Évite »
  assert.deepEqual(affaiblissements([vegan], [{ ...vegan, allergenes: ['viande', 'oeufs'] }]), ['Végan']); // allergène retiré
  assert.deepEqual(affaiblissements([lait], []), []); // « Évite » retiré : rien
  assert.deepEqual(affaiblissements([ara], [{ ...ara, libelle: 'Cacahuètes' }]), []); // renommée : rien
});

test('dejaPresent', () => {
  assert.ok(dejaPresent([el('ctr-1', 'Œufs', 'strict', ['oeufs'])], ['oeufs']));
  assert.ok(!dejaPresent([el('ctr-1', 'Végan', 'preference', ['oeufs', 'lait'])], ['oeufs']));
});
