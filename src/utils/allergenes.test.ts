/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyData, getDefaultContraintes } from '../services/storage';
import type { ContrainteTag, Convive } from '../types/models';
import { choixAllergenes, conflitsPlat, iconeContrainte, resumeAllergiesStrictes, retirerContrainte } from './allergenes';

const coriandre: ContrainteTag = { id: 'tag-coriandre', libelle: 'Coriandre', niveau: 'preference', allergenes: [] };
const contraintes = [...getDefaultContraintes(), coriandre];
const parId = new Map(contraintes.map((t) => [t.id, t]));
const convive = (id: string, nomAffiche: string, contraintesIds: string[]): Convive => ({
  id,
  nomAffiche,
  contraintesIds,
  contrainteLibre: '',
});
const lea = convive('conv-lea', 'Léa', ['tag-arachides']);
const sophie = convive('conv-sophie', 'Sophie', ['tag-lactose']);
const julie = convive('conv-julie', 'Julie', ['tag-vegetarien']);
const tom = convive('conv-tom', 'Tom', ['tag-coriandre']);
const paul = convive('conv-paul', 'Paul', ['tag-crustaces']);

test('allergie stricte', () => {
  assert.deepEqual(conflitsPlat(['arachides'], [lea], parId), [
    { allergeneId: 'arachides', libelle: 'Arachides', niveau: 'strict', convives: [lea] },
  ]);
});

test('préférence', () => {
  const res = conflitsPlat(['lait', 'oeufs'], [sophie], parId);
  assert.equal(res.length, 1);
  assert.equal(res[0].allergeneId, 'lait');
  assert.equal(res[0].niveau, 'preference');
});

test('végétarien et poisson', () => {
  const res = conflitsPlat(['poissons'], [julie], parId);
  assert.deepEqual(res.map((c) => c.allergeneId), ['poissons']);
});

test('contrainte personnelle', () => {
  const res = conflitsPlat(['tag-coriandre'], [tom], parId);
  assert.equal(res.length, 1);
  assert.equal(res[0].libelle, 'Coriandre');
  assert.deepEqual(res[0].convives, [tom]);
});

test('aucun faux positif', () => {
  assert.deepEqual(conflitsPlat(['arachides', 'gluten'], [paul], parId), []);
});

test('strict avant préférence', () => {
  const res = conflitsPlat(['lait', 'arachides'], [lea, sophie], parId);
  assert.deepEqual(res.map((c) => c.allergeneId), ['arachides', 'lait']);
});

test('retirerContrainte nettoie convives et plats', () => {
  const data = createEmptyData();
  data.contraintes.push(coriandre);
  data.convives.push(tom);
  data.plats.push({ id: 'plat-1', libelle: 'Taboulé', services: ['entree'], allergenes: ['tag-coriandre', 'lait'] });
  const res = retirerContrainte(data, 'tag-coriandre');
  assert.equal(res.contraintes.some((t) => t.id === 'tag-coriandre'), false);
  assert.deepEqual(res.convives[0].contraintesIds, []);
  assert.deepEqual(res.plats[0].allergenes, ['lait']);
  assert.deepEqual(data.convives[0].contraintesIds, ['tag-coriandre'], 'entrée non modifiée');
});

test('choixAllergenes', () => {
  const res = choixAllergenes(contraintes);
  assert.deepEqual(res.personnels, [coriandre]);
  assert.equal(res.reglementaires.length, 14);
  assert.equal(res.autres.length, 4);
});

test('iconeContrainte', () => {
  assert.equal(iconeContrainte({ ...coriandre, icone: 'ail' }), 'ail');
  assert.equal(iconeContrainte(parId.get('tag-arachides')!), 'arachide');
  assert.equal(iconeContrainte(parId.get('tag-vegetarien')!), 'leaf');
  assert.equal(iconeContrainte(coriandre), 'tag');
});

test('resumeAllergiesStrictes : deux premières puis le reste', () => {
  const nadia = convive('conv-nadia', 'Nadia', ['tag-fruits-coque', 'tag-gluten']);
  const strict = ['tag-arachides', 'tag-fruits-coque', 'tag-crustaces', 'tag-gluten'].map((id) => ({
    tag: parId.get(id)!,
    guests: id === 'tag-arachides' ? [lea] : id === 'tag-crustaces' ? [paul] : [nadia],
  }));
  assert.deepEqual(resumeAllergiesStrictes(strict), {
    texte: 'Arachides (Léa) · Fruits à coque (Nadia)',
    reste: 2,
  });
  assert.deepEqual(resumeAllergiesStrictes(strict.slice(0, 1)), { texte: 'Arachides (Léa)', reste: 0 });
});

test('Végétarien et Végan ont un pictogramme par défaut, l’icône choisie l’emporte', () => {
  const defaut = getDefaultContraintes();
  const vege = defaut.find((t) => t.id === 'tag-vegetarien')!;
  const vegan = defaut.find((t) => t.id === 'tag-vegan')!;
  assert.equal(iconeContrainte(vege), 'leaf');
  assert.equal(iconeContrainte(vegan), 'sprout');
  assert.equal(iconeContrainte({ ...vegan, icone: 'carrot' }), 'carrot');
});
