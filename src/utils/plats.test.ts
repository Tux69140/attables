/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ContrainteConvive, Convive, CourseKey, DishVerdict, Invitation, PlatFiche } from '../types/models';
import {
  aVerifier,
  allergenesRenseignes,
  cleDePlat,
  compterFiltres,
  enregistrerFiche,
  platsProches,
  rechercherPlats,
  renommerIdee,
  repertoirePlats,
  retrouverPlat,
  suivrePlat,
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
const paul: Convive = { id: 'conv-paul', nomAffiche: 'Paul', contraintes: [], contrainteLibre: '' };
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

test('pas de faux amis : mots courts, première lettre différente, plat contenu en mots entiers seulement', () => {
  const carnet = repertoire(
    ['Crêpes', 'Crème caramel', 'Œufs mimosa', 'Moules frites', 'Steak tartare', 'Pot-au-feu', 'Riz au lait', 'Tarte aux pommes'].map(
      (nom, i) => inv(`2026-10-${String(10 + i)}`, 'plat', nom)
    )
  );
  const noms = (saisie: string) => platsProches(carnet, saisie).map((p) => p.libelle);
  assert.deepEqual(noms('Crème anglaise'), []);
  assert.deepEqual(noms('Crêpe'), ['Crêpes']);
  assert.deepEqual(noms('Bœuf bourguignon'), []);
  assert.deepEqual(noms('Poule au pot'), []);
  assert.deepEqual(noms('Potée aux feuilles de chou'), []);
  assert.deepEqual(noms('Rizotto au lait de coco'), []);
  assert.deepEqual(noms('Riz au lait de coco'), ['Riz au lait']);
  const trouves = (saisie: string) => rechercherPlats(carnet, saisie).resultats.map((p) => p.libelle);
  assert.deepEqual(trouves('crêpes'), ['Crêpes']);
  assert.deepEqual(trouves('bœuf'), []);
  assert.deepEqual(trouves('poule'), []);
  assert.deepEqual(trouves('tarte'), ['Tarte aux pommes']);
});

test('rechercherPlats : la saisie exacte avant les correspondances approchées', () => {
  const liste = repertoire([
    inv('2026-11-20', 'plat', 'Potimarron farci'),
    inv('2026-11-10', 'plat', 'Gratin de potimaron'),
  ]);
  assert.deepEqual(rechercherPlats(liste, 'potimaron').resultats.map((p) => p.libelle), ['Gratin de potimaron', 'Potimarron farci']);
});

test('enregistrerFiche fusionne', () => {
  const res = enregistrerFiche([fiche('Tarte Tatin', ['dessert'])], { libelle: 'tarte tatin', services: ['entree'], allergenes: ['oeufs'], sansAllergene: false }, 'plat-2');
  assert.equal(res.length, 1);
  assert.deepEqual(res[0].services, ['dessert', 'entree']);
  assert.deepEqual(res[0].allergenes, ['oeufs']);
  const ajout = enregistrerFiche([], { libelle: '  blanquette  ', services: ['plat'], allergenes: [], sansAllergene: false }, 'plat-3');
  assert.deepEqual(ajout, [{ id: 'plat-3', libelle: 'Blanquette', services: ['plat'], allergenes: [] }]);
});

const valeurs = (allergenes: string[], sansAllergene: boolean) => ({ libelle: 'Poires pochées', services: ['dessert'] as CourseKey[], allergenes, sansAllergene });

test('enregistrerFiche : sansAllergene seulement sans allergène', () => {
  const vrai = enregistrerFiche([], valeurs([], true), 'plat-9');
  assert.deepEqual(vrai, [{ id: 'plat-9', libelle: 'Poires pochées', services: ['dessert'], allergenes: [], sansAllergene: true }]);
  const incoherent = enregistrerFiche([], valeurs(['oeufs'], true), 'plat-9');
  assert.equal('sansAllergene' in incoherent[0], false);
  const faux = enregistrerFiche([], valeurs([], false), 'plat-9');
  assert.equal('sansAllergene' in faux[0], false);
});

test('enregistrerFiche : une fiche existante gagne ou perd sansAllergene', () => {
  const avec = { ...fiche('Poires pochées', ['dessert']), sansAllergene: true };
  const retire = enregistrerFiche([avec], valeurs(['oeufs'], false), 'plat-9');
  assert.equal('sansAllergene' in retire[0], false);
  assert.deepEqual(retire[0].allergenes, ['oeufs']);
  const pose = enregistrerFiche([fiche('Poires pochées', ['dessert'])], valeurs([], true), 'plat-9');
  assert.equal(pose[0].sansAllergene, true);
});

test('allergenesRenseignes', () => {
  assert.equal(allergenesRenseignes(undefined), false);
  assert.equal(allergenesRenseignes(fiche('Flan')), false);
  assert.equal(allergenesRenseignes({ ...fiche('Flan'), sansAllergene: true }), true);
  assert.equal(allergenesRenseignes(fiche('Flan', ['plat'], ['oeufs'])), true);
});

test('aVerifier : plat saisi, tablée avec allergie, allergènes non renseignés', () => {
  const allergie: ContrainteConvive[] = [{ id: 'ctr-1', libelle: 'Arachides', niveau: 'strict', allergenes: ['arachides'] }];
  assert.equal(aVerifier('', undefined, allergie), false);
  assert.equal(aVerifier('   ', undefined, allergie), false);
  assert.equal(aVerifier('Flan', undefined, []), false);
  assert.equal(aVerifier('Flan', undefined, allergie), true);
  assert.equal(aVerifier('Flan', fiche('Flan'), allergie), true);
  assert.equal(aVerifier('Flan', { ...fiche('Flan'), sansAllergene: true }, allergie), false);
  assert.equal(aVerifier('Flan', fiche('Flan', ['plat'], ['oeufs']), allergie), false);
});

test('aVerifier : « Aucun de ces allergènes » ne couvre pas un aliment libre de la tablée', () => {
  const aucun = { ...fiche('Flan'), sansAllergene: true };
  const kiwi: ContrainteConvive = { id: 'ctr-2', libelle: 'Kiwi', niveau: 'strict', allergenes: ['autre:Kiwi'] };
  const arachides: ContrainteConvive = { id: 'ctr-1', libelle: 'Arachides', niveau: 'strict', allergenes: ['arachides'] };
  // Kiwi n'était peut-être pas dans la grille quand le plat a été marqué : à vérifier.
  assert.equal(aVerifier('Flan', aucun, [arachides, kiwi]), true);
  // Un aliment libre seulement évité ne compte pas.
  assert.equal(aVerifier('Flan', aucun, [arachides]), false);
  // Un aliment libre dont le nom désigne un allergène de la grille (« Cacahuètes ») est couvert.
  assert.equal(aVerifier('Flan', aucun, [{ ...kiwi, libelle: 'Cacahuètes', allergenes: ['autre:Cacahuètes'] }]), false);
  // Un allergène coché reste « renseigné ».
  assert.equal(aVerifier('Flan', fiche('Flan', ['plat'], ['oeufs']), [kiwi]), false);
});

test('renommerIdee', () => {
  const plats = [fiche('Pot-au-feu'), fiche('Blanquette')];
  assert.equal(renommerIdee(plats, 'plat-Blanquette', 'pot au feu'), 'existe');
  const res = renommerIdee(plats, 'plat-Blanquette', 'blanquette de veau');
  assert.notEqual(res, 'existe');
  assert.equal((res as PlatFiche[])[1].libelle, 'Blanquette de veau');
});

test('retrouverPlat suit une idée par sa fiche : renommage et « Annuler »', () => {
  const avant = repertoire([], [fiche('Cervelle de canut')]);
  const suivi = suivrePlat(avant[0]);
  assert.deepEqual(suivi, { cle: cleDePlat('Cervelle de canut'), ficheId: 'plat-Cervelle de canut' });
  const renommee = { ...fiche('Cervelle de canut'), libelle: 'Cervelle des canuts' };
  // Après le renommage, la clé d'avant n'existe plus : la fiche est retrouvée par son identifiant.
  assert.equal(retrouverPlat(repertoire([], [renommee]), suivi)?.libelle, 'Cervelle des canuts');
  // Deuxième renommage, puis « Annuler » qui rend l'ancien nom : toujours la même fiche.
  const suiviRenomme = { cle: cleDePlat('Cervelle des canuts'), ficheId: suivi.ficheId };
  assert.equal(retrouverPlat(repertoire([], [{ ...renommee, libelle: 'Cervelle' }]), suiviRenomme)?.libelle, 'Cervelle');
  assert.equal(retrouverPlat(avant, suiviRenomme)?.libelle, 'Cervelle de canut');
});

test('retrouverPlat : plat sans fiche suivi par sa clé, null quand il a disparu', () => {
  const menus = [inv('2026-10-18', 'plat', 'Risotto')];
  const suivi = suivrePlat(repertoire(menus)[0]);
  assert.deepEqual(suivi, { cle: cleDePlat('Risotto') });
  // Fiche ajoutée (allergènes), puis retirée par « Annuler » : le plat reste celui des menus.
  assert.equal(retrouverPlat(repertoire(menus, [fiche('Risotto')]), suivi)?.cle, cleDePlat('Risotto'));
  assert.equal(retrouverPlat(repertoire(menus), { ...suivi, ficheId: 'plat-Risotto' })?.cle, cleDePlat('Risotto'));
  // Idée supprimée : plus rien à afficher.
  assert.equal(retrouverPlat(repertoire([]), { cle: cleDePlat('Flan'), ficheId: 'plat-Flan' }), null);
  assert.equal(retrouverPlat(repertoire(menus), null), null);
});
