/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Un prénom s'élide-t-il (« d’Anne », « qu’Éric », « d’Hugo ») ? Oui devant une voyelle, accentuée ou non,
 * et devant un « h » (tous traités comme muets). Un « y » ne s'élide que devant une consonne
 * (« d’Yvon »), pas devant une voyelle (« de Yann », « de Yasmine ») : il y sonne comme une consonne.
 */
export function prenomElide(prenom: string): boolean {
  const lettres = prenom.trim().normalize('NFD').toLowerCase();
  const premiere = lettres[0];
  if (!premiere) return false;
  if (premiere === 'y') return !/^[aeiou]/.test(lettres.slice(1));
  return /^[aeiouh]/.test(premiere) || premiere === 'œ' || premiere === 'æ';
}

/** « d’Anne », « d’Éric », « d’Hugo », « de Yann », « de Paul » : la préposition « de » devant le prénom. */
export function dePrenom(prenom: string): string {
  const nom = prenom.trim();
  return `${prenomElide(nom) ? 'd’' : 'de '}${nom}`;
}

/** « Ce que Léa… », « Ce qu’Anne… » ; « cette personne » tant que le prénom est vide. */
export function ceQueNeMangePas(prenom: string): string {
  const nom = prenom.trim();
  if (!nom) return 'Ce que cette personne ne mange pas';
  return `${prenomElide(nom) ? 'Ce qu’' : 'Ce que '}${nom} ne mange pas`;
}
