/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useEffect, type RefObject } from 'react';
import { cibleTabulation, creerPileFocus } from './pileFocus';

const pile = creerPileFocus();

const FOCALISABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focalisablesVisibles(conteneur: HTMLElement): HTMLElement[] {
  return Array.from(conteneur.querySelectorAll<HTMLElement>(FOCALISABLES)).filter(
    (el) => el.getClientRects().length > 0,
  );
}

/**
 * Garde le focus dans une feuille ou une modale ouverte (WCAG 2.4.3) : le titre le reçoit à
 * l'ouverture, Tab boucle dans le conteneur (seule la couche du dessus), et la fermeture rend le
 * focus à l'élément qui l'avait avant. Sans `inert` ni `<dialog>` (anciennes WebView Android).
 * React exécute le nettoyage de la feuille qui se ferme avant l'effet de celle qui s'ouvre dans le
 * même rendu : la nouvelle mémorise alors l'élément que l'ancienne vient de retrouver.
 */
export function usePiegeFocus(
  ouvert: boolean,
  conteneur: RefObject<HTMLElement | null>,
  titre: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!ouvert || typeof document === 'undefined') return;
    const origine = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const id = pile.empiler();
    titre.current?.focus({ preventScroll: true });

    const surTouche = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !pile.estAuSommet(id) || !conteneur.current) return;
      const liste = focalisablesVisibles(conteneur.current);
      const cible = cibleTabulation(liste.length, liste.indexOf(document.activeElement as HTMLElement), e.shiftKey);
      if (cible !== null) {
        e.preventDefault();
        liste[cible].focus();
      } else if (liste.length === 0) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', surTouche);

    return () => {
      document.removeEventListener('keydown', surTouche);
      pile.retirer(id);
      if (origine && origine.isConnected && origine.getClientRects().length > 0) {
        origine.focus({ preventScroll: true });
      }
    };
    // Les refs sont stables : l'effet ne dépend que de l'ouverture.
  }, [ouvert]);
}
