/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/** Ce que la pile utilise de `window.history`. */
export interface HistoriqueMinimal {
  readonly state: unknown;
  pushState(state: unknown, titre: string): void;
  back(): void;
}

/**
 * Pile des couches (vues, modales, feuilles) fermables par le bouton Retour d'Android.
 * Chaque couche ajoute une entrée d'historique. Fermée par l'interface, elle retire la sienne
 * par `history.back()` ; le popstate qui en résulte doit être ignoré.
 */
export function creerPileRetour(historique: HistoriqueMinimal) {
  const pile: { id: string; onBack: () => void }[] = [];
  let compteur = 0;
  // Nombre de popstate provoqués par nos propres `back()`, encore à venir.
  let retoursIgnores = 0;

  function surPopState(): void {
    if (retoursIgnores > 0) {
      retoursIgnores -= 1;
      return;
    }
    pile.pop()?.onBack();
  }

  function empiler(onBack: () => void): string {
    const id = `attables-back-${++compteur}`;
    pile.push({ id, onBack });
    const etat = historique.state && typeof historique.state === 'object' ? historique.state : {};
    historique.pushState({ ...etat, attablesLayerId: id }, '');
    return id;
  }

  function retirer(id: string): void {
    const i = pile.findIndex((c) => c.id === id);
    if (i === -1) return; // déjà retirée par le bouton Retour
    pile.splice(i, 1);
    const etat = historique.state as { attablesLayerId?: string } | null;
    if (etat?.attablesLayerId === id) {
      retoursIgnores += 1;
      historique.back();
    }
  }

  return { empiler, retirer, surPopState };
}
