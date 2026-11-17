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

## 2. Préparation locale sous Debian avant le tag `v<version>`

F-Droid recompile l’application **entièrement depuis les sources** à partir d’un tag Git annoté `v<version>` (version de `package.json`, par exemple `v0.2.1`).  
Toutes les commandes pas à pas (génération de `pnpm-lock.yaml`, `Cargo.lock`, icônes, `tauri android init`, suppression de la permission `INTERNET`, ajout des captures `phoneScreenshots/`, vérification `git status` et pose du tag `v<version>`) sont centralisées dans [`BUILD_ANDROID_DEBIAN.md`](./BUILD_ANDROID_DEBIAN.md) (sections **2 à 7**).

---

## 3. Recette `fdroiddata` (`metadata/attables.biovibralyon.fr.yml`)

Lors de votre Merge Request sur <https://gitlab.com/fdroid/fdroiddata>, créez le fichier `metadata/attables.biovibralyon.fr.yml` sur ce modèle (ajustez `commit:`, `versionName`, les deux `versionCode` et `--config`, et `ndk:` selon la version installée sur votre machine de test) :

```yaml
Categories:
  - Time
License: GPL-3.0-or-later
AuthorName: Stéphane MICHEL — BioVibraLyon
AuthorEmail: stephane@biovibralyon.fr
AuthorWebSite: https://github.com/Tux69140/attables
SourceCode: https://github.com/Tux69140/attables
IssueTracker: https://github.com/Tux69140/attables/issues
Changelog: https://attables.biovibralyon.fr/notes-de-version.html

AutoName: Attablés

RepoType: git
Repo: https://github.com/Tux69140/attables.git

Builds:
  - versionName: '0.2.1'
    versionCode: 20011
    commit: v0.2.1
    subdir: src-tauri/gen/android
    sudo: &sudo
      - apt-get update
      - apt-get install -y nodejs npm curl build-essential pkg-config libssl-dev
      - npm install -g pnpm@10.33.4
      - curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
      - /root/.cargo/bin/rustup target add aarch64-linux-android armv7-linux-androideabi
    output: app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk
    srclibs:
      - none
    build:
      - export PATH="$HOME/.cargo/bin:$PATH"
      - export NDK_HOME="$ANDROID_NDK"
      - pushd ../../..
      - pnpm install --frozen-lockfile --ignore-scripts
      - pnpm tauri android build --apk --target armv7 --config '{"bundle":{"android":{"versionCode":20011}}}'
      - popd
    ndk: r27c

  - versionName: '0.2.1'
    versionCode: 20012
    commit: v0.2.1
    subdir: src-tauri/gen/android
    sudo: *sudo
    output: app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk
    srclibs:
      - none
    build:
      - export PATH="$HOME/.cargo/bin:$PATH"
      - export NDK_HOME="$ANDROID_NDK"
      - pushd ../../..
      - pnpm install --frozen-lockfile --ignore-scripts
      - pnpm tauri android build --apk --target aarch64 --config '{"bundle":{"android":{"versionCode":20012}}}'
      - popd
    ndk: r27c

AutoUpdateMode: Version
UpdateCheckMode: Tags
VercodeOperation:
  - 10 * %c + 1
  - 10 * %c + 2
CurrentVersion: '0.2.1'
CurrentVersionCode: 20012
```

