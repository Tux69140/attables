/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { createEmptyData, createSampleData, creerStockage, migrateAndValidateAppData } from './storage';

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
  const ancien = JSON.parse(JSON.stringify(createSampleData()));
  delete ancien.plats;
  delete ancien.settings.accueilVu;
  for (const t of ancien.contraintes) delete t.allergenes;
  ancien.contraintes.push({ id: 'tag-123', libelle: 'Coriandre', niveau: 'preference' });
  const res = migrateAndValidateAppData(ancien);
  const tag = (id: string) => res.contraintes.find((t) => t.id === id);
  assert.equal(res.settings.accueilVu, true);
  assert.deepEqual(res.plats, []);
  assert.deepEqual(tag('tag-arachides')?.allergenes, ['arachides']);
  assert.deepEqual(tag('tag-vegan')?.allergenes, ['viande', 'poissons', 'crustaces', 'mollusques', 'oeufs', 'lait']);
  assert.deepEqual(tag('tag-123')?.allergenes, []);
  assert.deepEqual(res.convives, ancien.convives);
  assert.deepEqual(res.invitations, ancien.invitations);
});

test('icône de contrainte inconnue retirée', () => {
  const data = JSON.parse(JSON.stringify(createEmptyData()));
  data.contraintes.push({ id: 'tag-1', libelle: 'Licorne', niveau: 'strict', allergenes: [], icone: 'licorne' });
  data.contraintes.push({ id: 'tag-2', libelle: 'Sans ail', niveau: 'strict', allergenes: [], icone: 'ail' });
  const res = migrateAndValidateAppData(data);
  const licorne = res.contraintes.find((t) => t.id === 'tag-1');
  assert.ok(licorne);
  assert.equal('icone' in licorne, false);
  assert.equal(res.contraintes.find((t) => t.id === 'tag-2')?.icone, 'ail');
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
