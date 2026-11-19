# Site de présentation d'Attablés — plan de réalisation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** publier `https://attables.biovibralyon.fr/` (accueil, démo, APK 0.2.0 vérifiable, notes de version, pages légales, hébergement durci) et sortir l'appli 0.2.0 (mode démo, nappe, bandeau des exemples, lien « Notes de version »).

**Architecture :** l'appli reçoit un mode de build `demo` et quelques ajouts d'interface ; un site Vite multi-page vit dans `site/` du même dépôt et se construit dans `dist-site/` (la démo dans `dist-site/demo/`) ; deux plugins Vite du site injectent les notes de version (depuis les changelogs fastlane) et les informations de l'APK ; les pages légales sont fabriquées par `~/Documents/Textes-legaux` ; un script rsync déploie et vérifie.

**Tech Stack :** React 19 + Vite 8 + Tailwind v4 (appli), Vite multi-page + TypeScript sans framework (site), Tauri v2 + `tauri-plugin-opener`, `node:test` via `tsx`, Playwright (captures), Apache `.htaccess` (o2switch).

**Spec :** `docs/superpowers/specs/2026-11-13-site-presentation-design.md`

## Global Constraints

- Tout texte d'interface et de site en français ; en-tête GPL (`Copyright (C) 2026 Stéphane MICHEL` + `SPDX-License-Identifier: GPL-3.0-or-later`) sur chaque nouveau fichier source.
- pnpm uniquement (`packageManager: pnpm@10.33.4`), pas de `package-lock.json`.
- Aucun appel réseau tiers, ni dans l'appli ni sur le site (polices `@fontsource` auto-hébergées, pas de CDN, pas de statistiques).
- Le build normal et l'APK gardent exactement la persistance actuelle (`localStorage`, clé `attables_db_v1`).
- Socle visuel = tokens de `src/index.css` (sable `#F7F6F1`, carte `#FEFDFB`, encre `#1A263C`, encre douce `#4D586C`, vert `#007232`) ; vichy rouge tomate (carreaux `rgba(196,58,43,·)`, accent `#B3362A`) **jamais** sur boutons ni alertes. Sombre « Nuit marine » : mêmes valeurs que `.dark` de l'appli, carreaux bordeaux sombres.
- Accessibilité : texte ≥ 13 px, contraste texte ≥ 4,5:1, cibles ≥ 44 px, rien porté par la couleur seule, `prefers-reduced-motion`, lien d'évitement sur le site.
- Capability Tauri : `core:default` + `opener:allow-open-url` limité à `https://attables.biovibralyon.fr/*`, rien d'autre ; aucune permission Android ajoutée (pas d'`INTERNET`).
- Toute action destructrice : snapshot + `showUndo(message, snapshot)` (7 s).
- Version cible : **0.2.0**, versionCode **2000**.
- **Portes de validation par l'auteur** (ne pas les franchir seul) : textes des notes de version (Tâche 6), textes du site (Tâche 12), lancement de `scripts/fabriquer-apk.sh` (mot de passe), premier déploiement (Tâche 14).
- **Commits** : décision de l'auteur, *aucun commit par tâche*. Travailler sur une branche `site-presentation` ; tout est commité ensemble à la Tâche 15, dans les deux dépôts (Attablés et `~/Documents/Textes-legaux`, y compris les deux modifications déjà en attente dans ce dernier).
- Validation de chaque tâche touchant l'appli : `pnpm lint` et `pnpm build` passent.

## Review Focus

1. Effacer les exemples quand une invitation **de l'utilisateur** est hébergée chez un foyer d'exemple (`hoteRefType: 'foyer'`, `hoteRefId: 'foyer-claire-tom'`) : l'invitation reste, sa référence d'hôte est retirée, `hoteLabel` est conservé. → test dans la Tâche 1.
2. Effacer les exemples quand une invitation de l'utilisateur ne compte **que** des convives d'exemple : elle reste, avec `convivesIds: []`. → test dans la Tâche 1.
3. La démo affichée dans le cadre (iframe même origine) ou en plein écran **n'écrit jamais** dans `localStorage`, même après des modifications. → test dans la Tâche 2.
4. Le déploiement ne doit jamais supprimer `cgi-bin/` ni `.well-known/` (certificat SSL) sur le serveur. → vérification dans la Tâche 14.
5. Notes de version : ordre par versionCode **numérique** (2000 avant 1001, et 10000 après 9000) et échappement HTML (`&`, `<`, `>`) des lignes du changelog. → tests dans la Tâche 9.

---

## Phase A — Appli 0.2.0

### Task 1: logique des exemples (et banc de test)

**Files :**
- Create : `src/utils/exemples.ts`, `src/utils/exemples.test.ts`
- Modify : `package.json` (script `test`)

**Interfaces :**
- Consumes : `createSampleData(): AppData` (`src/services/storage.ts`), types de `src/types/models.ts`.
- Produces :
  - `resteDesExemples(data: AppData): boolean`
  - `effacerExemples(data: AppData): AppData`
  - Les identifiants d'exemple sont **dérivés** de `createSampleData()` (foyers, convives, invitations), pas recopiés à la main.

