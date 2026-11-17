/*
 * Copyright (C) 2026 Stéphane MICHEL
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lireNotes, notesEnHtml, versionDepuisCode } from './notes';

function dossierAvec(fichiers: Record<string, string>): string {
  const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'notes-'));
  for (const [nom, contenu] of Object.entries(fichiers)) {
    fs.writeFileSync(path.join(dossier, nom), contenu);
  }
  return dossier;
}

test('versionDepuisCode convertit le versionCode', () => {
  assert.equal(versionDepuisCode(2000), '0.2.0');
  assert.equal(versionDepuisCode(1001), '0.1.1');
  assert.equal(versionDepuisCode(1002003), '1.2.3');
});

test('lireNotes ignore les copies F-Droid par ABI (10 × code + 1 ou 2)', () => {
  const dossier = dossierAvec({ '2001.txt': '• a', '20011.txt': '• a', '20012.txt': '• a', '2000.txt': '• b' });
  assert.deepEqual(lireNotes(dossier).map((n) => n.version), ['0.2.1', '0.2.0']);
});

test('lireNotes garde un code en 1 ou 2 dont le contenu diffère du fichier de base', () => {
  const dossier = dossierAvec({ '2000.txt': '• b', '20001.txt': '• autre', '20002.txt': '• b' });
  assert.deepEqual(lireNotes(dossier).map((n) => n.version), ['0.20.1', '0.2.0']);
});

test('lireNotes trie par code numérique décroissant et ignore les autres fichiers', () => {
  const dossier = dossierAvec({
    '1001.txt': '• a',
    '2000.txt': '• b',
    '10000.txt': '• c',
    '9000.txt': '• d',
    'notes.md': '• ignoré',
  });
  assert.deepEqual(lireNotes(dossier).map((n) => n.code), [10000, 9000, 2000, 1001]);
});

test('lireNotes retire l’en-tête de version, les puces et les lignes vides', () => {
  const dossier = dossierAvec({ '2000.txt': 'Version 0.2.0 :\n• Un\n\n•  Deux  \r\n' });
  const [note] = lireNotes(dossier);
  assert.equal(note.version, '0.2.0');
  assert.deepEqual(note.lignes, ['Un', 'Deux']);
});

test('notesEnHtml échappe le texte et titre chaque version', () => {
  const html = notesEnHtml([{ code: 2000, version: '0.2.0', lignes: ['Sel & poivre <b>'] }]);
  assert.match(html, /<h2>Version 0\.2\.0<\/h2>/);
  assert.match(html, /<li>Sel &amp; poivre &lt;b&gt;<\/li>/);
});

test('lireNotes garde les lignes sans puce et accepte les puces - et *', () => {
  const dossier = dossierAvec({ '1000.txt': 'Version 1 :\n- tiret\nPhrase libre\n* étoile' });
  assert.deepEqual(lireNotes(dossier)[0].lignes, ['tiret', 'Phrase libre', 'étoile']);
});

test('lireNotes écarte les deux variantes d’en-tête', () => {
  const dossier = dossierAvec({
    '1001.txt': 'Version initiale 0.1.1 :\n• a',
    '2000.txt': 'Version 0.2.0 :\n• b',
  });
  assert.deepEqual(lireNotes(dossier).map((n) => n.lignes), [['b'], ['a']]);
});

test('lireNotes échoue si un fichier ne contient que l’en-tête', () => {
  const dossier = dossierAvec({ '3000.txt': 'Version 0.3.0 :\n' });
  assert.throws(() => lireNotes(dossier), /3000\.txt/);
});
