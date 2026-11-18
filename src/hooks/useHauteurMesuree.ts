/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { type RefObject, useLayoutEffect, useRef } from 'react';

/** Variables CSS écrites sur <html> : une par rôle, car une seule vue est montée à la fois. */
export type VariableHauteur = '--hauteur-entete' | '--hauteur-barre' | '--hauteur-fab' | '--hauteur-bandeau';

/**
 * Écrit la hauteur réelle (offsetHeight) de l'élément dans une variable CSS de <html>, et la tient à jour.
 * En grand texte, l'en-tête et les barres grandissent : tout ce qui se positionne par rapport à eux
 * (index.css : .pt-below-header, .bottom-above-nav…) lit ces variables, avec la hauteur d'origine en repli.
 * La propriété est retirée au démontage. L'élément peut apparaître ou disparaître d'un rendu à l'autre
 * (l'en-tête de l'App n'existe que dans la vue à onglets) : la mesure suit `ref.current` à chaque rendu.
 */
export function useHauteurMesuree(ref: RefObject<HTMLElement | null>, variable: VariableHauteur): void {
  const mesure = useRef<{ el: HTMLElement; arreter: () => void } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (mesure.current?.el === el) return;
    mesure.current?.arreter();
    mesure.current = el ? demarrer(el, variable) : null;
  });

  useLayoutEffect(
    () => () => {
      mesure.current?.arreter();
      mesure.current = null;
    },
    []
  );
}

function demarrer(el: HTMLElement, variable: VariableHauteur) {
  const racine = document.documentElement;
  const ecrire = () => racine.style.setProperty(variable, `${el.offsetHeight}px`);
  ecrire();
  const observateur = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(ecrire);
  observateur?.observe(el);
  // Repli : la hauteur change aussi avec la rotation (marges système) ou un agrandissement du texte.
  window.addEventListener('resize', ecrire);
  return {
    el,
    arreter: () => {
      observateur?.disconnect();
      window.removeEventListener('resize', ecrire);
      racine.style.removeProperty(variable);
    },
  };
}
