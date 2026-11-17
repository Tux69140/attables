/*
 * Copyright (C) 2026 Stéphane MICHEL
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { ICONES } from '../../src/icones/donnees.ts';
import { type ElementSvg, serialiserSvg } from '../../src/icones/nettoyer.ts';

const ICONE = /<svg\b([^>]*?)\sdata-icone="([^"]+)"([^>]*)>\s*<\/svg>/g;

/**
 * Remplace chaque `<svg data-icone="nom" …></svg>` par le pictogramme partagé avec l'appli
 * (src/icones/), en gardant ses autres attributs (classe, aria-hidden…).
 */
export function remplacerIcones(html: string): string {
  return html.replace(ICONE, (_tout, avant: string, nom: string, apres: string) => {
    const elements = (ICONES as Record<string, ElementSvg[]>)[nom];
    if (!elements) throw new Error(`Icône inconnue : ${nom}`);
    const attributs: Record<string, string> = {};
    for (const [, cle, valeur] of `${avant} ${apres}`.matchAll(/([\w:-]+)="([^"]*)"/g)) attributs[cle] = valeur;
    return serialiserSvg(elements, attributs);
  });
}
