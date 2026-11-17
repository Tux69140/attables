/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import type { CourseKey } from '../types/models';
import type { NomIcone } from './donnees';

/** Pictogramme de chaque service du menu. */
export const ICONE_SERVICE: Record<CourseKey, NomIcone> = {
  apero: 'martini',
  entree: 'salad',
  plat: 'cooking-pot',
  fromage: 'cheese',
  dessert: 'cake-slice',
};
