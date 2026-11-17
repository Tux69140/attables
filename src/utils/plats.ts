/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
  COURSE_KEYS,
  type Convive,
  type CourseKey,
  type DishVerdict,
  type Invitation,
  type InvitationStatut,
  type PlatFiche,
} from '../types/models';
import { formatDishInput, getElapsedTimeInfo, normalizeForCompare } from './dishes';

/** Clé de comparaison d'un nom de plat : casse, accents, espaces, apostrophes et tirets ignorés. */
export function cleDePlat(libelle: string): string {
  return normalizeForCompare(formatDishInput(libelle));
}

/** Fiche dont le nom correspond (même clé), s'il y en a une. */
export function trouverFiche(plats: PlatFiche[], libelle: string): PlatFiche | undefined {
  const cle = cleDePlat(libelle);
  if (!cle) return undefined;
  return plats.find((p) => cleDePlat(p.libelle) === cle);
}

/** État d'un plat dans l'onglet Plats, du plus fort au plus faible. */
export type EtatPlat = 'a_eviter' | 'recent' | 'peut_revenir' | 'prevu' | 'idee';

/** Une apparition d'un plat dans le menu d'une invitation. */
export interface ApparitionPlat {
  invitationId: string;
  date: string;
  statut: InvitationStatut;
  course: CourseKey;
  /** « Chez moi » ou « Chez Paul & Julie ». */
  hoteLabel: string;
  convives: string[];
  verdict?: DishVerdict;
}

/** Un plat connu : présent dans des menus, ou seulement dans une fiche (idée). */
export interface PlatConnu {
  cle: string;
  libelle: string;
  services: CourseKey[];
  etat: EtatPlat;
  coupDeCoeur: boolean;
  /** Plus récentes d'abord. */
  apparitions: ApparitionPlat[];
  derniereServie?: ApparitionPlat;
  /** Date de la plus proche invitation prévue qui le contient. */
  prevuLe?: string;
  fiche?: PlatFiche;
  allergenes: string[];
}

/**
 * Répertoire des plats : union, par nom normalisé, des menus de toutes les invitations
 * (prévues et réalisées, tous hôtes) et des fiches. Les menus sont lus, jamais recopiés.
 * Tri : dernière apparition la plus récente d'abord, idées en dernier par ordre alphabétique.
 */
export function repertoirePlats(
  invitations: Invitation[],
  plats: PlatFiche[],
  convivesById: Map<string, Convive>,
  prescriptionMois: number,
  aujourdHui: string
): PlatConnu[] {
  const acc = new Map<string, { libelles: { date: string; libelle: string }[]; apparitions: ApparitionPlat[]; fiche?: PlatFiche }>();
  const entree = (cle: string) => {
    let a = acc.get(cle);
    if (!a) acc.set(cle, (a = { libelles: [], apparitions: [] }));
    return a;
  };

  for (const inv of invitations) {
    for (const course of COURSE_KEYS) {
      const brut = inv.menu[course]?.trim();
      if (!brut) continue;
      const cle = cleDePlat(brut);
      if (!cle) continue;
      const a = entree(cle);
      a.libelles.push({ date: inv.date, libelle: formatDishInput(brut) });
      a.apparitions.push({
        invitationId: inv.id,
        date: inv.date,
        statut: inv.statut,
        course,
        hoteLabel: inv.hoteType === 'moi' ? 'Chez moi' : `Chez ${inv.hoteLabel}`,
        convives: inv.convivesIds.map((id) => convivesById.get(id)?.nomAffiche).filter((n): n is string => Boolean(n)),
        verdict: inv.menuVerdicts?.[course] ?? inv.verdict,
      });
    }
  }
  for (const fiche of plats) {
    const cle = cleDePlat(fiche.libelle);
    if (!cle) continue;
    const a = entree(cle);
    a.fiche ??= fiche;
  }

  const liste: PlatConnu[] = [...acc.entries()].map(([cle, a]) => {
    const apparitions = [...a.apparitions].sort((x, y) => y.date.localeCompare(x.date));
    const derniereServie = apparitions.find((p) => p.statut === 'realisee');
    const prevues = apparitions.filter((p) => p.statut === 'prevue').map((p) => p.date).sort();
    const services = COURSE_KEYS.filter(
      (k) => a.fiche?.services.includes(k) || apparitions.some((p) => p.course === k)
    );
    const libelle = a.fiche
      ? formatDishInput(a.fiche.libelle)
      : [...a.libelles].sort((x, y) => y.date.localeCompare(x.date))[0].libelle;
    let etat: EtatPlat;
    if (apparitions.some((p) => p.verdict === 'a_eviter')) etat = 'a_eviter';
    else if (derniereServie)
      etat = getElapsedTimeInfo(derniereServie.date, aujourdHui).monthsAgo < prescriptionMois ? 'recent' : 'peut_revenir';
    else if (prevues.length > 0) etat = 'prevu';
    else etat = 'idee';
    return {
      cle,
      libelle,
      services,
      etat,
      coupDeCoeur: apparitions.some((p) => p.verdict === 'coup_de_coeur'),
      apparitions,
      derniereServie,
      prevuLe: prevues[0],
      fiche: a.fiche,
      allergenes: a.fiche?.allergenes ?? [],
    };
  });

  return liste.sort((x, y) => {
    const dx = x.apparitions[0]?.date;
    const dy = y.apparitions[0]?.date;
    if (dx && dy) return dy.localeCompare(dx);
    if (dx || dy) return dx ? -1 : 1;
    return x.libelle.localeCompare(y.libelle, 'fr');
  });
}

