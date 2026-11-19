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
  allergeneChoisi,
  allergeneDeReference,
  avecSaisieAutre,
  basculerAllergene,
  choixAllergenes,
  conflitsPlat,
  dejaPresent,
  elementDepuisReference,
  iconeContrainte,
  idAutre,
  libelleAllergene,
  listePrenoms,
  memeAlerte,
  memeAllergene,
  REGIMES,
  resumeAllergiesStrictes,
  texteEvite,
} from './allergenes';
import { memesElements } from '../components/ContraintesPersonne';

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

test('listePrenoms : un, deux, trois prénoms', () => {
  const lea = c('conv-lea', 'Léa');
  const nadia = c('conv-nadia', 'Nadia');
  const paul = c('conv-paul', 'Paul');
  assert.equal(listePrenoms([lea]), 'Léa');
  assert.equal(listePrenoms([lea, nadia]), 'Léa et Nadia');
  assert.equal(listePrenoms([lea, nadia, paul]), 'Léa, Nadia et Paul');
  assert.equal(listePrenoms([]), '');
});

test('resumeAllergiesStrictes : deux premières puis le reste, au format « Allergène — Prénom »', () => {
  const lea = c('conv-lea', 'Léa');
  const paul = c('conv-paul', 'Paul');
  const nadia = c('conv-nadia', 'Nadia');
  const groupe = (libelle: string, guests: Convive[]) => ({ cle: libelle.toLowerCase(), libelle, icone: 'tag' as const, guests });
  const strict = [groupe('Arachides', [lea]), groupe('Fruits à coque', [nadia]), groupe('Crustacés', [paul]), groupe('Gluten', [nadia])];
  assert.deepEqual(resumeAllergiesStrictes(strict), {
    texte: 'Arachides — Léa · Fruits à coque — Nadia',
    reste: 2,
  });
  assert.deepEqual(resumeAllergiesStrictes(strict.slice(0, 1)), { texte: 'Arachides — Léa', reste: 0 });
  assert.deepEqual(
    resumeAllergiesStrictes([groupe('Arachides', [lea, nadia]), groupe('Crustacés', [paul]), groupe('Gluten', [nadia])]),
    { texte: 'Arachides — Léa, Nadia · Crustacés — Paul', reste: 1 }
  );
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

test('affaiblissements : aliment libre réécrit avec une autre casse, pas d\'affaiblissement', () => {
  const kiwi = el('ctr-1', 'Kiwi', 'strict', ['autre:Kiwi']);
  assert.deepEqual(affaiblissements([kiwi], [{ ...kiwi, allergenes: ['autre:kiwi'] }]), []);
  assert.deepEqual(affaiblissements([{ ...kiwi, allergenes: ['autre:kiwi'] }], [kiwi]), []);
  // « autre:Cacahuètes » remplacé par « arachides » : les mêmes plats alertent, pas d'affaiblissement.
  const cacahuetes = el('ctr-2', 'Cacahuètes', 'strict', ['autre:Cacahuètes']);
  assert.deepEqual(affaiblissements([cacahuetes], [{ ...cacahuetes, allergenes: ['arachides'] }]), []);
  assert.deepEqual(affaiblissements([cacahuetes], [{ ...cacahuetes, allergenes: ['autre:Kiwi'] }]), ['Cacahuètes']);
  assert.deepEqual(affaiblissements([kiwi], [{ ...kiwi, allergenes: ['autre:Ananas'] }]), ['Kiwi']); // autre aliment : affaiblie
});

// `memesElements` (fiche d'une personne) : décide si la fiche a changé, donc si fermer enregistre.
test('memesElements : mêmes éléments, quel que soit l\'ordre des champs ou un pictogramme absent', () => {
  const ara = el('ctr-1', 'Arachides', 'strict', ['arachides']);
  assert.ok(memesElements([], []));
  assert.ok(memesElements([ara], [{ allergenes: ['arachides'], niveau: 'strict', libelle: 'Arachides', id: 'ctr-1' }]));
  assert.ok(memesElements([ara], [{ ...ara, icone: undefined }]));
});

test('memesElements : toute modification compte', () => {
  const ara = el('ctr-1', 'Arachides', 'strict', ['arachides']);
  const lait = el('ctr-2', 'Lait', 'preference', ['lait']);
  assert.ok(!memesElements([ara], [{ ...ara, libelle: 'Cacahuètes' }]));
  assert.ok(!memesElements([ara], [{ ...ara, niveau: 'preference' }]));
  assert.ok(!memesElements([ara], [{ ...ara, allergenes: ['arachides', 'autre:Kiwi'] }]));
  assert.ok(!memesElements([ara], [{ ...ara, icone: 'nut' }]));
  assert.ok(!memesElements([ara, lait], [ara]));
  assert.ok(!memesElements([ara, lait], [lait, ara])); // l'ordre est celui de la fiche
});

test('dejaPresent', () => {
  assert.ok(dejaPresent([el('ctr-1', 'Œufs', 'strict', ['oeufs'])], { libelle: 'Œufs', allergenes: ['oeufs'] }));
  assert.ok(!dejaPresent([el('ctr-1', 'Végan', 'preference', ['oeufs', 'lait'])], { libelle: 'Œufs', allergenes: ['oeufs'] }));
  // Libellé écrit autrement (casse, accents) : le même élément.
  assert.ok(dejaPresent([el('ctr-1', 'Kiwi', 'strict', ['autre:Kiwi'])], { libelle: 'kiwi', allergenes: ['autre:kiwi'] }));
});

test('dejaPresent : « Évite : Fromage » n\'empêche pas de noter le lait', () => {
  const lait = { libelle: 'Lait', allergenes: ['lait'] };
  // Aliment libre hérité de la v1, ou créé par « Autre… » (synonyme rattaché au lait) : Lait reste proposé.
  assert.ok(!dejaPresent([el('ctr-1', 'Fromage', 'preference', ['autre:Fromage'])], lait));
  assert.ok(!dejaPresent([el('ctr-1', 'Fromage', 'preference', ['lait'])], lait));
  assert.ok(!dejaPresent([el('ctr-1', 'Vin', 'preference', ['sulfites'])], { libelle: 'Sulfites', allergenes: ['sulfites'] }));
  // Le même mot une seconde fois reste refusé.
  assert.ok(dejaPresent([el('ctr-1', 'Fromage', 'preference', ['lait'])], { libelle: 'Fromage', allergenes: ['lait'] }));
  assert.ok(dejaPresent([el('ctr-1', 'Lait', 'preference', ['lait'])], lait));
});

test('basculerAllergene : décocher « Fromage » garde le lait', () => {
  assert.equal(allergeneChoisi(['lait'], 'autre:Fromage'), false);
  assert.equal(allergeneChoisi(['autre:fromage'], 'autre:Fromage'), true);
  assert.deepEqual(basculerAllergene(['lait'], 'autre:Fromage'), ['lait', 'autre:Fromage']);
  assert.deepEqual(basculerAllergene(['lait', 'autre:Fromage'], 'autre:Fromage'), ['lait']);
  assert.deepEqual(basculerAllergene(['lait', 'autre:Fromage'], 'lait'), ['autre:Fromage']);
  assert.deepEqual(basculerAllergene(['autre:kiwi'], 'autre:Kiwi'), []);
});

test('memeAllergene : identifiant identique, ou aliment libre écrit autrement ; jamais par synonyme', () => {
  assert.ok(memeAllergene('lait', 'lait'));
  assert.ok(memeAllergene('autre:Céleri rave', 'autre:celeri rave'));
  assert.ok(!memeAllergene('autre:Fromage', 'lait'));
  assert.ok(!memeAllergene('autre:Cacahuètes', 'arachides'));
  assert.ok(!memeAllergene('autre:Moules', 'autre:Calamars'));
});

test('memeAlerte : un aliment libre nommé par un synonyme alerte comme son allergène de référence', () => {
  assert.ok(memeAlerte('autre:Cacahuètes', 'arachides'));
  assert.ok(memeAlerte('arachides', 'autre:Cacahuètes'));
  assert.ok(memeAlerte('autre:Crevettes', 'autre:homard'));
  assert.ok(memeAlerte('autre:kiwi', 'autre:Kiwi'));
  assert.ok(!memeAlerte('autre:Kiwi', 'arachides'));
  assert.ok(!memeAlerte('lait', 'arachides'));
});

test('conflitsPlat : aliment libre « Cacahuètes » d\'une personne, plat aux arachides', () => {
  const lea = c('conv-lea', 'Léa', el('ctr-1', 'Cacahuètes', 'strict', ['autre:Cacahuètes']));
  assert.deepEqual(conflitsPlat(['arachides'], [lea]).map((x) => [x.allergeneId, x.niveau]), [['arachides', 'strict']]);
});

test('alimentsLibresConnus : deux aliments libres d\'une même famille restent distincts', () => {
  const lea = c('conv-lea', 'Léa', el('ctr-1', 'Moules', 'strict', ['autre:Moules']));
  const plats = [{ id: 'p', libelle: 'Paella', services: ['plat'], allergenes: ['autre:Calamars'] }] as PlatFiche[];
  assert.deepEqual(alimentsLibresConnus([lea], plats), ['autre:Calamars', 'autre:Moules']);
});

test('allergeneDeReference : libellé de référence, pluriel ou accents tolérés', () => {
  assert.equal(allergeneDeReference('oeuf'), 'oeufs');
  assert.equal(allergeneDeReference('Œufs'), 'oeufs');
  assert.equal(allergeneDeReference('Arachide'), 'arachides');
  assert.equal(allergeneDeReference('poisson'), 'poissons');
  assert.equal(allergeneDeReference('crustace'), 'crustaces');
  assert.equal(allergeneDeReference('fruit a coque'), 'fruits-a-coque');
  assert.equal(allergeneDeReference('Fruit à coque'), 'fruits-a-coque');
  assert.equal(allergeneDeReference('kiwi'), undefined);
  assert.equal(allergeneDeReference(''), undefined);
});

test('allergeneDeReference : mots courants rattachés à leur allergène de référence', () => {
  const attendus: Record<string, string[]> = {
    arachides: ['cacahuète', 'Cacahuètes', 'arachide'],
    lait: ['lactose', 'beurre', 'crème', 'Fromages', 'yaourt'],
    crustaces: ['crevette', 'homards', 'langouste', 'langoustines', 'crabe', 'écrevisse'],
    'fruits-a-coque': ['noix', 'Noisettes', 'amande', 'cajou', 'pistaches', 'noix de pécan', 'Noix du Brésil', 'macadamia'],
    gluten: ['blé', 'seigle', 'orge', 'épeautre', 'avoine', 'kamut'],
    mollusques: ['moules', 'huître', 'calamars', 'seiche', 'poulpe', 'escargots', 'Coquilles Saint-Jacques', 'pétoncle', 'bulot'],
    poissons: ['saumon', 'thon', 'cabillaud', 'anchois', 'sardines', 'truite'],
    soja: ['tofu'],
    oeufs: ['œuf'],
    sesame: ['tahini'],
    sulfites: ['vin'],
  };
  for (const [id, mots] of Object.entries(attendus)) {
    for (const mot of mots) assert.equal(allergeneDeReference(mot), id, mot);
  }
});

test('allergeneDeReference : pas de rapprochement abusif', () => {
  for (const mot of ['kiwi', 'noix de coco', 'lait de coco', 'beurre de karité', 'pois', 'vinaigre', 'thé', 'ail', 'bl', 'no', 'mou', 'riz']) {
    assert.equal(allergeneDeReference(mot), undefined, mot);
  }
});

test('elementDepuisReference : le mot de la personne est gardé pour un synonyme', () => {
  assert.deepEqual(elementDepuisReference('noisettes'), { libelle: 'Noisettes', allergenes: ['fruits-a-coque'] });
  assert.deepEqual(elementDepuisReference('cacahuètes'), { libelle: 'Cacahuètes', allergenes: ['arachides'] });
  // Libellé de référence lui-même : la forme de référence.
  assert.deepEqual(elementDepuisReference('arachide'), { libelle: 'Arachides', allergenes: ['arachides'] });
  assert.deepEqual(elementDepuisReference('oeuf'), { libelle: 'Œufs', allergenes: ['oeufs'] });
  assert.equal(elementDepuisReference('kiwi'), undefined);
});

test('synonymes : alerte dans les deux sens', () => {
  // Personne « Cacahuètes », créée par « Autre… » (allergène de référence) ou héritée de la v1 (aliment libre).
  const lea = c('conv-lea', 'Léa', el('ctr-1', 'Cacahuètes', 'strict', ['arachides']));
  const nadia = c('conv-nadia', 'Nadia', el('ctr-2', 'Cacahuètes', 'strict', ['autre:Cacahuètes']));
  const res = conflitsPlat(['arachides'], [lea, nadia]);
  assert.equal(res.length, 1);
  assert.deepEqual(res[0].convives.map((g) => g.nomAffiche), ['Léa', 'Nadia']);
  // Plat noté « Cacahuètes » en aliment libre : Paul (Arachides) est alerté.
  const paul = c('conv-paul', 'Paul', el('ctr-3', 'Arachides', 'strict', ['arachides']));
  assert.deepEqual(conflitsPlat(['autre:Cacahuètes'], [paul]).map((x) => x.convives[0].nomAffiche), ['Paul']);
  // Plat noté « Noisette » ↔ personne « Fruits à coque » ; « Lactose » ↔ « Lait » (évite).
  const marc = c('conv-marc', 'Marc', el('ctr-4', 'Fruits à coque', 'strict', ['fruits-a-coque']), el('ctr-5', 'Lait', 'preference', ['lait']));
  const conflits = conflitsPlat(['autre:Noisette', 'autre:Lactose'], [marc]);
  assert.deepEqual(conflits.map((x) => x.niveau), ['strict', 'preference']);
  // Le même allergène sous deux noms ne compte qu'une fois.
  assert.equal(conflitsPlat(['arachides', 'autre:Cacahuète'], [paul]).length, 1);
  assert.deepEqual(conflitsPlat(['autre:Kiwi'], [paul]), []);
});

test('avecSaisieAutre : un synonyme coche l\'allergène de référence', () => {
  assert.deepEqual(avecSaisieAutre([], 'Cacahuètes', []), ['arachides']);
  assert.deepEqual(avecSaisieAutre(['arachides'], 'cacahuète', []), ['arachides']);
  assert.deepEqual(avecSaisieAutre(['lait'], 'crevettes', []), ['lait', 'crustaces']);
});

test('avecSaisieAutre : le texte resté dans « Autre… » compte comme « Ajouter »', () => {
  assert.deepEqual(avecSaisieAutre(['lait'], '', []), ['lait']);
  assert.deepEqual(avecSaisieAutre(['lait'], '  ', []), ['lait']);
  assert.deepEqual(avecSaisieAutre([], 'kiwi', []), [idAutre('kiwi')]);
  assert.deepEqual(avecSaisieAutre(['lait'], 'oeuf', []), ['lait', 'oeufs']);
  assert.deepEqual(avecSaisieAutre(['oeufs'], 'Œuf', []), ['oeufs']);
  // Aliment libre déjà connu : sa graphie est gardée, sans doublon.
  assert.deepEqual(avecSaisieAutre([], 'KIWI', ['autre:Kiwi']), ['autre:Kiwi']);
  assert.deepEqual(avecSaisieAutre(['autre:Kiwi'], 'kiwi', []), ['autre:Kiwi']);
});

test('texteEvite : un seul allergène garde son libellé en minuscules', () => {
  assert.equal(texteEvite(el('ctr-1', 'Lait', 'preference', ['lait'])), 'lait');
  assert.equal(texteEvite(el('ctr-2', 'Coriandre', 'preference', [])), 'coriandre');
});

test('texteEvite : plusieurs allergènes, puis le libellé entre parenthèses', () => {
  const vegetarien = el('ctr-3', 'Végétarien', 'preference', ['viande', 'poissons', 'crustaces', 'mollusques']);
  assert.equal(texteEvite(vegetarien), 'viande, poissons, crustacés, mollusques (végétarien)');
  assert.equal(texteEvite(el('ctr-4', 'Fruits de mer', 'preference', ['crustaces', 'autre:Kiwi'])), 'crustacés, kiwi (fruits de mer)');
});
