# Guide de soumission F-Droid — Attablés

Ce document récapitule les éléments déjà en place dans le dépôt et les étapes à effectuer sous Debian avant d’ouvrir une demande d’ajout (*Merge Request*) sur **`fdroiddata`**.

---

## 1. Ce qui est déjà préparé dans ce dépôt

- **Licence conforme F-Droid :** `GPL-3.0-or-later` (`LICENSE` + `package.json` + `src-tauri/Cargo.toml`).
- **Dépendances JavaScript épurées :** aucun SDK Google/Firebase/IA, aucune télémétrie, aucun serveur distant ni police distante (polices `@fontsource/baumans` et `@fontsource/source-sans-3` embarquées localement).
- **Métadonnées Fastlane (`fr-FR` et `en-US`) :**
  - `fastlane/metadata/android/fr-FR/` (`title.txt`, `short_description.txt`, `full_description.txt`, `changelogs/1.txt`, `images/icon.png`, `images/featureGraphic.png`)
  - `fastlane/metadata/android/en-US/` (équivalent anglais complet)
- **Squelette Tauri v2 minimal :** `src-tauri/` (`tauri.conf.json`, `Cargo.toml`, `build.rs`, `src/lib.rs`, `src/main.rs`, `capabilities/default.json`), sans plugin superflu.
- **`.gitignore` durci :** exclut `.apk`, `.aab`, `.jks`, `.keystore`, `keystore.properties`, `src-tauri/target/`, `.gradle/`, `local.properties` et `build/`.

---

## 2. Préparation locale sous Debian avant le tag `v0.1.0`

F-Droid recompile l’application **entièrement depuis les sources** à partir d’un tag Git annoté (`v0.1.0`).  
Toutes les commandes pas à pas (génération de `pnpm-lock.yaml`, `Cargo.lock`, icônes, `tauri android init`, suppression de la permission `INTERNET`, ajout des captures `phoneScreenshots/`, vérification `git status` et pose du tag `v0.1.0`) sont centralisées dans [`BUILD_ANDROID_DEBIAN.md`](./BUILD_ANDROID_DEBIAN.md) (sections **2 à 7**).

---

## 3. Recette `fdroiddata` (`metadata/attables.biovibralyon.fr.yml`)

Lors de votre Merge Request sur <https://gitlab.com/fdroid/fdroiddata>, créez le fichier `metadata/attables.biovibralyon.fr.yml` sur ce modèle (ajustez `commit: v0.1.0`, `ndk:` selon la version installée sur votre machine de test, et les architectures ciblées) :

```yaml
Categories:
  - Time
License: GPL-3.0-or-later
AuthorName: Stéphane MICHEL — BioVibraLyon
AuthorEmail: stephane@biovibralyon.fr
AuthorWebSite: https://github.com/Tux69140/attables
SourceCode: https://github.com/Tux69140/attables
IssueTracker: https://github.com/Tux69140/attables/issues
Changelog: https://github.com/Tux69140/attables/releases

AutoName: Attablés

RepoType: git
Repo: https://github.com/Tux69140/attables.git

Builds:
  - versionName: '0.1.0'
    versionCode: 1
    commit: v0.1.0
    subdir: src-tauri/gen/android
    sudo:
      - apt-get update
      - apt-get install -y nodejs npm curl build-essential pkg-config libssl-dev
      - npm install -g pnpm
      - curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
      - /root/.cargo/bin/rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android
    output: app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk
    srclibs:
      - none
    prebuild:
      - export PATH="$HOME/.cargo/bin:$PATH"
      - pushd ../../..
      - pnpm install --frozen-lockfile --ignore-scripts
      - pnpm build
      - popd
    build:
      - export PATH="$HOME/.cargo/bin:$PATH"
      - export NDK_HOME="$ANDROID_NDK"
      - pushd ../..
      - cargo tauri android build --apk --target aarch64 armv7
      - popd
    ndk: r27c

AutoUpdateMode: Version
UpdateCheckMode: Tags
CurrentVersion: '0.1.0'
CurrentVersionCode: 1
```

> **Note importante pour la recette F-Droid :**
> - Vérifiez auprès de `fdroiddata` si `nodejs` ≥ 20 doit être installé via NodeSource ou `nvm` dans `sudo:` selon l’image Debian de l’environnement `fdroidserver` au moment de la soumission.
> - Si vous préférez utiliser Gradle directement après compilation des bibliothèques Rust (`cargo tauri android build --apk` vs `cargo ndk` + `./gradlew assembleUniversalRelease`), testez d’abord localement avec `fdroidserver` :
>   ```bash
>   fdroid readmeta
>   fdroid lint attables.biovibralyon.fr
>   fdroid build -v -l attables.biovibralyon.fr
>   ```
> - Vérifiez également le fichier APK généré avec `fdroid scanner` pour confirmer **zéro bibliothèque propriétaire** détectée.
