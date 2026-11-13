#!/usr/bin/env bash
# Fabrique l'APK release signé d'Attablés (arm64 + armv7), ou le bundle .aab
# pour Google Play avec --aab.
#
# Usage : scripts/fabriquer-apk.sh [--aab]
#
# Sortie : dist-android/attables-<version>.apk (ou .aab), non versionné.
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
    -h|--help) sed -n '2,18p' "$0"; exit 0 ;;
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
if [ "$FORMAT" = apk ]; then
    FICHIER=$SORTIE_GRADLE/apk/universal/release/app-universal-release.apk
    rm -f -- "$FICHIER" "${FICHIER%.apk}-unsigned.apk"
    pnpm tauri android build --apk --target aarch64 armv7
    [ -f "$FICHIER" ] || arret "APK signé absent : $FICHIER (signature non appliquée ?)."
    VERIF=$("$APKSIGNER" verify --print-certs "$FICHIER" 2>&1) || arret "APK non signé ou signature invalide : $FICHIER"
    [ "$(grep -c '^Signer #[0-9]* certificate SHA-256 digest: ' <<<"$VERIF")" = 1 ] ||
        arret "l'APK doit porter exactement une signature."
    EMPREINTE=$(sed -n 's/^Signer #1 certificate SHA-256 digest: \([0-9a-f]\{64\}\)$/\1/p' <<<"$VERIF")
else
    FICHIER=$SORTIE_GRADLE/bundle/universalRelease/app-universal-release.aab
    rm -f -- "$FICHIER"
    pnpm tauri android build --aab --target aarch64 armv7
    [ -f "$FICHIER" ] || arret "bundle absent : $FICHIER"
    EMPREINTE=$("$KEYTOOL" -J-Duser.language=en -printcert -jarfile "$FICHIER" 2>/dev/null |
        sed -n 's/^[[:space:]]*SHA256: \([0-9A-F:]*\)$/\1/p' | head -n1 | tr -d ':' | tr 'A-F' 'a-f')
fi
unset ATTABLES_KEYSTORE_MDP

[ "$EMPREINTE" = "$EPINGLEE" ] ||
    arret "$FICHIER n'est pas signé par la clé d'Attablés (attendu $EPINGLEE, obtenu ${EMPREINTE:-aucune signature})."

DEST=$SORTIE/attables-$VERSION.$FORMAT
cp -- "$FICHIER" "$DEST"
ls -lh "$DEST"
echo "Signé par la clé d'Attablés (certificat SHA-256 $EMPREINTE)."
[ "$FORMAT" = apk ] && echo "Sur le téléphone, sans désinstaller : adb install -r $DEST"
exit 0
