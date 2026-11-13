# Guide de compilation APK Android sous Debian (Tauri v2)

Ce guide décrit les étapes pour empaqueter l’application **Attablés** en fichier `.apk` Android sur une machine Debian disposant déjà de Node.js, Rust, du JDK, du SDK/NDK Android et de Tauri CLI v2.

---

## 1. Vérifier les variables d’environnement Android

Assurez-vous que ces variables sont bien exportées dans votre shell (`~/.bashrc` ou `~/.zshrc`) :

```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export ANDROID_HOME="$HOME/Android/Sdk"
export NDK_HOME="$ANDROID_HOME/ndk/<votre-version-ndk>"
export PATH="$PATH:$ANDROID_HOME/platform-tools"
```

Vérifiez rapidement que tout répond :

```bash
node -v
rustc --version
java -version
adb --version
```

---

## 2. Installer les dépendances et initialiser Tauri v2

Placez-vous à la racine du projet :

```bash
npm install
npm install -D @tauri-apps/cli@^2
npx tauri init
```

Réponses recommandées lors de `npx tauri init` :
- **App name** : `Attablés`
- **Window title** : `Attablés`
- **Web assets location (`frontendDist`)** : `../dist`
- **Dev server URL (`devUrl`)** : `http://localhost:3000`
- **Frontend dev command** : `npm run dev`
- **Frontend build command** : `npm run build`

Dans `src-tauri/tauri.conf.json`, vérifiez que l’identifiant applicatif (`identifier`) est un identifiant Android valide sans accent ni tiret, par exemple :

```json
"identifier": "fr.personnel.attables"
```

---

## 3. Initialiser la cible Android

Générez le projet Gradle Android géré par Tauri :

```bash
npx tauri android init
```

Le projet Android est créé dans `src-tauri/gen/android`.

---

## 4. Compiler l’APK

### Option A — APK Debug (test et installation directe rapide)

```bash
npx tauri android build --apk --debug
```

L’APK généré se trouve à :
`src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk`

### Option B — APK Release signé (pour usage quotidien)

1. Créez un keystore de signature (à faire une seule fois) :

   ```bash
   keytool -genkey -v -keystore ~/attables-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias attables
   ```

2. Créez le fichier `src-tauri/gen/android/keystore.properties` :

   ```properties
   password=VOTRE_MOT_DE_PASSE
   keyAlias=attables
   storeFile=/home/VOTRE_UTILISATEUR/attables-release.jks
   ```

3. Lancez la compilation :

   ```bash
   npx tauri android build --apk
   ```

L’APK signé se trouve à :
`src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk`

*(Astuce : si vous ne ciblez que des téléphones récents ARM64 et souhaitez un APK plus léger et plus rapide à compiler, ajoutez `--target aarch64` à la commande `tauri android build`.)*

---

## 5. Installer l’APK sur votre appareil Android

### Par câble USB (avec débogage USB activé)

```bash
adb install -r src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```

### Sans câble

Transférez le fichier `.apk` sur votre téléphone puis ouvrez-le depuis le gestionnaire de fichiers Android.
