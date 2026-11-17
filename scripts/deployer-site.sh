#!/usr/bin/env bash
# Copyright (C) 2026 Stéphane MICHEL
# SPDX-License-Identifier: GPL-3.0-or-later
#
# Déploie le site de présentation d'Attablés (page d'accueil, démo, APK) sur
# https://attables.biovibralyon.fr/ via l'alias SSH « o2switch ».
#
# Usage : scripts/deployer-site.sh [--essai]
#
#   --essai   construit et contrôle tout, puis montre ce que rsync ferait
#             (--dry-run --itemize-changes) et s'arrête : aucun transfert réel,
#             aucun contrôle curl.
#   (sans)    même chose, puis demande de taper « oui » avant le vrai rsync,
#             puis contrôle le site en ligne.
#
# Prérequis : dist-android/attables-<version>.apk (64 bits) et
# attables-<version>-32bits.apk, signés (scripts/fabriquer-apk.sh).
set -euo pipefail

# Racine du dépôt, calculée sans changer de répertoire : en mode test, le script est
# chargé par « source » et ne doit pas déplacer l'appelant (le cd vient après le hook).
RACINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly RACINE

# Cible écrite en dur. cgi-bin/ et .well-known/ existent déjà côté serveur :
# les --exclude les protègent aussi de --delete.
readonly CIBLE="o2switch:attables.biovibralyon.fr/"
readonly SITE="https://attables.biovibralyon.fr"
readonly SITE_HTTP="http://attables.biovibralyon.fr"
readonly ANDROID_HOME_DEFAUT="$HOME/Android/Sdk"
EMPREINTE_FICHIER="$RACINE/src-tauri/empreinte-cle-android.txt"

essai=0
case "${1:-}" in
  "") ;;
  --essai) essai=1 ;;
  *)
    echo "Usage : $0 [--essai]" >&2
    exit 2
    ;;
esac

erreur() {
  echo "Erreur : $*" >&2
  exit 1
}

# L'APK factice est réservé aux essais de build : jamais pour un déploiement.
if [ -n "${SITE_APK_FACTICE:-}" ]; then
  erreur "SITE_APK_FACTICE est défini : déploiement refusé (APK factice)."
fi

# Surcharge de l'empreinte épinglée : réservée au mode test (hook de chargement).
if [ -n "${DEPLOYER_SITE_EMPREINTE_FICHIER:-}" ]; then
  if [ "${DEPLOYER_SITE_CHARGER_SEULEMENT:-}" = "1" ]; then
    EMPREINTE_FICHIER="$DEPLOYER_SITE_EMPREINTE_FICHIER"
  else
    erreur "DEPLOYER_SITE_EMPREINTE_FICHIER est défini hors mode test : déploiement refusé (la clé épinglée ne se remplace pas)."
  fi
fi

