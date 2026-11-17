/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import type { PlatFiche } from '../types/models';
import { formatDishInput, normalizeForCompare } from './dishes';

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
