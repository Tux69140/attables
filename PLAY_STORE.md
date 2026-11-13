# Guide de publication Google Play Store — Attablés

Ce document rassemble les paramètres techniques, les déclarations obligatoires et les textes prêts à copier-coller dans la **Google Play Console**.

---

## 1. Identité technique de l’application

- **Nom de l’application :** `Attablés`
- **Identifiant Android (`applicationId` / `identifier`) :** `attables.biovibralyon.fr`
- **Version initiale :** `0.1.0` (`versionCode: 1`)
- **Format de publication Google Play :** Android App Bundle (`.aab` signé)
- **Dépôt open source (GNU GPL v3.0) :** <https://github.com/Tux69140/attables>
- **Développeur / Contact :** Stéphane MICHEL — BioVibraLyon (`stephane@biovibralyon.fr`)

> **Compte développeur pro :** Les informations légales vérifiées de votre entreprise (BioVibraLyon / D-U-N-S / adresse professionnelle) sont gérées et affichées directement par votre profil Organisation dans Google Play Console ; il n’est pas nécessaire de les dupliquer dans le code source de cette application libre et gratuite.
>
> **Format `.aab` :** Google Play exige le format `.aab` (et non `.apk`) pour la mise en ligne. Reportez-vous à [`BUILD_ANDROID_DEBIAN.md`](./BUILD_ANDROID_DEBIAN.md) (section 4C) pour compiler le `.aab` signé et générer toutes les icônes Android à partir de `store-assets/icon-512x512.png`.

---

## 2. Fiche Play Store (français)

### Titre (8 / 30 caractères max)
```
Attablés
```

### Description courte (79 / 80 caractères max)
```
Carnet d'invitations hors ligne : allergies, foyers et mémoire anti-doublon.
```

### Description complète (prête à copier)
```
Attablés est votre carnet d’invitations personnel, 100 % hors ligne et sans compte, pour recevoir vos proches sereinement et éviter les faux pas culinaires.

PRÉPAREZ VOS REPAS EN UN COUP D’ŒIL
• Notez vos invitations Prévues et Réalisées (chez vous ou chez un proche).
• Regroupez vos invités par foyer pour cocher toute une famille en un seul geste.
• Retrouvez instantanément qui était présent et ce qui a été servi.

ZÉRO OUBLI D’ALLERGIE
• Distinguez les allergies strictes (arachides, crustacés, gluten…) des simples préférences ou régimes.
• Visualisez toutes les contraintes réunies de la tablée en temps réel.
• Gardez un rappel permanent des allergies strictes juste au-dessus de la saisie du menu.

MÉMOIRE ANTI-DOUBLON & APPRÉCIATIONS
• Ne resservez plus involontairement le même plat aux mêmes invités.
• Prescription temporelle réglable (6 mois par défaut) : alerte forte si un plat a été servi récemment, mention douce « peut revenir » lorsqu’il est plus ancien.
• Notez vos retours sur les repas réalisés (Coup de cœur, Bien, À éviter) pour garder le meilleur et écarter les ratés.

EXPORT IA ANONYMISÉ EN OPTION
• Besoin d’inspiration ? Générez d’un clic un résumé structuré à coller dans l’assistant IA de votre choix.
• Anonymisé par défaut : aucun prénom ni nom d’hôte n’est inclus, uniquement le nombre de convives, les contraintes et l’historique des plats.

100 % SUR VOTRE APPAREIL
• Fonctionne entièrement hors ligne, sans publicité ni traceur.
• Vos données ne quittent jamais votre téléphone.
• Export et restauration locale via fichier .json.
• Logiciel libre sous licence GNU GPL v3.0 (code source sur GitHub).
```

### Catégorie & Coordonnées
- **Type d’application :** Application
- **Catégorie recommandée :** `Art de vivre` (ou `Outils`)
- **Adresse e-mail :** `stephane@biovibralyon.fr`
- **Site web :** `https://github.com/Tux69140/attables`

---

## 3. Visuels Play Console fournis

Les deux visuels obligatoires sont prêts dans [`store-assets/`](./store-assets) :

| Élément Play Console | Fichier | Dimensions exactes |
|---|---|---|
| Icône d’application | `store-assets/icon-512x512.png` | `512 × 512 px` (PNG, fond plein sans coins arrondis pré-découpés) |
| Image de présentation (Feature Graphic) | `store-assets/feature-graphic-1024x500.png` | `1024 × 500 px` (PNG) |

Il reste uniquement à prendre **2 à 4 captures d’écran téléphone** (format 9:16, ex. `1080 × 1920` ou `1080 × 2400`) directement depuis votre téléphone Android (écran *Invitations*, *Préparer une invitation* avec alerte allergie/doublon, *Convives*, et *Mode sombre Nuit marine*).

---

## 4. URL de politique de confidentialité

