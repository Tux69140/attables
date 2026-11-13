# Guide complet de compilation locale & préparation F-Droid sous Debian (Tauri v2)

Ce document centralise **toutes les tâches et commandes à exécuter sur votre machine Debian** pour compiler l’application **Attablés** (`.apk` / `.aab`), préparer le dépôt GitHub et finaliser les prérequis pour **Google Play** et **F-Droid**.

*(Fiches store et soumission : voir [`PLAY_STORE.md`](./PLAY_STORE.md) pour la Google Play Console et [`F_DROID.md`](./F_DROID.md) pour la recette YAML `fdroiddata`.)*

---

## 0. Cloner ou mettre à jour le dépôt depuis GitHub

### Premier téléchargement sur votre machine Debian

```bash
# HTTPS :
git clone https://github.com/Tux69140/attables.git
cd attables

# Ou via SSH (si votre clé SSH GitHub est configurée) :
# git clone git@github.com:Tux69140/attables.git && cd attables
```

### Mises à jour ultérieures

```bash
cd attables
git pull origin main
```

---

## 1. Vérifier l’environnement Debian (Node, Rust, JDK, SDK/NDK)

Assurez-vous que ces variables sont exportées dans votre shell (`~/.bashrc` ou `~/.zshrc`) :

```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export ANDROID_HOME="$HOME/Android/Sdk"
export NDK_HOME="$ANDROID_HOME/ndk/<votre-version-ndk>"
export PATH="$PATH:$ANDROID_HOME/platform-tools"
```

Vérifiez que les outils répondent et installez les cibles Rust Android si ce n’est pas déjà fait :

```bash
node -v        # >= 20 recommandé
rustc --version
java -version
adb --version
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android
```

---

## 2. Installer les dépendances et générer les lockfiles reproductibles

Le dossier `src-tauri/` est déjà préconfiguré (`identifier: "attables.biovibralyon.fr"`, licence `GPL-3.0-or-later`). À la racine du projet :

```bash
# 1. Installer les paquets Node et générer package-lock.json
npm install

# 2. Installer Tauri CLI v2 en dépendance de développement
npm install -D @tauri-apps/cli@^2

# 3. Générer Cargo.lock pour garantir un build Rust reproductible (requis par F-Droid)
(cd src-tauri && cargo generate-lockfile)
```

---

## 3. Générer les icônes, initialiser Android et retirer la permission `INTERNET`

### 3.1 Générer les icônes et le projet Gradle Android

```bash
npx tauri icon store-assets/icon-512x512.png
npx tauri android init
```

Le projet Android est généré dans `src-tauri/gen/android/`.

### 3.2 Supprimer la permission réseau ajoutée par défaut

**Attablés** fonctionne 100 % hors ligne. Tauri insère parfois `<uses-permission android:name="android.permission.INTERNET" />` dans `src-tauri/gen/android/app/src/main/AndroidManifest.xml`. Vérifiez et retirez cette ligne pour qu’aucune permission réseau ne soit demandée sur F-Droid ou Google Play :

```bash
grep -n "android.permission.INTERNET" src-tauri/gen/android/app/src/main/AndroidManifest.xml
```

Si une ligne apparaît, supprimez-la :

```bash
sed -i '/android\.permission\.INTERNET/d' src-tauri/gen/android/app/src/main/AndroidManifest.xml
```

---

## 4. Ajouter les captures d’écran Fastlane (avant tag Git)

Les textes et visuels (`icon.png`, `featureGraphic.png`) sont déjà prêts dans `fastlane/metadata/android/fr-FR/` et `en-US/`.  
Il reste à déposer **2 à 4 captures d’écran téléphone PNG** (ex. `1080 × 1920` ou `1080 × 2400`) :

1. Prenez vos captures depuis l’application installée (voir section 6) : accueil *Invitations*, *Préparer une invitation* (alerte allergie/doublon), *Convives*, et thème sombre *Nuit marine*.
2. Copiez-les sous `01.png`, `02.png`, `03.png`, `04.png` dans :
   - `fastlane/metadata/android/fr-FR/images/phoneScreenshots/`
   - `fastlane/metadata/android/en-US/images/phoneScreenshots/`
3. Supprimez les fichiers `.gitkeep` devenus inutiles :

```bash
rm -f fastlane/metadata/android/fr-FR/images/phoneScreenshots/.gitkeep \
      fastlane/metadata/android/en-US/images/phoneScreenshots/.gitkeep
```

---

## 5. Compiler l’APK ou le bundle `.aab`

### Option A — APK Debug (test rapide sur téléphone)

```bash
npx tauri android build --apk --debug
```

Fichier généré :  
`src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk`

### Option B — APK Release signé (distribution directe / test production)

1. Créez un keystore de signature (une seule fois, **en dehors du dépôt Git**) :

   ```bash
   keytool -genkey -v -keystore ~/attables-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias attables
   ```

2. Créez le fichier `src-tauri/gen/android/keystore.properties` (déjà ignoré par `.gitignore`) :

   ```properties
   password=VOTRE_MOT_DE_PASSE
   keyAlias=attables
   storeFile=/home/VOTRE_UTILISATEUR/attables-release.jks
   ```

3. Compilez l’APK Release :

   ```bash
   npx tauri android build --apk
   ```

Fichier généré :  
`src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk`

*(Astuce : ajoutez `--target aarch64` pour compiler plus vite uniquement pour téléphones ARM64.)*

### Option C — Bundle `.aab` signé (Google Play Store)

Avec le même `keystore.properties` configuré :

```bash
npx tauri android build --aab
```

Fichier généré :  
`src-tauri/gen/android/app/build/outputs/bundle/universalRelease/app-universal-release.aab`

*(Voir [`PLAY_STORE.md`](./PLAY_STORE.md) pour la fiche et les déclarations Play Console.)*

---

## 6. Installer et tester l’APK sur votre appareil Android

### Par câble USB (débogage USB activé)

```bash
adb install -r src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```

### Sans câble

Transférez le fichier `.apk` sur votre téléphone puis ouvrez-le depuis le gestionnaire de fichiers Android.

---

## 7. Contrôle final, tag GitHub `v0.1.0` & vérification F-Droid

Avant de publier sur GitHub et de soumettre sur `fdroiddata` :

### 7.1 Vérifier qu’aucun binaire ni secret n’est suivi par Git

```bash
git status
```

Assurez-vous qu’il n’y a **aucun** fichier `.apk`, `.aab`, `.jks`, `.keystore` ni `keystore.properties` dans les fichiers suivis.

### 7.2 Commiter et poser le tag `v0.1.0`

```bash
npm run lint
npm run build
git add package.json package-lock.json src-tauri/ fastlane/
git commit -m "Prepare v0.1.0 Android & F-Droid release"
git tag -a v0.1.0 -m "Version 0.1.0"
git push origin main --tags
```

### 7.3 Tester la recette F-Droid localement (si `fdroidserver` est installé)

Après avoir copié le modèle de recette de [`F_DROID.md`](./F_DROID.md) dans votre clone de `fdroiddata` (`metadata/attables.biovibralyon.fr.yml`) :

```bash
fdroid readmeta
fdroid lint attables.biovibralyon.fr
fdroid build -v -l attables.biovibralyon.fr
fdroid scanner src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```

*(Le scanner doit confirmer 0 bibliothèque propriétaire détectée.)*
