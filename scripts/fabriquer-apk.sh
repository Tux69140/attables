#!/usr/bin/env bash
# Fabrique les deux APK release signés d'Attablés, une seule architecture chacun
# (64 bits : attables-<version>.apk, 32 bits : attables-<version>-32bits.apk),
# ou le bundle .aab universel pour Google Play avec --aab (Play le découpe par
# appareil).
#
# Usage : scripts/fabriquer-apk.sh [--aab]
#
# Sortie : dist-android/attables-<version>.apk et attables-<version>-32bits.apk
# (ou attables-<version>.aab), non versionnés.
#
# La clé est TOUJOURS ~/.android-keys/attables-release.jks (alias « attables ») ;
# sa copie et son mot de passe sont dans KeePassXC (entrée « Attablés - clé de
# signature Android », pièce jointe attables-release.jks). Son empreinte est
# épinglée dans src-tauri/empreinte-cle-android.txt : une autre clé est refusée.
#
# Le mot de passe est demandé UNE fois, sans écho, vérifié sur la clé AVANT la
# longue compilation, puis transmis à Gradle par l'environnement seulement
# (jamais sur une ligne de commande, jamais dans un fichier) et effacé à la fin.
# Ni démon Gradle ni cache de configuration Gradle : ils garderaient le mot de
# passe en mémoire ou sur le disque après la fabrication.
set -euo pipefail
shopt -s inherit_errexit
unset ATTABLES_KEYSTORE ATTABLES_KEYSTORE_MDP
cd "$(dirname "$0")/.."

arret() { echo "ERREUR : $*" >&2; exit 1; }

FORMAT=apk
case "${1:-}" in
    '') ;;
    --aab) FORMAT=aab ;;
    -h|--help) sed -n '2,21p' "$0"; exit 0 ;;
    *) arret "option inconnue : $1 (usage : $0 [--aab])" ;;
