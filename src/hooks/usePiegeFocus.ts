/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useEffect, type RefObject } from 'react';
import { focaliserTitreVue, focusPerdu } from './focusVues';
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
 * Éléments masqués aux lecteurs d'écran par les feuilles ouvertes : nombre de feuilles qui les masquent
 * et valeur d'aria-hidden d'avant (null : absent), remise quand la dernière se ferme.
 */
const masques = new Map<Element, { nb: number; avant: string | null }>();

/**
 * Masque aux lecteurs d'écran (TalkBack lisait la liste derrière la feuille) tout ce qui n'est pas la
 * feuille : les frères du conteneur et de chacun de ses ancêtres. Un élément déjà caché (aria-hidden
 * « true ») n'est pas touché. React ne doit piloter aria-hidden sur aucun de ces frères : le poser sur
 * un conteneur intérieur (voir les boutons flottants). Renvoie de quoi tout rendre comme avant.
 */
function masquerLeReste(conteneur: HTMLElement): () => void {
  const pris: Element[] = [];
  for (let n: Element = conteneur; n.parentElement && n !== document.body; n = n.parentElement) {
    for (const frere of Array.from(n.parentElement.children)) {
      if (frere === n || frere.tagName === 'SCRIPT') continue;
      const deja = masques.get(frere);
      if (deja) deja.nb += 1;
      else if (frere.getAttribute('aria-hidden') === 'true') continue;
      else {
        masques.set(frere, { nb: 1, avant: frere.getAttribute('aria-hidden') });
        frere.setAttribute('aria-hidden', 'true');
      }
      pris.push(frere);
    }
  }
  return () => {
    for (const el of pris) {
      const m = masques.get(el);
      if (!m) continue;
      m.nb -= 1;
      if (m.nb > 0) continue;
      masques.delete(el);
      if (m.avant === null) el.removeAttribute('aria-hidden');
      else el.setAttribute('aria-hidden', m.avant);
    }
  };
}

/**
 * Garde le focus dans une feuille ou une modale ouverte (WCAG 2.4.3) : le titre le reçoit à
 * l'ouverture, Tab boucle dans le conteneur (seule la couche du dessus), et la fermeture rend le
 * focus à l'élément qui l'avait avant ; le reste de la page est masqué aux lecteurs d'écran
 * (aria-hidden) tant qu'elle est ouverte. Sans `inert` ni `<dialog>` (anciennes WebView Android).
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
    // Après le focus : Chrome refuse aria-hidden sur un élément qui contient le focus (le bouton d'origine).
    const rendreVisible = conteneur.current ? masquerLeReste(conteneur.current) : () => {};

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
      rendreVisible(); // avant de rendre le focus : l'élément d'origine doit être de nouveau lisible
      if (origine && origine.isConnected && origine.getClientRects().length > 0) {
        origine.focus({ preventScroll: true });
      } else if (focusPerdu()) {
        // L'élément qui avait ouvert la feuille a disparu (ligne supprimée…) : le titre de la vue, pas <body>.
        // Si le focus est allé ailleurs (autre feuille, titre d'une nouvelle vue), on n'y touche pas.
        focaliserTitreVue();
      }
    };
    // Les refs sont stables : l'effet ne dépend que de l'ouverture.
  }, [ouvert]);
}
