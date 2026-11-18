# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

**Attablés** : carnet d'invitations personnel 100 % hors ligne (foyers, convives, allergies, mémoire anti-doublon des plats). SPA React 19 + Vite + Tailwind v4, empaquetée pour Android via Tauri v2. Toute l'UI, les identifiants métier et les messages sont en français. Licence GPL-3.0-or-later : les fichiers source portent un en-tête copyright/SPDX à conserver.

## Commandes

```bash
pnpm install
pnpm dev        # Vite sur http://localhost:3000 (host 0.0.0.0)
pnpm lint       # tsc --noEmit (pas d'ESLint)
pnpm test       # node:test + tsx : src/**/*.test.ts et site/**/*.test.ts (Node ≥ 22)
pnpm build      # build de production dans dist/ (frontendDist de Tauri)
pnpm build:demo # démo web (MODE_DEMO) → dist-site/demo/, à lancer APRÈS site:build (qui vide dist-site/)

pnpm site:dev       # site de présentation (site/) en local
pnpm site:build     # site → dist-site/ ; exige dist-android/attables-<version>.apk et -32bits.apk
SITE_APK_FACTICE=1 pnpm site:build   # même build avec un APK factice : vérification locale seulement
pnpm site:captures  # régénère site/public/captures/ (Playwright, données d'exemple, thème clair)
scripts/deployer-site.sh --essai     # construit, contrôle, rsync à blanc ; sans --essai : vrai envoi (« oui »)

pnpm tauri android build --apk --debug   # APK de test
scripts/fabriquer-apk.sh                 # 2 APK release signés (64 bits + *-32bits.apk, un mot de passe) → dist-android/
scripts/fabriquer-apk.sh --aab           # bundle Play Store signé (universel, découpé par Google)
pnpm tauri android build --apk --target aarch64   # APK release NON signé (-unsigned), une ABI par build, comme F-Droid
```

Valider une modification = `pnpm lint` + `pnpm test` + `pnpm build`, puis vérification manuelle dans le navigateur (`pnpm dev`, `pnpm site:dev` pour le site).

Gestionnaire de paquets : **pnpm** uniquement (version épinglée dans `package.json` → `packageManager`, à garder synchronisée avec `npm install -g pnpm@…` dans la recette de `F_DROID.md`). `tauri.conf.json` appelle `pnpm dev` / `pnpm build`. Ne pas générer de `package-lock.json`.

Le guide complet Android/Debian (SDK/NDK, icônes, keystore, tag, `fdroid build`) est dans `BUILD_ANDROID_DEBIAN.md`.

## Architecture

**Aucun backend, aucun réseau.** Le shell Rust (`src-tauri/src/lib.rs`) ne fait que lancer la WebView et enregistrer `tauri-plugin-opener` ; aucune commande Tauri n'est exposée et la capability se limite à `core:default` + `opener:allow-open-url` limité à `https://attables.biovibralyon.fr/*` (lien Notes de version) ; ne rien ouvrir d'autre. Seul pont natif : l'interface JavaScript `AttablesAndroid` (une méthode `barresSysteme(sombre)`, locale, sans réseau), ajoutée par `MainActivity.onWebViewCreate` pour régler la couleur des icônes des barres système selon le thème de l'appli ; à préserver si le projet Android est régénéré, comme `signingConfigs`. Même obligation pour la ligne `webView.settings.textZoom = (fontScale * 100)` du même `onWebViewCreate` : l'appli suit la taille de police d'Android sans plafond, donc **aucune hauteur fixe pour l'en-tête et les barres** (`min-h-*`, jamais `h-*`) : `useHauteurMesuree` écrit leur hauteur réelle dans `--hauteur-entete` / `--hauteur-barre` (et `--hauteur-fab`, `--hauteur-bandeau`), que lisent les classes de `src/index.css` (`.pt-below-header`, `.bottom-above-*`…) ; les textes essentiels passent à la ligne au lieu de `truncate`. Toute la logique vit dans le frontend TypeScript. Ne pas ajouter de dépendance réseau, de télémétrie ni de SDK tiers : l'app est publiée sur F-Droid sans permission `INTERNET` (à retirer de `src-tauri/gen/android/app/src/main/AndroidManifest.xml` après `tauri android init`).

**État unique dans `App.tsx`.** Un seul objet `AppData` (`src/types/models.ts`) contient foyers, convives, tags de contraintes, invitations et réglages. `App.tsx` détient le `useState<AppData>`, tous les handlers CRUD, et le transmet aux écrans (`InvitationsTab`, `ConvivesTab`, `InvitationEditor`, `SettingsModal` → `SettingsScreen`) via props ; pas de contexte ni de store externe. Un `useEffect` persiste l'intégralité de `AppData` à chaque changement.

**Persistance** (`src/services/storage.ts`) : `localStorage` sous la clé `attables_db_v1`. Premier lancement ou JSON illisible → données d'exemple (`createSampleData`). `migrateAndValidateAppData` sert à la fois au chargement et à la restauration d'une sauvegarde `.json` : tout nouveau champ de `AppData` doit y être normalisé (valeur par défaut), et un changement de structure incompatible implique d'incrémenter `CURRENT_DATA_VERSION` et d'ajouter la migration.

**Mode démo** (`pnpm build:demo`, `MODE_DEMO` = `import.meta.env.MODE === 'demo'`) : `creerStockage(demo)` recharge les exemples à chaque visite et n'écrit **jamais** dans `localStorage` ; la démo s'ouvre en thème clair forcé. Le build normal et l'APK gardent la persistance ci-dessus.

