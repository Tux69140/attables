---
name: Attablés
description: Carnet d'invitations hors ligne, chaud comme une table de bouchon et ferme sur les allergies.
colors:
  safran: "#F0B429"
  safran-brule: "#8A5A00"
  safran-pale: "#FBE3A6"
  olive: "#4E6B1A"
  olive-pale: "#EEF8E2"
  rouge-allergie: "#B42318"
  rouge-pale: "#FDECEA"
  blanc-sur-rouge: "#FFFFFF"
  bleu-preference: "#2E5A9C"
  bleu-pale: "#E8EFFA"
  ambre-recent: "#996200"
  ambre-pale: "#FBF0DA"
  fond-creme: "#FBF8F3"
  blanc-carte: "#FFFFFF"
  lin: "#F4EFE7"
  lin-presse: "#E9E1D3"
  filet: "#E8E1D6"
  contour: "#8A7E70"
  expresso: "#2B2420"
  expresso-doux: "#5E554C"
  encre-tuile: "#1A263C"
  foyer-corail: "#FF7A5C"
  foyer-tournesol: "#FFC93C"
  foyer-abricot: "#FF9F45"
  foyer-pomme: "#8CCB4E"
  foyer-lagon: "#2BBFB0"
  foyer-ciel: "#5AA9FF"
  foyer-framboise: "#F0598A"
  foyer-lilas: "#A98BF0"
  nuit: "#0D1624"
  nuit-carte: "#162131"
  nuit-ardoise: "#1F2C3F"
  nuit-ardoise-pressee: "#273952"
  nuit-filet: "#414E60"
  nuit-contour: "#7F8BA0"
  nuit-craie: "#F4F2EA"
  nuit-craie-douce: "#B4BFCE"
  nuit-safran: "#F2B93B"
  nuit-safran-sourd: "#3A3420"
  nuit-pousse: "#A3DE64"
  nuit-olive-fond: "#22301F"
  nuit-bleu-preference: "#A8C3F2"
  nuit-bleu-fond: "#1D2E4A"
  nuit-ambre: "#F2C36A"
  nuit-ambre-fond: "#332711"
  nuit-rouge-texte: "#F38E81"
  nuit-rouge-fond: "#3A1D1D"
typography:
  display:
    fontFamily: "Baumans, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 400
    lineHeight: 1.25
  headline:
    fontFamily: "Baumans, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.375
  title:
    fontFamily: "Baumans, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.3
  body:
    fontFamily: "'Source Sans 3', system-ui, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  body-small:
    fontFamily: "'Source Sans 3', system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "'Source Sans 3', system-ui, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.2
  label-small:
    fontFamily: "'Source Sans 3', system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.2
  caption:
    fontFamily: "'Source Sans 3', system-ui, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.2
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.safran}"
    textColor: "{colors.expresso}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-fab:
    backgroundColor: "{colors.safran}"
    textColor: "{colors.expresso}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0 20px"
    height: "50px"
  button-secondary:
    backgroundColor: "{colors.lin}"
    textColor: "{colors.expresso}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "46px"
  button-success:
    backgroundColor: "{colors.olive}"
    textColor: "{colors.blanc-carte}"
    typography: "{typography.label-small}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-destructive:
    backgroundColor: "{colors.rouge-allergie}"
    textColor: "{colors.blanc-sur-rouge}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "46px"
  button-icon:
    textColor: "{colors.expresso}"
    rounded: "{rounded.md}"
    size: "44px"
  chip:
    backgroundColor: "{colors.blanc-carte}"
    textColor: "{colors.expresso}"
    typography: "{typography.label-small}"
    rounded: "{rounded.full}"
    padding: "0 14px"
    height: "44px"
  chip-selected:
    backgroundColor: "{colors.expresso}"
    textColor: "{colors.blanc-carte}"
    typography: "{typography.label-small}"
    rounded: "{rounded.full}"
    padding: "0 14px"
    height: "44px"
  pastille-allergie:
    backgroundColor: "{colors.rouge-allergie}"
    textColor: "{colors.blanc-sur-rouge}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  pastille-preference:
    backgroundColor: "{colors.bleu-pale}"
    textColor: "{colors.bleu-preference}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  bandeau-allergie:
    backgroundColor: "{colors.rouge-allergie}"
    textColor: "{colors.blanc-sur-rouge}"
    typography: "{typography.caption}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.blanc-carte}"
    textColor: "{colors.expresso}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input:
    backgroundColor: "{colors.lin}"
    textColor: "{colors.expresso}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "46px"
  nav-item-active:
    backgroundColor: "{colors.safran-pale}"
    textColor: "{colors.safran-brule}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
  sheet:
    backgroundColor: "{colors.blanc-carte}"
    textColor: "{colors.expresso}"
    rounded: "{rounded.xl}"
    padding: "16px 20px"
  undo-banner:
    backgroundColor: "{colors.expresso}"
    textColor: "{colors.fond-creme}"
    typography: "{typography.label-small}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
