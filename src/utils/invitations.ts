/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
  COURSE_KEYS,
  type CourseKey,
  type DishVerdict,
  type HoteType,
  type Invitation,
  type InvitationStatut,
  type MenuCourses,
} from '../types/models';
import { formatDishInput } from './dishes';

/** Ce que l'éditeur tient en cours de saisie, avant d'en faire une invitation. */
export interface ChampsInvitation {
  date: string;
  titre: string;
  note: string;
  hoteType: HoteType;
  hoteLabel: string;
  hoteRefType?: 'foyer' | 'convive';
  hoteRefId?: string;
  convivesIds: string[];
  menu: MenuCourses;
  verdict?: DishVerdict;
  menuVerdicts?: Partial<Record<CourseKey, DishVerdict>>;
}

/**
 * Invitation que l'éditeur enregistrerait. Les convives absents de `idsConnus` (par exemple une
 * personne créée depuis l'éditeur puis annulée) sont écartés.
 */
export function construireInvitation(
  champs: ChampsInvitation,
  id: string,
  statut: InvitationStatut,
  idsConnus: ReadonlySet<string>,
  aujourdhui = '',
): Invitation {
  const menu: MenuCourses = {};
  const verdicts: Partial<Record<CourseKey, DishVerdict>> = {};
  for (const k of COURSE_KEYS) {
    const formate = formatDishInput(champs.menu[k] ?? '');
    if (formate) {
      menu[k] = formate;
      const v = champs.menuVerdicts?.[k];
      if (v) verdicts[k] = v;
    }
  }
  return {
    id,
    statut,
    date: champs.date || aujourdhui,
    titre: champs.titre.trim() || undefined,
    note: champs.note.trim() || undefined,
    hoteType: champs.hoteType,
    hoteLabel: champs.hoteType === 'moi' ? 'Moi' : champs.hoteLabel.trim() || 'Hôte extérieur',
    hoteRefType: champs.hoteType === 'autre' ? champs.hoteRefType : undefined,
    hoteRefId: champs.hoteType === 'autre' ? champs.hoteRefId : undefined,
    convivesIds: champs.convivesIds.filter((c) => idsConnus.has(c)),
    menu,
    verdict: champs.verdict,
    menuVerdicts: Object.keys(verdicts).length > 0 ? verdicts : undefined,
  };
}

/** Aucun convive, aucun plat, ni titre ni note : rien à garder. */
export function invitationVide(inv: Invitation): boolean {
  return (
    inv.convivesIds.length === 0 &&
    !inv.titre?.trim() &&
    !inv.note?.trim() &&
    COURSE_KEYS.every((k) => !inv.menu[k]?.trim())
  );
}

function empreinte(inv: Invitation): string {
  const { id: _id, ...contenu } = inv;
  return JSON.stringify(
    { ...contenu, convivesIds: [...inv.convivesIds].sort() },
    (_cle, valeur: unknown) => {
      if (valeur && typeof valeur === 'object' && !Array.isArray(valeur)) {
        return Object.fromEntries(
          Object.entries(valeur as Record<string, unknown>)
            .filter(([, v]) => v !== undefined)
            .sort(([a], [b]) => (a < b ? -1 : 1)),
        );
      }
      return valeur;
    },
  );
}

/** Même contenu (identifiant ignoré, ordre des convives sans effet). */
export function memeInvitation(a: Invitation, b: Invitation): boolean {
  return empreinte(a) === empreinte(b);
}
