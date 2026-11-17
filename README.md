# Attablés

**Attablés** est un carnet d’invitations personnel **100 % hors ligne**, conçu pour Android (via Tauri v2) afin d’organiser vos repas entre proches sans jamais oublier une allergie ni resservir trop vite le même plat.

- **Dépôt officiel :** <https://github.com/Tux69140/attables>
- **Identifiant Android :** `attables.biovibralyon.fr`
- **Concepteur :** Stéphane MICHEL — BioVibraLyon (`stephane@biovibralyon.fr`)
- **Licence :** [GNU GPL v3.0 ou ultérieure](./LICENSE) (`GPL-3.0-or-later`)

---

## Fonctionnalités principales

- **Suivi des invitations** : distinction entre repas *Prévus* et *Réalisés*, filtres par hôte (*Chez moi / Chez les autres*) et par statut, passage rapide en *Réalisée*, action **Réinviter ce groupe** en un geste.
- **Annuaire par foyers & convives** : regroupement par foyer avec pavés couleur/pictogramme pour cocher toute une famille en un clic, fiches détaillées avec historique complet des repas et plats déjà servis.
- **Allergies strictes & préférences** : tags paramétrables distinguant les interdits stricts (alertes visuelles dédiées) des préférences, plus un rappel automatique des allergies strictes au-dessus de la saisie du menu.
- **Mémoire anti-doublon intelligente** :
  - Seuls les repas *Réalisés* alimentent la mémoire.
  - **Prescription temporelle** paramétrable dans les réglages (6 mois par défaut) : alerte forte *« Servi récemment »* vs mention douce *« peut revenir »*.
  - **Appréciations rapides** sur les repas réalisés (*Coup de cœur*, *Bien*, *À éviter*), par plat et sur le repas global.
- **Export Markdown pour une IA externe** : génération d’un prompt structuré **anonymisé par défaut**, s’appuyant sur les coups de cœur passés et les plats à éviter. Les prénoms et le nom d’hôte n’y figurent pas ; vos notes libres sont reprises telles quelles : relisez-les avant de coller.
- **100 % privé & local** : aucune collecte, aucune télémétrie, aucun SDK tiers ; sauvegarde et restauration par fichier `.json`.
- **Thèmes clair & sombre** : *Sable* et *Nuit marine*, avec suivi automatique du mode système Android.

---

## Développement local

Prérequis : Node.js ≥ 22 (motifs de fichiers de `node --test`) et pnpm (version épinglée dans `package.json` → `packageManager`).

```bash
pnpm install
pnpm dev          # Serveur de développement sur http://localhost:3000
pnpm lint         # Vérification TypeScript (tsc --noEmit)
pnpm test         # Tests (node:test + tsx) : src/**/*.test.ts et site/**/*.test.ts
pnpm build        # Build de production dans dist/
```

---

## Site de présentation

Le site <https://attables.biovibralyon.fr/> (page d’accueil, démo web, notes de version, téléchargement des APK, pages légales) vit dans `site/` et se construit dans `dist-site/`.

```bash
pnpm site:dev                          # site en local
pnpm site:captures                     # régénère les captures (Playwright, données d’exemple)
SITE_APK_FACTICE=1 pnpm site:build     # build du site avec un APK factice (vérification locale seulement)
pnpm build:demo                        # démo web dans dist-site/demo/ (après site:build), sans rien enregistrer
```

Le site propose deux APK signés : `attables-<version>.apk` (64 bits, bouton principal) et `attables-<version>-32bits.apk` (secours pour les téléphones anciens), fabriqués par `scripts/fabriquer-apk.sh` dans `dist-android/`.

Déploiement en deux temps :

1. `scripts/deployer-site.sh --essai` : construit, vérifie les deux APK (signature, empreinte épinglée), puis montre ce que `rsync` enverrait, sans rien transférer ;
2. `scripts/deployer-site.sh` : même chose, puis envoi réel après avoir tapé « oui », et contrôles en ligne (HTTP, en-têtes de sécurité).

Les pages légales (`site/mentions-legales.html`, `confidentialite.html`, `conditions-utilisation.html`) sont générées depuis le dépôt `Textes-legaux` (`node fabriquer.mjs attables <chemin>/site`) : ne pas les modifier à la main.

---

## Compilation Android & Publication (Play Store & F-Droid)

- **Compiler l’APK ou le bundle `.aab` sous Debian (Tauri v2)** : voir [`BUILD_ANDROID_DEBIAN.md`](./BUILD_ANDROID_DEBIAN.md)
- **Préparer la mise en ligne sur Google Play Console** : voir [`PLAY_STORE.md`](./PLAY_STORE.md)
- **Préparer la soumission sur F-Droid** : voir [`F_DROID.md`](./F_DROID.md) et [`fastlane/metadata/android/`](./fastlane/metadata/android)
- **Politique de confidentialité** : <https://attables.biovibralyon.fr/confidentialite.html> (version Markdown : [`PRIVACY_POLICY.md`](./PRIVACY_POLICY.md))
- **Visuels Store** (`512×512` et `1024×500`) : disponibles dans [`store-assets/`](./store-assets)

---

## Auteur & Licence

Copyright © 2026 **Stéphane MICHEL — BioVibraLyon** (<stephane@biovibralyon.fr>)

Ce programme est un logiciel libre : vous pouvez le redistribuer et/ou le modifier selon les termes de la **Licence Publique Générale GNU (GNU GPL v3.0)** publiée par la Free Software Foundation (version 3 de la licence ou, à votre choix, toute version ultérieure).

En particulier, toute version modifiée ou œuvre dérivée redistribuée **doit rester open source sous licence GNU GPL v3.0** et **conserver la mention de l’auteur original (Stéphane MICHEL — BioVibraLyon, `stephane@biovibralyon.fr`)** ainsi que l’accès au code source correspondant.

Consultez le fichier [`LICENSE`](./LICENSE) pour le texte complet de la licence.

**Composants tiers :** les icônes viennent de [Lucide](https://lucide.dev) (licence ISC, voir [`src/icones/LICENCE-lucide.txt`](./src/icones/LICENCE-lucide.txt)), recopiées dans `src/icones/svg/` ; les pictogrammes arachide, céleri, moutarde, sésame, ail, chocolat et assemblée sont dessinés pour Attablés (GPL-3.0-or-later).
