/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import type { AppData, ContrainteConvive, ContrainteNiveau, Convive } from '../types/models';
import { conflitsPlat, LIAISONS_PAR_DEFAUT } from '../utils/allergenes';
import { aggregateConstraints } from '../utils/dishes';
import { createEmptyData, createSampleData, creerStockage, migrateAndValidateAppData, preparerExport } from './storage';

const c = (id: string, nom: string, ...els: ContrainteConvive[]): Convive => ({ id, nomAffiche: nom, contraintes: els, contrainteLibre: '' });
const el = (id: string, libelle: string, niveau: ContrainteNiveau, allergenes: string[]): ContrainteConvive => ({ id, libelle, niveau, allergenes });

function installerFauxStockage(initial: Record<string, string> = {}) {
  const contenu = { ...initial };
  const compteur = { setItem: 0 };
  (globalThis as unknown as { localStorage: unknown }).localStorage = {
    getItem: (cle: string) => (cle in contenu ? contenu[cle] : null),
    setItem: (cle: string, valeur: string) => {
      compteur.setItem += 1;
      contenu[cle] = valeur;
    },
  };
  return compteur;
}

afterEach(() => {
  delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
});

test('mode démo : charger renvoie toujours les exemples, même si le stockage contient autre chose', () => {
  installerFauxStockage({ attables_db_v1: JSON.stringify(createEmptyData()) });
  const exemple = createSampleData();
  assert.deepEqual(creerStockage(true).charger(), { ...exemple, settings: { ...exemple.settings, theme: 'clair' } });
  assert.equal(creerStockage(true).charger().settings.theme, 'clair');
  assert.equal(createSampleData().settings.theme, 'appareil');
});

test('mode démo : enregistrer n\'écrit jamais dans localStorage', () => {
  const compteur = installerFauxStockage();
  creerStockage(true).enregistrer(createEmptyData());
  assert.equal(compteur.setItem, 0);
});

test('premier lancement : carnet vide et accueil à afficher', () => {
  installerFauxStockage();
  const data = creerStockage(false).charger();
  assert.deepEqual(data.invitations, []);
  assert.deepEqual(data.convives, []);
  assert.deepEqual(data.plats, []);
  assert.equal(data.settings.accueilVu, false);
});

test('JSON illisible : traité comme une nouvelle installation', () => {
  installerFauxStockage({ attables_db_v1: '{pas du json' });
  const data = creerStockage(false).charger();
  assert.equal(data.settings.accueilVu, false);
  assert.deepEqual(data.foyers, []);
});

test('données 0.2.1 : accueil déjà vu, plats vides, liaisons par défaut', () => {
  const exemple = createSampleData();
  const ancien = {
    version: 1,
    foyers: exemple.foyers,
    invitations: exemple.invitations,
    settings: { theme: 'appareil', prescriptionMois: 6 },
    contraintes: [
      { id: 'tag-arachides', libelle: 'Arachides', niveau: 'strict' },
      { id: 'tag-vegan', libelle: 'Végan', niveau: 'preference' },
      { id: 'tag-123', libelle: 'Coriandre', niveau: 'preference' },
    ],
    convives: [{ id: 'conv-lea', nomAffiche: 'Léa', foyerId: 'foyer-martin', contraintesIds: ['tag-arachides', 'tag-vegan', 'tag-123'], contrainteLibre: '' }],
  };
  const res = migrateAndValidateAppData(JSON.parse(JSON.stringify(ancien)));
  const element = (tagId: string) => res.convives[0].contraintes.find((e) => e.id === `ctr-conv-lea-${tagId}`);
  assert.equal(res.settings.accueilVu, true);
  assert.deepEqual(res.plats, []);
  assert.deepEqual(element('tag-arachides')?.allergenes, ['arachides']);
  assert.deepEqual(element('tag-vegan')?.allergenes, ['viande', 'poissons', 'crustaces', 'mollusques', 'oeufs', 'lait']);
  assert.equal(element('tag-vegan')?.icone, 'sprout');
  assert.deepEqual(element('tag-123')?.allergenes, ['autre:Coriandre']);
  assert.equal(res.convives[0].foyerId, 'foyer-martin');
  assert.deepEqual(res.foyers, exemple.foyers);
  assert.deepEqual(res.invitations, exemple.invitations);
});

