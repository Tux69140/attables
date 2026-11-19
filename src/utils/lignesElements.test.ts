/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ContrainteConvive, ContrainteNiveau } from '../types/models';
import { affaiblissements } from './allergenes';
import {
  ajouterLigne,
  elementsActifs,
  lignesDepuis,
  modifierLigne,
  restaurerLigne,
  retirerLigne,
  retraitsConfirmes,
} from './lignesElements';

const el = (id: string, libelle: string, niveau: ContrainteNiveau, allergenes: string[]): ContrainteConvive => ({ id, libelle, niveau, allergenes });

const ara = el('ctr-1', 'Arachides', 'strict', ['arachides']);
const lait = el('ctr-2', 'Lait', 'preference', ['lait']);
const gluten = el('ctr-3', 'Gluten', 'strict', ['gluten']);

test('retirerLigne : l\'élément quitte la liste enregistrée mais garde sa place', () => {
  const lignes = retirerLigne(lignesDepuis([ara, lait, gluten]), 'ctr-2', false);
  assert.deepEqual(elementsActifs(lignes), [ara, gluten]);
  assert.deepEqual(lignes.map((l) => [l.element.id, !!l.retrait]), [['ctr-1', false], ['ctr-2', true], ['ctr-3', false]]);
});

test('restaurerLigne : remet l\'élément tel quel, à sa place', () => {
  const avant = lignesDepuis([ara, lait, gluten]);
  const apres = restaurerLigne(retirerLigne(avant, 'ctr-1', true), 'ctr-1');
  assert.deepEqual(apres, avant);
  assert.equal(apres[0].element, ara); // même objet : même id, niveau, allergènes
});

test('restaurerLigne : plusieurs retraits, chacun revient à sa place quel que soit l\'ordre', () => {
  let lignes = lignesDepuis([ara, lait, gluten]);
  lignes = retirerLigne(lignes, 'ctr-1', true);
  lignes = retirerLigne(lignes, 'ctr-3', true);
  lignes = restaurerLigne(lignes, 'ctr-3');
  assert.deepEqual(elementsActifs(lignes), [lait, gluten]);
  lignes = restaurerLigne(lignes, 'ctr-1');
  assert.deepEqual(elementsActifs(lignes), [ara, lait, gluten]);
});

test('retraitsConfirmes : la confirmation d\'une allergie tombe avec « Annuler »', () => {
  let lignes = retirerLigne(lignesDepuis([ara, lait]), 'ctr-1', true);
  assert.deepEqual(retraitsConfirmes(lignes), ['ctr-1']);
  lignes = restaurerLigne(lignes, 'ctr-1');
  assert.deepEqual(retraitsConfirmes(lignes), []);
  // Allergie remise puis passée en « Évite » : l'enregistrement redemande bien.
  lignes = modifierLigne(lignes, { ...ara, niveau: 'preference' });
  assert.deepEqual(affaiblissements([ara, lait], elementsActifs(lignes), retraitsConfirmes(lignes)), ['Arachides']);
});

test('retraitsConfirmes : un « Évite » retiré sans question n\'est pas confirmé', () => {
  assert.deepEqual(retraitsConfirmes(retirerLigne(lignesDepuis([ara, lait]), 'ctr-2', false)), []);
});

test('modifierLigne ne touche pas une ligne retirée', () => {
  const lignes = retirerLigne(lignesDepuis([ara]), 'ctr-1', true);
  assert.deepEqual(modifierLigne(lignes, { ...ara, libelle: 'Cacahuètes' }), lignes);
});

test('ajouterLigne : en fin de liste ; une ligne retirée équivalente disparaît (pas de doublon par « Annuler »)', () => {
  const lignes = retirerLigne(lignesDepuis([ara, lait]), 'ctr-1', true);
  const neuf = el('ctr-9', 'Arachides', 'preference', ['arachides']);
  const apres = ajouterLigne(lignes, neuf);
  assert.deepEqual(apres.map((l) => l.element.id), ['ctr-2', 'ctr-9']);
  assert.deepEqual(retraitsConfirmes(apres), []);
  // Un ajout différent laisse la ligne retirée en place.
  assert.deepEqual(ajouterLigne(lignes, gluten).map((l) => l.element.id), ['ctr-1', 'ctr-2', 'ctr-3']);
});