---

# Design System: Attablés

## 1. Overview : Le bouchon en novembre

**Creative North Star: "Le bouchon en novembre"**

Attablés ressemble à la table d'un bouchon lyonnais un soir de novembre : une nappe à carreaux safran, une lumière chaude, des titres qui ont un peu d'accent, et une patronne qui n'oublie jamais qui est allergique à quoi. La chaleur tient en trois choses : le safran, la police Baumans des titres, et les mots (« proches », « repas », « plats »). Le reste se tait : fond crème, cartes blanches sans bordure, texte expresso.

C'est un outil de téléphone, tenu d'une main, pour un public large, seniors compris. Les cibles sont grandes (44 px au moins, 48 à 50 px pour les actions principales), le texte courant fait 15 à 16 px, chaque écran a une tâche et une seule action safran. La mise en page tient en une colonne sur téléphone, centrée dans 1080 px au plus ; les listes de cartes passent à deux colonnes à partir de 768 px. Les marges latérales font 16 px au moins, augmentées des zones sûres d'Android (encoche, bords arrondis, barres système). Le mouvement ne dit qu'un état : barres qui se retirent au défilement, bouton qui s'enfonce à la pression ; tout s'arrête quand « mouvement réduit » est demandé.

Le système refuse le tableau de bord SaaS froid, l'appli de recettes surchargée et les icônes à la place des mots. Il refuse aussi toute couleur chaude saturée qui pourrait se confondre avec le rouge d'allergie, et tout décor qui ralentit la lecture : photos, flous, animations d'entrée. Deux thèmes portent les mêmes rôles : « Safran » en clair, « Nuit marine » en sombre.

**Key Characteristics:**
- Le safran pour agir, le rouge pour l'allergie ; rien d'autre ne crie.
- Des cartes blanches sans bordure, posées sur le fond crème par une ombre douce.
- Baumans pour les titres, Source Sans 3 pour tout le reste.
- Des cibles tactiles de 44 px au moins ; chaque état porte une icône et un mot.
- La nappe vichy safran sous la barre d'état, jamais masquée : c'est la signature.
- Hors ligne et léger : polices auto-hébergées, pictogrammes en SVG, aucune image décorative.

## 2. Colors : La palette Safran et olive

Une palette restreinte : des neutres crème et expresso, un safran pour agir, et quatre couleurs de signal qui n'ont chacune qu'un sens.

