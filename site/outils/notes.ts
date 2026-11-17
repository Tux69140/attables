/*
 * Copyright (C) 2026 Stéphane MICHEL
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import fs from 'node:fs';
import path from 'node:path';

export interface NoteDeVersion {
  code: number;
  version: string;
  lignes: string[];
}

// versionCode Tauri : majeure × 1 000 000 + mineure × 1 000 + correctif.
export function versionDepuisCode(code: number): string {
  const majeure = Math.floor(code / 1_000_000);
  const mineure = Math.floor((code % 1_000_000) / 1_000);
  const correctif = code % 1_000;
  return `${majeure}.${mineure}.${correctif}`;
}

// Lit `<code>.txt`, ignore tout autre fichier, trie du plus récent au plus ancien.
// Seul l'en-tête « Version … : » est écarté (la page affiche déjà la version en titre) ;
// toute autre ligne est gardée, puce « • », « - » ou « * » retirée. Un fichier vide fait échouer le build.
//
// Copies F-Droid : pour une construction par ABI, F-Droid cherche `changelogs/<10 × code + 1>.txt`
// et `<10 × code + 2>.txt` (voir F_DROID.md), copies de `<code>.txt`. Elles ne sont pas des versions :
// un code N qui finit par 1 ou 2 est ignoré seulement si `floor(N / 10).txt` existe et a exactement
// le même contenu ; sinon N est une version à part entière (20001 = 0.20.1, distinct de 2000).
export function lireNotes(dossier: string): NoteDeVersion[] {
  const noms = fs.readdirSync(dossier).filter((nom) => /^\d+\.txt$/.test(nom));
  const contenus = new Map(
    noms.map((nom) => [Number.parseInt(nom, 10), fs.readFileSync(path.join(dossier, nom), 'utf8')]),
  );
  const copieFdroid = (code: number): boolean =>
    [1, 2].includes(code % 10) && contenus.get(Math.floor(code / 10)) === contenus.get(code);
  return [...contenus]
    .filter(([code]) => !copieFdroid(code))
    .map(([code, contenu]) => {
      const nom = `${code}.txt`;
      const toutes = contenu
        .split(/\r?\n/)
        .map((ligne) => ligne.trim())
        .filter((ligne) => ligne !== '');
      if (toutes.length > 0 && /^Version\b.*:\s*$/i.test(toutes[0])) toutes.shift();
      const lignes = toutes
        .map((ligne) => ligne.replace(/^[•*-]\s*/, '').trim())
        .filter((ligne) => ligne !== '');
      if (lignes.length === 0) throw new Error(`Notes de version vides : ${nom}`);
      return { code, version: versionDepuisCode(code), lignes };
    })
    .sort((a, b) => b.code - a.code);
}

const echapper = (texte: string): string =>
  texte
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function notesEnHtml(notes: NoteDeVersion[]): string {
  return notes
    .map(
      (note) =>
        `<article class="note-version">\n<h2>Version ${echapper(note.version)}</h2>\n<ul>\n${note.lignes
          .map((ligne) => `<li>${echapper(ligne)}</li>`)
          .join('\n')}\n</ul>\n</article>`,
    )
    .join('\n');
}
