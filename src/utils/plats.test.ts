/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { PlatFiche } from '../types/models';
import { cleDePlat, trouverFiche } from './plats';

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