esac
[ $# -le 1 ] || arret "une seule option à la fois (usage : $0 [--aab])"

CLE=$HOME/.android-keys/attables-release.jks
ALIAS=attables
EMPREINTE_FICHIER=src-tauri/empreinte-cle-android.txt
SORTIE=dist-android

# ── Version : les trois fichiers doivent dire la même chose ───────────────────
VERSION=$(node -p "require('./package.json').version")
TAURI_VERSION=$(node -p "require('./src-tauri/tauri.conf.json').version")
CARGO_VERSION=$(sed -n 's/^version = "\(.*\)"$/\1/p' src-tauri/Cargo.toml | head -n1)
[[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || arret "version de package.json illisible : $VERSION"
[ "$VERSION" = "$TAURI_VERSION" ] && [ "$VERSION" = "$CARGO_VERSION" ] ||
    arret "versions différentes : package.json $VERSION, tauri.conf.json $TAURI_VERSION, Cargo.toml $CARGO_VERSION"

# ── Notes de version (vérifiées avant le mot de passe) ────────────────────────
# versionCode Tauri : majeure × 1 000 000 + mineure × 1 000 + correctif. F-Droid
# construit une fois par ABI et cherche aussi <10 × code + 1>.txt et <10 × code + 2>.txt.
IFS=. read -r MAJEURE MINEURE CORRECTIF <<<"$VERSION"
CODE=$((10#$MAJEURE * 1000000 + 10#$MINEURE * 1000 + 10#$CORRECTIF))
for langue in fr-FR en-US; do
    for code in "$CODE" "$((CODE * 10 + 1))" "$((CODE * 10 + 2))"; do
        notes=fastlane/metadata/android/$langue/changelogs/$code.txt
        [ -s "$notes" ] ||
            arret "notes de version absentes ou vides : $notes (version $VERSION, versionCode $CODE). Les écrire avant de fabriquer."
    done
done

# ── Outils et cibles Rust (vérifiés avant le mot de passe) ────────────────────
KEYTOOL=${JAVA_HOME:+$JAVA_HOME/bin/}keytool
command -v "$KEYTOOL" >/dev/null || arret "keytool introuvable (JAVA_HOME=${JAVA_HOME:-non défini})."
APKSIGNER=''
for sdk in "${ANDROID_HOME:-}" "${ANDROID_SDK_ROOT:-}" "$HOME/Android/Sdk"; do
    [ -n "$sdk" ] && [ -d "$sdk/build-tools" ] || continue
    APKSIGNER=$(find "$sdk/build-tools" -mindepth 2 -maxdepth 2 -name apksigner -type f 2>/dev/null | sort -V | tail -n1)
    [ -n "$APKSIGNER" ] && break
done
[ -n "$APKSIGNER" ] || arret "apksigner introuvable (SDK Android : build-tools)."
command -v unzip >/dev/null || arret "unzip introuvable : il faut l'installer (sudo apt install unzip)."
command -v rustup >/dev/null || arret "rustup introuvable."
CIBLES_RUST=$(rustup target list --installed)
for cible in aarch64-linux-android armv7-linux-androideabi; do
    grep -qx "$cible" <<<"$CIBLES_RUST" ||
        arret "cible Rust $cible absente : taper « rustup target add $cible », puis relancer."
done

# ── Clé, empreinte épinglée et mot de passe ───────────────────────────────────
[ -f "$CLE" ] ||
    arret "clé introuvable : $CLE — la recopier depuis KeePassXC (pièce jointe attables-release.jks)."
[ -f "$EMPREINTE_FICHIER" ] || arret "$EMPREINTE_FICHIER absent : empreinte de la clé inconnue."
EPINGLEE=$(grep -E '^[0-9a-f]{64}$' "$EMPREINTE_FICHIER" || true)
[ -n "$EPINGLEE" ] && [ "$(printf '%s\n' "$EPINGLEE" | wc -l)" = 1 ] ||
    arret "$EMPREINTE_FICHIER illisible : une seule ligne de 64 caractères hexadécimaux attendue."

trap 'unset ATTABLES_KEYSTORE_MDP' EXIT
IFS= read -rsp "Mot de passe de la clé Android (KeePassXC) : " ATTABLES_KEYSTORE_MDP; echo
[ -n "$ATTABLES_KEYSTORE_MDP" ] || arret "mot de passe vide."
export ATTABLES_KEYSTORE=$CLE ATTABLES_KEYSTORE_MDP
"$KEYTOOL" -list -keystore "$CLE" -alias "$ALIAS" -storepass:env ATTABLES_KEYSTORE_MDP >/dev/null 2>&1 ||
    arret "ce mot de passe n'ouvre pas la clé $CLE (alias $ALIAS). Rien n'a été fabriqué."
EMPREINTE_CLE=$("$KEYTOOL" -exportcert -keystore "$CLE" -alias "$ALIAS" -storepass:env ATTABLES_KEYSTORE_MDP 2>/dev/null |
    sha256sum | cut -d' ' -f1)
[ "$EMPREINTE_CLE" = "$EPINGLEE" ] ||
    arret "cette clé n'est PAS celle d'Attablés (empreinte $EMPREINTE_CLE, attendue $EPINGLEE). Rien n'a été fabriqué."
echo "Clé Android ouverte (empreinte conforme)."

# Ni démon Gradle ni cache de configuration (ils retiendraient le mot de passe).
export GRADLE_OPTS="${GRADLE_OPTS:+$GRADLE_OPTS }-Dorg.gradle.daemon=false -Dorg.gradle.configuration-cache=false"
mkdir -p "$SORTIE"

# ── Fabrication et contrôle de la signature ───────────────────────────────────
SORTIE_GRADLE=src-tauri/gen/android/app/build/outputs
# fabriquer_apk <cible tauri> <ABI attendue> <nom dans $SORTIE> : un APK signé
# d'une seule architecture, contrôlé (ABI, signature unique, empreinte de la
# clé épinglée) avant d'être rangé. Avec une seule cible, Tauri écrit quand
# même sous « universal ».
fabriquer_apk() {
    local cible=$1 abi=$2 nom=$3 fichier abis verif empreinte
    fichier=$SORTIE_GRADLE/apk/universal/release/app-universal-release.apk
    rm -f -- "$fichier" "${fichier%.apk}-unsigned.apk"   # jamais l'APK de la fabrication précédente
    pnpm tauri android build --apk --target "$cible"
    [ -f "$fichier" ] || arret "APK signé absent ($abi) : $fichier (signature non appliquée ?)."
    # Une seule architecture, et la bonne : sans sa bibliothèque l'appli ne
    # démarre pas ; une autre en plus doublerait la taille de l'APK.
    abis=$(unzip -Z1 "$fichier" 'lib/*' 2>/dev/null | cut -d/ -f2 | sort -u | paste -sd' ') || abis=''
    [ "$abis" = "$abi" ] ||
        arret "l'APK $nom doit porter la seule architecture $abi ; il porte : ${abis:-aucune}."
    verif=$("$APKSIGNER" verify --print-certs "$fichier" 2>&1) || arret "APK non signé ou signature invalide : $nom"
    [ "$(grep -c '^Signer #[0-9]* certificate SHA-256 digest: ' <<<"$verif")" = 1 ] ||
        arret "l'APK $nom doit porter exactement une signature."
    empreinte=$(sed -n 's/^Signer #1 certificate SHA-256 digest: \([0-9a-f]\{64\}\)$/\1/p' <<<"$verif")
    [ "$empreinte" = "$EPINGLEE" ] ||
        arret "$nom n'est pas signé par la clé d'Attablés (attendu $EPINGLEE, obtenu ${empreinte:-aucune signature})."
    cp -- "$fichier" "$SORTIE/$nom"
    ls -lh "$SORTIE/$nom"
    echo "APK $abi signé par la clé d'Attablés (certificat SHA-256 $empreinte)."
}

if [ "$FORMAT" = apk ]; then
    # Jamais un 32 bits d'une fabrication précédente à côté d'un 64 bits neuf.
    rm -f -- "$SORTIE/attables-$VERSION.apk" "$SORTIE/attables-$VERSION-32bits.apk"
    # 64 bits (aarch64, arm64-v8a) : le bouton principal du site.
    fabriquer_apk aarch64 arm64-v8a "attables-$VERSION.apk"
    # 32 bits (armv7, armeabi-v7a) : secours pour un téléphone ancien ou
    # d'entrée de gamme. Jamais dans le même APK que le 64 bits.
    fabriquer_apk armv7 armeabi-v7a "attables-$VERSION-32bits.apk"
    unset ATTABLES_KEYSTORE_MDP
    echo "Sur le téléphone, sans désinstaller : adb install -r $SORTIE/attables-$VERSION.apk"
    echo "(téléphone 32 bits seulement : $SORTIE/attables-$VERSION-32bits.apk)"
    exit 0
fi

# Bundle universel : Google Play le découpe par appareil, une seule fabrication.
FICHIER=$SORTIE_GRADLE/bundle/universalRelease/app-universal-release.aab
rm -f -- "$FICHIER"
pnpm tauri android build --aab --target aarch64 armv7
[ -f "$FICHIER" ] || arret "bundle absent : $FICHIER"
EMPREINTE=$("$KEYTOOL" -J-Duser.language=en -printcert -jarfile "$FICHIER" 2>/dev/null |
    sed -n 's/^[[:space:]]*SHA256: \([0-9A-F:]*\)$/\1/p' | head -n1 | tr -d ':' | tr 'A-F' 'a-f')
unset ATTABLES_KEYSTORE_MDP

[ "$EMPREINTE" = "$EPINGLEE" ] ||
    arret "$FICHIER n'est pas signé par la clé d'Attablés (attendu $EPINGLEE, obtenu ${EMPREINTE:-aucune signature})."

DEST=$SORTIE/attables-$VERSION.$FORMAT
cp -- "$FICHIER" "$DEST"
ls -lh "$DEST"
echo "Signé par la clé d'Attablés (certificat SHA-256 $EMPREINTE)."
exit 0
