/*
 * Copyright (C) 2026 Stéphane MICHEL
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import './styles.css';
import './pied-attables';
import './en-tete';
import './carrousel';

// Démo de la page d'accueil : sur grand écran, l'appli vivante dans le cadre de téléphone ;
// sinon (et sans JavaScript), seul le bouton « Essayer la démo » de l'accroche, qui ouvre /demo/ en plein écran.
const cadre = document.querySelector<HTMLElement>('[data-demo-cadre]');
const ecran = document.querySelector<HTMLElement>('[data-demo-ecran]');

if (cadre && ecran) {
  const grandEcran = window.matchMedia('(min-width: 900px)');
  // L'iframe n'est créée qu'après le chargement de la page, pour que l'accroche s'affiche d'abord.
  let pageChargee = document.readyState === 'complete';

  const insererIframe = () => {
    if (ecran.querySelector('iframe')) return;
    const iframe = document.createElement('iframe');
    iframe.src = '/demo/';
    iframe.title = 'Démo d’Attablés';
    iframe.loading = 'lazy';
    iframe.width = '393';
    iframe.height = '852';
    ecran.append(iframe);
  };

  const appliquer = () => {
    const afficherCadre = grandEcran.matches;
    if (afficherCadre && pageChargee) insererIframe();
    cadre.hidden = !afficherCadre;
  };

  // Taille du téléphone : la hauteur laissée sous l'en-tête et le bandeau vichy, bornée par --echelle-max (largeur).
  const telephone = cadre.querySelector<HTMLElement>('.telephone');
  const accroche = cadre.closest<HTMLElement>('.accroche');
  const ajusterTelephone = () => {
    if (!telephone || !accroche || !grandEcran.matches) return;
    const entete = document.querySelector<HTMLElement>('.entete')?.offsetHeight ?? 0;
    const bandeau = document.querySelector<HTMLElement>('.bandeau-vichy')?.offsetHeight ?? 0;
    const styleAccroche = getComputedStyle(accroche);
    const styleTelephone = getComputedStyle(telephone);
    const dispo = window.innerHeight - entete - bandeau
      - parseFloat(styleAccroche.paddingTop) - parseFloat(styleAccroche.paddingBottom)
      - parseFloat(styleTelephone.paddingTop) - parseFloat(styleTelephone.paddingBottom);
    const max = parseFloat(styleTelephone.getPropertyValue('--echelle-max')) || 0.88;
    const echelle = Math.min(max, Math.max(0.5, dispo / 852));
    telephone.style.setProperty('--echelle', (Math.floor(echelle * 1000) / 1000).toString());
  };

  appliquer();
  ajusterTelephone();
  grandEcran.addEventListener('change', () => {
    appliquer();
    ajusterTelephone();
  });
  window.addEventListener('resize', ajusterTelephone, { passive: true });
  if (!pageChargee) {
    window.addEventListener('load', () => {
      pageChargee = true;
      appliquer();
      ajusterTelephone();
    }, { once: true });
  }
}

// Apparition au défilement : sections et engagements montent doucement en entrant dans l'écran.
// Ce qui est déjà visible au chargement n'est pas touché, pour ne pas clignoter.
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observateur = new IntersectionObserver((entrees) => {
    entrees.forEach((entree) => {
      if (!entree.isIntersecting) return;
      entree.target.classList.add('est-visible');
      observateur.unobserve(entree.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  // Sur mobile, les engagements défilent de côté : ils apparaissent avec leur section.
  const cibles = window.matchMedia('(min-width: 640px)').matches ? '.section, .engagements li' : '.section';
  document.querySelectorAll<HTMLElement>(cibles).forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    el.classList.add('anime-au-scroll');
    observateur.observe(el);
  });
}

// Engagements sur mobile : la rangée se parcourt aussi au clavier, et des points suivent la carte en vue.
const rangee = document.querySelector<HTMLElement>('[data-engagements]');
if (rangee) {
  const cartes = Array.from(rangee.children) as HTMLElement[];
  const points = document.createElement('div');
  points.className = 'engagements-points';
  points.setAttribute('aria-hidden', 'true');
  cartes.forEach(() => points.append(document.createElement('span')));
  rangee.after(points);

  const marquer = () => {
    const auBout = rangee.scrollLeft >= rangee.scrollWidth - rangee.clientWidth - 2;
    const pas = cartes.length > 1 ? cartes[1].offsetLeft - cartes[0].offsetLeft : 1;
    const active = auBout ? cartes.length - 1 : Math.round(rangee.scrollLeft / pas);
    Array.from(points.children).forEach((point, i) => point.classList.toggle('est-actif', i === active));
  };

  const enRangee = window.matchMedia('(max-width: 639px)');
  const adapter = () => {
    if (enRangee.matches) {
      rangee.tabIndex = 0;
      rangee.setAttribute('aria-label', 'Nos engagements');
    } else {
      rangee.removeAttribute('tabindex');
      rangee.removeAttribute('aria-label');
    }
    marquer();
  };
  adapter();
  enRangee.addEventListener('change', adapter);
  let attente = false;
  rangee.addEventListener('scroll', () => {
    if (attente) return;
    attente = true;
    requestAnimationFrame(() => {
      attente = false;
      marquer();
    });
  }, { passive: true });
}
