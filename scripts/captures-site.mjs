/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Captures réelles de l'appli (données d'exemple, thème clair) pour le site.
 * Usage : pnpm site:captures
 */
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const sortie = join(racine, 'site', 'public', 'captures');
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const webp = spawnSync('cwebp', ['-version']).status === 0;
const ext = webp ? 'webp' : 'png';

function portLibre() {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

async function attendreServeur(url) {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      /* pas encore prêt */
    }
    await pause(300);
  }
  throw new Error(`Serveur Vite injoignable : ${url}`);
}

const port = await portLibre();
const vite = spawn('pnpm', ['exec', 'vite', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], {
  cwd: racine,
  stdio: 'ignore',
});
let navigateur;
try {
  const url = `http://127.0.0.1:${port}/`;
  await attendreServeur(url);
  await mkdir(sortie, { recursive: true });

  navigateur = await chromium.launch();
  const contexte = await navigateur.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    colorScheme: 'light',
    locale: 'fr-FR',
    reducedMotion: 'no-preference',
  });
  const page = await contexte.newPage();

  async function capturer(nom) {
    await pause(700);
    const fichier = join(sortie, `${nom}.png`);
    await page.screenshot({ path: fichier });
    if (webp) {
      const r = spawnSync('cwebp', ['-q', '90', fichier, '-o', join(sortie, `${nom}.webp`)]);
      if (r.status !== 0) throw new Error(`cwebp a échoué pour ${nom}`);
      spawnSync('rm', [fichier]);
    }
  }

  // Premier lancement : présentation, porte « exemples », puis bandeau masqué.
  await page.goto(url);
  await page.getByRole('button', { name: 'Passer' }).click();
  await pause(600);
  await page.getByRole('button', { name: /Visiter avec des exemples/ }).click();
  await page.getByRole('button', { name: 'Masquer', exact: true }).click();

  await page.getByRole('navigation', { name: 'Navigation principale' }).getByText('Convives').click();
  await capturer('convives');
  await page.getByText('Paul', { exact: true }).first().click();
  await capturer('memoire');
  await page.getByRole('button', { name: /fermer/i }).first().click().catch(() => {});
  await page.reload();
  await page.getByRole('button', { name: 'Masquer', exact: true }).click();
  await page.getByText('Dîner d’automne').first().click();
  await pause(800);
  await page.mouse.move(200, 500);
  await page.mouse.wheel(0, 200);
  await page.mouse.move(2, 400);
  await capturer('invitation');
  console.log(`Captures enregistrées dans ${sortie} (.${ext})`);
} finally {
  await navigateur?.close();
  vite.kill('SIGTERM');
}
