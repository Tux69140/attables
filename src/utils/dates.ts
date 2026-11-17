/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import type { Invitation } from '../types/models';

/** Jour civil (YYYY-MM-DD) en millisecondes UTC : écarts exacts, insensibles aux changements d'heure. */
function jourUtc(dateIso: string): number {
  const [y, m, d] = dateIso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

const ecartJours = (dateIso: string, aujourdHui: string): number =>
  Math.round((jourUtc(dateIso) - jourUtc(aujourdHui)) / 86_400_000);

/** « aujourd’hui », « demain », « dans 11 jours », « hier », « il y a 2 jours ». */
export function delaiRelatif(dateIso: string, aujourdHui: string): string {
  const n = ecartJours(dateIso, aujourdHui);
  if (n === 0) return 'aujourd’hui';
  if (n === 1) return 'demain';
  if (n === -1) return 'hier';
  return n > 0 ? `dans ${n} jours` : `il y a ${-n} jours`;
}

/** Repas prévu dont le jour est arrivé : on propose de le passer en réalisé. */
export function estAMarquer(inv: Invitation, aujourdHui: string): boolean {
  return inv.statut === 'prevue' && inv.date <= aujourdHui;
}

/** Ordre de l'onglet « À venir » : à marquer (plus anciennes d'abord), puis futures par date croissante. */
export function trierAVenir(invitations: Invitation[], aujourdHui: string): Invitation[] {
  return [...invitations].sort((a, b) => {
    const aa = estAMarquer(a, aujourdHui) ? 0 : 1;
    const bb = estAMarquer(b, aujourdHui) ? 0 : 1;
    return aa - bb || a.date.localeCompare(b.date);
  });
}

const formatCourt = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

/** « sam. 28 nov. » */
export function formatDateCourte(dateIso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return dateIso;
  return formatCourt.format(new Date(jourUtc(dateIso)));
}

const formatJM = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** « 18 oct. », ou « 14 avr. 2025 » quand l'année n'est pas celle d'aujourd'hui. */
export function formatJourMois(dateIso: string, aujourdHui: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return dateIso;
  const jm = formatJM.format(new Date(jourUtc(dateIso)));
  return dateIso.slice(0, 4) === aujourdHui.slice(0, 4) ? jm : `${jm} ${dateIso.slice(0, 4)}`;
}

/** Mois restant avant de pouvoir resservir un plat servi le `dateIso` (au moins 1). */
export function moisAvantRetour(dateIso: string, prescriptionMois: number, aujourdHui: string): number {
  const [y, m, d] = dateIso.split('-').map(Number);
  const fin = Date.UTC(y, m - 1 + prescriptionMois, d);
  return Math.max(1, Math.round((fin - jourUtc(aujourdHui)) / (86_400_000 * 30.44)));
}
