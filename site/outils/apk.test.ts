/*
 * Copyright (C) 2026 Stéphane MICHEL
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { infosApk, lireEmpreinteCertificat, tailleLisible } from './apk';

test('empreinte du fichier réel du dépôt', () => {
  const texte = readFileSync(new URL('../../src-tauri/empreinte-cle-android.txt', import.meta.url), 'utf8');
  const e = lireEmpreinteCertificat(texte);
  assert.ok(e.startsWith('19:33:24:A6'));
  assert.match(e, /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
});

test('empreinte : commentaires et lignes vides ignorés, hex invalide refusé', () => {
  assert.equal(lireEmpreinteCertificat('# c\n\n' + 'ab'.repeat(32)), Array(32).fill('AB').join(':'));
  assert.throws(() => lireEmpreinteCertificat('# seulement un commentaire'));
  assert.throws(() => lireEmpreinteCertificat('abcd'));
});

test('infosApk : sha256 et taille', () => {
  const f = join(mkdtempSync(join(tmpdir(), 'apk-')), 'x.apk');
  writeFileSync(f, 'abc');
  assert.deepEqual(infosApk(f), {
    sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    octets: 3,
  });
});

test('tailleLisible : format français avec espace insécable', () => {
  assert.equal(tailleLisible(13625344), '13,0 Mo');
  assert.equal(tailleLisible(1572864), '1,5 Mo');
  assert.equal(tailleLisible(0), '0,0 Mo');
});

test('pluginApk : deux APK présents → remplacements et copies émises ; l\'un absent → erreur explicite', async () => {
  const { pluginApk } = await import('./apk');
  const dossier = mkdtempSync(join(tmpdir(), 'apk-'));
  const empreinte = join(dossier, 'e.txt');
  writeFileSync(empreinte, '# c\n' + 'ab'.repeat(32));
  const creer = () => {
    const p = pluginApk({ version: '9.9.9', dossierApk: dossier, fichierEmpreinte: empreinte }) as any;
    p.config({}, { command: 'build' });
    return p;
  };
  assert.throws(() => creer().buildStart(), /APK absent : lancer scripts\/fabriquer-apk\.sh/);

  writeFileSync(join(dossier, 'attables-9.9.9.apk'), 'abc');
  assert.throws(() => creer().buildStart(), /attables-9\.9\.9-32bits\.apk introuvable/);

  writeFileSync(join(dossier, 'attables-9.9.9-32bits.apk'), 'abcd');
  const p = creer();
  p.buildStart();
  const html = p.transformIndexHtml.handler(
    '%APK_VERSION%|%APK_FICHIER%|%APK_TAILLE%|%APK_SHA256%|%APK32_FICHIER%|%APK32_TAILLE%|%APK32_SHA256%|%CERT_SHA256%',
  );
  assert.equal(
    html,
    [
      '9.9.9',
      'attables-9.9.9.apk',
      '0,0\u00a0Mo',
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      'attables-9.9.9-32bits.apk',
      '0,0\u00a0Mo',
      createHash('sha256').update('abcd').digest('hex'),
      Array(32).fill('AB').join(':'),
    ].join('|'),
  );
  const emis: any[] = [];
  p.generateBundle.call({ emitFile: (f: any) => emis.push(f) });
  assert.deepEqual(emis.map((f) => f.fileName), ['telechargement/attables-9.9.9.apk', 'telechargement/attables-9.9.9-32bits.apk']);
  assert.equal(emis[0].source.toString(), 'abc');
  assert.equal(emis[1].source.toString(), 'abcd');
});

test('pluginApk : mode factice → valeurs factices pour les deux, rien d\'émis', async () => {
  const { pluginApk } = await import('./apk');
  const dossier = mkdtempSync(join(tmpdir(), 'apk-'));
  const empreinte = join(dossier, 'e.txt');
  writeFileSync(empreinte, 'ab'.repeat(32));
  process.env.SITE_APK_FACTICE = '1';
  try {
    const p = pluginApk({ version: '9.9.9', dossierApk: dossier, fichierEmpreinte: empreinte }) as any;
    p.config({}, { command: 'build' });
    p.buildStart();
    assert.equal(
      p.transformIndexHtml.handler('%APK_TAILLE%|%APK32_TAILLE%|%APK32_SHA256%|%APK32_FICHIER%'),
      '(APK non construit)|(APK non construit)|(APK non construit)|attables-9.9.9-32bits.apk',
    );
    const emis: any[] = [];
    p.generateBundle.call({ emitFile: (f: any) => emis.push(f) });
    assert.equal(emis.length, 0);
  } finally {
    delete process.env.SITE_APK_FACTICE;
  }
});