**Données d'exemple** (`src/utils/exemples.ts`) : reconnues par leurs identifiants fixes (`createSampleData`) ; `resteDesExemples` affiche le bandeau d'invitation à les effacer, `effacerExemples` les retire sans toucher aux données de l'utilisateur (avec annulation).

**Annulation** : les actions destructrices (suppression, passage en réalisée, restauration, reset) capturent le `data` précédent comme snapshot et appellent `showUndo(message, snapshot)` ; le bandeau `UndoBanner` restaure le snapshot pendant 7 s. Un seul `UndoBanner`, monté par `App` quelle que soit la vue ; sa zone `role="status"` reste dans le DOM ; le minuteur s'arrête tant que le focus est dans le bandeau. Les nouvelles actions destructrices doivent suivre ce schéma.

**Logique métier** (`src/utils/dishes.ts`, fonctions pures) :
- Seules les invitations `statut === 'realisee'` alimentent la mémoire des plats servis (`getDishesServedToGuests`).
- Les plats sont comparés via `normalizeForCompare` (insensible à la casse, aux accents, œ/æ) ; `formatDishInput` normalise l'affichage.
- `settings.prescriptionMois` (1–60, défaut 6) sépare « servi récemment » de « peut revenir ».
- Verdict d'un plat = `menuVerdicts[course]` sinon `verdict` global de l'invitation.
- Contraintes : tags `strict` (allergies, alertes fortes) vs `preference`, plus note libre par convive (`aggregateConstraints`).
- `buildAiPromptMarkdown` génère le prompt pour une IA externe, **anonymisé par défaut** (pas de prénoms ni d'hôte ; les notes libres y figurent telles quelles) ; préserver cette garantie et cette formulation dans les textes (site, appli, stores, `PRIVACY_POLICY.md`).

**Navigation Android** : `useAndroidBack(active, onBack)` empile chaque vue/modale/sheet ouverte dans `history` pour que le bouton Retour ferme l'overlay du dessus plutôt que de quitter l'app. Toute nouvelle modale ou vue plein écran doit l'utiliser ; toute modale ou feuille utilise aussi `usePiegeFocus` (focus sur le titre, Tab bouclé, focus rendu à la fermeture). `useAutoHideChrome` masque l'en-tête/la barre d'onglets au défilement.

**Thème** : couleurs en variables CSS dans `src/index.css` (`:root` = « Safran » clair, `.dark` = « Nuit marine »), variante Tailwind `dark` basée sur la classe `.dark` posée sur `<html>` par `App.tsx` (qui met aussi à jour `meta[name=theme-color]`). Utiliser les tokens (`var(--ink)`, `var(--primary)`…) plutôt que des couleurs en dur. Nappe vichy : divs `.nappe` (haut) et `.nappe-bas` (zone de la barre de navigation Android, `env(safe-area-inset-bottom)`) dans `index.html`. Polices auto-hébergées déclarées dans `src/polices.css` (Baumans pour `.font-display`, Source Sans 3 ; sous-ensemble latin, woff2 seulement, partagé avec le site) : ne pas réimporter les `@fontsource/*.css`.

**Site de présentation** (`site/`, servi sur https://attables.biovibralyon.fr/) : Vite multi-pages sans framework (`site/vite.config.ts`), plugins de build dans `site/outils/` (notes de version lues dans `fastlane/…/changelogs/`, APK et SHA-256), sortie `dist-site/` (démo dans `dist-site/demo/`). Thème clair seulement. Les pages `site/{mentions-legales,confidentialite,conditions-utilisation}.html` sont générées par `~/Documents/Textes-legaux` (`node fabriquer.mjs attables <chemin>/site`) : ne pas les éditer à la main.

**Identifiants** : générés côté client par préfixe + `Date.now()` (`inv-…`, `conv-…`, `foyer-…`, `tag-…`).

## Publication

- Versions à garder synchronisées : `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, plus un changelog `fastlane/metadata/android/{fr-FR,en-US}/changelogs/<versionCode>.txt` et la mention « Version x.y.z » codée en dur dans `src/components/SettingsModal.tsx` (2 occurrences). `versionCode` est calculé par Tauri : majeure × 1 000 000 + mineure × 1 000 + correctif (0.1.1 → 1001). Exception F-Droid : à chaque version, ajouter aussi dans `fr-FR` et `en-US` les copies (pas des liens) `changelogs/<10 × code + 1>.txt` et `<10 × code + 2>.txt` de `<code>.txt` (le site les ignore) ; un versionCode distinct par ABI (`10 × code + 1` armeabi-v7a, `+ 2` arm64-v8a), fixé par `--config` ; voir `F_DROID.md`. `scripts/fabriquer-apk.sh` refuse de fabriquer si l'un de ces six fichiers manque.
- Identifiant Android : `attables.biovibralyon.fr`.
- Ne jamais commiter `*.apk`, `*.aab`, `*.jks`, `keystore.properties` (déjà dans `.gitignore`). F-Droid exige `Cargo.lock` et `pnpm-lock.yaml` commités (`--frozen-lockfile`).
- Signature : `src-tauri/gen/android/app/build.gradle.kts` contient un bloc `signingConfigs` ajouté à la main, qui lit la clé et son mot de passe **uniquement** dans les variables d'environnement `ATTABLES_KEYSTORE` / `ATTABLES_KEYSTORE_MDP`, posées par `scripts/fabriquer-apk.sh` (à préserver si le projet Android est régénéré). Ne jamais écrire le mot de passe dans un fichier. L'empreinte du certificat est épinglée dans `src-tauri/empreinte-cle-android.txt`.
- Le script Gradle Rust de Tauri lance `pnpm tauri …` depuis `src-tauri/` : le script `"tauri": "tauri"` de `package.json` est indispensable.
