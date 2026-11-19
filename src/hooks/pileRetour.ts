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
  // Couches ouvertes pendant qu'un de nos `back()` est en cours : leur entrée attend qu'il
  // soit fait, sinon ce recul tomberait sur elle et désalignerait l'historique.
  let enAttente: string[] = [];
  // Couches fermées par l'interface alors que leur entrée n'était pas la dernière (une couche fermée
  // en même temps qu'une autre, ex. éditeur et confirmation de suppression). Leur entrée est encore
  // dans l'historique : on la retire dès que le recul qui la découvre est fait.
  const orphelines = new Set<string>();

  const pousser = (id: string) => {
    const etat = historique.state && typeof historique.state === 'object' ? historique.state : {};
    historique.pushState({ ...etat, attablesLayerId: id }, '');
  };

  const idCourant = () => (historique.state as { attablesLayerId?: string } | null)?.attablesLayerId;

  // Si l'entrée courante est celle d'une couche déjà fermée, on recule encore.
  function purgerOrpheline(): void {
    const id = idCourant();
    if (id !== undefined && orphelines.delete(id)) {
      retoursIgnores += 1;
      historique.back();
    }
  }

  function surPopState(): void {
    if (retoursIgnores > 0) {
      retoursIgnores -= 1;
      if (retoursIgnores === 0) {
        purgerOrpheline();
        if (retoursIgnores === 0) {
          const ids = enAttente;
          enAttente = [];
          ids.forEach(pousser);
        }
      }
      return;
    }
    pile.pop()?.onBack();
    if (retoursIgnores === 0) purgerOrpheline();
  }

  function empiler(onBack: () => void): string {
    const id = `attables-back-${++compteur}`;
    pile.push({ id, onBack });
    if (retoursIgnores > 0) enAttente.push(id);
    else pousser(id);
    return id;
  }

  function retirer(id: string): void {
    const i = pile.findIndex((c) => c.id === id);
    if (i === -1) return; // déjà retirée par le bouton Retour
    pile.splice(i, 1);
    if (enAttente.includes(id)) {
      enAttente = enAttente.filter((x) => x !== id); // jamais entrée dans l'historique
      return;
    }
    const courant = idCourant();
    if (courant === id) {
      retoursIgnores += 1;
      historique.back();
    } else if (courant !== undefined) {
      orphelines.add(id);
    }
  }

  /** Vrai si la couche `id` est la dernière empilée (celle du dessus). */
  function estAuDessus(id: string): boolean {
    return pile.length > 0 && pile[pile.length - 1].id === id;
  }

  return { empiler, retirer, surPopState, estAuDessus };
}
