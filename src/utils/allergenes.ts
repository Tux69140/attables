/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import type { NomIcone } from '../icones/donnees';
import type { ContrainteConvive, ContrainteNiveau, Convive, PlatFiche } from '../types/models';
import { type AggregatedConstraints, formatDishInput, normalizeForCompare } from './dishes';

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

/** Allergènes interdits par les contraintes livrées avec les versions 1 (identifiant de contrainte → allergènes) ; sert à la migration. */
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

const VEGETARIEN = ['viande', 'poissons', 'crustaces', 'mollusques'];

/** Régimes pré-remplis : choisir l'un d'eux crée un élément que l'on peut ajuster pour une seule personne. */
export const REGIMES: { id: 'vegetarien' | 'vegan'; libelle: string; allergenes: string[]; icone: NomIcone }[] = [
  { id: 'vegetarien', libelle: 'Végétarien', allergenes: [...VEGETARIEN], icone: 'leaf' },
  { id: 'vegan', libelle: 'Végan', allergenes: [...VEGETARIEN, 'oeufs', 'lait'], icone: 'sprout' },
];

const PREFIXE_AUTRE = 'autre:';

/** Identifiant d'un aliment libre (« Autre… ») : `autre:` suivi du libellé mis en forme. */
export function idAutre(libelle: string): string {
  return PREFIXE_AUTRE + formatDishInput(libelle);
}

export function estAutre(id: string): boolean {
  return id.startsWith(PREFIXE_AUTRE);
}

export function libelleAutre(id: string): string {
  return id.slice(PREFIXE_AUTRE.length);
}

/** Clé de comparaison d'un nom d'aliment : normalisée, sans pluriel en -s/-x à la fin de chaque mot (« fruit a coque » = « fruits a coque »). */
function cleSansPluriel(texte: string): string {
  return normalizeForCompare(texte)
    .split(' ')
    .map((m) => (m.length > 3 ? m.replace(/[sx]$/, '') : m))
    .join(' ');
}

/**
 * Allergène de référence que désigne une saisie libre (« oeuf », « Arachide », « fruit à coque »), pluriel,
 * casse et accents tolérés ; sinon `undefined`. Évite qu'un aliment libre double un allergène de référence
 * sans que les alertes des plats le retrouvent.
 */
export function allergeneDeReference(saisie: string): string | undefined {
  const cle = cleSansPluriel(saisie);
  if (!cle) return undefined;
  return ALLERGENES.find((a) => cleSansPluriel(a.libelle) === cle)?.id;
}

/**
 * Identifiant que désigne une saisie « Autre… » : l'allergène de référence, sinon l'aliment libre déjà connu
 * (graphie conservée), sinon un nouvel aliment libre.
 */
export function idDepuisSaisieAutre(saisie: string, connus: string[]): string {
  const saisi = idAutre(saisie);
  return allergeneDeReference(saisie) ?? connus.find((c) => memeAllergene(c, saisi)) ?? saisi;
}

/** Allergènes avec, en plus, le texte resté dans « Autre… » (comme si « Ajouter » avait été touché) ; inchangés si le texte est vide. */
export function avecSaisieAutre(allergenes: string[], saisie: string, connus: string[]): string[] {
  const texte = saisie.trim();
  if (!texte) return allergenes;
  const id = idDepuisSaisieAutre(texte, [...allergenes, ...connus]);
  return allergenes.some((a) => memeAllergene(a, id)) ? allergenes : [...allergenes, id];
}

/** Même allergène : même identifiant, ou deux aliments libres dont les libellés ne diffèrent que par la casse ou les accents. */
export function memeAllergene(a: string, b: string): boolean {
  if (a === b) return true;
  return estAutre(a) && estAutre(b) && normalizeForCompare(libelleAutre(a)) === normalizeForCompare(libelleAutre(b));
}

/**
 * Allergies affaiblies entre deux versions des éléments d'une personne : libellés des éléments `strict`
 * d'`avant` qui, dans `apres` (même `id`), ont disparu, sont passés à « Évite » ou ont perdu un allergène.
 */
export function affaiblissements(avant: ContrainteConvive[], apres: ContrainteConvive[]): string[] {
  return avant
    .filter((a) => {
      if (a.niveau !== 'strict') return false;
      const b = apres.find((x) => x.id === a.id);
      return !b || b.niveau !== 'strict' || a.allergenes.some((x) => !b.allergenes.some((y) => memeAllergene(x, y)));
    })
    .map((a) => a.libelle);
}

/** Vrai si un élément porte exactement ces allergènes (même ensemble, voir `memeAllergene`) : choix à ne pas reproposer. */
export function dejaPresent(contraintes: ContrainteConvive[], allergenes: string[]): boolean {
  const inclus = (xs: string[], ys: string[]) => xs.every((x) => ys.some((y) => memeAllergene(x, y)));
  return contraintes.some((c) => inclus(c.allergenes, allergenes) && inclus(allergenes, c.allergenes));
}

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

