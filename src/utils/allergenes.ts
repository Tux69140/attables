/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import type { NomIcone } from '../icones/donnees';

/** Allergène de référence : les 14 réglementaires, puis quelques familles courantes. */
export interface Allergene {
  id: string;
  libelle: string;
  icone: NomIcone;
  groupe: 'reglementaire' | 'autre';
}

export const ALLERGENES: Allergene[] = [
  { id: 'gluten', libelle: 'Gluten', icone: 'wheat', groupe: 'reglementaire' },
  { id: 'crustaces', libelle: 'Crustacés', icone: 'shrimp', groupe: 'reglementaire' },
  { id: 'oeufs', libelle: 'Œufs', icone: 'egg', groupe: 'reglementaire' },
  { id: 'poissons', libelle: 'Poissons', icone: 'fish', groupe: 'reglementaire' },
  { id: 'arachides', libelle: 'Arachides', icone: 'arachide', groupe: 'reglementaire' },
  { id: 'soja', libelle: 'Soja', icone: 'bean', groupe: 'reglementaire' },
  { id: 'lait', libelle: 'Lait', icone: 'milk', groupe: 'reglementaire' },
  { id: 'fruits-a-coque', libelle: 'Fruits à coque', icone: 'nut', groupe: 'reglementaire' },
  { id: 'celeri', libelle: 'Céleri', icone: 'celeri', groupe: 'reglementaire' },
  { id: 'moutarde', libelle: 'Moutarde', icone: 'moutarde', groupe: 'reglementaire' },
  { id: 'sesame', libelle: 'Sésame', icone: 'sesame', groupe: 'reglementaire' },
  { id: 'sulfites', libelle: 'Sulfites', icone: 'flask-conical', groupe: 'reglementaire' },
  { id: 'lupin', libelle: 'Lupin', icone: 'flower-2', groupe: 'reglementaire' },
  { id: 'mollusques', libelle: 'Mollusques', icone: 'shell', groupe: 'reglementaire' },
  { id: 'fodmap', libelle: 'FODMAP', icone: 'ail', groupe: 'autre' },
  { id: 'porc', libelle: 'Porc', icone: 'ham', groupe: 'autre' },
  { id: 'alcool', libelle: 'Alcool', icone: 'wine', groupe: 'autre' },
  { id: 'viande', libelle: 'Viande', icone: 'beef', groupe: 'autre' },
];

/** Allergènes interdits par les contraintes livrées avec l'appli (identifiant de contrainte → allergènes). */
export const LIAISONS_PAR_DEFAUT: Record<string, string[]> = {
  'tag-arachides': ['arachides'],
  'tag-fruits-coque': ['fruits-a-coque'],
  'tag-crustaces': ['crustaces'],
  'tag-gluten': ['gluten'],
  'tag-lactose': ['lait'],
  'tag-vegetarien': ['viande', 'poissons', 'crustaces', 'mollusques'],
  'tag-vegan': ['viande', 'poissons', 'crustaces', 'mollusques', 'oeufs', 'lait'],
  'tag-sans-porc': ['porc'],
  'tag-sans-alcool': ['alcool'],
};

/** Pictogrammes proposés pour une contrainte : ceux des allergènes, puis des aliments courants. */
export const PICTOS_CONTRAINTE: { icone: NomIcone; libelle: string }[] = [
  ...ALLERGENES.map((a) => ({ icone: a.icone, libelle: a.id === 'fodmap' ? 'Ail' : a.libelle })),
  { icone: 'carrot', libelle: 'Carotte' },
  { icone: 'apple', libelle: 'Pomme' },
  { icone: 'cherry', libelle: 'Fruits rouges' },
  { icone: 'citrus', libelle: 'Agrumes' },
  { icone: 'banana', libelle: 'Banane' },
  { icone: 'grape', libelle: 'Raisin' },
  { icone: 'leafy-green', libelle: 'Légumes verts' },
  { icone: 'sprout', libelle: 'Graines germées' },
  { icone: 'flame', libelle: 'Épicé' },
  { icone: 'candy', libelle: 'Sucre' },
  { icone: 'chocolat', libelle: 'Chocolat' },
  { icone: 'coffee', libelle: 'Café' },
  { icone: 'drumstick', libelle: 'Volaille' },
  { icone: 'croissant', libelle: 'Viennoiserie' },
  { icone: 'cookie', libelle: 'Biscuit' },
  { icone: 'hop', libelle: 'Bière' },
];
