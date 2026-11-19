# Corrections de l'audit impeccable — conception

- Date : 2026-11-18
- Branche : `corrections-audit` (depuis `main` = 15bace6, version 0.3.0)
- Références : `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, rapport `/impeccable audit src` (15/20), registre de relecture `.superpowers/sdd/2026-11-17-refonte-ui-0.3.0/progress.md`

## 1. Intention

Traiter **toutes** les remarques de l'audit (P1 à P3) pour que l'appli soit vraiment utilisable par le public de `PRODUCT.md` : des personnes qui reçoivent famille et amis, seniors compris, sur un téléphone Android, parfois avec TalkBack ou une grande taille de police. On ajoute les six petits points laissés par la relecture de la 0.3.0, qui touchent les mêmes fichiers. À la fin, on relance l'audit pour vérifier la hausse du score.

## 2. Objectifs, non-objectifs, anti-objectifs

**Objectifs**
- Une personne qui utilise TalkBack entend l'annonce « Annuler », reste dans la feuille ouverte et retrouve sa place à la fermeture.
- Toutes les cibles tactiles visibles font au moins 44 × 44 px.
- L'appli suit la taille de police du téléphone, et chaque écran reste lisible et utilisable jusqu'à 200 %.
- Chaque écran a une hiérarchie de titres complète (h1, puis h2, puis h3).
- Retour depuis l'éditeur : on retrouve la liste à l'endroit où on l'avait laissée, avec les barres visibles.
- Les finitions visuelles respectent `DESIGN.md` : aucun flou, casse normale, pas de boîte dans une carte, encre des tuiles en jeton.

**Non-objectifs**
- Le logo et le favicon (encore verts) : c'est un chantier à part.
- Baumans dans les titres : c'est l'identité assumée de l'appli.
- Le filet de 3 px des foyers : c'est une exception autorisée par `DESIGN.md`.
- La publication : numéro de version, changelogs et APK se décident après le chantier.
- Le site de présentation (`site/`) : il n'est pas touché.

**Anti-objectifs** (ce qui ferait échouer le chantier même si tout « marche »)
- Le bouton Retour d'Android devient moins fiable, par exemple une entrée d'historique orpheline ou un Retour qui quitte l'appli.
- Une allergie stricte coupée, tronquée ou masquée en grand texte.
- Une nouvelle dépendance, une fonctionnalité CSS ou JS sans repli pour les anciennes WebView (`inert`, `<dialog>`, `:has()` sans repli, etc.).
- Des contrôles agrandis au point de casser la mise en page à 320 px, ou une zone tactile invisible qui empiète sur une cible voisine.

## 3. Contraintes

- Aucun réseau, aucune télémétrie, aucun SDK, aucune dépendance nouvelle. Pas de permission `INTERNET`.
- Le pont `AttablesAndroid` et `signingConfigs` sont préservés. La modification de `MainActivity.kt` doit être documentée dans `CLAUDE.md`, comme le pont.
- `useAndroidBack` reste la seule voie du bouton Retour. La pile `pileRetour.ts` et ses tests ne régressent pas.
- Aucune régression des contrastes : les tests des jetons restent verts en clair et en sombre.
- Toute action destructrice garde son instantané et `showUndo` (7 s).
- `pnpm` uniquement. En-têtes GPL/SPDX conservés sur tout nouveau fichier.
- Chaque lot est validé par `pnpm lint`, `pnpm test`, `pnpm build`, puis une vérification dans le navigateur (Playwright, 412 × 915 et 320 × 640, clair et sombre).
- Commits : un par lot, sur `corrections-audit`. `PRODUCT.md`, `DESIGN.md`, `.impeccable/` et `docs/` restent hors des commits (décision de l'utilisateur) ; on peut les modifier, mais on ne les commite pas. `CLAUDE.md` est suivi par git et se commite avec le lot qui le modifie.

## 4. Approches retenues (choisies par l'utilisateur)

| Sujet | Retenu | Écartés, et pourquoi |
|---|---|---|
| Cibles de 44 px | **Agrandir ce qu'on voit.** Seuls les liens dans le texte (« Voir ce plat ») gardent leur aspect et reçoivent une zone tactile invisible de 44 px. | Une zone invisible partout aurait laissé des cibles petites à viser du regard, ce qui est moins rassurant pour des seniors. |
| Focus des feuilles et des vues | **Un petit outil maison dans `SharedUI`** : focus sur le titre à l'ouverture, piège de tabulation, retour du focus à la fermeture. | `<dialog>` natif : il entre en conflit avec l'animation des feuilles et avec `useAndroidBack`, et sa couche supérieure recouvre le bandeau « Annuler ». Une bibliothèque : une dépendance pour une quarantaine de lignes. |
| Taille de police d'Android | **La suivre sans plafond** : une ligne Kotlin, des hauteurs minimales et des décalages mesurés, une vérification jusqu'à 200 %. | Plafonner à 150 % : la mise en page serait plus simple, mais on lâcherait les personnes qui en ont le plus besoin. |
| Ordre du travail | **Par famille de remarques, composants partagés d'abord.** Un commit vérifié par lot, puis l'audit relancé. | Écran par écran : les composants partagés seraient retouchés plusieurs fois. |

Exécution : un sous-agent écrit le code de chaque lot et un sous-agent le relit, tous deux en réflexion `high`. Le contrôle final de la branche est fait par un sous-agent en `xhigh`. Aucun push.

## 5. Les lots

### Lot 1 — Annonces et focus (P1 bandeau « Annuler », P2 focus)

**Bandeau « Annuler »** (WCAG 4.1.3)
- Un seul `UndoBanner`, monté en permanence au niveau d'`App`, quelle que soit la vue (onglets, éditeur, Réglages). Aujourd'hui, il est rendu séparément dans trois branches, et il rend `null` quand il n'y a pas de message.
- Il contient une zone d'annonce (`role="status"`, `aria-live="polite"`, `aria-atomic="true"`) **toujours présente** dans le DOM.
- Seul le message est annoncé (par exemple « Invitation supprimée »), pas les boutons.
- L'annonce doit aussi avoir lieu quand la vue change dans le même geste, par exemple en supprimant une invitation depuis l'éditeur. C'est pour ce cas que le bandeau est monté une seule fois.
- Deux messages identiques à la suite (deux suppressions) sont annoncés deux fois : le contenu de la zone change à chaque nouvel état d'annulation, par exemple en s'appuyant sur son identifiant.
- *Mon choix* : le minuteur de 7 s s'arrête tant que le focus est dans le bandeau, et repart quand le focus en sort (WCAG 2.2.1). Sinon, une personne qui navigue avec TalkBack n'a pas le temps d'atteindre « Annuler ».

**Focus des feuilles et de la fenêtre de confirmation** (WCAG 2.4.3)
- Un outil partagé est utilisé par `BottomSheet` et `ConfirmModal`.
  - **À l'ouverture**, il mémorise l'élément qui avait le focus et place le focus sur le titre (`tabIndex={-1}`).
  - **Tant que c'est ouvert**, Tab et Maj+Tab bouclent à l'intérieur.
  - **À la fermeture**, quelle qu'en soit la cause (croix, voile, Échap, Retour, action), il rend le focus à l'élément mémorisé, s'il existe encore et qu'il est visible.
- Les feuilles s'empilent (paramètre `zClass`, confirmation par-dessus une feuille) : seule la couche du dessus gère la tabulation. À sa fermeture, le focus revient dans la couche du dessous.
- `aria-modal="true"` est conservé. Pas d'`inert`, qui n'existe pas sur les anciennes WebView.

**Focus des vues plein écran**
- **Éditeur, Réglages et présentation d'accueil** : à l'ouverture, et à chaque changement d'écran dans l'accueil ou de section dans les Réglages, le focus va sur le `h1` de la vue.
- **À la fermeture de l'éditeur** : la liste est démontée puis remontée, donc l'élément d'origine n'existe plus.
  - `App` retient une cible stable : la carte de l'invitation (attribut `data-*` avec son identifiant), ou le bouton « Préparer une invitation » pour une nouvelle.
  - `App` remet le focus sur cette cible après la restauration du défilement (lot 5), avec `preventScroll`.
  - Si la cible n'existe plus (invitation supprimée), ou si l'éditeur a été ouvert depuis ailleurs (fiche plat, guide de démarrage, convive), le focus va sur le `h1` de l'écran (lot 4).
- **À la fermeture des Réglages** : le focus revient sur le bouton Réglages de l'en-tête. Au retour d'une section vers la racine des Réglages, il revient sur l'entrée de cette section.

**Acceptation**
- Au clavier dans le navigateur : ouvrir chaque feuille, tabuler au-delà du dernier élément (le focus reste dedans), fermer de chaque façon possible (le focus revient d'où il venait).
- Supprimer une invitation depuis l'éditeur : l'arbre d'accessibilité montre la zone `status` avec le message, et elle existait déjà avant l'apparition du message.

### Lot 2 — Cibles de 44 px (P2)

Contrôles à agrandir (relevés par l'audit, à revérifier par la mesure) :

| Emplacement | Taille actuelle (px) |
|---|---|
| Puces de filtre, `Controles.tsx` (`Puces`) | 40 |
| `FeuillePlat.tsx`, l. ~113 | 40 |
| `FichePlat.tsx`, bouton « Modifier / Renseigner » | 40 |
| `SettingsModal.tsx`, l. ~224 (bascule de niveau) | 34 |
| `ParcoursGuide.tsx`, l. ~105 | 36 |
| `InvitationEditor.tsx`, l. ~450, ~471, ~1153 et ~1217 | 38 |
| `InvitationEditor.tsx`, l. ~491 et ~798 (prénoms de la tablée) | 36 |
| `InvitationEditor.tsx`, l. ~1441 | 42 |

- Les contrôles visibles passent à 44 px au moins en hauteur et en largeur. Le texte et le rembourrage s'ajustent pour garder des proportions justes.
- **Le lien dans le texte « Voir ce plat »** (`FeuillePlat.tsx`, l. ~93) garde son aspect. Sa zone tactile est étendue à 44 px, par exemple avec un pseudo-élément ou un rembourrage compensé par une marge négative. Elle ne doit empiéter sur aucune cible voisine.
- `DESIGN.md` : retirer la mention « puces à 40 px = dette ». La valeur normative de 44 px est désormais tenue.

**Acceptation** : `.superpowers/audit-a11y.mjs`, adapté pour ouvrir aussi les feuilles et l'éditeur, ne signale plus aucune cible sous 44 px, à 412 px comme à 320 px, en clair et en sombre. Les seules exceptions admises sont les zones étendues documentées.

### Lot 3 — Grand texte (P2 taille de police, P3 en-tête qui déborde à 320 px)

**Android**
- Dans `MainActivity.onWebViewCreate`, appliquer `webView.settings.textZoom = (resources.configuration.fontScale * 100).roundToInt()`. Le comportement devient le même sur toutes les WebView, quelle que soit leur valeur par défaut.
- `fontScale` ne figure pas dans `configChanges` : l'activité est recréée quand le réglage change, et la valeur est donc relue.
- Commenter cette ligne comme le pont, et l'ajouter dans `CLAUDE.md` à la liste de ce qu'il faut préserver si `gen/android` est régénéré.

**Mise en page**
- Les hauteurs fixes de l'en-tête (`h-14`) et de la barre du bas (`h-16`) deviennent des hauteurs minimales.
- Tous les décalages qui supposent ces hauteurs lisent désormais une **hauteur mesurée** : un `ResizeObserver` écrit des variables CSS, avec les valeurs actuelles en repli.
- Décalages concernés :
  - `.pt-below-header`, `.pb-below-bar` ;
  - `.bottom-above-nav`, `.bottom-above-fab`, `.bottom-above-bar`, `.bottom-safe-gap` ;
  - la position collante de `BandeauAllergies` ;
  - la barre d'actions de l'éditeur.
- Les textes essentiels passent à la ligne au lieu d'être tronqués ou bloqués sur une ligne : le message du bandeau « Annuler », les titres de feuille et de vue, le libellé du bouton flottant, les libellés de la barre du bas, et le bandeau d'allergie, qui ne doit jamais être tronqué.
- **En-tête** : il ne doit plus déborder à 320 px (de 3 px aujourd'hui, à cause de la grille `88px 1fr 88px`), ni en grand texte. Le titre « Attablés » peut se décentrer ou passer sur une ligne réduite si la place manque. La loupe et les Réglages restent à 44 px.

**Matrice de vérification** (*mon choix*)
- 320 px : 100 % et 130 %.
- 360 px et 412 px : 100 %, 130 % et 200 %.
- Critères : pas de défilement horizontal, aucun texte coupé, aucun chevauchement, aucun contenu caché sous l'en-tête ou la barre.

**Simulation**
- Un script Playwright multiplie la taille de police calculée de chaque élément (× 1,3 et × 2) et réapplique le facteur à chaque rendu, par exemple avec un `MutationObserver`. C'est le pire cas.
- Le vrai comportement de la WebView est plus subtil : son agrandissement automatique épargne certains blocs à hauteur fixe ou sans retour à la ligne. La vérification finale se fait donc sur le téléphone (voir la section 6).

### Lot 4 — Titres (P2 WCAG 1.3.1, P3 « Apéro5 »)

- Invitations, Convives et Plats reçoivent chacun un `h1` masqué à l'écran (`sr-only`) : « Invitations », « Convives », « Plats ».
  - *Mon choix* : un titre masqué plutôt que visible, parce que la barre du bas et l'en-tête identifient déjà l'écran à l'œil, et qu'un titre visible ajouterait une ligne à chaque écran.
  - L'accueil, l'éditeur et les Réglages ont déjà leur `h1`.
- Invitations hors recherche : la liste se place sous un `h2` masqué qui reprend l'onglet choisi (« À venir » ou « Réalisées »). Les cartes, en `h3`, ont ainsi un parent.
- Plats : le `h2` de service est lu « Apéro5 ».
  - Le nombre reste visible mais se lit séparément, par exemple « Apéro, 5 plats » pour les lecteurs d'écran.
  - À l'œil, il est séparé du mot par un espace ou une pastille sobre, sans Baumans sur le nombre (règle de l'enseigne).
- Vérifier la hiérarchie complète de chaque écran, chaque feuille et chaque vue avec la sortie « titres » d'`audit-a11y.mjs` : aucun niveau sauté, un seul `h1` par vue. Les feuilles gardent leur `h2`.

### Lot 5 — Retour depuis l'éditeur (P2)

- Au démarrage : `history.scrollRestoration = 'manual'`. Le navigateur ne restaure plus rien de lui-même au `popstate`.
- **À l'ouverture de l'éditeur ou des Réglages**, `App` mémorise `window.scrollY` de l'onglet courant. La vue s'ouvre en haut.
- **À la fermeture**, quelle qu'en soit la cause (Enregistrer, Annuler, Supprimer, Retour d'Android) :
  - une fois la liste rendue (`useLayoutEffect`), restaurer la position mémorisée, bornée à la hauteur disponible ;
  - forcer l'en-tête et la barre visibles ;
  - recaler la référence de `useAutoHideChrome` sur la position restaurée, pour que le défilement de restauration ne masque pas les barres ;
  - remettre le focus (lot 1).
- Le changement d'onglet garde son comportement actuel : retour en haut.

**Acceptation** (320 × 640) : ouvrir une invitation en bas de liste, puis revenir par chacune des quatre voies. On retrouve la même position, en-tête et barre visibles, focus sur la carte. Même essai avec les Réglages.

### Lot 6 — Finitions visuelles (P3)

- **Flous** : retirer les 7 `backdrop-blur`. Emplacements : `App.tsx`, en-tête (l. ~461) et barre du bas (l. ~563) ; `SharedUI.tsx`, l. ~58 et ~125 ; `SettingsModal.tsx`, l. ~276 ; `InvitationEditor.tsx`, l. ~381 et ~1304.
  - Les barres deviennent opaques (`var(--bg)`, `var(--card)`).
  - Les voiles gardent le Nuit à 60 %, sans flou.
- **Capitales espacées** → casse normale, en gras, à la même taille. Emplacements : `Allergies.tsx`, l. ~63 et ~73 ; `ChoixAllergenes.tsx`, l. ~37.
- **Fiche plat** : la liste « Historique » perd sa boîte bordée (`FichePlat.tsx`, l. ~120). Les lignes se séparent par des filets seulement, comme le veut la règle « jamais de sous-cartes » de `DESIGN.md`.
- **Cartes de l'éditeur** : les trois cartes encore bordées (« Qui reçoit », « Qui vient », « Menu ») passent à la classe `.carte`, sans bordure et avec l'ombre douce. La liste bordée « Déjà servi » (l. ~850) suit la même règle que l'historique de la fiche plat (*mon choix*). Les autres encadrés intérieurs ne sont pas touchés, sauf s'ils sont clairement des sous-cartes. Dans ce cas, les signaler dans le rapport du lot.
- **Encre des tuiles de foyer** : #1A263C devient un jeton CSS `--encre-tuile`, défini dans `:root` et `.dark` (même valeur dans les deux thèmes, car les tuiles gardent leurs couleurs claires). Il est utilisé par `FoyerTile` (`SharedUI.tsx`) et `FeuilleFoyer.tsx`. Mettre à jour la note correspondante dans `DESIGN.md`.

### Lot 7 — Les six points de la relecture 0.3.0

1. **« Revoir la présentation »** : Retour sur l'écran 1 ramène aux Réglages, d'où l'on vient, au lieu de quitter l'appli (*mon choix* : plutôt qu'au carnet). Au premier lancement, rien ne change : Retour sur l'écran 1 quitte l'appli.
2. **Recherche orpheline** : quand la loupe disparaît parce qu'il n'y a plus aucune invitation, la recherche se ferme (`recherche = null`) et son entrée d'historique est retirée. Aucun Retour ne doit rester sans effet.
3. **Cartes bordées de l'éditeur** : traitées dans le lot 6.
4. **Bandeau d'allergie** : `-mx-4` suppose une gouttière de 16 px. Il est remplacé par l'inverse exact de la gouttière réelle, qui tient compte des zones sûres (`max(1rem, env(safe-area-inset-*))`). En paysage avec une encoche, le bandeau couvre toute la largeur.
5. **Passage à l'heure d'été** : `getElapsedTimeInfo` compte les jours en UTC (`Date.UTC`) au lieu de dates locales.
   - Test : deux dates de part et d'autre du 29 mars 2026, avec le fuseau `Europe/Paris`.
   - Vérifier le même motif dans `utils/dates.ts`, par exemple `moisAvantRetour`.
6. **Pictogrammes de Végétarien et Végan** : par défaut, `leaf` et `sprout`, sans toucher aux données.
   - `iconeContrainte` les donne aux identifiants `tag-vegetarien` et `tag-vegan` quand l'utilisateur n'a choisi aucune icône. Une icône choisie l'emporte toujours.
   - Test unitaire.

## 6. Vérification d'ensemble

- **Après chaque lot** : `pnpm lint`, `pnpm test` et `pnpm build` au vert ; captures Playwright (`.superpowers/voir.mjs`) des écrans touchés, en clair et en sombre ; mesures (`audit-a11y.mjs`, `audit-etroit.mjs`).
- **Fin de branche** :
  - relecture complète par un sous-agent `xhigh` ;
  - nouvel `/impeccable audit src` : objectif 0 P1 et 0 P2, avec un score en hausse par rapport à 15/20 ;
  - mise à jour de `DESIGN.md`, de `.impeccable/design.json` (règles devenues vraies, dettes soldées) et de `CLAUDE.md` (ligne Kotlin, outil de focus, bandeau unique).
- **Sur le téléphone de l'utilisateur** (APK de test) : à faire avant toute publication.
  - TalkBack : annonce « Annuler », focus des feuilles, retour du focus depuis l'éditeur.
  - Taille de police à 130 % et au maximum.
  - Bouton Retour sur tous les parcours du lot 7.

## 7. Laissé à celui qui construit

- Les noms des outils et des variables CSS.
- La structure exacte de la zone d'annonce.
- La technique d'extension de la zone tactile des liens.
- La disposition de l'en-tête et de la barre du bas quand la place manque, dans le respect des critères ci-dessus.
- Le découpage fin de chaque lot en tâches.
- Les tests unitaires, pour toute logique pure qui en vaut la peine : pile de focus, calcul de dates, pictogrammes par défaut.
- Tout écart à cette conception se signale dans le rapport du lot, avec sa raison.