/** Libellé d'un allergène de référence, sinon d'un aliment libre, sinon l'identifiant brut. */
export function libelleAllergene(id: string): string {
  return ALLERGENES.find((a) => a.id === id)?.libelle ?? (estAutre(id) ? libelleAutre(id) : id);
}

/** Pictogramme d'un allergène de référence, sinon l'étiquette. */
export function iconeAllergene(id: string): NomIcone {
  return ALLERGENES.find((a) => a.id === id)?.icone ?? 'tag';
}

/**
 * Allergènes du plat qui concernent les convives : un convive est concerné par l'allergène `a`
 * si l'un de ses éléments contient `a` (même aliment libre compris, voir `memeAllergene`).
 * Une seule entrée par (allergène, niveau) ; une allergie stricte l'emporte sur une préférence
 * pour un même convive. Strict d'abord, puis ordre de ALLERGENES.
 */
export function conflitsPlat(allergenesPlat: string[], convives: Convive[]): ConflitAllergene[] {
  const distincts: string[] = [];
  for (const a of allergenesPlat) if (!distincts.some((d) => memeAllergene(d, a))) distincts.push(a);
  const groupes = new Map<string, ConflitAllergene>();
  for (const a of distincts) {
    for (const convive of convives) {
      let niveau: ContrainteNiveau | undefined;
      for (const element of convive.contraintes) {
        if (!element.allergenes.some((x) => memeAllergene(x, a))) continue;
        niveau = element.niveau === 'strict' ? 'strict' : (niveau ?? 'preference');
      }
      if (!niveau) continue;
      const cle = `${a}|${niveau}`;
      const groupe = groupes.get(cle);
      if (groupe) groupe.convives.push(convive);
      else groupes.set(cle, { allergeneId: a, libelle: libelleAllergene(a), niveau, convives: [convive] });
    }
  }
  return [...groupes.values()].sort(
    (x, y) =>
      (x.niveau === 'strict' ? 0 : 1) - (y.niveau === 'strict' ? 0 : 1) ||
      rangAllergene(x.allergeneId) - rangAllergene(y.allergeneId)
  );
}

/** Aliments libres déjà portés par des personnes ou des plats, sans doublon (le premier vu est gardé), triés. */
export function alimentsLibresConnus(convives: Convive[], plats: PlatFiche[]): string[] {
  const libres: string[] = [];
  const ajouter = (id: string) => {
    if (estAutre(id) && !libres.some((l) => memeAllergene(l, id))) libres.push(id);
  };
  for (const convive of convives) for (const element of convive.contraintes) element.allergenes.forEach(ajouter);
  for (const plat of plats) plat.allergenes.forEach(ajouter);
  return libres.sort((a, b) => libelleAutre(a).localeCompare(libelleAutre(b), 'fr'));
}

/** Choix proposés dans la grille d'allergènes : référence, puis aliments libres déjà connus. */
export function choixAllergenes(libresConnus: string[]): {
  reglementaires: Allergene[];
  autres: Allergene[];
  libres: string[];
} {
  return {
    reglementaires: ALLERGENES.filter((a) => a.groupe === 'reglementaire'),
    autres: ALLERGENES.filter((a) => a.groupe === 'autre'),
    libres: libresConnus.filter(estAutre),
  };
}

/** Pictogramme d'un élément : choisi, sinon celui de son unique allergène, sinon l'étiquette. */
export function iconeContrainte(c: { icone?: NomIcone; allergenes: string[] }): NomIcone {
  if (c.icone) return c.icone;
  if (c.allergenes.length === 1) return iconeAllergene(c.allergenes[0]);
  return 'tag';
}

/**
 * Ce qu'évite une personne, en minuscules : le libellé seul pour un élément à un allergène (« lait »),
 * les allergènes puis le libellé entre parenthèses au-delà (« viande, poissons, crustacés, mollusques (végétarien) »).
 */
export function texteEvite(element: ContrainteConvive): string {
  const libelle = element.libelle.toLowerCase();
  if (element.allergenes.length < 2) return libelle;
  return `${element.allergenes.map((a) => libelleAllergene(a).toLowerCase()).join(', ')} (${libelle})`;
}

/** Prénoms en phrase : « Léa », « Léa et Nadia », « Léa, Nadia et Paul ». */
export function listePrenoms(convives: Convive[]): string {
  const noms = convives.map((g) => g.nomAffiche);
  if (noms.length <= 1) return noms.join('');
  return `${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]}`;
}

/** Bandeau de carte : « Arachides — Léa, Nadia · Crustacés — Paul », puis le nombre d'allergies non citées. */
export function resumeAllergiesStrictes(
  strict: AggregatedConstraints['strict'],
  max = 2
): { texte: string; reste: number } {
  const texte = strict
    .slice(0, max)
    .map(({ libelle, guests }) => `${libelle} — ${guests.map((g) => g.nomAffiche).join(', ')}`)
    .join(' · ');
  return { texte, reste: Math.max(0, strict.length - max) };
}