> **Un paquet par architecture (décision de l'auteur) :** une construction par ABI, donc deux APK distincts sur F-Droid, chacun ne portant qu'une architecture (`armeabi-v7a` ou `arm64-v8a`, la bibliothèque native et le site embarqué pèsent ~23 Mo par ABI). F-Droid exige un `versionCode` distinct par APK. Schéma retenu, celui de la documentation F-Droid (`VercodeOperation`, « utile pour les applis compilées pour plusieurs ABI ») : `versionCode = 10 × code de base + chiffre d'ABI`, avec le code de base calculé par Tauri (majeure × 1 000 000 + mineure × 1 000 + correctif, `2001` pour `0.2.1`) et le chiffre `1` pour armeabi-v7a, `2` pour arm64-v8a (le 64 bits a le plus grand code : un téléphone qui accepte les deux reçoit le 64 bits). Soit `20011` et `20012` pour `0.2.1`. Tauri n'a pas d'option « un code par ABI » : chaque construction fixe le sien avec `--config '{"bundle":{"android":{"versionCode":N}}}'`, fusionné par la CLI dans `tauri.conf.json` (vérifié en local : `tauri.properties` reçoit `tauri.android.versionCode=N`). Ces codes ne concernent que F-Droid ; les APK du site portent le code de base (`2001`) et le Play Store reçoit l'AAB (code de base, découpé par Google). À chaque nouvelle version, mettre à jour les deux `versionCode:`, les deux `--config` et `CurrentVersionCode` (le plus grand des deux).
>
> **Notes de version par ABI :** F-Droid cherche `fastlane/metadata/android/<langue>/changelogs/<versionCode>.txt` pour chaque APK. À chaque version, ajouter dans `fr-FR` et `en-US` les **copies** (pas des liens symboliques, mal gérés par les outils F-Droid/fastlane et par les extractions Windows) `<10 × code + 1>.txt` et `<10 × code + 2>.txt` du fichier `<code>.txt` (0.2.1 : `20011.txt` et `20012.txt`, copies de `2001.txt`). Le site les ignore (`site/outils/notes.ts`).
>
> **À vérifier avant la soumission :** (1) que `UpdateCheckMode: Tags` retrouve bien le code de base `%c` pour un projet Tauri (le `versionCode` n'est pas écrit en dur dans le dépôt : `tauri.properties` est généré) ; sinon passer à `UpdateCheckMode: HTTP` avec `UpdateCheckData` pointant sur un fichier du dépôt, ou renseigner les `Builds` à la main ; (2) que `AutoUpdateMode: Version` génère bien les deux blocs avec leur `--config` (le nombre de blocs égale le nombre d'opérations de `VercodeOperation`), sinon les ajouter à la main à chaque version ; (3) l'ancre YAML `&sudo` / `*sudo` : si `fdroid lint` la refuse, recopier la liste dans le second bloc.
>
> **Note importante pour la recette F-Droid :**
> - Le projet utilise **pnpm** (version épinglée dans `package.json` → `packageManager`, à garder synchronisée avec la ligne `npm install -g pnpm@…`). `pnpm install --frozen-lockfile` échoue si `pnpm-lock.yaml` n’est pas commité ou pas à jour.
> - L’installation des dépendances Node se fait dans `build:` et non dans `prebuild:` : le scanner F-Droid s’exécute entre les deux, et `node_modules/` contient des binaires précompilés (esbuild, CLI Tauri) qu’il signalerait.
> - `pnpm tauri android build` (lancé depuis la racine) exécute lui-même `pnpm build` via `beforeBuildCommand` de `tauri.conf.json`. Sans les variables `ATTABLES_KEYSTORE` / `ATTABLES_KEYSTORE_MDP` (posées uniquement par `scripts/fabriquer-apk.sh`), Gradle produit l’APK `-unsigned` attendu par `output:` ; F-Droid le signe avec sa propre clé.
> - Vérifiez auprès de `fdroiddata` si `nodejs` ≥ 20 doit être installé via NodeSource ou `nvm` dans `sudo:` selon l’image Debian de l’environnement `fdroidserver` au moment de la soumission.
> - Si vous préférez utiliser Gradle directement après compilation des bibliothèques Rust (`cargo tauri android build --apk` vs `cargo ndk` + `./gradlew assembleUniversalRelease`), testez d’abord localement avec `fdroidserver` :
>   ```bash
>   fdroid readmeta
>   fdroid lint attables.biovibralyon.fr
>   fdroid build -v -l attables.biovibralyon.fr
>   ```
> - Vérifiez également le fichier APK généré avec `fdroid scanner` pour confirmer **zéro bibliothèque propriétaire** détectée.
>
> **Builds reproductibles (futur) :** si F-Droid publie un jour des APK signés avec la clé de l'auteur (builds reproductibles), les versionCode `10 × code + 1/2` de F-Droid et le code de base (`2001`) des APK du site coexisteraient sous la même signature : Android refuserait de « mettre à jour » vers un code plus bas, et un APK du site ne remplacerait plus proprement celui de F-Droid. Il faudrait alors aligner les schémas (par exemple adopter les mêmes codes par ABI sur le site).
