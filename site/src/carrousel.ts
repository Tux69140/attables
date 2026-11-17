/*
 * Copyright (C) 2026 Stéphane MICHEL
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Carrousel « Comment ça marche ». Sur ordinateur, les étapes en liste (l'active dépliée) et les téléphones à côté ;
// sur mobile, le téléphone, les commandes, puis l'étape active. Les captures quittent leur étape pour la scène.
// Rotation automatique, en pause au survol, au focus clavier, hors écran, onglet masqué, sur demande,
// et d'emblée si l'on préfère réduire les animations. Sans JavaScript, la liste des trois étapes reste telle quelle.
const DUREE_ETAPE_MS = 6000;
const SEUIL_GLISSER_PX = 40;

const carrousel = document.querySelector<HTMLElement>('[data-carrousel]');
const piste = carrousel?.querySelector<HTMLElement>('[data-carrousel-piste]');
const nav = carrousel?.querySelector<HTMLElement>('[data-carrousel-nav]');
const annonce = carrousel?.querySelector<HTMLElement>('[data-carrousel-annonce]');
const boutonLecture = nav?.querySelector<HTMLButtonElement>('[data-carrousel-lecture]');

if (carrousel && piste && nav && annonce && boutonLecture) {
  const etapes = Array.from(piste.children) as HTMLElement[];
  const total = etapes.length;
  const cadres = etapes.flatMap((etape) => etape.querySelector<HTMLElement>('.capture-cadre') ?? []);
  const titres = etapes.flatMap((etape) => etape.querySelector('h3') ?? []);
  const paragraphes = etapes.flatMap((etape) => etape.querySelector<HTMLElement>('.etape-texte p') ?? []);
  const points = Array.from(nav.querySelectorAll<HTMLButtonElement>('[data-carrousel-point]'));
  const reductionAnimations = window.matchMedia('(prefers-reduced-motion: reduce)');

  const scene = document.createElement('div');
  scene.className = 'carrousel-scene';
  scene.append(...cadres);
  piste.after(scene);

  // Le titre de chaque étape devient un bouton ; une fine barre montre le temps avant l'étape suivante.
  const boutons = titres.map((titre) => {
    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'etape-bouton';
    bouton.append(...titre.childNodes);
    titre.append(bouton);
    const barre = document.createElement('span');
    barre.className = 'etape-progression';
    titre.parentElement?.append(barre);
    return bouton;
  });

  let active = 0;
  let hauteursCorps: number[] = [];
  let ecoule = 0;
  let instant: number | null = null;
  let idImage = 0;
  let pauseDemandee = reductionAnimations.matches;
  let visible = !('IntersectionObserver' in window);
  let focusClavier = false;
  const survols = new Set<Element>();

  const position = (i: number, reference: number) => {
    // Position par rapport à l'étape de référence, ramenée autour de 0 : le carrousel boucle.
    let pos = i - reference;
    if (pos > total / 2) pos -= total;
    if (pos < -total / 2) pos += total;
    return pos;
  };

  // Sur ordinateur, la liste réserve sous elle la hauteur qui manque à l'étape dépliée pour égaler la plus longue :
  // les commandes ne bougent pas d'une étape à l'autre.
  const reserver = () => {
    if (!hauteursCorps.length) return;
    piste.style.setProperty('--reserve', `${Math.max(...hauteursCorps) - hauteursCorps[active]}px`);
  };

  const afficher = (index: number, annoncer: boolean) => {
    const precedente = active;
    active = (index + total) % total;
    etapes.forEach((etape, i) => {
      etape.classList.toggle('est-active', i === active);
      boutons[i].setAttribute('aria-expanded', String(i === active));
    });
    cadres.forEach((cadre, i) => {
      const pos = position(i, active);
      cadre.dataset.pos = String(pos);
      // Le téléphone qui passe d'un bord à l'autre glisse sous les deux autres.
      cadre.toggleAttribute('data-traverse', Math.abs(pos - position(i, precedente)) > 1);
      cadre.setAttribute('aria-hidden', String(i !== active));
    });
    points.forEach((point, i) => {
      if (i === active) point.setAttribute('aria-current', 'step');
      else point.removeAttribute('aria-current');
    });
    reserver();
    ecoule = 0;
    carrousel.style.setProperty('--progression', '0');
    if (annoncer) annonce.textContent = `Étape ${active + 1} sur ${total}\u00a0: ${titres[active].textContent ?? ''}`;
  };

  const avancer = (temps: number) => {
    if (instant !== null) ecoule += temps - instant;
    instant = temps;
    if (ecoule >= DUREE_ETAPE_MS) afficher(active + 1, false);
    carrousel.style.setProperty('--progression', (ecoule / DUREE_ETAPE_MS).toFixed(4));
    idImage = requestAnimationFrame(avancer);
  };

  const actualiser = () => {
    const enPause = pauseDemandee || survols.size > 0 || focusClavier || !visible || document.hidden;
    if (enPause) {
      cancelAnimationFrame(idImage);
      idImage = 0;
      instant = null;
    } else if (!idImage) {
      idImage = requestAnimationFrame(avancer);
    }
  };

  // Navigation manuelle : on va à l'étape demandée et le minuteur repart de zéro.
  const aller = (index: number) => {
    afficher(index, true);
    actualiser();
  };

  const majBoutonLecture = () => {
    boutonLecture.setAttribute('aria-label', pauseDemandee ? 'Relancer la rotation' : 'Mettre en pause la rotation');
    carrousel.classList.toggle('est-en-pause', pauseDemandee);
  };
  boutonLecture.addEventListener('click', () => {
    pauseDemandee = !pauseDemandee;
    // Qui relance la rotation veut la voir tourner, même si le pointeur ou le focus est encore sur le bouton.
    if (!pauseDemandee) {
      survols.clear();
      focusClavier = false;
    }
    majBoutonLecture();
    actualiser();
  });

  nav.querySelector('[data-carrousel-prec]')?.addEventListener('click', () => aller(active - 1));
  nav.querySelector('[data-carrousel-suiv]')?.addEventListener('click', () => aller(active + 1));
  points.forEach((point, i) => point.addEventListener('click', () => aller(i)));
  boutons.forEach((bouton, i) => bouton.addEventListener('click', () => {
    if (i !== active) aller(i);
  }));

  const auClavier = (e: KeyboardEvent) => {
    const recul = e.key === 'ArrowLeft' || (e.currentTarget === piste && e.key === 'ArrowUp');
    const avance = e.key === 'ArrowRight' || (e.currentTarget === piste && e.key === 'ArrowDown');
    if (!recul && !avance) return;
    e.preventDefault();
    aller(active + (recul ? -1 : 1));
    if (e.currentTarget === piste) boutons[active].focus();
  };
  nav.addEventListener('keydown', auClavier);
  piste.addEventListener('keydown', auClavier);

  // Glisser : un écart horizontal suffisant change d'étape ; le clic qui suit est alors ignoré.
  let departX: number | null = null;
  let aGlisse = false;
  scene.addEventListener('pointerdown', (e) => {
    departX = e.clientX;
    aGlisse = false;
  });
  scene.addEventListener('pointerup', (e) => {
    if (departX === null) return;
    const ecart = e.clientX - departX;
    departX = null;
    if (Math.abs(ecart) < SEUIL_GLISSER_PX) return;
    aGlisse = true;
    aller(active + (ecart < 0 ? 1 : -1));
  });
  scene.addEventListener('pointercancel', () => { departX = null; });
  cadres.forEach((cadre, i) => cadre.addEventListener('click', () => {
    if (!aGlisse && i !== active) aller(i);
  }));

  [piste, nav, scene].forEach((zone) => {
    zone.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch') return;
      survols.add(zone);
      actualiser();
    });
    zone.addEventListener('pointerleave', () => {
      survols.delete(zone);
      actualiser();
    });
  });
  carrousel.addEventListener('focusin', (e) => {
    focusClavier = e.target instanceof Element && e.target.matches(':focus-visible');
    actualiser();
  });
  carrousel.addEventListener('focusout', (e) => {
    if (e.relatedTarget instanceof Node && carrousel.contains(e.relatedTarget)) return;
    focusClavier = false;
    actualiser();
  });
  document.addEventListener('visibilitychange', actualiser);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entree]) => {
      visible = entree.isIntersecting;
      actualiser();
    }, { threshold: 0.5 }).observe(carrousel);
  }

  // Hauteur de chaque paragraphe, pour déplier son étape en douceur (une hauteur « auto » ne s'anime pas).
  let largeurMesuree = 0;
  const mesurer = () => {
    hauteursCorps = paragraphes.map((p) => p.offsetHeight);
    etapes.forEach((etape, i) => etape.style.setProperty('--hauteur-corps', `${hauteursCorps[i]}px`));
    reserver();
  };
  if ('ResizeObserver' in window) {
    new ResizeObserver(([entree]) => {
      if (entree.contentRect.width === largeurMesuree) return;
      largeurMesuree = entree.contentRect.width;
      mesurer();
    }).observe(piste);
  }
  document.fonts?.addEventListener('loadingdone', mesurer);
  window.addEventListener('load', mesurer, { once: true });

  // Sur les écrans bas, « En prime » tient sur une ligne (carrousel.css) ; ce bouton la déplie.
  const enPrime = carrousel.querySelector<HTMLElement>('.en-prime');
  if (enPrime) {
    const suite = document.createElement('button');
    suite.type = 'button';
    suite.className = 'en-prime-suite';
    suite.setAttribute('aria-expanded', 'false');
    suite.textContent = 'Lire la suite';
    suite.addEventListener('click', () => {
      const deplie = enPrime.classList.toggle('est-deplie');
      suite.setAttribute('aria-expanded', String(deplie));
      suite.textContent = deplie ? 'Réduire' : 'Lire la suite';
    });
    enPrime.append(' ', suite);
  }

  carrousel.classList.add('est-actif');
  nav.hidden = false;
  afficher(0, false);
  majBoutonLecture();
  mesurer();
  actualiser();
}

// « Cerise sur le gâteau » : la cerise tombe une fois, quand la carte entre dans l'écran.
const cerise = document.querySelector<HTMLElement>('[data-cerise]');
if (cerise && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  cerise.classList.add('attend-cerise');
  const observateurCerise = new IntersectionObserver((entrees) => {
    if (!entrees.some((entree) => entree.isIntersecting)) return;
    cerise.classList.add('est-servie');
    observateurCerise.disconnect();
  }, { threshold: 0.6 });
  observateurCerise.observe(cerise);
}