### Primary
- **Safran** (#F0B429) : jeton `--primary`. Fond des boutons principaux, du bouton flottant et du bouton « Annuler » ; soulignement de l'onglet de page actif et pastille de son compteur ; carreaux de la nappe vichy. Texte posé dessus : expresso (8,2:1).
- **Safran brûlé** (#8A5A00) : jeton `--primary-ink`. Le safran quand il doit s'écrire sur fond clair (5,6:1 sur crème) : onglet actif de la barre du bas, icônes de service, liens, boutons en pointillés, contour de focus.
- **Safran pâle** (#FBE3A6) : jeton `--indic`. Pastille derrière l'icône de l'onglet actif ; encadré « Idée : jamais servi ».

### Secondary
- **Olive** (#4E6B1A) : jeton `--success`. Ce qui est fait ou réussi : « Passer en réalisée », coup de cœur, « peut revenir », tablée sans allergie.
- **Olive pâle** (#EEF8E2) : jeton `--success-bg`. Fond de ces messages et de la ligne « Le repas a eu lieu ? » (olive dessus : 5,6:1).

### Signaux
- **Rouge d'allergie** (#B42318) : jetons `--alerte` (pleins) et `--error` (texte en clair). Bandeaux et pastilles d'« Allergie », texte blanc à 6,6:1, identiques dans les deux thèmes ; verdict « À éviter » ; confirmation d'une suppression.
- **Rouge pâle** (#FDECEA) : jeton `--error-bg`. Fond du verdict « À éviter » et du bouton « Supprimer » de second plan.
- **Bleu de préférence** (#2E5A9C) : jeton `--pref`. Ce qu'une personne évite (« Évite : lait ») : une information, jamais une alerte.
- **Bleu pâle** (#E8EFFA) : jeton `--pref-bg`. Fond des pastilles et alertes de préférence (5,9:1).
- **Ambre** (#996200) : jeton `--warning`. Un seul sens : « servi récemment, attendre encore n mois », toujours avec l'horloge (jamais le ⚠, réservé aux allergies).
- **Ambre pâle** (#FBF0DA) : jeton `--warning-bg`. Fond de ce message (4,5:1, à la limite : ne pas éclaircir l'ambre).

### Neutral
- **Fond crème** (#FBF8F3) : jeton `--bg`. Fond de l'appli et de l'en-tête ; `theme-color` en clair.
- **Blanc de carte** (#FFFFFF) : jeton `--card`. Cartes, feuilles, barre du bas, champ de recherche.
- **Lin** (#F4EFE7) : jeton `--surface-elevated`. Champs de formulaire, boutons secondaires, pastilles neutres.
- **Lin pressé** (#E9E1D3) : jeton `--surface-active`. État pressé d'une carte ou d'une ligne.
- **Filet** (#E8E1D6) : jeton `--border`. Séparateurs, contour des puces non choisies et des champs.
- **Contour** (#8A7E70) : jeton `--outline`. Contour des cases à cocher et des contrôles qui doivent atteindre 3:1 (4,0:1 sur blanc).
- **Expresso** (#2B2420) : jetons `--ink` et `--on-primary`. Texte (14,4:1 sur crème), fond des puces choisies et du bandeau « Annuler ».
- **Expresso doux** (#5E554C) : jeton `--ink-muted`. Texte secondaire, libellés de champ, onglets inactifs, placeholders (6,9:1 sur crème).
- **Encre de tuile** (`--encre-tuile`, #1A263C) : pictogramme et contour des tuiles de foyer, dans les deux thèmes, car les couleurs de foyer ne changent pas avec le thème.

### Foyers
Huit couleurs d'identité choisies pour chaque foyer. Elles ne portent aucun état et ne servent jamais à un bouton ni à une alerte : tuile du foyer en plein, avatar d'initiale et en-tête de carte en teinte diluée (14 % dans le blanc en clair, 22 % dans la carte de nuit en sombre, calculée en JS par `teinteFoyer`), filet des membres.
- **Corail** (#FF7A5C) : couleur de foyer.
- **Tournesol** (#FFC93C) : couleur de foyer, voisine du safran mais d'identité, pas d'action.
- **Abricot** (#FF9F45) : couleur de foyer.
- **Pomme** (#8CCB4E) : couleur de foyer.
- **Lagon** (#2BBFB0) : couleur de foyer.
- **Ciel** (#5AA9FF) : couleur de foyer.
- **Framboise** (#F0598A) : couleur de foyer.
- **Lilas** (#A98BF0) : couleur de foyer.

### Nuit marine (thème sombre)
Un bleu nuit plutôt qu'un brun : un texte clair sur brun très sombre paraît criard. Les rôles ne changent pas, seules les valeurs.
- **Nuit** (#0D1624) : jetons `--bg` et `--on-primary` en sombre ; voile des feuilles (60 %) dans les deux thèmes.
- **Carte de nuit** (#162131) : jeton `--card`.
- **Ardoise** (#1F2C3F) : jeton `--surface-elevated`.
- **Ardoise pressée** (#273952) : jeton `--surface-active`.
- **Filet de nuit** (#414E60) : jeton `--border`.
- **Contour de nuit** (#7F8BA0) : jeton `--outline`.
- **Craie** (#F4F2EA) : jeton `--ink` (16,2:1 sur nuit).
- **Craie douce** (#B4BFCE) : jeton `--ink-muted` (8,7:1 sur carte de nuit).
- **Safran de nuit** (#F2B93B) : jetons `--primary` et `--primary-ink` ; assez clair pour s'écrire sur nuit.
- **Safran sourd** (#3A3420) : jeton `--indic`.
- **Pousse** (#A3DE64) : jeton `--success`, le vert Biovibralyon (10,2:1 sur carte de nuit).
- **Olive de nuit** (#22301F) : jeton `--success-bg`.
- **Bleu clair de nuit** (#A8C3F2) : jeton `--pref`.
- **Bleu de nuit** (#1D2E4A) : jeton `--pref-bg`.
- **Ambre de nuit** (#F2C36A) : jeton `--warning`.
- **Ambre sourd** (#332711) : jeton `--warning-bg`.
- **Rouge clair** (#F38E81) : jeton `--error`, texte d'erreur sur fond sombre. Les bandeaux pleins gardent le rouge d'allergie #B42318.
- **Rouge de nuit** (#3A1D1D) : jeton `--error-bg`.

### Named Rules
**La règle du rouge réservé.** Le rouge #B42318 appartient aux allergies strictes et aux actions destructrices. Aucune couleur chaude saturée (terracotta, corail, tomate, orange) ne s'en approche dans l'interface : terracotta et rouge d'erreur ne sont qu'à 1,6:1 l'un de l'autre. Les couleurs de foyer restent dans les tuiles, les avatars et les en-têtes de foyer. Si un écran montre deux rouges, l'un des deux est de trop.

**La règle du safran muet.** Le safran remplit et souligne ; il ne s'écrit jamais sur fond clair. En texte ou en icône sur crème ou sur blanc, c'est le safran brûlé #8A5A00.

**La règle d'un sens par couleur.** Olive = fait ou réussi. Bleu = « Évite ». Ambre = servi récemment. Rouge = « Allergie » ou « à éviter ». Une couleur de signal n'est jamais décorative et jamais seule : chaque état porte aussi une icône et un mot.

## 3. Typography : L'enseigne et l'ardoise

**Display Font:** Baumans (with system-ui, sans-serif)
**Body Font:** Source Sans 3 (with system-ui, -apple-system, sans-serif)

**Character:** Baumans, ronde et un peu fantaisie, fait l'enseigne peinte sur la vitrine ; Source Sans 3, humaniste et très lisible, fait l'ardoise du jour. Les deux sont auto-hébergées (sous-ensemble latin, woff2 ; graisses 400, 600 et 700 pour Source Sans 3), sans aucun appel réseau.

### Hierarchy
- **Display** (Baumans 400, 28 à 30 px, interligne 125 %): titres de l'accueil (« Qui a déjà mangé quoi ? ») et des grands états vides.
- **Headline** (Baumans 400, 20 à 24 px, interligne 137 %): « Attablés » dans l'en-tête (24 px), titres de feuille et de carte d'invitation (20 px).
- **Title** (Baumans 400, 18 à 19 px, interligne 130 %): titres de section (« Foyers », « Apéro », « Allergènes »), titre d'une invitation réalisée.
- **Body** (Source Sans 3 400, 15 à 16 px, interligne 145 %): texte courant, prénoms, plats du menu ; 16 px dans les champs de recherche, pour éviter le zoom automatique.
- **Body small** (Source Sans 3 400, 14 px, interligne 145 %): texte secondaire, dates, lieux, aides sous les champs.
- **Label** (Source Sans 3 600, 14 à 15 px): boutons (15 px pour les actions principales, 14 px pour les secondaires et les puces), libellés de champ.
- **Caption** (Source Sans 3 700, 13 px): libellés de la barre du bas, pastilles de contrainte, compteurs, verdicts.

L'échelle est serrée (1 à 2 px entre deux crans) et exprimée en px. Le suivi de la taille de police réglée dans Android reste à vérifier sur un vrai téléphone.

### Named Rules
**La règle de l'enseigne.** Baumans signe les titres : écran, section, carte, feuille. Jamais sur un bouton, un libellé, une donnée, un nombre ni un prénom dans une liste. Une carte porte un seul titre Baumans.

**La règle des mots écrits.** Les noms des plats, des convives et des allergies s'écrivent en toutes lettres. Un pictogramme accompagne un mot, il ne le remplace pas. Seuls les boutons d'icône universels (loupe, réglages, fermer, menu « ⋮ ») s'en passent, avec un nom accessible.

**La règle de la casse normale.** Pas de petites capitales espacées pour annoncer une section. Les intitulés « Allergie », « Évite » et les groupes d'allergènes sont en casse normale, en gras, à la même taille.

## 4. Elevation : Posé sur la nappe

Le système est presque plat. Une seule ombre douce pose les cartes blanches sur le fond crème, sans bordure ; ce qui flotte au-dessus du contenu (bouton flottant, bandeau « Annuler », feuilles) prend une ombre plus marquée. En sombre, l'ombre se densifie, car l'écart de valeur entre le fond et la carte est faible. Dans une carte, les lignes d'une liste se séparent par des filets #E8E1D6, jamais par des sous-cartes.

### Shadow Vocabulary
- **Posée** (`box-shadow: 0 2px 10px rgb(43 36 32 / 0.08)` ; en sombre `0 2px 10px rgb(0 0 0 / 0.35)` ; jeton `--ombre`, classe `.carte`) : cartes d'invitation, de foyer, de convive et de plat.
- **Bandeau** (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`) : bandeau d'allergie collant de l'éditeur.
- **Flottante** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`) : bouton flottant « Préparer une invitation ».
- **Notification** (`box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`) : bandeau « Annuler », fenêtre de confirmation.
- **Levée** (`box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25)`) : feuilles du bas, au-dessus d'un voile nuit à 60 %.

### Named Rules
**La règle de la nappe.** Les surfaces sont posées, pas empilées : une carte ne contient jamais une autre carte, n'a pas de bordure, et son ombre ne dépasse pas « Posée ». Si l'on voit l'ombre avant le contenu, elle est trop sombre.

**La règle du verre interdit.** Ni effet verre ni flou décoratif. L'en-tête, la barre du bas et le voile des feuilles n'ont aucun flou : coûteux sur les anciennes WebView, inutiles sur des fonds opaques. N'en ajoutez pas.

## 5. Components : Généreux et rassurant

Des contrôles larges et arrondis qu'on touche sans viser : 12 px de rayon pour ce qu'on touche, 16 px pour ce qui contient, 24 px pour le haut des feuilles, entièrement rond pour ce qui se choisit. Une seule action safran par écran.

### Buttons
- **Shape:** coins doucement arrondis (12 px) ; bouton flottant et bandeau « Annuler » à 16 px.
- **Primary:** fond safran, texte expresso 15 px semi-gras, hauteur 48 px (50 px pour le bouton flottant et l'action en bas d'une fiche), pleine largeur dans les feuilles. Icône de 18 à 20 px à gauche quand elle aide.
- **Pressé / Focus:** à la pression, le bouton se réduit à 98 % ; le focus clavier est un contour de 2 px safran brûlé (décalage de 2 px), posé par une règle `:focus-visible` globale ; il reste visible dans les cartes qui rognent. Pas d'effet de survol propre : l'appli est tactile, seuls les boutons d'icône prennent un fond lin au survol.
- **Désactivé:** opacité 50 %, rien d'autre.
- **Secondaire:** fond lin, filet #E8E1D6, texte expresso, hauteur 44 à 46 px.
- **Réussite:** « Passer en réalisée » sur fond olive, texte blanc, hauteur 44 px, icône de coche.
- **Destructif:** fond rouge d'allergie, texte blanc, réservé à la confirmation d'une suppression ; en second plan, « Supprimer » sur rouge pâle avec texte rouge.
- **Icône seule:** 44 × 44 px, sans fond, coins de 12 px ; nom accessible obligatoire (« Rechercher », « Réglages », « Fermer »).
- **En pointillés:** filet pointillé safran brûlé (1 px) ou safran (2 px) pour « + Nouveau convive » et « + Enregistrer « … » » : une proposition, pas une commande.

### Chips
- **Puces de filtre et de choix:** rondes, filet #E8E1D6 sur blanc, texte expresso 14 px semi-gras, icône de 16 px. Choisie : fond expresso, texte blanc ; l'état se lit sans dépendre d'un fond pâle. Attribut `aria-pressed`.
- **Hauteur:** 44 px au moins. Les puces font 44 px (la dette relevée par l'audit est soldée).
- **Pastilles de contrainte:** rondes, 13 px gras, icône de 14 px. « Allergie » : rouge plein, texte blanc, icône de l’aliment ; « Évite » : bleu pâle, texte bleu. Le libellé est toujours écrit, et le niveau se lit en mots dans la fiche d'une personne (« Allergie » / « Évite »), jamais par la couleur seule.
- **État « choisi »:** un seul pour toute sélection (puces, convives et foyers de « Qui vient ? », mois de prescription, type de repas, grilles d'allergènes) : fond expresso, texte blanc, coche ; non choisi : fond carte ou lin, filet. L'olive reste réservée à « fait / réussi ». Les verdicts (Coup de cœur, Bien, À éviter) gardent leur couleur de sens et gagnent la coche une fois choisis.

### Cards / Containers
- **Corner Style:** 16 px.
- **Background:** blanc de carte (#FFFFFF) en clair, carte de nuit (#162131) en sombre.
- **Shadow Strategy:** « Posée » (voir Elevation).
- **Border:** aucune.
- **Internal Padding:** 16 px ; 12 à 14 px pour les cartes compactes (invitation réalisée).
- **Carte d'invitation:** bandeau d'allergie rouge plein en tête, regroupé par aliment (« Gluten — Nadia · Arachides — Léa, Nadia »), puis date et délai en gras, titre Baumans, prénoms, menu précédé des icônes de service ; un ⚠ rouge devant un plat qui contient l'allergène d'un convive ; ligne olive « Le repas a eu lieu ? » le jour venu.
- **Carte de foyer:** en-tête teinté de la couleur du foyer, tuile de 44 px, nom en Baumans ; les membres sont dans la carte, avec un avatar d'initiale teinté.

### Inputs / Fields
- **Style:** fond lin dans les formulaires, blanc pour la recherche ; filet #E8E1D6 ; coins de 12 px ; hauteur 46 à 48 px ; texte 15 à 16 px ; libellé au-dessus, 14 px semi-gras, expresso doux.
- **Focus:** le filet passe au safran brûlé, sans halo.
- **Erreur:** message sous le champ, rouge, 14 px semi-gras.
- **Placeholder:** expresso doux, jamais plus clair.

### Navigation
- **Barre du bas:** trois onglets (Invitations · Convives · Plats) sur blanc de carte, filet en haut, 64 px de haut plus la zone de navigation d'Android. Onglet actif : pastille safran pâle de 56 × 28 px derrière l'icône de 22 px, libellé de 13 px gras en safran brûlé ; inactif : expresso doux. Attribut `aria-current="page"`.
- **Réglages:** la racine compte cinq entrées (plus de « Contraintes alimentaires » : elles vivent dans la fiche de chaque personne) ; pastilles d'icône neutres (fond lin, icône safran brûlé), une seule action safran par écran.
- **En-tête:** fond crème, « Attablés » centré en Baumans 24 px, loupe et réglages à droite en 44 px.
- **Onglets de page** (À venir / Réalisées) : texte de 16 px ; l'onglet actif est gras, expresso, souligné de 3 px de safran, avec un compteur sur pastille safran ; l'inactif est en expresso doux, compteur sur lin.
- **Au défilement:** l'en-tête, la barre du bas et le bouton flottant se retirent (600 ms, `cubic-bezier(0.33, 0, 0.2, 1)`) ; la nappe reste. Rien ne bouge en « mouvement réduit ».
- **Feuilles du bas:** coins hauts de 24 px, poignée de 40 × 4 px, titre Baumans de 20 px centré, bouton Fermer de 44 px à droite, 88 % de la hauteur d'écran au plus ; le bouton Retour d'Android les ferme.

### Nappe vichy
La signature du système : des carreaux de 8 px, safran à 40 % sur crème (28 % sur nuit), dans la bande de la barre d'état (6 px au moins dans un navigateur) et dans la zone de la barre de navigation d'Android. Jamais masquée au défilement. Reprise dans l'illustration de l'accueil et sur le site. C'est le seul motif décoratif.

### Pictogrammes
Un jeu unique au trait : grille de 24 px, trait de 2 px à bouts ronds (Lucide, licence ISC), complété de dessins maison dans le même style (moutarde, chocolat, ail). De 14 à 22 px selon le texte qu'ils accompagnent, masqués aux lecteurs d'écran et toujours doublés d'un mot. Les tuiles de foyer portent un pictogramme choisi (maison, table, cœur…) en encre de tuile sur la couleur du foyer.

### Bandeau « Annuler »
Fond expresso, texte crème de 14 px, coins de 16 px, ombre « Notification », bouton « Annuler » safran ; il reste 7 secondes au-dessus du bouton flottant après toute action destructrice, et disparaît dès qu'on touche l'écran ailleurs. Un enregistrement fait depuis une fiche (allergènes ou nom d'un plat, « Modifier la fiche » d'une personne) ramène à cette fiche, à jour, le bandeau posé par-dessus. Dans la fiche d'une personne, un élément retiré laisse à sa place une ligne « Retiré : Arachides » avec son « Annuler », tant que la fiche est ouverte.

### Filet de foyer
Seule exception autorisée à l'interdiction des filets latéraux : un filet vertical de 3 px à la couleur du foyer devant chaque membre, à l'intérieur d'une carte de foyer de l'onglet Convives. Nulle part ailleurs.

## 6. Do's and Don'ts

### Do:
- **Do** garder une seule action safran (#F0B429) par écran ; les autres boutons sont en lin, en olive ou en rouge selon leur sens.
- **Do** écrire chaque allergie sous la forme « Allergène — Prénom » (partout : bandeau, carte, « La tablée » personne par personne), en rouge plein #B42318 et texte blanc, en tête de tout écran où elle compte.
- **Do** passer par les jetons (`var(--ink)`, `var(--primary)`…) ; les seules couleurs écrites en dur sont les huit couleurs de foyer ; l'encre de tuile passe par le jeton `--encre-tuile` (#1A263C) et son filet à 15 % par `--encre-tuile-filet`.
- **Do** donner 44 px au moins à toute cible tactile, et 48 à 50 px aux actions principales.
- **Do** doubler chaque état d'une icône et d'un mot : la couleur seule ne porte jamais l'information.
- **Do** réserver le ⚠ aux allergies ; « servi récemment » prend l'horloge, en ambre.
- **Do** vérifier toute nouvelle couleur par le test de contraste des jetons, en clair et en sombre : 4,5:1 pour le texte, 3:1 pour les contrôles.
- **Do** calculer en JS les teintes mélangées, comme `teinteFoyer` : ni `color-mix()` ni CSS récent sans repli, car l'appli tourne sur d'anciennes WebView.
- **Do** réserver le mouvement aux changements d'état, en 150 à 250 ms (600 ms pour le retrait des barres), avec une variante « mouvement réduit ».

### Don't:
- **Don't** faire « le tableau de bord SaaS froid : cartes grises identiques, chiffres en vedette, ton d'entreprise ».
- **Don't** faire « l'appli de recettes surchargée : photos de plats partout, publicité, flux à faire défiler sans fin ».
- **Don't** mettre « les icônes à la place des mots » : les noms des plats, des convives et des allergies restent écrits en toutes lettres.
- **Don't** introduire de terracotta, de corail, de tomate ni d'orange dans l'interface : ils se confondent avec le rouge d'allergie. La palette crème, terracotta, corail et sauge a été écartée pour cette raison.
- **Don't** écrire en safran sur fond clair ; c'est le safran brûlé #8A5A00.
- **Don't** employer l'ambre pour autre chose que « servi récemment », ni le bleu pour une allergie.
- **Don't** poser de filet coloré de plus de 1 px sur le côté d'une carte, d'une alerte ou d'une ligne de liste ; seule exception, le filet de foyer de 3 px des membres dans une carte de foyer.
- **Don't** imbriquer une carte dans une carte, ni border une carte.
- **Don't** utiliser d'effet verre, de flou d'arrière-plan, de texte en dégradé ni d'animation d'entrée.
- **Don't** mettre Baumans sur un bouton, un libellé ou une donnée.
- **Don't** passer à un brun très sombre pour le thème sombre : la Nuit marine (#0D1624) a été choisie parce qu'un texte clair sur brun paraît criard.