- [ ] **Étape 1 : ajouter le script** `"test": "node --import tsx --test \"src/**/*.test.ts\" \"site/**/*.test.ts\""` (Node 24 accepte les globs ; `tsx` est déjà en devDependency).
- [ ] **Étape 2 : écrire les tests** (`node:test`, `node:assert/strict`) :
  - `resteDesExemples(createSampleData())` → `true` ; `resteDesExemples(createEmptyData())` → `false`.
  - `effacerExemples(createSampleData())` → `foyers`, `convives`, `invitations` vides ; `contraintes` égales à `getDefaultContraintes()` (les tags restent) ; `settings` inchangés ; `resteDesExemples` du résultat → `false`.
  - Données d'exemple + un convive utilisateur `conv-1700000000000` avec `foyerId: 'foyer-martin'` → il reste, `foyerId` devient `undefined`.
  - Exemple renommé (`foyer-martin` renommé « Ma famille ») → effacé quand même.
  - (Review Focus 1) invitation utilisateur `inv-1700000000000` avec `hoteRefType: 'foyer'`, `hoteRefId: 'foyer-claire-tom'`, `hoteLabel: 'Claire & Tom'` → reste, `hoteRefType` et `hoteRefId` `undefined`, `hoteLabel` `'Claire & Tom'`.
  - (Review Focus 2) invitation utilisateur avec `convivesIds: ['conv-paul', 'conv-julie']` → reste avec `convivesIds: []`.
  - L'entrée n'est pas mutée (comparer à un `structuredClone` pris avant l'appel).
- [ ] **Étape 3 : `pnpm test`** → échec (module absent).
- [ ] **Étape 4 : implémenter** `src/utils/exemples.ts`. Le nettoyage des références suit `handleDeleteFoyer` / `handleDeleteConvive` d'`App.tsx`, plus l'hôte : une référence `hoteRefType: 'convive'` vers un convive d'exemple est retirée de la même façon.
- [ ] **Étape 5 : `pnpm test`** → tout passe ; `pnpm lint` passe.

> `storage.ts` sera importé sous Node : il ne doit pas toucher `localStorage` ni `import.meta.env` au chargement du module (voir Tâche 2).

### Task 2: mode démo

**Files :**
- Modify : `src/services/storage.ts`, `package.json` (script `build:demo`)
- Create : `src/services/storage.test.ts`

**Interfaces :**
- Produces : `export const MODE_DEMO: boolean` dans `storage.ts`, égal à `import.meta.env?.MODE === 'demo'` (chaînage optionnel : `undefined` sous Node).
- Produces : `export function creerStockage(demo: boolean): { charger(): AppData; enregistrer(data: AppData): void }`. `loadAppData()` et `saveAppData()` gardent leur signature et délèguent à `creerStockage(MODE_DEMO)`.

- [ ] **Étape 1 : tests** avec un faux `globalThis.localStorage` (objet qui compte les `setItem`) :
  - `creerStockage(true).charger()` → profondément égal à `createSampleData()`, même si le faux stockage contient déjà d'autres données.
  - (Review Focus 3) `creerStockage(true).enregistrer(data)` → `setItem` n'est **jamais** appelé.
  - `creerStockage(false)` : premier chargement sur stockage vide → exemples **et** `setItem` appelé une fois (comportement actuel inchangé).
- [ ] **Étape 2 : `pnpm test`** → échec.
- [ ] **Étape 3 : implémenter** ; ajouter le script `"build:demo": "vite build --mode demo --base /demo/ --outDir dist-site/demo --emptyOutDir"`.
- [ ] **Étape 4 : `pnpm test`, `pnpm lint`, `pnpm build`, `pnpm build:demo`** → succès ; `grep -c attables_db_v1 dist-site/demo/assets/*.js` peut rester > 0 (constante), mais un test manuel dans `pnpm exec vite preview --outDir dist-site --base /` (ou `npx serve dist-site`) sur `/demo/` : modifier une invitation, recharger → les exemples reviennent ; `localStorage` vide dans les outils du navigateur.

### Task 3: bandeau des exemples

**Files :**
- Create : `src/components/BandeauExemples.tsx`
- Modify : `src/App.tsx`, `src/components/SettingsModal.tsx`

**Interfaces :**
- Consumes : `resteDesExemples`, `effacerExemples` (Tâche 1), `MODE_DEMO` (Tâche 2).
- Produces : `BandeauExemples({ demo, onEffacer, onMasquer }: { demo: boolean; onEffacer: () => void; onMasquer: () => void })`.
- `SettingsModal` reçoit `resteDesExemples: boolean` et `onEffacerExemples: () => void`.

- [ ] **Étape 1 : `App.tsx`** : état `bandeauMasque` (`useState(false)`, **non persisté**) ; `handleEffacerExemples` = snapshot, `setData(effacerExemples)`, `showUndo('Exemples effacés', snapshot)`. Le bandeau se rend en tête du `<main>`, au-dessus des deux onglets, si `resteDesExemples(data) && !bandeauMasque`.
- [ ] **Étape 2 : `BandeauExemples`**. Textes exacts : « Marc, Sophie et les autres sont des exemples. » ; boutons « Effacer les exemples » (action principale, vert) et « Masquer ce bandeau » (secondaire) ; en démo, ligne supplémentaire « Démo : rien n'est gardé. ». Compact (carte `var(--card)`, bord `var(--border)`), boutons ≥ 44 px, côte à côte s'ils tiennent, l'un sous l'autre sinon. Icône de table/assiette existante de `Icons.tsx` si disponible.
- [ ] **Étape 3 : Réglages** : entrée « Effacer les exemples » (sous-titre « Retire Marc, Sophie et les autres ; vos propres données restent ») dans la section de « Recharger les données d'exemple », affichée seulement si `resteDesExemples`, avec une confirmation `ConfirmDialog` comme les entrées voisines (« Effacer les exemples ? » / « Effacer »), puis fermeture des réglages et bandeau Annuler.
- [ ] **Étape 4 : vérifier** `pnpm lint`, `pnpm build`, puis à la main (`pnpm dev`, 393 × 852) : bandeau visible ; « Masquer » le cache, rechargement de la page → il revient ; « Effacer » → plus d'exemple, bandeau parti, « Annuler » les ramène ; création d'un convive puis effacement → le convive reste.

### Task 4: la nappe sous la barre d'état

**Files :**
- Modify : `index.html`, `src/index.css`

- [ ] **Étape 1 : `index.html`** : `<div class="nappe" aria-hidden="true"></div>` juste avant `#root` (statique, présente sur tous les écrans : accueil, réglages, éditeur).
- [ ] **Étape 2 : `src/index.css`** :
  - `--haut-systeme: max(6px, env(safe-area-inset-top));` sur `:root`.
  - `.nappe` : `position: fixed; top: 0; left: 0; right: 0; height: var(--haut-systeme); z-index: 50;` fond `var(--bg)` + carreaux vichy **délavés** (deux `linear-gradient` croisés, `rgba(196,58,43,0.22)` en clair, carreaux de 8 px) ; en `.dark`, carreaux bordeaux sombres lisibles sur `#0D1624` (ex. `rgba(150,40,50,0.35)`).
  - `.pt-safe` → `padding-top: var(--haut-systeme)` ; `.pt-below-header` → `calc(4.5rem + var(--haut-systeme))`. Mettre à jour le commentaire au-dessus.
- [ ] **Étape 3 : vérifier** `pnpm build`, puis navigateur 393 × 852, clair et sombre : liseré de 6 px en haut, titre « Attablés » non rogné ; défiler pour masquer l'en-tête → les cartes passent **sous** la nappe, jamais au-dessus ; ouvrir Réglages et l'éditeur → nappe présente, rien de rogné. APK debug sur appareil (`pnpm tauri android build --apk --debug`) : carreaux sous l'heure, heure lisible, portrait et paysage.

### Task 5: lien « Notes de version » (opener)

**Files :**
- Modify : `src-tauri/Cargo.toml`, `src-tauri/src/lib.rs`, `src-tauri/capabilities/default.json`, `package.json`, `src/components/SettingsModal.tsx`, `CLAUDE.md`
- Create : `src/services/liens.ts`

**Interfaces :**
- Produces : `export const URL_NOTES_DE_VERSION = 'https://attables.biovibralyon.fr/notes-de-version.html'` et `export async function ouvrirLien(url: string): Promise<void>` : sous Tauri (`'__TAURI_INTERNALS__' in window`) → `openUrl(url)` de `@tauri-apps/plugin-opener` ; sinon `window.open(url, '_blank', 'noopener')`.

- [ ] **Étape 1 : dépendances** : `tauri-plugin-opener = "2"` (Cargo), `pnpm add @tauri-apps/plugin-opener` ; `lib.rs` : `.plugin(tauri_plugin_opener::init())`.
- [ ] **Étape 2 : capability** : ajouter `{ "identifier": "opener:allow-open-url", "allow": [{ "url": "https://attables.biovibralyon.fr/*" }] }` (pas `opener:default`).
- [ ] **Étape 3 : « À propos »** : bouton-ligne « Notes de version » (chevron, ≥ 44 px) dans la première carte, sous la description ; appelle `ouvrirLien(URL_NOTES_DE_VERSION)`.
- [ ] **Étape 4 : `CLAUDE.md`** : remplacer « la capability se limite à `core:default` » par « `core:default` + `opener:allow-open-url` limité à `https://attables.biovibralyon.fr/*` (lien Notes de version) ; ne rien ouvrir d'autre ».
- [ ] **Étape 5 : vérifier** `pnpm lint`, `pnpm build`, `pnpm tauri android build --apk --debug` ; `grep -c "android.permission.INTERNET" src-tauri/gen/android/app/build/intermediates/merged_manifest/*/process*Manifest/AndroidManifest.xml` → `0` (sinon s'arrêter et signaler) ; sur l'appareil, le lien ouvre le navigateur.

### Task 6: version 0.2.0 et notes de version — PORTE AUTEUR

**Files :**
- Modify : `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` (+ `Cargo.lock` via build), `src/components/SettingsModal.tsx` (2 × « Version 0.1.1 »)
- Create : `fastlane/metadata/android/fr-FR/changelogs/2000.txt`, `fastlane/metadata/android/en-US/changelogs/2000.txt`

- [ ] **Étape 1 : monter la version** à 0.2.0 dans les 5 emplacements ; `grep -rn "0\.1\.1" package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml src/` → aucune occurrence restante.
- [ ] **Étape 2 : rédiger les brouillons** fr et en de `2000.txt` (même forme que `1001.txt`, ≤ 500 caractères) : démo en ligne, nappe, effacement des exemples, lien Notes de version, correction du contenu qui passait sous la barre d'état.
- [ ] **Étape 3 : soumettre à l'auteur** les deux `2000.txt` **et** les deux `1001.txt` existants. Ne pas continuer vers la Tâche 9 ni les captures tant qu'ils ne sont pas validés ; appliquer ses corrections.
- [ ] **Étape 4 : demander à l'auteur** de lancer `scripts/fabriquer-apk.sh` (mot de passe de la clé) ; attendu : `dist-android/attables-0.2.0.apk`.

## Phase B — Textes légaux (`~/Documents/Textes-legaux`)

### Task 7: CGV facultatives, pied par site, pages d'Attablés

**Files (dans `~/Documents/Textes-legaux`) :**
- Modify : `fabriquer.mjs`, `fabriquer.test.mjs`, `README.md`
- Create : `sites/attables.json`, `gabarits/attables.html`, `attables/confidentialite.html`, `attables/conditions-utilisation.html`

**Interfaces :**
- `sites/<site>.json` : `cgv` devient facultatif ; nouvelle clé facultative `scriptPied` (chemin d'un fichier, défaut `commun/script-pied.html`, donc Paré inchangé).
- Sortie pour Attablés dans `~/Documents/applis/attables/site/` : `mentions-legales.html`, `confidentialite.html`, `conditions-utilisation.html`.

- [ ] **Étape 1 : tests** : un site sans `cgv` → les pages sont écrites, aucun fichier `public/cgv/`, `server/` absent ; `scriptPied` personnalisé → son contenu est dans chaque page ; Paré (avec `cgv`, sans `scriptPied`) → sortie identique à avant (les tests existants restent verts).
- [ ] **Étape 2 : `node --test fabriquer.test.mjs`** → échec des nouveaux tests.
- [ ] **Étape 3 : implémenter** dans `fabriquer.mjs` (bloc CGV sous `if (cgv)`, `versionCgv`/`dateCgv` seulement s'il existe).
- [ ] **Étape 4 : fichiers d'Attablés** :
  - `sites/attables.json` : `gabarit: "gabarits/attables.html"`, `scriptPied: "attables/script-pied.html"` (crée ce fichier : `<script type="module" src="/src/pied-attables.ts"></script>`), `valeurs.hebergeur` identique à Paré, `mediateur` absent (non utilisé : vérifier qu'aucune page d'Attablés ne contient `{{mediateur}}`), pages avec `"email": false` (le pied d'Attablés gère `.email-link`, voir Tâche 8 : pas de script en ligne, CSP sans `'unsafe-inline'`).
  - `gabarits/attables.html` : modèle de `gabarits/pare.html` ; `<title>{{titre}} — Attablés</title>`, `<link rel="stylesheet" href="/src/legal.css">`, en-tête « ← Attablés », Mentions légales, Confidentialité, Conditions d'utilisation ; pied de secours sans « Mon compte » ni CGV.
  - `attables/confidentialite.html` (partie `partieService`) : reprend `PRIVACY_POLICY.md` (aucune collecte, export IA manuel et anonymisé par défaut, sauvegardes `.json` en clair) + « Visite du site et démo web » sur le modèle de `pare/confidentialite.html` (journaux o2switch, intérêt légitime, aucun cookie, la démo ne garde rien).
  - `attables/conditions-utilisation.html` : ce que fait Attablés ; ce qu'il n'est pas (outil d'organisation, ne remplace pas l'avis d'un médecin ni la vérification des étiquettes pour une allergie) ; la démo (rien gardé, ne pas y saisir de données personnelles) ; gratuit, sans compte, licence GPL-3.0-or-later avec lien vers le dépôt ; fourni sans garantie (clause GPL).
- [ ] **Étape 5 : `node --test fabriquer.test.mjs`** → vert ; `node fabriquer.mjs attables ~/Documents/applis/attables/site` → trois pages écrites, aucune `{{…}}` restante.

## Phase C — Site

### Task 8: socle du site

**Files :**
- Create : `site/vite.config.ts`, `site/index.html` (squelette), `site/notes-de-version.html` (squelette), `site/src/styles.css`, `site/src/legal.css`, `site/src/accueil.ts`, `site/src/pied-de-site.js` + `site/src/pied-de-site.css` (copies conformes de `~/Documents/Evacuation/App_V2/web/src/`), `site/src/pied-attables.ts`, `site/src/pied-attables.css`
- Modify : `package.json` (scripts), `.gitignore` (`dist-site/`, `.superpowers/`), `tsconfig.json` (exclure `dist-site`)

**Interfaces :**
- Produces : scripts `"site:dev": "vite --config site/vite.config.ts"`, `"site:build": "vite build --config site/vite.config.ts"` ; `root: 'site'`, `build.outDir: '../dist-site'`, `emptyOutDir: true`, entrées : `index`, `notes-de-version`, `mentions-legales`, `confidentialite`, `conditions-utilisation`.
- Ordre de construction complet (utilisé par la Tâche 14) : `pnpm site:build` puis `pnpm build:demo`.

- [ ] **Étape 1 : config et styles** : tokens repris de `src/index.css` (clair + sombre via `prefers-color-scheme`), polices via `@fontsource/baumans` et `@fontsource/source-sans-3` importées dans `styles.css`, motif vichy en classe utilitaire (bandeau, ourlet).
- [ ] **Étape 2 : pied** : dans la copie de `pied-de-site.js`, ajouter `{ texte: 'Attablés', href: 'https://attables.biovibralyon.fr/' }` à `COMMUN.applications` (seule différence avec l'original). `pied-attables.ts` appelle `poserPied({ nom: 'Attablés', logo, phrase, engagement: 'Sans publicité ni mesure d’audience', version, liens, legal })` (version importée de `../../package.json` ; liens : Essayer la démo `/demo/`, Télécharger `/#telecharger`, Notes de version `/notes-de-version.html`, Code source GitHub ; legal : les trois pages) **et** remplace chaque `.email-link` comme `commun/script-email.html`.
- [ ] **Étape 3 : vérifier** `pnpm site:build` → `dist-site/` contient les 5 pages ; `grep -L "<script>" dist-site/*.html` liste les 5 pages (aucun script en ligne) ; `pnpm lint` passe.

### Task 9: page « Notes de version »

**Files :**
- Create : `site/outils/notes.ts`, `site/outils/notes.test.ts`, `site/outils/plugin-notes.ts`
- Modify : `site/vite.config.ts`, `site/notes-de-version.html`

**Interfaces :**
- `versionDepuisCode(code: number): string` (2000 → `'0.2.0'`, 1001 → `'0.1.1'`, 1002003 → `'1.2.3'`).
- `lireNotes(dossier: string): { code: number; version: string; lignes: string[] }[]` — lit `<code>.txt`, ignore tout autre fichier, trie par `code` numérique décroissant ; `lignes` = lignes non vides, puce `•` initiale retirée.
- `notesEnHtml(notes): string` — un `<article>` par version (`<h2>Version x.y.z</h2>` + `<ul>`), texte échappé.
- Plugin Vite `pluginNotes(dossier)` : remplace `<!-- NOTES -->` dans `notes-de-version.html` (via `transformIndexHtml`) par `notesEnHtml(lireNotes(dossier))`, dossier `fastlane/metadata/android/fr-FR/changelogs`.

- [ ] **Étape 1 : tests** (dossier temporaire `fs.mkdtempSync`) : conversions ci-dessus ; (Review Focus 5) fichiers `1001.txt`, `2000.txt`, `10000.txt`, `9000.txt` → ordre 10000, 9000, 2000, 1001 ; une ligne `Sel & poivre <b>` → `Sel &amp; poivre &lt;b&gt;` dans le HTML ; `notes.md` ignoré.
- [ ] **Étape 2 : `pnpm test`** → échec ; **Étape 3 : implémenter** ; **Étape 4 : `pnpm test`** → vert, `pnpm site:build` → `dist-site/notes-de-version.html` contient « Version 0.2.0 » avant « Version 0.1.1 ».
- [ ] La page : titre « Notes de version », phrase d'intro, versions, lien retour vers l'accueil ; mêmes en-tête, nappe et pied que l'accueil.

### Task 10: informations et copie de l'APK

**Files :**
- Create : `site/outils/apk.ts`, `site/outils/apk.test.ts`
- Modify : `site/vite.config.ts`

**Interfaces :**
- `lireEmpreinteCertificat(texte: string): string` — première ligne non vide qui ne commence pas par `#` ; retourne les 64 hex en **majuscules groupées par deux** séparées par `:`.
- `infosApk(chemin: string): { sha256: string; octets: number }`.
- `tailleLisible(octets: number): string` (ex. `13 625 344` → `'13,0 Mo'`, format fr).
- Plugin `pluginApk({ version })` : en `build`, exige `dist-android/attables-${version}.apk` (sinon erreur « APK absent : lancer scripts/fabriquer-apk.sh ») ; le copie vers `dist-site/telechargement/attables-${version}.apk` (`generateBundle` → `emitFile` ou copie en `closeBundle`) ; dans `index.html` remplace `%APK_VERSION%`, `%APK_FICHIER%`, `%APK_TAILLE%`, `%APK_SHA256%`, `%CERT_SHA256%`. En `serve`, valeurs factices « (APK non construit) ».

- [ ] **Étape 1 : tests** : empreinte du fichier réel `src-tauri/empreinte-cle-android.txt` → commence par `19:33:24:A6` ; `infosApk` sur un fichier temporaire de contenu `abc` → sha256 `ba7816bf…15ad`, `octets` 3 ; `tailleLisible`.
- [ ] **Étape 2 → 4** : échec, implémentation, vert ; `pnpm site:build` sans APK 0.2.0 → erreur explicite ; avec → fichier copié, empreintes visibles dans `dist-site/index.html`.

### Task 11: captures réelles

**Files :**
- Create : `scripts/captures-site.mjs`
- Modify : `package.json` (devDependency `@playwright/test` `^1.64.1`, même version que Tirages : navigateurs déjà dans `~/.cache/ms-playwright` ; script `"site:captures": "node scripts/captures-site.mjs"`)

- [ ] **Étape 1 :** le script lance `vite` de l'appli sur un port libre, ouvre Chromium 393 × 852, `deviceScaleFactor: 3`, thème clair, `localStorage` vide (donc exemples), masque le bandeau des exemples (clic « Masquer ce bandeau ») et enregistre dans `site/public/captures/` : `invitations.png` (accueil), `convives.png` (onglet Convives), `invitation.png` (éditeur de « Dîner d'automne » : contraintes réunies, menu, alerte de plat déjà servi si visible), `memoire.png` (historique d'un convive avec plats servis et avis). Convertir en WebP si `cwebp` est disponible, sinon PNG.
- [ ] **Étape 2 :** à lancer **après** la Tâche 6 (appli 0.2.0) ; vérifier visuellement chaque image (pas de bandeau, pas de rognage, nappe présente).

### Task 12: page d'accueil et démo — PORTE AUTEUR (textes)

**Files :**
- Modify : `site/index.html`, `site/src/styles.css`, `site/src/accueil.ts`

- [ ] **Étape 1 : structure** (ordre de la spec) : lien d'évitement ; bandeau vichy ; en-tête (« Attablés » en Baumans, nav Comment ça marche · Démo · Télécharger) ; accroche « On remet le couvert ? » avec « le couvert » en rouge tomate, phrase, boutons « Télécharger » (vert, `#telecharger`) et « Essayer la démo » (`/demo/`), clin d'œil « Tante Odile a déjà eu le gratin. Deux fois. » ; zone démo ; « Pourquoi » ouvert par « Que leur ai-je servi la dernière fois qu'ils sont venus ? » ; trois étapes avec les captures de la Tâche 11 (`width`/`height`, `alt` descriptifs, `loading="lazy"`) ; « Vos invités restent chez vous » (hors ligne, sans compte, sans publicité ni mesure d'audience, export IA anonymisé par défaut, GPL + lien GitHub) ; « Télécharger » (`id="telecharger"`) avec bouton APK (`%APK_FICHIER%`, `%APK_TAILLE%`, Android 7.0 ou plus récent), SHA-256 du fichier et du certificat en `<code>` sélectionnables, aide repliable `<details>` « Installer un APK » (autoriser le navigateur à installer des applis, ouvrir le fichier, puis retirer l'autorisation), « Bientôt sur le Play Store et F-Droid », encadré « Premiers pas » (l'appli s'ouvre sur une tablée d'exemple ; bandeau « Effacer les exemples » ; aussi dans Réglages → Sauvegarde & Données), lien Notes de version ; `<footer data-pied-de-site>` avec liens légaux de secours.
- [ ] **Étape 2 : démo** (`accueil.ts`) : si `matchMedia('(min-width: 900px)')`, insérer dans le cadre de téléphone une `<iframe src="/demo/" title="Démo d'Attablés" loading="lazy">` de 393 × 852 px réduite par `transform: scale()` pour tenir dans le cadre ; sinon, le cadre est remplacé par le bouton « Essayer la démo » (plein écran). Sans JavaScript : le bouton seul.
- [ ] **Étape 3 : décor** : illustrations SVG maison (assiettes, couverts, cartons de table) dans le fichier, couleurs via tokens ; animations légères désactivées sous `prefers-reduced-motion`.
- [ ] **Étape 4 : vérifier** `pnpm site:build && pnpm build:demo`, servir `dist-site/` (`pnpm exec vite preview --config site/vite.config.ts`) : 390 px et 1440 px, clair et sombre ; pas de défilement horizontal ; démo dans le cadre (≥ 900 px) et bouton (mobile) ; liens internes valides.
- [ ] **Étape 5 : soumettre à l'auteur** les textes de la page (et les captures) ; appliquer ses corrections.

### Task 13: `.htaccess`

**Files :**
- Create : `site/public/.htaccess`, `site/demo.htaccess`

- [ ] **Étape 1 : `site/public/.htaccess`**, sur le modèle de Paré :
  - Redirection 301 si `HTTPS != on` ou hôte ≠ `attables.biovibralyon.fr` ; `Options -Indexes` ; refus des fichiers cachés (sauf `.well-known/`), `.env`, `.ini`, `.log`, `.sql`, `.bak`, `.sh`, `.pem`, `.key`, `.map`, **et `.php`** (aucun PHP).
  - `AddType application/vnd.android.package-archive .apk` ; pour `\.apk$` : `Content-Disposition: attachment`, `Cache-Control: no-cache`.
  - En-têtes : `Strict-Transport-Security "max-age=31536000"`, `X-Content-Type-Options nosniff`, `X-Frame-Options DENY`, `Referrer-Policy strict-origin-when-cross-origin`, `Permissions-Policy` de Paré, CSP `default-src 'self'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; frame-src 'self'; object-src 'none'; img-src 'self' data:; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; upgrade-insecure-requests`.
  - Cache : `assets/` long (`max-age=31536000, immutable`), `*.html` `no-cache`.
- [ ] **Étape 2 : `site/demo.htaccess`** (copié en `dist-site/demo/.htaccess` par la Tâche 14) : mêmes en-têtes sauf `X-Frame-Options SAMEORIGIN` et `frame-ancestors 'self'` dans la CSP.
- [ ] **Étape 3 : vérifier** en Tâche 14 (en ligne).

### Task 14: déploiement — PORTE AUTEUR (premier envoi)

**Files :**
- Create : `scripts/deployer-site.sh`

- [ ] **Étape 1 : écrire le script** (`set -euo pipefail`, structure de `~/Documents/Tirages/scripts/deploy.sh`) :
  1. `pnpm lint && pnpm test && pnpm site:build && pnpm build:demo && cp site/demo.htaccess dist-site/demo/.htaccess`.
  2. `version` lue dans `package.json` ; `apksigner verify --print-certs dist-android/attables-$version.apk` (`$ANDROID_HOME/build-tools/<plus récent>/apksigner`) ; le SHA-256 du certificat (minuscules sans `:`) doit égaler la ligne de `src-tauri/empreinte-cle-android.txt`, sinon arrêt.
  3. Présence de `dist-site/index.html`, `dist-site/.htaccess`, `dist-site/demo/index.html`, `dist-site/demo/.htaccess`, `dist-site/telechargement/attables-$version.apk`.
  4. `rsync -az --delete --chmod=D755,F644 --exclude cgi-bin/ --exclude .well-known/ dist-site/ "o2switch:attables.biovibralyon.fr/"` (cible en dur ; Review Focus 4 : les `--exclude` protègent aussi ces dossiers de `--delete`).
  5. Contrôles `curl` : 200 sur `/`, `/demo/`, `/notes-de-version.html`, `/telechargement/attables-$version.apk` ; `http://` → 301 vers `https://attables.biovibralyon.fr/` ; en-têtes `nosniff`, `strict-transport-security`, `content-security-policy` présents sur `/` ; `x-frame-options: SAMEORIGIN` sur `/demo/` ; `/cgi-bin/` ne renvoie pas « Index of » ; `content-type: application/vnd.android.package-archive` sur l'APK.
  6. Avertir si l'arbre git n'est pas propre ; afficher la version déployée.
- [ ] **Étape 2 : essai à blanc** : `rsync … --dry-run` montré à l'auteur (rien n'est supprimé hors de ce que le site gère).
- [ ] **Étape 3 : l'auteur donne son accord**, puis exécution réelle ; `ssh o2switch 'ls -a ~/attables.biovibralyon.fr/'` montre encore `cgi-bin` et `.well-known`.
- [ ] **Étape 4 : test manuel** : télécharger l'APK depuis un téléphone Android, l'installer, vérifier nappe, bandeau, lien Notes de version.

### Task 15: finitions et commit unique

- [ ] **Étape 1 :** `PRIVACY_POLICY.md` aligné sur la page confidentialité publiée (même contenu sur le fond) ; `README.md` : section « Site » (scripts `site:*`, `deployer-site.sh`).
- [ ] **Étape 2 :** relire `git status` dans les deux dépôts ; aucun `*.apk`, `dist-site/`, `.superpowers/` suivi.
- [ ] **Étape 3 : commits** (sur accord de l'auteur) — Attablés, branche `site-presentation` : un commit `feat(site): site de présentation et appli 0.2.0` ; Textes-legaux : un commit `feat(légal): pages d'Attablés, CGV facultatives` qui inclut aussi `commun/valeurs.json` et `fabriquer.test.mjs` déjà modifiés.
- [ ] **Étape 4 : signaler à l'auteur** : ajouter Attablés à `COMMUN.applications` dans la copie du pied de Paré (et des autres sites) ; l'entrée « Baluchon » pointe vers une adresse qui ne répond pas alors que l'appli s'appelle Bouclé (`boucle.biovibralyon.fr` existe sur le serveur).

## Phase D — Retours de l'auteur (13 novembre au soir)

### Task 16: polices latines en woff2 seulement (appli et site)

**Files :** Modify `src/index.css`, `site/src/styles.css` ; Create `src/polices.css` (ou équivalent partagé si simple).

- [ ] **Étape 1 :** remplacer les imports `@fontsource/…/400.css` (tous jeux de caractères, woff + woff2) par des `@font-face` qui ne chargent que le sous-ensemble **latin** en **woff2** (fichiers `@fontsource/<famille>/files/<famille>-latin-<graisse>-normal.woff2`), pour Baumans 400 et Source Sans 3 400, 600, 700, avec `font-display: swap` et le `unicode-range` latin de fontsource. Mêmes noms de familles qu'aujourd'hui (`Baumans`, `Source Sans 3`) : aucun changement de rendu pour le français (œ, æ, « », espaces insécables compris dans le latin de fontsource — à vérifier).
- [ ] **Étape 2 :** mesurer `du -sh dist` et la liste des polices émises avant/après (`pnpm build`, `SITE_APK_FACTICE=1 pnpm site:build`) ; aucune police `latin-ext`, `cyrillic`, `greek`, `vietnamese`, ni `.woff`.
- [ ] **Étape 3 :** vérifier visuellement (Playwright 393 px) qu'un texte avec « Œufs à la neige, crème brûlée » s'affiche dans la bonne police (aucune police de secours) ; `pnpm lint`, `pnpm test`, `pnpm build`.

### Task 17: icônes des barres système selon le thème, nappe en bas

**Files :** Modify `src-tauri/gen/android/app/src/main/java/attables/biovibralyon/fr/MainActivity.kt`, `src/App.tsx`, `index.html`, `src/index.css`, `CLAUDE.md` ; Create `src/services/barresSysteme.ts`.

**Interfaces :**
- Kotlin : dans `MainActivity`, `override fun onWebViewCreate(webView: WebView)` ajoute `webView.addJavascriptInterface(<objet>, "AttablesAndroid")` ; méthode `@JavascriptInterface fun barresSysteme(sombre: Boolean)` qui, sur le fil UI (`runOnUiThread`), règle `WindowCompat.getInsetsController(window, window.decorView)` : `isAppearanceLightStatusBars = !sombre`, `isAppearanceLightNavigationBars = !sombre`.
- TS : `export function signalerThemeAuxBarres(sombre: boolean): void` — appelle `window.AttablesAndroid?.barresSysteme(sombre)` si présent (typé, sans erreur hors Android), appelé dans `applyTheme` d'`App.tsx` avec `isDark`.

- [ ] **Étape 1 : nappe du bas** : `<div class="nappe nappe-bas" aria-hidden="true">` (ou classe dédiée) fixe en bas, hauteur `env(safe-area-inset-bottom)` (0 dans un navigateur), mêmes carreaux délavés que `.nappe` (clair et sombre), au-dessus de la barre d'onglets dans cette zone uniquement, `pointer-events: none`. La barre d'onglets et le bouton flottant ne bougent pas.
- [ ] **Étape 2 : pont natif** (interfaces ci-dessus). Commentaire Kotlin : pourquoi, et « à préserver si `gen/android` est régénéré ».
- [ ] **Étape 3 : `CLAUDE.md`** : mentionner l'interface `AttablesAndroid` (seul pont natif, local, sans réseau) et qu'elle est à préserver lors d'une régénération Android, comme `signingConfigs`.
- [ ] **Étape 4 :** `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm tauri android build --apk --debug` (compile) ; `INTERNET` toujours absent du manifeste fusionné. Vérification sur appareil par l'auteur.

### Task 18: version 0.2.1 — PORTE AUTEUR (notes)

- [ ] Monter en 0.2.1 (versionCode 2001) aux 5 endroits habituels + `Cargo.lock` ; brouillons `fastlane/metadata/android/{fr-FR,en-US}/changelogs/2001.txt` (≤ 500 caractères : icônes des barres Android lisibles quel que soit le thème, nappe en bas, appli plus légère) ; soumis à l'auteur.

### Task 19: deux APK (64 bits, 32 bits) — site, déploiement, stores

**Files :** Modify `scripts/fabriquer-apk.sh`, `site/outils/apk.ts` (+ tests), `site/vite.config.ts`, `site/index.html`, `scripts/deployer-site.sh`, `F_DROID.md`, `PLAY_STORE.md`, `BUILD_ANDROID_DEBIAN.md`.

- [ ] **Étape 1 : fabrication** (modèle : `~/Documents/Lulu/lumosphere/scripts/fabriquer-applis.sh`, fonction `fabriquer_apk`) : sans option, deux APK signés : `dist-android/attables-<v>.apk` (`--target aarch64`, ABI `arm64-v8a` seule, vérifiée par `unzip -l`) et `dist-android/attables-<v>-32bits.apk` (`--target armv7`, `armeabi-v7a` seule) ; un seul mot de passe. `--aab` inchangé (AAB universel : le Play Store le découpe par appareil).
- [ ] **Étape 2 : site** : `pluginApk` gère les deux fichiers (copie, taille, SHA-256), nouveaux remplacements `%APK32_FICHIER%`, `%APK32_TAILLE%`, `%APK32_SHA256%` ; en `SITE_APK_FACTICE`, valeurs factices pour les deux. Section Télécharger : bouton = APK 64 bits ; condition « Pour Android 7 ou plus récent, sur un téléphone 64 bits. » ; dessous, lien discret, textes de Lumosphère : « Téléphone ancien ou d'entrée de gamme ? Si l'application ne s'installe pas ou ne s'ouvre pas, prenez la version 32 bits. » / « Télécharger la version 32 bits » (espaces insécables dans « 64 bits », « 32 bits », « Android 7 »), sa taille et son SHA-256 (repliable si besoin). Tests unitaires mis à jour.
- [ ] **Étape 3 : déploiement** : `deployer-site.sh` vérifie, copie (`cmp`) et contrôle la signature des deux APK, et contrôle en ligne 200 + type MIME pour les deux.
- [ ] **Étape 4 : stores** : `PLAY_STORE.md` (AAB = un paquet par appareil, rien à faire) ; `F_DROID.md` : recette avec une construction par ABI (arm64-v8a, armeabi-v7a), versionCodes distincts selon la convention F-Droid (documenter le schéma choisi et comment Tauri le fixe), à partir de la documentation F-Droid (vérifier en ligne) ; `BUILD_ANDROID_DEBIAN.md` et `CLAUDE.md` (commandes).
- [ ] **Étape 5 :** `bash -n` des scripts, `pnpm test`, `pnpm lint`, `SITE_APK_FACTICE=1 pnpm site:build` ; capture 390/1440 de la section Télécharger. L'auteur lance ensuite `scripts/fabriquer-apk.sh` puis `scripts/deployer-site.sh --essai` et le vrai déploiement.
