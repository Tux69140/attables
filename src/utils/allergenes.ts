/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import type { NomIcone } from '../icones/donnees';
import type { AppData, ContrainteNiveau, ContrainteTag, Convive } from '../types/models';

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

/** Un allergène d'un plat qui concerne des convives, au niveau de leur contrainte. */
export interface ConflitAllergene {
  allergeneId: string;
  libelle: string;
  niveau: ContrainteNiveau;
  convives: Convive[];
}

const rangAllergene = (id: string): number => {
  const i = ALLERGENES.findIndex((a) => a.id === id);
  return i === -1 ? ALLERGENES.length : i;
};

/** Libellé d'un allergène de référence, sinon de la contrainte personnelle, sinon l'identifiant brut. */
export function libelleAllergene(id: string, contraintesById: Map<string, ContrainteTag>): string {
  return ALLERGENES.find((a) => a.id === id)?.libelle ?? contraintesById.get(id)?.libelle ?? id;
}

/**
 * Allergènes du plat qui concernent les convives : un convive est concerné par l'allergène `a`
 * s'il porte une contrainte qui l'interdit (`allergenes` contient `a`) ou qui est `a` elle-même
 * (contrainte personnelle). Une seule entrée par (allergène, niveau) ; une allergie stricte
 * l'emporte sur une préférence pour un même convive. Strict d'abord, puis ordre de ALLERGENES.
 */
export function conflitsPlat(
  allergenesPlat: string[],
  convives: Convive[],
  contraintesById: Map<string, ContrainteTag>
): ConflitAllergene[] {
  const groupes = new Map<string, ConflitAllergene>();
  for (const a of new Set(allergenesPlat)) {
    for (const convive of convives) {
      let niveau: ContrainteNiveau | undefined;
      for (const tagId of convive.contraintesIds) {
        const tag = contraintesById.get(tagId);
        if (!tag || !(tag.id === a || tag.allergenes.includes(a))) continue;
        niveau = tag.niveau === 'strict' ? 'strict' : (niveau ?? 'preference');
      }
      if (!niveau) continue;
      const cle = `${a}|${niveau}`;
      const groupe = groupes.get(cle);
      if (groupe) groupe.convives.push(convive);
      else groupes.set(cle, { allergeneId: a, libelle: libelleAllergene(a, contraintesById), niveau, convives: [convive] });
    }
  }
  return [...groupes.values()].sort(
    (x, y) =>
      (x.niveau === 'strict' ? 0 : 1) - (y.niveau === 'strict' ? 0 : 1) ||
      rangAllergene(x.allergeneId) - rangAllergene(y.allergeneId)
  );
}

/** Choix proposés pour les allergènes d'un plat : référence, puis contraintes personnelles non reliées. */
export function choixAllergenes(contraintes: ContrainteTag[]): {
  reglementaires: Allergene[];
  autres: Allergene[];
  personnels: ContrainteTag[];
} {
  return {
    reglementaires: ALLERGENES.filter((a) => a.groupe === 'reglementaire'),
    autres: ALLERGENES.filter((a) => a.groupe === 'autre'),
    personnels: contraintes.filter((t) => t.allergenes.length === 0),
  };
}

/** Pictogramme d'une contrainte : choisi, sinon celui de son unique allergène lié, sinon l'étiquette. */
export function iconeContrainte(tag: ContrainteTag): NomIcone {
  if (tag.icone) return tag.icone;
  if (tag.allergenes.length === 1) {
    const lie = ALLERGENES.find((a) => a.id === tag.allergenes[0]);
    if (lie) return lie.icone;
  }
  return 'tag';
}

/** Retire une contrainte et toutes ses références (convives, allergènes des fiches de plat). */
export function retirerContrainte(data: AppData, tagId: string): AppData {
  return {
    ...data,
    contraintes: data.contraintes.filter((t) => t.id !== tagId),
    convives: data.convives.map((c) =>
      c.contraintesIds.includes(tagId) ? { ...c, contraintesIds: c.contraintesIds.filter((id) => id !== tagId) } : c
    ),
    plats: data.plats.map((p) =>
      p.allergenes.includes(tagId) ? { ...p, allergenes: p.allergenes.filter((id) => id !== tagId) } : p
    ),
  };
}