# Vérifie que l'APK a exactement un signataire, et que son certificat est la clé épinglée.
verifier_signature() {
  local apk="$1" sdk="${ANDROID_HOME:-$ANDROID_HOME_DEFAUT}" outil sortie attendue nb ligne
  local -a empreintes
  [ -f "$apk" ] || erreur "$apk est absent (lancer scripts/fabriquer-apk.sh)."
  [ -d "$sdk/build-tools" ] || erreur "$sdk/build-tools est introuvable (ANDROID_HOME mal défini ?)."
  outil=$(find "$sdk/build-tools" -maxdepth 2 -name apksigner -type f 2>/dev/null | sort -V | tail -n 1 || true)
  [ -n "$outil" ] || erreur "apksigner introuvable dans $sdk/build-tools."
  attendue=$(grep -v '^[[:space:]]*#' "$EMPREINTE_FICHIER" | grep -v '^[[:space:]]*$' | head -n 1 | tr -d ':[:space:]' | tr 'A-F' 'a-f' || true)
  [ -n "$attendue" ] || erreur "empreinte épinglée introuvable dans $EMPREINTE_FICHIER."
  sortie=$("$outil" verify -v --print-certs "$apk") || erreur "apksigner refuse $apk."
  grep -qx 'Number of signers: 1' <<<"$sortie" || erreur "$apk doit avoir exactement un signataire."
  empreintes=()
  while IFS= read -r ligne; do
    empreintes+=("$(tr -d ':' <<<"$ligne" | tr 'A-F' 'a-f')")
  done < <(sed -n 's/^Signer #[0-9]* certificate SHA-256 digest: //p' <<<"$sortie")
  nb=${#empreintes[@]}
  [ "$nb" -eq 1 ] || erreur "$apk : $nb empreinte(s) de signataire lue(s) au lieu d'une."
  if [ "${empreintes[0]}" != "$attendue" ]; then
    erreur "$apk n'est pas signé par la clé attendue (obtenu ${empreintes[0]}, attendu $attendue)."
  fi
  echo "Signature de $apk conforme à la clé épinglée."
}

# Sans exécution si le script est seulement chargé pour test.
if [ "${DEPLOYER_SITE_CHARGER_SEULEMENT:-}" = "1" ]; then
  echo "DEPLOYER_SITE_CHARGER_SEULEMENT=1 : fonctions chargées, rien n'est exécuté." >&2
  return 0 2>/dev/null || exit 0
fi

cd "$RACINE"

version=$(node -p "require('./package.json').version")
[ -n "$version" ] || erreur "version illisible dans package.json."
apk="dist-android/attables-$version.apk"
apk32="dist-android/attables-$version-32bits.apk"

pnpm lint
pnpm test
pnpm site:build
pnpm build:demo
# Copie orpheline de la page publique de l'appli : son script inline est bloqué
# par la CSP du site ; la page de référence est /confidentialite.html.
rm -f dist-site/demo/privacy.html
cp site/demo.htaccess dist-site/demo/.htaccess

if grep -q '(APK non construit)' dist-site/index.html; then
  erreur "dist-site/index.html contient « (APK non construit) » : APK absent au moment du build."
fi

# L'APK réellement publié est la copie de dist-site ; elle doit être identique à celle signée.
# Les deux APK (64 bits, puis 32 bits de secours) subissent les mêmes contrôles.
for source in "$apk" "$apk32"; do
  publie="dist-site/telechargement/$(basename "$source")"
  [ -f "$publie" ] || erreur "$publie est absent, déploiement annulé."
  cmp -s "$source" "$publie" || erreur "$publie diffère de $source."
  verifier_signature "$publie"
done

for f in dist-site/index.html dist-site/.htaccess dist-site/demo/index.html \
  dist-site/demo/.htaccess; do
  [ -f "$f" ] || erreur "$f est absent, déploiement annulé."
done

if [ -n "$(git status --porcelain)" ]; then
  echo "Attention : l'arbre de travail n'est pas propre, la version déployée peut différer du commit." >&2
fi

options=(-az --delete --chmod=D755,F644 --exclude cgi-bin/ --exclude .well-known/ --max-delete=50 --delay-updates)

if [ "$essai" = 1 ]; then
  echo "Essai à blanc (rien n'est transféré) :"
  rsync "${options[@]}" --dry-run --itemize-changes dist-site/ "$CIBLE"
  echo "Essai terminé : version $version, aucun transfert réel."
  exit 0
fi

echo "Version $version prête à être envoyée vers $CIBLE"
echo "Relisez les lignes « *deleting » de votre dernier passage avec --essai avant de continuer."
read -r -p "Tapez « oui » pour déployer pour de bon : " reponse
[ "$reponse" = "oui" ] || erreur "déploiement annulé."

rsync "${options[@]}" dist-site/ "$CIBLE"
echo "Transfert terminé : le site est EN LIGNE. Contrôles en cours."

# À partir d'ici le site est déjà en ligne : tout échec le signale.
erreur() {
  echo "Erreur : $*" >&2
  echo "Le site est DÉJÀ EN LIGNE. Regardez $SITE/ et le .htaccess déployé (dist-site/.htaccess, dist-site/demo/.htaccess) ; corrigez puis redéployez." >&2
  exit 1
}

# Capture d'abord les en-têtes : avec pipefail, un grep -q qui ferme le tube tôt
# ferait échouer curl (SIGPIPE) et donnerait un faux négatif.
entetes() {
  curl -sS --max-time 20 -I "$1" || true
}

# Code HTTP seul ; 000 = aucune réponse.
code_http() {
  curl -sS --max-time 20 -o /dev/null -w '%{http_code}' "$1" || true
}

attendre_code() {
  local url="$1" attendu="$2" code
  code=$(code_http "$url")
  [ "$code" = "$attendu" ] || erreur "$url a répondu HTTP $code au lieu de $attendu."
}

a_entete() {
  local h="$1" motif="$2" url="$3"
  grep -qi "$motif" <<<"$h" || erreur "en-tête absent sur $url : $motif"
}

for chemin in / /demo/ /notes-de-version.html "/telechargement/attables-$version.apk" "/telechargement/attables-$version-32bits.apk"; do
  attendre_code "$SITE$chemin" 200
done

# La redirection http -> https ne doit pas suivre la redirection (301 attendu).
h=$(entetes "$SITE_HTTP/")
head -n 1 <<<"$h" | grep -q ' 301' || erreur "$SITE_HTTP/ ne répond pas 301."
a_entete "$h" "^location: $SITE/" "$SITE_HTTP/"

# Le défi ACME ne doit pas être redirigé : 404 attendu (fichier inexistant), pas 301.
attendre_code "$SITE_HTTP/.well-known/acme-challenge/verification-attables" 404

h=$(entetes "$SITE/")
a_entete "$h" '^x-content-type-options: nosniff' "$SITE/"
a_entete "$h" '^strict-transport-security:' "$SITE/"
a_entete "$h" '^content-security-policy:' "$SITE/"
a_entete "$h" '^x-frame-options: DENY' "$SITE/"

h=$(entetes "$SITE/demo/")
a_entete "$h" '^x-frame-options: SAMEORIGIN' "$SITE/demo/"

premier_asset=$(find dist-site/demo/assets -maxdepth 1 -type f -printf '%f\n' | sort | head -n 1)
[ -n "$premier_asset" ] || erreur "dist-site/demo/assets est vide."
h=$(entetes "$SITE/demo/assets/$premier_asset")
a_entete "$h" '^cache-control:.*immutable' "$SITE/demo/assets/$premier_asset"

code=$(code_http "$SITE/cgi-bin/")
case "$code" in
  403|404) ;;
  *) erreur "$SITE/cgi-bin/ a répondu HTTP $code au lieu de 403 ou 404." ;;
esac
h=$(curl -sS --max-time 20 "$SITE/cgi-bin/" || true)
if grep -qi 'Index of' <<<"$h"; then
  erreur "$SITE/cgi-bin/ affiche un index de répertoire."
fi

for nom in "attables-$version.apk" "attables-$version-32bits.apk"; do
  h=$(entetes "$SITE/telechargement/$nom")
  a_entete "$h" '^content-type: application/vnd.android.package-archive' "$nom"
done

echo "Déployé : version $version sur $SITE/"
