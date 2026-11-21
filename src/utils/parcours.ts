/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import type { AppData } from '../types/models';

/**
 * Parcours guidé du premier usage, déduit des données (rien n'est mémorisé) :
 * ① des proches, ② une invitation, ③ une invitation réalisée.
 */
export interface EtatParcours {
  proches: boolean;
  invitation: boolean;
  realisee: boolean;
  /** Première étape non faite, ou null quand tout est fait. */
  etapeCourante: 1 | 2 | 3 | null;
  /** Carte complète tant qu'il n'y a aucune invitation, puis une ligne jusqu'à la première invitation réalisée. */
  affichage: 'complet' | 'ligne' | 'aucun';
}

export function etatParcours(data: Pick<AppData, 'convives' | 'invitations'>): EtatParcours {
  const proches = data.convives.length > 0;
  const invitation = data.invitations.length > 0;
  const realisee = data.invitations.some((i) => i.statut === 'realisee');
  const etapeCourante = !proches ? 1 : !invitation ? 2 : !realisee ? 3 : null;
  const affichage = !invitation ? 'complet' : !realisee ? 'ligne' : 'aucun';
  return { proches, invitation, realisee, etapeCourante, affichage };
}

/** « Famille Martin et Nadia sont parmi vos convives. » : foyers habités, puis personnes sans foyer. */
export function resumeProches(data: Pick<AppData, 'foyers' | 'convives'>): string {
  const foyersHabites = data.foyers.filter((f) => data.convives.some((c) => c.foyerId === f.id));
  const idsFoyers = new Set(data.foyers.map((f) => f.id));
  const seuls = data.convives.filter((c) => !c.foyerId || !idsFoyers.has(c.foyerId));
  const noms = [...foyersHabites.map((f) => f.nom), ...seuls.map((c) => c.nomAffiche)];
  if (noms.length === 0) return '';
  const verbe = noms.length === 1 ? 'est' : 'sont';
  let liste: string;
  if (noms.length <= 2) liste = noms.join(' et ');
  else {
    const reste = noms.length - 2;
    liste = `${noms[0]}, ${noms[1]} et ${reste} autre${reste > 1 ? 's' : ''}`;
  }
  return `${liste} ${verbe} parmi vos convives.`;
}