test('icône inconnue retirée (v1 et v2)', () => {
  const v1 = {
    foyers: [],
    invitations: [],
    contraintes: [
      { id: 'tag-1', libelle: 'Licorne', niveau: 'strict', allergenes: [], icone: 'licorne' },
      { id: 'tag-2', libelle: 'Sans ail', niveau: 'strict', allergenes: [], icone: 'ail' },
    ],
    convives: [{ id: 'conv-lea', nomAffiche: 'Léa', contraintesIds: ['tag-1', 'tag-2'], contrainteLibre: '' }],
  };
  const [licorne, ail] = migrateAndValidateAppData(v1).convives[0].contraintes;
  assert.equal('icone' in licorne, false);
  assert.equal(ail.icone, 'ail');
  const v2 = JSON.parse(JSON.stringify(createEmptyData()));
  v2.convives = [{ id: 'conv-lea', nomAffiche: 'Léa', contrainteLibre: '', contraintes: [{ id: 'ctr-1', libelle: 'Licorne', niveau: 'strict', allergenes: [], icone: 'licorne' }] }];
  assert.equal('icone' in migrateAndValidateAppData(v2).convives[0].contraintes[0], false);
});

test('v1 → v2 : chaque convive reçoit une copie de ses contraintes', () => {
  const v1 = { version: 1, foyers: [], invitations: [], plats: [],
    contraintes: [{ id: 'tag-arachides', libelle: 'Arachides', niveau: 'strict', allergenes: ['arachides'] },
                  { id: 'tag-vegetarien', libelle: 'Végétarien', niveau: 'preference' }],
    convives: [{ id: 'conv-lea', nomAffiche: 'Léa', contraintesIds: ['tag-arachides', 'tag-vegetarien', 'tag-inconnu'], contrainteLibre: '' }] };
  const d = migrateAndValidateAppData(v1);
  assert.equal(d.version, 2);
  assert.equal('contraintes' in d, false);
  const els = d.convives[0].contraintes;
  assert.deepEqual(els.map((e) => [e.libelle, e.niveau, e.allergenes]), [
    ['Arachides', 'strict', ['arachides']],
    ['Végétarien', 'preference', ['viande', 'poissons', 'crustaces', 'mollusques']],
  ]);
  assert.equal(els[1].icone, 'leaf');                 // pictogramme par défaut de tag-vegetarien conservé
  assert.equal(new Set(els.map((e) => e.id)).size, 2); // ids uniques
});

test('v1 → v2 : contrainte personnelle devient un aliment libre, sur la personne et sur le plat', () => {
  const v1 = { foyers: [], invitations: [],
    contraintes: [{ id: 'tag-kiwi', libelle: 'Kiwi', niveau: 'strict', allergenes: [] }],
    convives: [{ id: 'conv-lea', nomAffiche: 'Léa', contraintesIds: ['tag-kiwi'], contrainteLibre: '' }],
    plats: [{ id: 'p1', libelle: 'Pavlova', services: ['dessert'], allergenes: ['tag-kiwi', 'oeufs', 'zzz'] }] };
  const d = migrateAndValidateAppData(v1);
  assert.deepEqual(d.convives[0].contraintes[0].allergenes, ['autre:Kiwi']);
  assert.deepEqual(d.plats[0].allergenes, ['autre:Kiwi', 'oeufs']);
  // Comme en v1 (tag.id === a) : une seule alerte, le kiwi ; les œufs ne concernent pas Léa.
  assert.deepEqual(conflitsPlat(d.plats[0].allergenes, d.convives).map((x) => [x.allergeneId, x.niveau]), [['autre:Kiwi', 'strict']]);
});

