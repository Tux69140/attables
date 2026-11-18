/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/** Clé stable de l'élément actif (attribut data-focus-cle de lui-même ou d'un parent), sinon null. */
export function memoriserCleFocus(): string | null {
  const actif = document.activeElement;
  if (!(actif instanceof HTMLElement)) return null;
  return actif.closest<HTMLElement>('[data-focus-cle]')?.getAttribute('data-focus-cle') ?? null;
}

/** Focalise le titre de la vue (`[data-titre-vue]`), sans faire défiler la page. */
export function focaliserTitreVue(): void {
  document.querySelector<HTMLElement>('[data-titre-vue]')?.focus({ preventScroll: true });
}

/** Focalise [data-focus-cle="cle"] s'il existe, sinon le titre de la vue ; toujours preventScroll. */
export function rendreFocus(cle: string | null): void {
  if (cle) {
    const cible = Array.from(document.querySelectorAll<HTMLElement>('[data-focus-cle]')).find(
      (el) => el.getAttribute('data-focus-cle') === cle,
    );
    if (cible) {
      cible.focus({ preventScroll: true });
      return;
    }
  }
  focaliserTitreVue();
}