Google Play exige une **URL publique** pointant vers votre politique de confidentialité, même pour une application 100 % hors ligne.

Le fichier prêt à héberger se trouve ici : [`public/privacy.html`](./public/privacy.html) (et sa version Markdown dans [`PRIVACY_POLICY.md`](./PRIVACY_POLICY.md)).

Deux options simples pour obtenir une URL publique :
1. **GitHub Pages** : activez *Settings → Pages* sur le dépôt `Tux69140/attables` (ou publiez `privacy.html` dans `docs/`), ou servez-la sur `https://attables.biovibralyon.fr/privacy.html`.
2. **Lien brut ou domaine personnel** : hébergez `public/privacy.html` sur votre domaine `biovibralyon.fr` (par ex. `https://attables.biovibralyon.fr/privacy.html`).

---

## 5. Formulaire « Sécurité des données » (Data Safety)

Dans **Contenu de l’application → Sécurité des données** :

1. **Votre application collecte-t-elle ou partage-t-elle l’un des types de données utilisateur requis ?**
   - Répondre : **Non**
2. *(Google Play affichera la mention : « Aucune donnée collectée » et « Aucune donnée partagée avec des tiers ».)*
3. **Les données sont-elles chiffrées en transit ?**
   - Sans objet si aucune donnée n’est collectée ni transférée (vous pouvez cocher *Oui* ou *Non applicable* selon le questionnaire affiché lorsque *Collecte = Non*).

---

## 6. Classification du contenu, Public cible & Santé

- **Public cible :** `18 ans et plus` ou `13 ans et plus` (évitez de cocher les tranches *Moins de 13 ans* pour ne pas déclencher l’examen spécifique *Familles* alors que c’est un outil d’organisation de repas pour adultes).
- **Questionnaire IARC (Classification du contenu) :** catégorie *Utilitaire / Productivité / Autre* → répondre **Non** à toutes les questions (pas de violence, pas d’achat intégré, pas de contenu généré par les utilisateurs en ligne, pas de partage de position, pas de publicité).
- **Publicités :** *Non, mon application ne contient pas d’annonces.*
- **Accès à l’application :** *Toutes les fonctionnalités sont accessibles sans accès restreint* (aucun compte requis pour les testeurs Google Play).
- **Applications liées à la santé (Health apps) :** répondre **Non** (même si l’application gère des rappels d’allergies ou régimes pour vos dîners, il s’agit d’un carnet d’invitations culinaires personnel, pas d’une application médicale, clinique ou de suivi de santé).

---

## 7. Checklist des actions manuelles avant mise en ligne & hygiène GitHub

### Ce qui reste à faire manuellement côté Play Console
1. **Vérifier le profil Organisation (compte pro) :** vérifiez que la validation D-U-N-S et vos coordonnées professionnelles BioVibraLyon sont bien validées dans Google Play Console *(un compte Organisation vérifié n’est pas soumis à l’obligation des 12 testeurs pendant 14 jours avant la mise en production)*.
2. **Héberger la politique de confidentialité :** publiez `public/privacy.html` en HTTPS (sur `biovibralyon.fr` ou via GitHub Pages) et collez cette URL dans *Contenu de l’application → Règles de confidentialité*.
3. **Compiler le `.aab` signé et sauvegarder le keystore :** suivez [`BUILD_ANDROID_DEBIAN.md`](./BUILD_ANDROID_DEBIAN.md), fabriquez-le avec `scripts/fabriquer-apk.sh --aab`, conservez `~/.android-keys/attables-release.jks` et son mot de passe dans KeePassXC (**jamais dans le dépôt**), puis activez **Play App Signing** (*Signature d’application par Google Play*) lors du premier envoi du `.aab`.
4. **Ajouter 2 à 4 captures d’écran téléphone** (et éventuellement activer la langue **English (United States)** avec les textes prêts dans `fastlane/metadata/android/en-US/`).
5. **Valider tous les questionnaires** (*Sécurité des données*, *Publicités*, *Accès*, *IARC*, *Public cible*, *Santé = Non*) puis soumettre en **Production** (ou en *Test interne* rapide sur votre appareil au préalable).

### Ce qu’il ne faut JAMAIS commiter ni pusher sur GitHub
Le fichier `.gitignore` protège déjà les fichiers techniques courants, mais vérifiez toujours avant un `git push` que vous n’ajoutez **aucun** de ces éléments :
- Clés et secrets de signature : `*.jks`, `*.keystore`, `keystore.properties`, mots de passe, fichiers `.env` locaux.
- Binaires compilés : `*.apk`, `*.aab`, `*.apks`, dossiers `build/`, `dist/`, `src-tauri/target/`.
- Données administratives ou personnelles sensibles non requises dans le code libre : numéro de SIRET, numéro de TVA, adresse postale personnelle, numéro de téléphone *(gérés uniquement en privé dans votre compte Organisation Play Console)*.