test('v1 → v2 : plat qui cite une contrainte ayant des allergènes garde son alerte', () => {
  const v1 = { foyers: [], invitations: [],
    contraintes: [{ id: 'tag-x', libelle: 'Fruits exotiques', niveau: 'strict', allergenes: ['fruits-a-coque'] }],
    convives: [{ id: 'conv-lea', nomAffiche: 'Léa', contraintesIds: ['tag-x'], contrainteLibre: '' }],
    plats: [{ id: 'p1', libelle: 'Salade', services: ['entree'], allergenes: ['tag-x'] }] };
  const d = migrateAndValidateAppData(v1);
  assert.deepEqual(d.plats[0].allergenes, ['autre:Fruits exotiques']);
  assert.deepEqual(d.convives[0].contraintes[0].allergenes, ['fruits-a-coque', 'autre:Fruits exotiques']);
  assert.equal(conflitsPlat(d.plats[0].allergenes, d.convives)[0].niveau, 'strict');
});

test('v2 : validation (niveau inconnu → strict, sansAllergene faux si allergènes, ids inconnus retirés)', () => {
  const v2 = { version: 2, foyers: [], invitations: [],
    convives: [{ id: 'conv-lea', nomAffiche: 'Léa', contrainteLibre: '',
      contraintes: [{ id: 'ctr-1', libelle: 'Œufs', niveau: 'grave', allergenes: ['oeufs', 'ctr-9', 42] }] }],
    plats: [{ id: 'p1', libelle: 'Flan', services: ['dessert'], allergenes: ['oeufs', 'ctr-1'], sansAllergene: true }] };
  const d = migrateAndValidateAppData(v2);
  assert.equal(d.convives[0].contraintes[0].niveau, 'strict');
  assert.deepEqual(d.convives[0].contraintes[0].allergenes, ['oeufs']);
  assert.deepEqual(d.plats[0].allergenes, ['oeufs']);
  assert.equal(d.plats[0].sansAllergene ?? false, false);
});

test('v2 : « Aucun de ces allergènes » conservé sur une fiche sans allergène', () => {
  const v2 = { version: 2, foyers: [], invitations: [], convives: [],
    plats: [{ id: 'p1', libelle: 'Pain', services: ['entree'], allergenes: [], sansAllergene: true }] };
  assert.equal(migrateAndValidateAppData(v2).plats[0].sansAllergene, true);
});

test('exemples v2 : mêmes personnes et contraintes qu\'avant', () => {
  const d = createSampleData();
  assert.equal(d.version, 2);
  const lib = (id: string) => d.convives.find((x) => x.id === id)!.contraintes.map((e) => `${e.libelle}/${e.niveau}`);
  assert.deepEqual(lib('conv-paul'), ['Crustacés/strict']);
  assert.deepEqual(lib('conv-julie'), ['Végétarien/preference']);
  assert.deepEqual(lib('conv-sophie'), ['Lait/preference']);
  assert.deepEqual(lib('conv-lea'), ['Arachides/strict']);
  assert.deepEqual(lib('conv-claire'), ['Alcool/preference']);
  assert.deepEqual(lib('conv-nadia'), ['Porc/preference', 'Fruits à coque/strict']);
});

test('export compatible : relu par la logique v1, mêmes alertes', () => {
  const d: AppData = { ...createEmptyData(), plats: [{ id: 'p1', libelle: 'Salade', services: ['entree'], allergenes: ['autre:Kiwi', 'arachides'] }],
    convives: [
      c('conv-lea', 'Léa', el('ctr-k1', 'Kiwi', 'strict', ['autre:Kiwi']), el('ctr-a1', 'Arachides', 'strict', ['arachides'])),
      c('conv-marc', 'Marc', el('ctr-k2', 'Kiwi', 'preference', ['autre:kiwi'])),
    ] };
  const e = preparerExport(d) as any;
  assert.deepEqual(e.contraintes.map((t: any) => [t.id, t.niveau, t.allergenes]), [
    ['ctr-k1', 'strict', []], ['ctr-a1', 'strict', ['arachides']], ['ctr-k2', 'preference', []]]);
  assert.deepEqual(e.convives.map((x: any) => x.contraintesIds), [['ctr-k1', 'ctr-a1'], ['ctr-k2']]);
  assert.deepEqual([...e.plats[0].allergenes].sort(), ['arachides', 'autre:Kiwi', 'ctr-k1', 'ctr-k2'].sort());
  // Ancienne règle v1, recopiée ici : concerné si tag.id === a || tag.allergenes.includes(a) ; strict l'emporte.
  const v1Niveau = (conv: any, a: string) => {
    let n: string | undefined;
    for (const id of conv.contraintesIds) {
      const t = e.contraintes.find((x: any) => x.id === id);
      if (t && (t.id === a || t.allergenes.includes(a))) n = t.niveau === 'strict' ? 'strict' : (n ?? 'preference');
    }
    return n;
  };
  const niveau = (conv: any) => e.plats[0].allergenes.map((a: string) => v1Niveau(conv, a)).filter(Boolean);
  assert.ok(niveau(e.convives[0]).includes('strict'));          // Léa : arachides et kiwi
  assert.deepEqual([...new Set(niveau(e.convives[1]))], ['preference']); // Marc : kiwi
});

