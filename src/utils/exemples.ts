/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { createSampleData } from '../services/storage';
import type { AppData } from '../types/models';

interface IdsExemples {
  foyers: ReadonlySet<string>;
  convives: ReadonlySet<string>;
  invitations: ReadonlySet<string>;
}

let cacheIds: IdsExemples | undefined;

/**
 * Identifiants des données d'exemple, dérivés de `createSampleData()` (identifiants fixes).
 * Calculés une seule fois : `resteDesExemples` est appelé à chaque rendu d'`App`.
 */
function idsExemples(): IdsExemples {
  if (!cacheIds) {
    const ex = createSampleData();
    cacheIds = {
      foyers: new Set(ex.foyers.map((f) => f.id)),
      convives: new Set(ex.convives.map((c) => c.id)),
      invitations: new Set(ex.invitations.map((i) => i.id)),
    };
  }
  return cacheIds;
}

/** Vrai s'il reste au moins un foyer, convive ou invitation d'exemple (reconnu par son identifiant). */
export function resteDesExemples(data: AppData): boolean {
  const ids = idsExemples();
  return (
    data.foyers.some((f) => ids.foyers.has(f.id)) ||
    data.convives.some((c) => ids.convives.has(c.id)) ||
    data.invitations.some((i) => ids.invitations.has(i.id))
  );
}

/**
 * Retire les foyers, convives et invitations d'exemple, en conservant les
 * données de l'utilisateur et en nettoyant les références pendantes.
 * Ne modifie pas l'entrée.
 */
export function effacerExemples(data: AppData): AppData {
  const ids = idsExemples();
  return {
    ...data,
    foyers: data.foyers.filter((f) => !ids.foyers.has(f.id)),
    convives: data.convives
      .filter((c) => !ids.convives.has(c.id))
      .map((c) => (c.foyerId && ids.foyers.has(c.foyerId) ? { ...c, foyerId: undefined } : c)),
    invitations: data.invitations
      .filter((i) => !ids.invitations.has(i.id))
      .map((i) => {
        const refExemple =
          (i.hoteRefType === 'foyer' && i.hoteRefId !== undefined && ids.foyers.has(i.hoteRefId)) ||
          (i.hoteRefType === 'convive' && i.hoteRefId !== undefined && ids.convives.has(i.hoteRefId));
        return {
          ...i,
          convivesIds: i.convivesIds.filter((id) => !ids.convives.has(id)),
          ...(refExemple ? { hoteRefType: undefined, hoteRefId: undefined } : {}),
        };
      }),
  };
}
