/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Pile des couches (feuilles, modales) qui retiennent le focus. Seule la couche du dessus
 * gère la tabulation : une confirmation ouverte sur une feuille garde le focus pour elle.
 */
export function creerPileFocus() {
  const pile: number[] = [];
  let compteur = 0;

  function empiler(): number {
    const id = ++compteur;
    pile.push(id);
    return id;
  }

  function retirer(id: number): void {
    const i = pile.indexOf(id);
    if (i !== -1) pile.splice(i, 1);
  }

  function estAuSommet(id: number): boolean {
    return pile.length > 0 && pile[pile.length - 1] === id;
  }

  /** Couche du dessus, null si aucune n'est ouverte. */
  function sommet(): number | null {
    return pile.length > 0 ? pile[pile.length - 1] : null;
  }

  return { empiler, retirer, estAuSommet, sommet };
}

/**
 * Index à focaliser quand Tab sort des bornes ; null = laisser faire le navigateur.
 * `index` = position de l'élément actif parmi les `nb` focalisables, -1 s'il n'en fait pas partie.
 * `toujours` : la liste ne suit pas l'ordre du document (bandeau « Annuler » ajouté après la feuille),
 * donc chaque pas est donné, jamais laissé au navigateur.
 */
export function cibleTabulation(nb: number, index: number, arriere: boolean, toujours = false): number | null {
  if (nb <= 0) return null;
  if (index === -1) return arriere ? nb - 1 : 0;
  if (!arriere && index === nb - 1) return 0;
  if (arriere && index === 0) return nb - 1;
  if (toujours) return arriere ? index - 1 : index + 1;
  return null;
}