test('aller-retour : export puis restauration redonnent les mêmes données', () => {
  const d = createSampleData();
  assert.deepEqual(migrateAndValidateAppData(JSON.parse(JSON.stringify(preparerExport(d)))), d);
});

// Exemples tels qu'ils étaient en version 1 (contraintes partagées), avec le « Dîner d'automne ».
const CONTRAINTES_V1 = [
  { id: 'tag-arachides', libelle: 'Arachides', niveau: 'strict' },
  { id: 'tag-fruits-coque', libelle: 'Fruits à coque', niveau: 'strict' },
  { id: 'tag-crustaces', libelle: 'Crustacés', niveau: 'strict' },
  { id: 'tag-gluten', libelle: 'Sans gluten', niveau: 'strict' },
  { id: 'tag-lactose', libelle: 'Sans lactose', niveau: 'preference' },
  { id: 'tag-vegetarien', libelle: 'Végétarien', niveau: 'preference' },
  { id: 'tag-vegan', libelle: 'Végan', niveau: 'preference' },
  { id: 'tag-sans-porc', libelle: 'Sans porc', niveau: 'preference' },
  { id: 'tag-sans-alcool', libelle: 'Sans alcool', niveau: 'preference' },
].map((t) => ({ ...t, allergenes: LIAISONS_PAR_DEFAUT[t.id] }));
const exemplesV1 = (avecContraintes: boolean) => ({
  version: 1,
  foyers: [],
  plats: [],
  ...(avecContraintes ? { contraintes: CONTRAINTES_V1 } : {}),
  convives: [
    ['conv-paul', 'Paul', ['tag-crustaces']],
    ['conv-julie', 'Julie', ['tag-vegetarien']],
    ['conv-marc', 'Marc', []],
    ['conv-sophie', 'Sophie', ['tag-lactose']],
    ['conv-lea', 'Léa', ['tag-arachides']],
    ['conv-claire', 'Claire', ['tag-sans-alcool']],
    ['conv-tom', 'Tom', []],
    ['conv-nadia', 'Nadia', ['tag-sans-porc', 'tag-fruits-coque']],
  ].map(([id, nomAffiche, contraintesIds]) => ({ id, nomAffiche, contraintesIds, contrainteLibre: '' })),
  invitations: [{ id: 'inv-1', statut: 'prevue', date: '2026-11-28', titre: 'Dîner d’automne', hoteType: 'moi', hoteLabel: 'Moi',
    convivesIds: ['conv-marc', 'conv-sophie', 'conv-lea', 'conv-nadia'], menu: {} }],
});

