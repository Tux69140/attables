/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Lignes de la fiche d'une personne : un élément retiré par son ✕ garde sa place (ligne « Retiré : … »)
 * tant que la fiche est ouverte, pour pouvoir être remis tel quel par « Annuler ».
 */
import type { ContrainteConvive } from '../types/models';
import { dejaPresent } from './allergenes';

export interface LigneElement {
  element: ContrainteConvive;
  /** Présent si l'élément est retiré ; `confirme` : retrait d'une allergie déjà confirmé (ne pas redemander). */
  retrait?: { confirme: boolean };
}

export const lignesDepuis = (contraintes: ContrainteConvive[]): LigneElement[] => contraintes.map((element) => ({ element }));

/** Les éléments encore dans la liste, dans l'ordre de la fiche : ce qui sera enregistré. */
export const elementsActifs = (lignes: LigneElement[]): ContrainteConvive[] =>
  lignes.filter((l) => !l.retrait).map((l) => l.element);

/** Identifiants des allergies retirées après confirmation : l'enregistrement ne redemande pas pour elles. */
export const retraitsConfirmes = (lignes: LigneElement[]): string[] =>
  lignes.filter((l) => l.retrait?.confirme).map((l) => l.element.id);

/** Retire l'élément `id` en gardant sa place. */
export function retirerLigne(lignes: LigneElement[], id: string, confirme: boolean): LigneElement[] {
  return lignes.map((l) => (l.element.id === id && !l.retrait ? { element: l.element, retrait: { confirme } } : l));
}

/** Remet l'élément `id` à sa place, tel qu'il était (même identifiant, niveau, allergènes) ; sa confirmation tombe. */
export function restaurerLigne(lignes: LigneElement[], id: string): LigneElement[] {
  return lignes.map((l) => (l.element.id === id && l.retrait ? { element: l.element } : l));
}

/** Remplace un élément modifié dans sa feuille. */
export function modifierLigne(lignes: LigneElement[], element: ContrainteConvive): LigneElement[] {
  return lignes.map((l) => (l.element.id === element.id && !l.retrait ? { element } : l));
}

/**
 * Ajoute un élément en fin de liste. Une ligne retirée équivalente disparaît : son « Annuler » créerait
 * un doublon.
 */
export function ajouterLigne(lignes: LigneElement[], element: ContrainteConvive): LigneElement[] {
  return [...lignes.filter((l) => !l.retrait || !dejaPresent([l.element], element)), { element }];
}