/** Compteurs des puces de filtre. */
export function compterFiltres(liste: PlatConnu[]): {
  tous: number;
  idees: number;
  coeur: number;
  peut_revenir: number;
  a_eviter: number;
} {
  return {
    tous: liste.length,
    idees: liste.filter((p) => p.etat === 'idee').length,
    coeur: liste.filter((p) => p.coupDeCoeur).length,
    peut_revenir: liste.filter((p) => p.etat === 'peut_revenir').length,
    a_eviter: liste.filter((p) => p.etat === 'a_eviter').length,
  };
}

/** Plats qui contiennent la saisie ; proposer de l'enregistrer s'il n'est pas déjà connu sous ce nom. */
export function rechercherPlats(
  liste: PlatConnu[],
  saisie: string
): { resultats: PlatConnu[]; proposerEnregistrement: boolean } {
  const q = cleDePlat(saisie);
  if (!q) return { resultats: liste, proposerEnregistrement: false };
  return {
    resultats: liste.filter((p) => p.cle.includes(q)),
    proposerEnregistrement: !liste.some((p) => p.cle === q),
  };
}

const MOTS_VIDES = new Set(['de', 'du', 'des', 'a', 'au', 'aux', 'la', 'le', 'les', 'l', 'd', 'et', 'en']);

/** Mots significatifs d'un nom, sans pluriel en -s/-x, triés : « lasagne legume ». */
function signature(cle: string): string {
  return cle
    .split(/[\s']+/)
    .filter((m) => m && !MOTS_VIDES.has(m))
    .map((m) => (m.length > 3 ? m.replace(/[sx]$/, '') : m))
    .sort()
    .join(' ');
}

/** Plat connu « presque identique » (mêmes mots, au pluriel et aux petits mots près), mais pas le même. */
export function platProche(liste: PlatConnu[], saisie: string): PlatConnu | undefined {
  const cle = cleDePlat(saisie);
  const sig = signature(cle);
  if (!sig) return undefined;
  return liste.find((p) => p.cle !== cle && signature(p.cle) === sig);
}

/** Enregistre une fiche ; si le plat a déjà une fiche, la complète (services unis, allergènes remplacés). */
export function enregistrerFiche(
  plats: PlatFiche[],
  entree: { libelle: string; services: CourseKey[]; allergenes: string[] },
  id: string
): PlatFiche[] {
  const cle = cleDePlat(entree.libelle);
  const existante = plats.find((p) => cleDePlat(p.libelle) === cle);
  if (existante) {
    return plats.map((p) =>
      p === existante
        ? {
            ...p,
            services: [...p.services, ...entree.services.filter((s) => !p.services.includes(s))],
            allergenes: entree.allergenes,
          }
        : p
    );
  }
  return [...plats, { id, libelle: formatDishInput(entree.libelle), services: entree.services, allergenes: entree.allergenes }];
}

/** Renomme une idée, sauf si le nouveau nom est déjà celui d'une autre fiche. */
export function renommerIdee(plats: PlatFiche[], id: string, libelle: string): PlatFiche[] | 'existe' {
  const cle = cleDePlat(libelle);
  if (plats.some((p) => p.id !== id && cleDePlat(p.libelle) === cle)) return 'existe';
  return plats.map((p) => (p.id === id ? { ...p, libelle: formatDishInput(libelle) } : p));
}
