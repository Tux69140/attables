/*
 * Copyright (C) 2026 Stéphane MICHEL
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

// Première ligne utile (ni vide ni commentaire) : 64 hex → « 19:33:24:… » en majuscules.
export function lireEmpreinteCertificat(texte: string): string {
  const ligne = texte
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l !== '' && !l.startsWith('#'));
  if (!ligne || !/^[0-9a-fA-F]{64}$/.test(ligne)) {
    throw new Error('Empreinte du certificat illisible : 64 caractères hexadécimaux attendus');
  }
  return ligne.toUpperCase().match(/../g)!.join(':');
}

export function infosApk(chemin: string): { sha256: string; octets: number } {
  return infosContenu(readFileSync(chemin));
}

function infosContenu(contenu: Buffer): { sha256: string; octets: number } {
  return { sha256: createHash('sha256').update(contenu).digest('hex'), octets: contenu.length };
}

// Format français, une décimale, base 1 048 576, espace insécable avant « Mo ».
export function tailleLisible(octets: number): string {
  const mo = (octets / 1048576).toFixed(1).replace('.', ',');
  return `${mo} Mo`;
}

export interface OptionsApk {
  version: string;
  /** Dossier contenant attables-<version>.apk et attables-<version>-32bits.apk (défaut : dist-android du dépôt). */
  dossierApk: string;
  /** Fichier d'empreinte du certificat de signature. */
  fichierEmpreinte: string;
}

const FACTICE = '(APK non construit)';
const NOMS = ['APK_VERSION', 'APK_FICHIER', 'APK_TAILLE', 'APK_SHA256', 'APK32_FICHIER', 'APK32_TAILLE', 'APK32_SHA256', 'CERT_SHA256'];

export function pluginApk(options: OptionsApk): Plugin {
  const { version, dossierApk, fichierEmpreinte } = options;
  // 64 bits (bouton principal) puis 32 bits (secours).
  const fichier = `attables-${version}.apk`;
  const fichier32 = `attables-${version}-32bits.apk`;
  let remplacements: Record<string, string> = {};
  let apkEmis: { nom: string; octets: Buffer }[] = [];
  let commande: 'build' | 'serve' = 'serve';

  return {
    name: 'attables-apk',
    config(_, env) {
      commande = env.command;
    },
    buildStart() {
      const certificat = lireEmpreinteCertificat(readFileSync(fichierEmpreinte, 'utf8'));
      const factice = commande === 'serve' || process.env.SITE_APK_FACTICE === '1';
      apkEmis = [];
      if (factice) {
        remplacements = {
          APK_VERSION: version,
          APK_FICHIER: fichier,
          APK_TAILLE: FACTICE,
          APK_SHA256: FACTICE,
          APK32_FICHIER: fichier32,
          APK32_TAILLE: FACTICE,
          APK32_SHA256: FACTICE,
          CERT_SHA256: certificat,
        };
        return;
      }
      for (const nom of [fichier, fichier32]) {
        const chemin = join(dossierApk, nom);
        if (!existsSync(chemin)) {
          throw new Error(`APK absent : lancer scripts/fabriquer-apk.sh (${chemin} introuvable)`);
        }
        apkEmis.push({ nom, octets: readFileSync(chemin) });
      }
      const [i64, i32] = apkEmis.map(({ octets }) => infosContenu(octets));
      remplacements = {
        APK_VERSION: version,
        APK_FICHIER: fichier,
        APK_TAILLE: tailleLisible(i64.octets),
        APK_SHA256: i64.sha256,
        APK32_FICHIER: fichier32,
        APK32_TAILLE: tailleLisible(i32.octets),
        APK32_SHA256: i32.sha256,
        CERT_SHA256: certificat,
      };
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace(new RegExp(`%(${NOMS.join('|')})%`, 'g'), (_, nom: string) => remplacements[nom] ?? '');
      },
    },
    generateBundle() {
      for (const { nom, octets } of apkEmis) {
        this.emitFile({ type: 'asset', fileName: `telechargement/${nom}`, source: octets });
      }
    },
  };
}
