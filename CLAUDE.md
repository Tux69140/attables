# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

**Attablés** : carnet d'invitations personnel 100 % hors ligne (foyers, convives, allergies, mémoire anti-doublon des plats). SPA React 19 + Vite + Tailwind v4, empaquetée pour Android via Tauri v2. Toute l'UI, les identifiants métier et les messages sont en français. Licence GPL-3.0-or-later : les fichiers source portent un en-tête copyright/SPDX à conserver.

## Commandes

```bash
pnpm install
pnpm dev        # Vite sur http://localhost:3000 (host 0.0.0.0)
pnpm lint       # tsc --noEmit — seule vérification automatique (pas d'ESLint, pas de tests)
pnpm build      # build de production dans dist/ (frontendDist de Tauri)

pnpm tauri android build --apk --debug   # APK de test
pnpm tauri android build --apk           # APK release signé si src-tauri/gen/android/keystore.properties existe, sinon -unsigned
pnpm tauri android build --aab           # bundle Play Store
```

Il n'existe aucune suite de tests. Valider une modification = `pnpm lint` + `pnpm build`, puis vérification manuelle dans le navigateur (`pnpm dev`).

Gestionnaire de paquets : **pnpm** uniquement (version épinglée dans `package.json` → `packageManager`, à garder synchronisée avec `npm install -g pnpm@…` dans la recette de `F_DROID.md`). `tauri.conf.json` appelle `pnpm dev` / `pnpm build`. Ne pas générer de `package-lock.json`.

Le guide complet Android/Debian (SDK/NDK, icônes, keystore, tag, `fdroid build`) est dans `BUILD_ANDROID_DEBIAN.md`.

## Architecture

**Aucun backend, aucun réseau.** Le shell Rust (`src-tauri/src/lib.rs`) ne fait que lancer la WebView ; aucune commande Tauri n'est exposée et la capability se limite à `core:default`. Toute la logique vit dans le frontend TypeScript. Ne pas ajouter de dépendance réseau, de télémétrie ni de SDK tiers : l'app est publiée sur F-Droid sans permission `INTERNET` (à retirer de `src-tauri/gen/android/app/src/main/AndroidManifest.xml` après `tauri android init`).

**État unique dans `App.tsx`.** Un seul objet `AppData` (`src/types/models.ts`) contient foyers, convives, tags de contraintes, invitations et réglages. `App.tsx` détient le `useState<AppData>`, tous les handlers CRUD, et le transmet aux écrans (`InvitationsTab`, `ConvivesTab`, `InvitationEditor`, `SettingsModal` → `SettingsScreen`) via props ; pas de contexte ni de store externe. Un `useEffect` persiste l'intégralité de `AppData` à chaque changement.

**Persistance** (`src/services/storage.ts`) : `localStorage` sous la clé `attables_db_v1`. Premier lancement ou JSON illisible → données d'exemple (`createSampleData`). `migrateAndValidateAppData` sert à la fois au chargement et à la restauration d'une sauvegarde `.json` : tout nouveau champ de `AppData` doit y être normalisé (valeur par défaut), et un changement de structure incompatible implique d'incrémenter `CURRENT_DATA_VERSION` et d'ajouter la migration.

**Annulation** : les actions destructrices (suppression, passage en réalisée, restauration, reset) capturent le `data` précédent comme snapshot et appellent `showUndo(message, snapshot)` ; le bandeau `UndoBanner` restaure le snapshot pendant 7 s. Les nouvelles actions destructrices doivent suivre ce schéma.

**Logique métier** (`src/utils/dishes.ts`, fonctions pures) :
- Seules les invitations `statut === 'realisee'` alimentent la mémoire des plats servis (`getDishesServedToGuests`).
- Les plats sont comparés via `normalizeForCompare` (insensible à la casse, aux accents, œ/æ) ; `formatDishInput` normalise l'affichage.
- `settings.prescriptionMois` (1–60, défaut 6) sépare « servi récemment » de « peut revenir ».
- Verdict d'un plat = `menuVerdicts[course]` sinon `verdict` global de l'invitation.
- Contraintes : tags `strict` (allergies, alertes fortes) vs `preference`, plus note libre par convive (`aggregateConstraints`).
- `buildAiPromptMarkdown` génère le prompt pour une IA externe, **anonymisé par défaut** (pas de prénoms ni d'hôte) ; préserver cette garantie.

**Navigation Android** : `useAndroidBack(active, onBack)` empile chaque vue/modale/sheet ouverte dans `history` pour que le bouton Retour ferme l'overlay du dessus plutôt que de quitter l'app. Toute nouvelle modale ou vue plein écran doit l'utiliser. `useAutoHideChrome` masque l'en-tête/la barre d'onglets au défilement.

**Thème** : couleurs en variables CSS dans `src/index.css` (`:root` = « Sable » clair, `.dark` = « Nuit marine »), variante Tailwind `dark` basée sur la classe `.dark` posée sur `<html>` par `App.tsx` (qui met aussi à jour `meta[name=theme-color]`). Utiliser les tokens (`var(--ink)`, `var(--primary)`…) plutôt que des couleurs en dur. Polices auto-hébergées via `@fontsource` (Baumans pour `.font-display`, Source Sans 3).

**Identifiants** : générés côté client par préfixe + `Date.now()` (`inv-…`, `conv-…`, `foyer-…`, `tag-…`).

## Publication

- Versions à garder synchronisées : `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, plus un changelog `fastlane/metadata/android/{fr-FR,en-US}/changelogs/<versionCode>.txt`.
- Identifiant Android : `attables.biovibralyon.fr`.
- Ne jamais commiter `*.apk`, `*.aab`, `*.jks`, `keystore.properties` (déjà dans `.gitignore`). F-Droid exige `Cargo.lock` et `pnpm-lock.yaml` commités (`--frozen-lockfile`).
- `src-tauri/gen/android/app/build.gradle.kts` contient un bloc `signingConfigs` ajouté à la main (signature release seulement si `keystore.properties` existe) : à préserver si le projet Android est régénéré.
