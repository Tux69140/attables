/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { createEmptyData, createSampleData, creerStockage } from './storage';

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

test('mode normal : premier chargement sur stockage vide donne les exemples et les enregistre une fois', () => {
  const compteur = installerFauxStockage();
  assert.deepEqual(creerStockage(false).charger(), createSampleData());
  assert.equal(compteur.setItem, 1);
});
