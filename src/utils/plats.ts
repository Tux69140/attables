/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
  COURSE_KEYS,
  type ContrainteConvive,
  type Convive,
  type CourseKey,
  type DishVerdict,
  type Invitation,
  type InvitationStatut,
  type PlatFiche,
} from '../types/models';
import { allergeneDeReference, estAutre, libelleAutre } from './allergenes';
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

/**
 * Plat dont la fiche est ouverte : suivi par l'identifiant de sa fiche quand il en a une (un renommage,
 * ou son « Annuler », change sa clé mais pas sa fiche), sinon par sa clé de nom.
 */
export interface PlatSuivi {
  cle: string;
  ficheId?: string;
}

export function suivrePlat(plat: PlatConnu): PlatSuivi {
  return plat.fiche ? { cle: plat.cle, ficheId: plat.fiche.id } : { cle: plat.cle };
}

/** Le plat suivi dans le répertoire : par sa fiche, sinon par sa clé ; null s'il a disparu. */
export function retrouverPlat(liste: PlatConnu[], suivi: PlatSuivi | null): PlatConnu | null {
  if (!suivi) return null;
  return (
    (suivi.ficheId !== undefined ? liste.find((p) => p.fiche?.id === suivi.ficheId) : undefined) ??
    liste.find((p) => p.cle === suivi.cle) ??
    null
  );
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

/**
 * Plats qui contiennent la saisie, puis ceux dont les mots retrouvent chacun des mots saisis (début de
 * mot, dans n'importe quel ordre, une faute de frappe tolérée) ; proposer de l'enregistrer s'il n'est
 * pas déjà connu sous ce nom.
 */
export function rechercherPlats(
  liste: PlatConnu[],
  saisie: string
): { resultats: PlatConnu[]; proposerEnregistrement: boolean } {
  const q = cleDePlat(saisie);
  if (!q) return { resultats: liste, proposerEnregistrement: false };
  const motsQ = mots(q);
  const exacts = liste.filter((p) => p.cle.includes(q));
  const approches = motsQ.length > 0 ? liste.filter((p) => !p.cle.includes(q) && fautes(motsQ, mots(p.cle)) >= 0) : [];
  return {
    resultats: [...exacts, ...approches],
    proposerEnregistrement: !liste.some((p) => p.cle === q),
  };
}

const MOTS_VIDES = new Set(['de', 'du', 'des', 'a', 'au', 'aux', 'la', 'le', 'les', 'l', 'd', 'et', 'en']);

/** Mots significatifs d'une clé de plat, dans l'ordre et sans pluriel en -s/-x : « veloute potimarron verrine ». */
function mots(cle: string): string[] {
  return cle
    .split(/[\s']+/)
    .filter((m) => m && !MOTS_VIDES.has(m))
    .map((m) => (m.length > 3 ? m.replace(/[sx]$/, '') : m));
}

/** Distance d'édition : lettre ajoutée, retirée, remplacée, ou deux lettres voisines inversées. */
function distance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/**
 * Mot saisi retrouvé dans un mot du plat : 0 s'il en est le début, 1 avec une faute de frappe, -1 sinon.
 * La faute n'est tolérée qu'à partir de 7 lettres et avec la même première lettre : en deçà, trop de
 * plats différents sont à une lettre l'un de l'autre (crème/crêpe, bœuf/œuf, poule/moule).
 */
function correspondanceMot(q: string, w: string): number {
  if (w.startsWith(q)) return 0;
  if (q.length < 7 || q[0] !== w[0]) return -1;
  for (const n of [q.length - 1, q.length, q.length + 1]) {
    if (n <= w.length && distance(q, w.slice(0, n)) <= 1) return 1;
  }
  return -1;
}

/** Nombre de fautes de frappe pour retrouver chaque mot saisi dans le plat, ou -1 si l'un n'y est pas. */
function fautes(motsSaisie: string[], motsPlat: string[]): number {
  let total = 0;
  for (const q of motsSaisie) {
    let meilleur = -1;
    for (const w of motsPlat) {
      const c = correspondanceMot(q, w);
      if (c === 0) {
        meilleur = 0;
        break;
      }
      if (c === 1) meilleur = 1;
    }
    if (meilleur < 0) return -1;
    total += meilleur;
  }
  return total;
}

/** Mots significatifs d'un nom, sans pluriel en -s/-x, triés : « lasagne legume ». */
function signature(cle: string): string {
  return mots(cle).sort().join(' ');
}

/**
 * Plats connus qui ressemblent au nom tapé, sans être le même, du plus proche au moins proche
 * (`max` au plus) : d'abord ceux qui ont les mêmes mots (au pluriel et aux petits mots près), puis
 * ceux qui contiennent tous les mots tapés (début de mot, une faute de frappe tolérée par mot), le
 * moins de fautes puis le moins de mots en plus d'abord, enfin ceux dont tous les mots sont des mots
 * du nom tapé. Rien sous 4 lettres tapées.
 */
export function platsProches(liste: PlatConnu[], saisie: string, max = 5): PlatConnu[] {
  const cle = cleDePlat(saisie);
  const sig = signature(cle);
  if (!sig) return [];
  const motsQ = mots(cle);
  const partiel = motsQ.join('').length >= 4;
  const notes: { plat: PlatConnu; score: number }[] = [];
  for (const p of liste) {
    if (p.cle === cle) continue;
    if (signature(p.cle) === sig) {
      notes.push({ plat: p, score: -1 });
      continue;
    }
    if (!partiel) continue;
    const motsP = mots(p.cle);
    const f = fautes(motsQ, motsP);
    if (f >= 0) {
      notes.push({ plat: p, score: f * 100 + (motsP.length - motsQ.length) });
      continue;
    }
    // Plat connu contenu dans le nom tapé, en mots entiers (« Potimarron farci » pour « Potimarron farci
    // au four », mais pas « Pot-au-feu » pour « Potée aux feuilles ») : après les autres.
    if (motsP.join('').length >= 4 && motsP.every((w) => motsQ.includes(w))) {
      notes.push({ plat: p, score: 1000 + (motsQ.length - motsP.length) });
    }
  }
  return notes
    .sort((a, b) => a.score - b.score)
    .slice(0, max)
    .map((n) => n.plat);
}

/** Ce que la feuille d'une fiche de plat saisit. */
export interface ValeursPlat {
  libelle: string;
  services: CourseKey[];
  allergenes: string[];
  /** « Aucun de ces allergènes » : n'est gardé que si `allergenes` est vide. */
  sansAllergene: boolean;
}

/** Vrai quand les allergènes du plat ont été renseignés : au moins un coché, ou « Aucun de ces allergènes ». */
export function allergenesRenseignes(fiche: PlatFiche | undefined): boolean {
  return Boolean(fiche && (fiche.allergenes.length > 0 || fiche.sansAllergene));
}

/**
 * Vrai quand un plat saisi, servi à une tablée qui compte une allergie (`allergiesTablee` : ses éléments `strict`),
 * n'a pas ses allergènes renseignés. « Aucun de ces allergènes » ne vaut pas pour un aliment libre de la tablée
 * (Kiwi…) : il n'était peut-être pas dans la grille quand le plat a été marqué.
 */
export function aVerifier(valeurPlat: string, fiche: PlatFiche | undefined, allergiesTablee: ContrainteConvive[]): boolean {
  if (valeurPlat.trim() === '' || !allergiesTablee.some((e) => e.niveau === 'strict')) return false;
  if (!allergenesRenseignes(fiche)) return true;
  const allergieLibre = allergiesTablee.some(
    (e) => e.niveau === 'strict' && e.allergenes.some((a) => estAutre(a) && !allergeneDeReference(libelleAutre(a)))
  );
  return Boolean(fiche?.sansAllergene) && allergieLibre;
}

/** Enregistre une fiche ; si le plat a déjà une fiche, la complète (services unis, allergènes remplacés). */
export function enregistrerFiche(plats: PlatFiche[], entree: ValeursPlat, id: string): PlatFiche[] {
  const cle = cleDePlat(entree.libelle);
  const aucun = entree.sansAllergene && entree.allergenes.length === 0;
  const existante = plats.find((p) => cleDePlat(p.libelle) === cle);
  if (existante) {
    return plats.map((p) => {
      if (p !== existante) return p;
      const { sansAllergene: _ancien, ...reste } = p;
      return {
        ...reste,
        services: [...p.services, ...entree.services.filter((s) => !p.services.includes(s))],
        allergenes: entree.allergenes,
        ...(aucun ? { sansAllergene: true } : {}),
      };
    });
  }
  return [
    ...plats,
    {
      id,
      libelle: formatDishInput(entree.libelle),
      services: entree.services,
      allergenes: entree.allergenes,
      ...(aucun ? { sansAllergene: true } : {}),
    },
  ];
}

/** Renomme une idée, sauf si le nouveau nom est déjà celui d'une autre fiche. */
export function renommerIdee(plats: PlatFiche[], id: string, libelle: string): PlatFiche[] | 'existe' {
  const cle = cleDePlat(libelle);
  if (plats.some((p) => p.id !== id && cleDePlat(p.libelle) === cle)) return 'existe';
  return plats.map((p) => (p.id === id ? { ...p, libelle: formatDishInput(libelle) } : p));
}
