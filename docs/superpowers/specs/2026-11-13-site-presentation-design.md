# Site de présentation d'Attablés — conception

Date : 2026-11-13. Statut : à valider par l'auteur.

## Intention

Publier sur `https://attables.biovibralyon.fr/` le site de présentation d'Attablés, dans la lignée du site de Paré (`https://urgence.biovibralyon.fr/`).

- **Pour qui** (mots de l'auteur) : toute personne intéressée par Attablés, ou qui veut suivre ce qu'elle sert à ses invités.
- **Pour quoi** : y trouver l'essentiel de ce qu'apporte Attablés et la télécharger, en attendant le Play Store et F-Droid.
- **Cas de départ** (mots de l'auteur) : « Que leur ai-je servi la dernière fois qu'ils sont venus ? »

Aujourd'hui le sous-domaine (SSL actif, o2switch) affiche « Index of / » : le site doit être sécurisé.

## Objectifs

1. Une page d'accueil qui fait comprendre en une lecture ce qu'apporte Attablés, et donne envie de l'essayer.
2. Une démo vivante de l'appli, dans un cadre de téléphone sur ordinateur, en plein écran sur mobile.
3. Le téléchargement direct de l'APK signé, vérifiable (SHA-256 du fichier, empreinte du certificat), avec une aide à l'installation.
4. Les pages légales (mentions légales, confidentialité, conditions d'utilisation), produites par `~/Documents/Textes-legaux`.
5. Un hébergement durci (`.htaccess`) et un déploiement en une commande, vérifié.
6. Dans l'appli : la nappe vichy sous la barre d'état et un bandeau qui permet d'effacer facilement les données d'exemple.
7. Une page « Notes de version » sur le site, ouverte depuis l'écran « À propos » de l'appli.
8. Ces changements d'appli sortent en **version 0.2.0**, publiée sur le site à sa mise en ligne.

## Non-objectifs

- Pas de version anglaise (l'appli n'existe qu'en français).
- Pas de compte, de vente, de CGV, de PHP, de formulaire, de lettre d'information.
- Pas de liens Play Store / F-Droid actifs tant que les fiches ne sont pas publiées (mention « bientôt »).
- Pas de nouvel habillage complet de l'appli (couleurs) : seule la nappe y entre.
- Pas de numéro de téléphone dans l'appli : il ne figure que dans les mentions légales du site (obligation du site, pas d'un logiciel gratuit).

## Anti-objectifs (ce qui serait un échec même si ça marche)

- Une capture ou une démo qui ne ressemble pas à la vraie appli. **Toutes les captures sont prises sur l'appli réelle** (données d'exemple), jamais dessinées.
- Un site qui appelle un service tiers (police Google, CDN, statistiques, cookies de suivi) : contraire à la promesse « 100 % sur votre appareil ».
- Un mode démo qui toucherait l'appli installée : l'APK et le build normal gardent exactement la persistance actuelle.
- Un humour lourd ou moqueur envers les invités : touches légères seulement.
- Perdre le chemin vers l'effacement des exemples (cf. bandeau ci-dessous).

## Contraintes

- Hébergement o2switch, alias SSH `o2switch` déjà configuré (`phcv1381@anzu.o2switch.net`), même schéma que `Tirages/scripts/deploy.sh` (rsync puis vérifications `curl`). Dossier distant : `attables.biovibralyon.fr/` (à confirmer à la première mise en ligne : le listing actuel montre `cgi-bin/` à la racine, à ne pas supprimer).
- pnpm uniquement, pas de nouvelle dépendance réseau dans l'appli, en-têtes GPL/SPDX sur les nouveaux fichiers source.
- `*.apk` est ignoré par git : l'APK publié vient de `dist-android/attables-<version>.apk`, produit par `scripts/fabriquer-apk.sh`.
- Le pied de page est commun aux sites de l'auteur (`pied-de-site.js` + `pied-de-site.css`, recopiés tels quels ; chaque site écrit son `pied-<site>.js` et ses couleurs).
- Accessibilité au niveau de Paré/Bouclé : contrastes ≥ 4,5:1 pour le texte, cibles ≥ 44 px, rien porté par la couleur seule, `prefers-reduced-motion` respecté, aucun texte < 13 px, lien d'évitement.

## Approches envisagées

1. **Dossier `site/` dans le dépôt Attablés, construit avec Vite — retenue.** Même outillage que l'appli et que le site de Paré ; la démo et les captures sortent du même commit ; un seul script construit le site, la démo, copie l'APK, calcule les empreintes, déploie et vérifie. Contrepartie : le dépôt de l'appli porte aussi le site (sans effet sur F-Droid, qui ne construit que l'appli).
2. HTML/CSS écrits à la main sans outil : plus simple à lire, mais la démo exige de toute façon un build, et l'on perd la gestion des polices auto-hébergées et l'import du pied commun.
3. Dépôt séparé, comme le site de Paré : bonne isolation, mais version, démo, captures et APK à synchroniser à la main entre deux dépôts.

L'auteur a choisi l'approche 1.

## Décisions de l'auteur

### Direction visuelle : « A2 — la nappe posée sur la table de l'appli »

- Socle repris de l'appli (`src/index.css`) : fond sable `#F7F6F1`, carte `#FEFDFB`, encre `#1A263C`, encre douce `#4D586C`, vert d'action `#007232` (boutons principaux). Thème sombre « Nuit marine » selon l'appareil, mêmes valeurs que l'appli.
- Esprit repas, convivialité, gastronomie. **Nappe vichy** rouge tomate (`rgba(196,58,43,·)` sur sable, base `#B3362A` pour les accents) : bandeau en tête de page et décoration (mots mis en valeur dans les titres, illustrations, ourlets de section). Le rouge tomate ne sert jamais aux boutons ni aux alertes (le rouge d'erreur de l'appli `#A82E27` en est proche : ne pas créer d'ambiguïté avec « Allergie stricte à table »).
- En sombre : carreaux bordeaux sombres sur fond marine.
- Titres en Baumans, texte en Source Sans 3, auto-hébergés (`@fontsource`, déjà en dépendance).
- Touches d'humour légères bienvenues (exemple validé en maquette : « Tante Odile a déjà eu le gratin. Deux fois. »). Accroche de maquette : « On remet le couvert ? ».
- Maquettes de référence : `.superpowers/brainstorm/195418-1794586583/content/nappe-pont-v2.html` (carte A2).

### Démo en ligne

- Servie sous `/demo/`. Sur ordinateur : l'appli vivante dans un cadre de téléphone sur la page d'accueil (`<iframe>` même origine). Sur mobile : le cadre est remplacé par un bouton « Essayer la démo » qui ouvre `/demo/` en plein écran.
- Construite depuis l'appli avec un mode Vite dédié (`vite build --mode demo`, `base: '/demo/'`). En mode démo : chargement systématique des données d'exemple, aucune écriture persistante (rien gardé à la fermeture). Le build normal et l'APK ne changent pas de comportement.

### Effacer les données d'exemple — site et appli

- **Site** : un encadré « Premiers pas » près du téléchargement explique que l'appli s'ouvre sur une tablée d'exemple et comment l'effacer.
- **Appli** : un bandeau compact en haut des onglets Invitations et Convives, affiché **tant qu'il reste au moins un élément d'exemple** :
  « Marc, Sophie et les autres sont des exemples. » — [Effacer les exemples] [Masquer ce bandeau]
  - Les exemples sont reconnus à leurs **seuls** identifiants fixes (`foyer-martin`, `conv-paul`, `inv-1`…`inv-5` de `createSampleData`), distincts des identifiants créés par l'utilisateur (`préfixe-Date.now()`). Décision de l'auteur : un exemple renommé, modifié ou réutilisé reste un exemple et part avec les autres ; le filet est l'annulation.
  - « Effacer les exemples » retire les foyers, convives et invitations d'exemple ; ce que l'utilisateur a créé reste, nettoyé des références aux exemples supprimés comme le font les suppressions existantes (convive retiré des invitations, foyer détaché). Les tags de contraintes par défaut (`getDefaultContraintes`) ne sont pas des exemples et restent. Snapshot + `showUndo` (7 s), comme toute action destructrice.
  - « Masquer ce bandeau » le cache **jusqu'au prochain lancement** de l'appli (état en mémoire, non persisté). Il n'y a pas de bouton « Garder » : le bandeau ne disparaît définitivement que lorsqu'il n'y a plus d'exemple.
  - Dans les Réglages, à côté de « Recharger les données d'exemple » : entrée « Effacer les exemples » (même action).
  - En démo, le bandeau porte en plus « Démo : rien n'est gardé ».

### Nappe dans l'appli

- Option « 2 » : carreaux vichy **délavés** dans la zone de la barre d'état Android (hauteur `env(safe-area-inset-top)`), l'heure et les icônes restant nettes. Dans un navigateur (inset nul, donc la démo), un liseré de 6 px la remplace.
- Cette bande est un élément fixe, **indépendant de l'en-tête** qui se masque au défilement (`App.tsx:355`, `-translate-y-full`). Effet de bord voulu : le contenu ne défile plus sous l'heure et la batterie quand l'en-tête est masqué (défaut actuel).
- Thème sombre : carreaux bordeaux sombres sur marine ; `meta[name=theme-color]` inchangé.

### Version 0.2.0 et notes de version

- Les changements d'appli (mode démo, nappe, bandeau des exemples, lien « Notes de version ») sortent en **0.2.0** (versionCode 2000). Montée de version dans `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, les 2 mentions de `SettingsModal.tsx`, changelogs `fastlane/metadata/android/{fr-FR,en-US}/changelogs/2000.txt`.
- L'auteur lance `scripts/fabriquer-apk.sh` (mot de passe de la clé) avant le premier déploiement ; les captures du site sont prises sur la 0.2.0.
- **Page `notes-de-version.html`** sur le site : une entrée par version, la plus récente en haut, générée au build depuis `fastlane/metadata/android/fr-FR/changelogs/<versionCode>.txt` (source unique ; versionCode → x.y.z par majeure × 1 000 000 + mineure × 1 000 + correctif). Liée depuis le pied de page et la section Télécharger.
- **Validation par l'auteur** : le texte de chaque note de version (`fr-FR` et `en-US`, y compris la 0.1.1 existante et la nouvelle 0.2.0) est rédigé en brouillon puis **soumis à l'auteur, qui le valide avant toute inclusion** dans le site, l'appli ou un build. Pas de génération automatique depuis les messages de commit.
- **Dans l'appli**, écran « À propos » : lien « Notes de version » qui ouvre `https://attables.biovibralyon.fr/notes-de-version.html` dans le navigateur du téléphone (décision de l'auteur, de préférence à un écran interne). Module officiel `tauri-plugin-opener` (+ `@tauri-apps/plugin-opener`), capability élargie à `opener:allow-open-url` **limitée à `https://attables.biovibralyon.fr/*`**. Vérifié : le module n'ajoute aucune permission Android (`AndroidManifest.xml` vide en 2.5.5) ; l'appli reste sans `INTERNET`, aucune antifonctionnalité F-Droid. `CLAUDE.md` est mis à jour (la règle « `core:default` seulement » devient « `core:default` + ouverture d'URL limitée au site »). Dans un navigateur (démo), le lien est un simple `<a target="_blank">`.

## Contenu de la page d'accueil (proposition, textes à faire relire)

1. **Bandeau nappe** + en-tête : logo/nom « Attablés », navigation (Comment ça marche · Démo · Télécharger).
2. **Accroche** : titre (« On remet le couvert ? »), une phrase (qui vient, quelles allergies, ce qu'on leur a déjà servi), boutons « Télécharger » (vert) et « Essayer la démo », clin d'œil humoristique ; à droite la démo dans le téléphone.
3. **Pourquoi** : part de la question « Que leur ai-je servi la dernière fois qu'ils sont venus ? », en 2–3 phrases.
4. **Comment ça marche**, trois étapes avec vraies captures : convives, foyers et contraintes (strictes / préférences) ; l'invitation (qui vient, contraintes réunies, menu, alerte « déjà servi ») ; la mémoire (plats servis, prescription réglable, avis Coup de cœur / Bien / À éviter). L'export IA anonymisé peut y figurer en bonus.
5. **Vos invités restent chez vous** : hors ligne, sans compte, sans publicité ni mesure d'audience, export IA anonymisé par défaut, logiciel libre GPL-3.0 (lien `https://github.com/Tux69140/attables`).
6. **Télécharger** : APK de la version courante (`attables-<version>.apk`), taille, SHA-256 du fichier, empreinte SHA-256 du certificat (`src-tauri/empreinte-cle-android.txt`), Android minimum, aide à l'installation (autoriser l'installation depuis le navigateur), mention « bientôt sur le Play Store et F-Droid », encadré « Premiers pas » (effacer les exemples).
7. **Pied commun** (via `pied-de-site.js`) : phrase du site, liens Attablés, informations légales, réseaux, « Mes autres applications ».

Source d'inspiration pour les arguments : `fastlane/metadata/android/fr-FR/full_description.txt`.

## Pages légales

- `Textes-legaux/fabriquer.mjs` rend la section `cgv` **facultative** (aujourd'hui obligatoire) ; le test `fabriquer.test.mjs` est complété.
- Nouveaux fichiers dans `Textes-legaux` : `sites/attables.json` (pages, hébergeur), `gabarits/attables.html`, `attables/confidentialite.html` (partie propre au service, reprise de `PRIVACY_POLICY.md` + visite du site et démo, sur le modèle de `pare/confidentialite.html`), `attables/conditions-utilisation.html` (courtes : outil d'organisation, ne remplace pas un avis médical sur les allergies, démo, licence GPL). `commun/script-pied.html` vise aujourd'hui `/src/pied-pare.js` en dur : le rendre propre à chaque site (valeur ou fichier par site).
- `Textes-legaux` est un dépôt git distinct. Il porte deux modifications non commitées de l'auteur (`commun/valeurs.json` : téléphone ; `fabriquer.test.mjs` : un test) : décision de l'auteur, elles sont commitées **avec** les changements de ce projet, au moment de commiter.
- `PRIVACY_POLICY.md` du dépôt et la page confidentialité du site doivent dire la même chose ; la page publiée devient l'URL de confidentialité du Play Store.

## Pied de page commun

- `site/` recopie `pied-de-site.js` et `pied-de-site.css` depuis le site de Paré et écrit `pied-attables.js` / `.css`.
- Attablés est ajouté à `COMMUN.applications`. La copie de Paré (et de tout autre site) devra recevoir la même ligne : on le signale à l'auteur, on ne modifie pas le dépôt de Paré dans ce projet.
- Remarque : la liste actuelle nomme « Baluchon » (`baluchon.biovibralyon.fr`, adresse qui ne répond pas), alors que l'appli s'appelle désormais Bouclé. À signaler, pas à corriger ici.

## Sécurité de l'hébergement

`.htaccess` à la racine, sur le modèle de Paré (`Evacuation/App_V2/web/public/.htaccess`), adapté :

- Redirection 301 vers `https://attables.biovibralyon.fr` (HTTPS et nom d'hôte unique).
- `Options -Indexes` ; refus des fichiers cachés, sauvegardes, `.env`, `.sh`, clés, etc.
- Aucun PHP : refuser l'exécution / l'accès aux `.php`.
- En-têtes : HSTS (1 an), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restrictive, CSP stricte `default-src 'self'` sans `'unsafe-inline'` pour les scripts si le build le permet, `font-src 'self'`, `img-src 'self' data:`, `object-src 'none'`, `base-uri 'self'`, `form-action 'none'`.
- Cadrage : `frame-ancestors 'none'` + `X-Frame-Options: DENY` partout, **sauf `/demo/`** qui autorise `frame-ancestors 'self'` (`X-Frame-Options: SAMEORIGIN`) pour s'afficher dans la page d'accueil.
- APK : `AddType application/vnd.android.package-archive .apk`, `Content-Disposition: attachment`.
- Cache : ressources à empreinte (`assets/`) longues, HTML et APK courts.

## Déploiement

`scripts/deployer-site.sh` (nom à confirmer par le constructeur) :

1. `pnpm lint`, build du site, build de la démo dans `site/dist/demo/`.
2. Vérifie que `dist-android/attables-<version de package.json>.apk` existe ; sinon s'arrête en demandant `scripts/fabriquer-apk.sh`. Vérifie la signature et l'empreinte du certificat contre `src-tauri/empreinte-cle-android.txt` (`apksigner verify --print-certs`). Copie l'APK, calcule son SHA-256 et l'injecte dans la page (ou un `.sha256` à côté).
3. `rsync` vers la cible écrite en dur, sans `--delete` hors des dossiers gérés par le site (ne jamais supprimer `cgi-bin/`).
4. Vérifie : HTTP 200 sur `/`, `/demo/`, l'APK ; présence de `nosniff`, HSTS et CSP ; absence d'« Index of » sur un dossier sans index ; redirection 301 de `http://`.
5. Avertit si l'arbre git n'est pas propre.

## Captures

Produites par un script Playwright sur l'appli lancée en local (données d'exemple), au format téléphone (393 × 852, ×3), thème clair. Pas de capture retouchée ni dessinée. Elles sont régénérées à chaque version si l'interface change.

## Commits

Décision de l'auteur : tout est commité ensemble au moment opportun (fin de chantier validé), dans chacun des deux dépôts (Attablés, Textes-legaux). `.superpowers/` est ajouté au `.gitignore` d'Attablés.

## Laissé au constructeur

- Arborescence exacte de `site/`, config Vite multi-page, nommage des fichiers.
- Forme des illustrations décoratives (assiettes, couverts, carreaux) en SVG maison.
- Mécanisme exact du mode démo (`import.meta.env.MODE`, stockage en mémoire ou `sessionStorage`).
- Rédaction des textes (à faire relire à l'auteur avant mise en ligne).
- Détection « il reste des exemples » : liste des identifiants d'exemple exportée depuis `storage.ts`.

## Validation

- `pnpm lint` et `pnpm build` (appli), build du site et de la démo.
- `node --test fabriquer.test.mjs` dans `Textes-legaux`.
- Vérification visuelle téléphone et ordinateur, clair et sombre, du site et de l'appli (nappe, bandeau, démo dans le cadre et en plein écran).
- Après déploiement, vérifications du script + test manuel du téléchargement et de l'installation de l'APK sur un appareil Android.

## Complément du 13 novembre 2026 (soir) — retours de l'auteur

- **Icônes des barres système** : sur Xiaomi en mode sombre avec Attablés en thème clair, les boutons Android du bas sont blancs sur fond sable, donc invisibles. Décision de l'auteur : une commande native est autorisée. L'appli indique son thème effectif à Android, qui passe les icônes des barres d'état et de navigation en foncé sur thème clair, en clair sur thème sombre. Choix d'implémentation (ruling coordinateur) : interface JavaScript `AttablesAndroid` ajoutée par `MainActivity.onWebViewCreate` (pas de commande Tauri ni de capability, contenu local uniquement). À préserver si le projet Android est régénéré (comme le bloc `signingConfigs`).
- **Nappe en bas** : même bande vichy délavée que la nappe du haut, dans la zone de la barre de navigation Android (`env(safe-area-inset-bottom)`, rien dans un navigateur).
- **Taille de l'APK** : décision de l'auteur, un paquet par architecture sur les stores (Play : AAB, découpé par le store ; F-Droid : une construction par ABI) ; sur le site, l'APK 64 bits par défaut et un APK 32 bits de secours, présenté comme sur le site de Lumosphère (lien discret sous la condition d'installation, `~/Documents/Lulu/lumosphere/src/features/telechargements/Android.tsx`). Polices réduites aux caractères latins (appli et site), en woff2 seulement.
- **Version** : ces changements modifient l'APK déjà publié en 0.2.0 ; ruling coordinateur : ils sortent en **0.2.1** (versionCode 2001), notes de version soumises à l'auteur.
