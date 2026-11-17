/*
 * Copyright (C) 2026 Stéphane MICHEL
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// L'en-tête s'efface quand on descend dans la page et revient dès qu'on remonte, même d'un cran :
// toute la hauteur sert à la lecture, le menu reste à portée. Il ne s'efface pas en haut de page,
// et le focus clavier le garde visible (voir `.entete` dans en-tete.css).
// En haut de page il reste transparent ; `est-defile` lui donne son fond dès que la page a défilé.
const SEUIL_PX = 6;

const entete = document.querySelector<HTMLElement>('.entete');

if (entete) {
  // Hauteur réelle (la navigation peut passer sous le nom sur écran très étroit) : sert aux marges d'ancre.
  const mesurer = () => document.documentElement.style.setProperty('--hauteur-entete', `${entete.offsetHeight}px`);
  mesurer();
  if ('ResizeObserver' in window) new ResizeObserver(mesurer).observe(entete);

  const marquerDefile = (y: number) => entete.classList.toggle('est-defile', y > 0);
  marquerDefile(window.scrollY);

  let dernier = window.scrollY;
  let attente = false;
  const suivre = () => {
    attente = false;
    const y = window.scrollY;
    marquerDefile(y);
    const ecart = y - dernier;
    if (Math.abs(ecart) < SEUIL_PX) return;
    entete.classList.toggle('est-efface', ecart > 0 && y > entete.offsetHeight);
    dernier = y;
  };
  window.addEventListener('scroll', () => {
    if (attente) return;
    attente = true;
    requestAnimationFrame(suivre);
  }, { passive: true });
}