for (const avecContraintes of [true, false]) {
  test(`v1 → v2 : exemples v1 ${avecContraintes ? 'avec' : 'sans'} le tableau de contraintes`, () => {
    const d = migrateAndValidateAppData(JSON.parse(JSON.stringify(exemplesV1(avecContraintes))));
    const els = (id: string) => d.convives.find((x) => x.id === id)!.contraintes.map((e) => [e.libelle, e.niveau, e.allergenes]);
    assert.deepEqual(els('conv-paul'), [['Crustacés', 'strict', ['crustaces']]]);
    assert.deepEqual(els('conv-julie'), [['Végétarien', 'preference', ['viande', 'poissons', 'crustaces', 'mollusques']]]);
    assert.deepEqual(els('conv-marc'), []);
    assert.deepEqual(els('conv-sophie'), [['Sans lactose', 'preference', ['lait']]]);
    assert.deepEqual(els('conv-lea'), [['Arachides', 'strict', ['arachides']]]);
    assert.deepEqual(els('conv-claire'), [['Sans alcool', 'preference', ['alcool']]]);
    assert.deepEqual(els('conv-tom'), []);
    assert.deepEqual(els('conv-nadia'), [['Sans porc', 'preference', ['porc']], ['Fruits à coque', 'strict', ['fruits-a-coque']]]);
    assert.equal(d.convives.find((x) => x.id === 'conv-julie')!.contraintes[0].icone, 'leaf');
    const inv = d.invitations.find((i) => i.id === 'inv-1')!;
    const { strict } = aggregateConstraints(inv.convivesIds, new Map(d.convives.map((x) => [x.id, x])));
    assert.deepEqual(strict.map((g) => [g.libelle, g.guests.map((x) => x.nomAffiche)]), [['Arachides', ['Léa']], ['Fruits à coque', ['Nadia']]]);
  });
}

test('aller-retour avec aliments libres et « Aucun de ces allergènes »', () => {
  const d: AppData = { ...createEmptyData(),
    convives: [
      c('conv-lea', 'Léa', el('ctr-k1', 'Kiwi', 'strict', ['autre:Kiwi'])),
      c('conv-marc', 'Marc', el('ctr-k2', 'Kiwi', 'preference', ['autre:kiwi'])),
    ],
    plats: [
      { id: 'p1', libelle: 'Pavlova', services: ['dessert'], allergenes: ['autre:Kiwi', 'oeufs'] },
      { id: 'p2', libelle: 'Pain', services: ['entree'], allergenes: [], sansAllergene: true },
    ] };
  const restaure = migrateAndValidateAppData(JSON.parse(JSON.stringify(preparerExport(d))));
  assert.deepEqual(restaure, d);
  assert.ok(restaure.plats.every((p) => p.allergenes.every((a) => !a.startsWith('ctr-'))));
});

test('version future (≥ 2) : validée comme la v2, les contraintes par personne restent', () => {
  const v3 = { version: 3, foyers: [], invitations: [], plats: [],
    convives: [{ id: 'conv-lea', nomAffiche: 'Léa', contrainteLibre: '',
      contraintes: [{ id: 'ctr-1', libelle: 'Arachides', niveau: 'strict', allergenes: ['arachides'] }] }] };
  const d = migrateAndValidateAppData(v3);
  assert.equal(d.version, 2);
  assert.deepEqual(d.convives[0].contraintes, [{ id: 'ctr-1', libelle: 'Arachides', niveau: 'strict', allergenes: ['arachides'] }]);
});

test('mode démo : les exemples chargés sont en v2', () => {
  const d = creerStockage(true).charger();
  assert.equal(d.version, 2);
  assert.ok(d.convives.every((x) => Array.isArray(x.contraintes) && !('contraintesIds' in x)));
});

test('plats invalides filtrés', () => {
  const data = JSON.parse(JSON.stringify(createEmptyData()));
  data.plats = [
    { id: 'p1', libelle: 'Tarte Tatin', services: ['dessert', 'goûter'], allergenes: ['gluten'] },
    { id: 'p2', libelle: 'tarte tatin', services: ['dessert'], allergenes: [] },
    { id: 'p3', libelle: 'Sans service', allergenes: [] },
    { id: 'p4', libelle: 'Goûter seul', services: ['goûter'], allergenes: [] },
  ];
  const res = migrateAndValidateAppData(data);
  assert.deepEqual(res.plats, [{ id: 'p1', libelle: 'Tarte Tatin', services: ['dessert'], allergenes: ['gluten'] }]);
});

test('accueilVu conservé quand on vide les données', () => {
  const settings = createSampleData().settings;
  assert.equal(createEmptyData({ ...settings, accueilVu: true }).settings.accueilVu, true);
  assert.equal(createEmptyData().settings.accueilVu, false);
});
