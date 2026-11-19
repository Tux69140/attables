# Refonte UI : premier lancement, palette, allergies, Convives, Plats — conception

Date : 2026-11-17 · Statut : validé par l'auteur · Maquettes de travail : `.superpowers/brainstorm/638041-1794924780/content/` (non versionnées)

## 1. Intention

**Déclencheur.** Un testeur, placé devant l'écran d'accueil rempli des données d'exemple, n'a pas su par où commencer. Le bandeau disait *ce que sont* les données (« Marc, Sophie et les autres sont des exemples ») mais pas *quoi faire* ; ses deux boutons (« Effacer les exemples », « Masquer ce bandeau ») ne veulent pas dire « commencer ».

**Diagnostic** (validé par l'auteur) :
1. L'appli s'ouvre sur la 2ᵉ étape (Invitations) alors que tout commence par les convives.
2. Sans convives, « Qui vient ? » est un cul-de-sac (« Ajoutez des convives depuis l'onglet Convives ») : il faut quitter l'invitation.
3. La valeur (« qui a déjà mangé quoi ») n'apparaît qu'après « Passer en réalisée », que rien n'annonce.

**Souhait de l'auteur pour le reste** : une appli « plus moderne, plus appétissante, attrayante » ; des allergies strictes impossibles à rater ; une différence nette entre foyers et individus.

## 2. Objectifs, non-objectifs, anti-objectifs

**Objectifs**
- Une première minute qui explique la boucle (proches → invitation → réalisée → mémoire) et mène à une vraie première action.
- Une palette chaude et gourmande (Safran + olive / Nuit marine).
- L'allergie stricte reste **la couleur qui crie le plus**, partout, sous **une seule forme** : « Allergène — Prénom ».
- Écran Invitations centré sur « ce qui arrive » ; écran Convives où un foyer ne peut pas être confondu avec un individu.

**Non-objectifs**
- **Deviner** un allergène à partir du nom d'un plat (« satay » → arachides) : jamais. Seuls les allergènes **renseignés à la main** sur un plat déclenchent une alerte (§5.10).
- Changer la typographie (Baumans + Source Sans 3 restent).
- Une cloche, un profil, un compte, un onglet « Recherche » : rien de tout cela n'existe ni ne doit exister. Seul ajout à la barre : l'onglet « Plats » (§5.8).
- Une pastille de compteur sur la barre du bas : écartée (elle se lirait « n invitations à venir »).

**Anti-objectifs** (échec même si « ça marche »)
- Un rouge d'allergie concurrencé par une autre couleur (accent rouge, orange, terracotta…).
- Un bouton flottant réduit à un « + » sans texte : pire que l'actuel pour quelqu'un qui ne sait pas par où commencer.
- Les noms des plats remplacés par des icônes : c'est le cœur de l'anti-doublon.
- Un membre affiché hors de son foyer.
- Toute dépendance réseau, télémétrie, bibliothèque de carrousel ou d'animation.
- Les personnes ayant déjà l'appli qui revoient l'accueil à la mise à jour.

## 3. Contraintes

- 100 % hors ligne, aucune permission `INTERNET`, aucune nouvelle dépendance (F-Droid).
- Couleurs uniquement via les variables de `src/index.css` (`:root` clair, `.dark` sombre).
- Contraste WCAG AA : texte ≥ 4,5:1 (≥ 3:1 pour le texte large ou gras ≥ 14 px). Toutes les valeurs du §5.1 ont été vérifiées.
- Toute nouvelle vue plein écran, modale ou feuille utilise `useAndroidBack`.
- Rapprochement des noms de plats : pas de dictionnaire (risque de fusionner à tort deux plats différents). `normalizeForCompare` ignore casse, accents, espaces multiples, œ/æ, apostrophes droites ou courbes **et tirets** ; au-delà, une simple suggestion « Vous voulez dire… ? » (§5.9), jamais de fusion automatique.
- Toute action destructrice suit le schéma snapshot + `showUndo` (7 s).
- Tout nouveau champ de `AppData` est normalisé dans `migrateAndValidateAppData`.
- Mode démo (`MODE_DEMO`) : n'écrit jamais dans `localStorage`, thème clair forcé.
- En-têtes GPL/SPDX sur tout nouveau fichier source.
- Le site (`site/`) a sa propre copie des variables (`site/src/styles.css`) ; les pages légales et peut-être `site/src/legal.css` sont générées par `~/Documents/Textes-legaux` (ne pas éditer à la main : vérifier qui produit `legal.css`).
- WebView Android : versions anciennes possibles ; ne pas compter sur `color-mix()` sans repli (voir §5.5).

## 4. Approches envisagées et choix

### 4.1 Que deviennent les exemples au premier lancement ?
| | Approche | Pour | Contre |
|---|---|---|---|
| A | Exemples d'abord, bulles d'explication posées dessus | Appli « vivante », mémoire démontrée | Bulles fragiles, données qui ne sont pas les siennes |
| B | Carnet vide d'abord, exemples dans Réglages | Net, chacun part de ses données | La valeur n'apparaît qu'après un vrai repas |
| **C ✔** | **Accueil puis deux portes : « Commencer avec mes proches » / « Visiter avec des exemples »** | Répare ce qu'a vécu le testeur, garde les exemples pour les curieux et la démo | Un écran de plus |

Choix de l'auteur : **C**, avec le parcours guidé réaffiché à chaque ouverture tant que le carnet est vide.

### 4.2 Comment savoir qu'il faut afficher l'accueil ?
| | Approche | Pour | Contre |
|---|---|---|---|
| **A ✔** | **Champ `settings.accueilVu` dans `AppData`** | Suit l'architecture (état unique, normalisé au chargement) | Voyage dans les sauvegardes (sans gêne) |
| B | Clé `localStorage` séparée | Hors sauvegardes | Second chemin de stockage |
| C | Absence de carnet enregistré = nouvelle installation | Rien à stocker | Il faut bloquer toute sauvegarde avant le choix d'une porte : implicite, fragile |

Choix de l'auteur : **A**.

### 4.3 Palette
Pistes montrées : **Safran** (jaune safran, texte expresso), **Olive** (vert olive), **Aubergine**. Aubergine écartée (« elle m'oppresse »). Choix : **Safran avec l'olive comme seconde couleur** (« plus chaud, lyonnais en novembre »).
Sombres montrés : Nuit expresso, **Nuit marine**, Nuit olive. Choix : **Nuit marine** (un texte clair sur brun très sombre paraît criard à l'auteur).
Rejeté : la palette crème/terracotta/corail/sauge proposée par une autre IA — terracotta et corail se confondent avec le rouge d'allergie (1,6:1 entre terracotta et rouge d'erreur) ; corail et sauge avec texte blanc échouent à l'AA (2,95 et 3,03).

### 4.4 Rangement de l'écran Invitations
| | Approche | Pour | Contre |
|---|---|---|---|
| A | Une liste : recherche + filtre d'hôte sur une ligne, sections « À venir » puis « Réalisées » | Tout au même endroit | L'historique s'allonge sans fin sous la liste |
| **B ✔** | **Deux onglets « À venir / Réalisées »**, puces d'hôte, recherche derrière une loupe | L'accueil ne montre que ce qui arrive (usage le plus fréquent selon l'auteur) | Un geste de plus pour l'historique |

Choix de l'auteur : **B**.

### 4.5 Idées de plats
Proposé : une liste « Idées » distincte. **Rejeté par l'auteur** : « la liste d'idées va se faire toute seule » — une idée est simplement **un plat connu mais jamais servi**. Il faut seulement une entrée claire pour enregistrer un plat (§5.9).

### 4.6 Allergènes des plats : que fait l'appli de l'information ?
| | Approche | Pour | Contre |
|---|---|---|---|
| A | Simple affichage des pictogrammes | Aucun changement aux contraintes | Le cuisinier recoupe de mémoire : contraire à « allergies impossibles à rater » |
| **B ✔** | **Affichage + alerte automatique dans l'éditeur** quand un plat contient un allergène lié à la contrainte d'un convive présent | Vrai gain de sécurité | Chaque contrainte doit être reliée à ses allergènes (modèle modifié) |

Choix de l'auteur : **B**.

## 5. Conception détaillée

### 5.1 Palette et jetons (`src/index.css`)

Valeurs validées (clair = Safran + olive ; sombre = Nuit marine) :

| Rôle (jeton) | Clair | Sombre | Usage |
|---|---|---|---|
| `--bg` | `#FBF8F3` | `#0D1624` | fond |
| `--card` | `#FFFFFF` | `#162131` | cartes, barres |
| `--surface-elevated` | `#F4EFE7` | `#1F2C3F` (inchangé) | champs, pistes |
| `--surface-active` | `#E9E1D3` (à ajuster) | `#273952` (inchangé) | état pressé |
| `--border` | `#E8E1D6` | `#414E60` (inchangé) | séparateurs |
| `--outline` | à recalculer dans la gamme expresso | `#7F8BA0` (inchangé) | contours de cases |
| `--ink` | `#2B2420` (expresso) | `#F4F2EA` | texte |
| `--ink-muted` | `#5E554C` | `#B4BFCE` | texte secondaire |
| `--primary` | `#F0B429` (safran) | `#F2B93B` | bouton flottant, boutons principaux, soulignement d'onglet, pastille du compteur |
| `--on-primary` | `#2B2420` | `#0D1624` | texte sur safran (8,2:1 / > 9:1) |
| `--primary-ink` *(nouveau)* | `#8A5A00` | `#F2B93B` | texte ou icône « couleur d'action » sur fond clair (onglet actif de la barre, icônes de service) |
| `--success` | `#4E6B1A` (olive) | `#A3DE64` (vert Biovibralyon, 10,2:1 sur carte) | « fait / bon » : passer en réalisée, coup de cœur, peut revenir |
| `--success-bg` | `#EEF8E2` (teinte pâle de `#A3DE64`) | `#22301F` | fonds associés |
| `--pref` *(nouveau)* | `#2E5A9C` | `#A8C3F2` | préférences alimentaires (remplace l'ambre) |
| `--pref-bg` *(nouveau)* | `#E8EFFA` | `#1D2E4A` | |
| `--warning` | `#9C6400` (inchangé) | `#F2C36A` (inchangé) | « servi récemment » uniquement |
| `--warning-bg` | `#FBF0DA` | `#332711` | |
| `--error` | `#B42318` | `#F38E81` (inchangé) | texte d'allergie, « à éviter » |
| `--error-bg` | `#FDECEA` | `#3A1D1D` (inchangé) | |
| `--alerte` *(nouveau)* | `#B42318` | `#B42318` | **bandeaux d'allergie pleins**, texte blanc (6,6:1), identiques dans les deux thèmes |

- `--primary` n'est **plus** égal à `--success` : tout code qui utilisait `--primary` pour signifier « fait » passe à `--success`, et tout code qui utilisait `--warning` pour une **préférence** passe à `--pref`.
- Le safran ne sert jamais de couleur de texte sur fond clair (contraste insuffisant) : utiliser `--primary-ink`.
- « dans 11 jours » s'écrit en `--ink` gras (le safran foncé ressemblait à l'ambre de « servi récemment »).
- **Nappe vichy** (`.nappe`, `.nappe-bas`, illustration d'accueil) : carreaux safran, `rgba(240,180,41,.40)` en clair, `rgba(242,185,59,.28)` en sombre. Le rouge tomate disparaît.
- `meta[name=theme-color]` dans `App.tsx` : `#FBF8F3` en clair, `#0D1624` en sombre.
- **Cartes** : plus de bordure, coins 16 px, ombre douce (`0 2px 10px` à ~8 % d'expresso en clair ; ombre plus forte en sombre). Pas de cartes imbriquées.
- **Couleurs de foyer** : inchangées (Tournesol, proche du safran, est conservé : couleur d'identité, pas d'action).
- **`ConfirmModal`** : le rouge en dur `#A82E27` passe sur le jeton `--alerte`.
- **Site** : `site/src/styles.css` reçoit les mêmes valeurs claires (et la nappe safran). Les variables `--appetit-*` du site sont à revoir pour ne pas réintroduire d'orange/tomate concurrent. Captures à régénérer (`pnpm site:captures`).

### 5.2 Contrôles segmentés et onglets (correctif transversal)
Sur fond crème, l'onglet blanc « actif » et la piste beige « inactive » se lisent à l'envers (signalé par l'auteur ; même défaut sur les filtres actuels et le choix « Chez moi / Chez un proche » de l'éditeur). Règle : **l'état sélectionné se lit sans dépendre d'un fond pâle**.
- Onglets de page (À venir / Réalisées) : texte gras `--ink` + soulignement 3 px `--primary` + compteur sur pastille safran ; inactif : `--ink-muted`, compteur sur `--surface-elevated`. `role="tablist"`/`tab`, `aria-selected`.
- Puces de filtre (hôte, allergies) : sélectionnée = fond `--ink`, texte `--card` ; sinon contour `--border`.
- Le sélecteur « Chez moi / Chez un proche » de l'éditeur et le choix du thème dans Réglages suivent l'une de ces deux formes.

### 5.3 Premier lancement

**Données** : `AppSettings` gagne `accueilVu: boolean`.
- `migrateAndValidateAppData` : absent ou non booléen → `true` (personnes ayant déjà l'appli, anciennes sauvegardes).
- Nouvelle installation (`creerStockage().charger()` sans clé) : **carnet vide** (`createEmptyData`) avec `accueilVu: false` — plus de chargement automatique des exemples.
- JSON illisible : traité comme une nouvelle installation (carnet vide + accueil) au lieu des exemples. *(Call.)*
- `createEmptyData(keepSettings)` conserve `accueilVu` ; « Vider toutes les données » ne réaffiche donc pas l'accueil, mais le parcours guidé.
- `createSampleData` : `accueilVu: true`.
- Démo : `accueilVu: true` et exemples, comme aujourd'hui (la démo ouvre directement la porte « exemples »).

**Accueil** : vue plein écran rendue par `App.tsx` avant tout le reste quand `!accueilVu`, nappe vichy en haut, sans en-tête ni barre d'onglets.
1. **La promesse** — illustration (table vue de dessus, nappe vichy safran, quatre couverts ; SVG en ligne dans le style des icônes) ; titre Baumans « Qui a déjà mangé quoi ? » ; texte « Attablés s'en souvient pour vous : les plats servis, les allergies, les goûts de chacun. »
2. **Comment ça marche** — trois étapes numérotées : « Vos proches — Seuls ou par foyer, avec leurs allergies et leurs goûts. » ; « Une invitation — Cochez qui vient : Attablés réunit leurs allergies et rappelle ce qu'ils ont déjà mangé. » ; « Après le repas — « Passer en réalisée » : les plats sont retenus pour la prochaine fois, et vous les retrouvez dans l'onglet Plats. » Encart : « Tout reste sur ce téléphone. Sans compte, sans connexion. »
3. **Par où commencer ?** — bouton principal « Commencer avec mes proches » (sous-titre « Carnet vide, on vous guide pas à pas. ») ; bouton secondaire « Visiter avec des exemples » (« Marc, Sophie, Léa… effaçables d'un geste. »).
- Écrans 1–2 : « Passer » en haut à droite → écran 3 ; points de pagination ; bouton « Suivant ». Écran 3 : pas de « Passer ».
- Glissement horizontal natif par `scroll-snap` CSS (aucune bibliothèque), synchronisé avec les points et « Suivant ». Respecter `prefers-reduced-motion`.
- Retour Android : écran 2 ou 3 → écran précédent ; écran 1 → comportement par défaut (quitter).
- « Commencer avec mes proches » → `accueilVu = true`, carnet vide, écran Invitations avec parcours guidé.
- « Visiter avec des exemples » → `accueilVu = true`, données d'exemple chargées (réglages conservés).
- **Revoir la présentation** : nouvelle entrée dans Réglages. Si le carnet n'est pas vide (exemples compris), l'écran 3 remplace les deux portes par un seul bouton « C'est parti » qui ferme l'accueil sans toucher aux données ; s'il est vide, les deux portes s'affichent. *(Call.)*

**Parcours guidé** (écran Invitations, onglet « À venir ») — état **déduit des données**, rien n'est mémorisé :
- Étape ① faite si `convives.length > 0` ; ② si `invitations.length > 0` ; ③ si au moins une invitation est `realisee`.
- Aucune invitation : carte « Pour bien démarrer » avec les trois étapes ; l'étape courante porte son bouton (« + Ajouter un proche » → feuille « Ajouter… » du §5.6 ; « + Préparer une invitation » → éditeur) ; les suivantes sont grisées ; les faites sont cochées (« Famille Martin et Nadia sont dans le carnet. »).
- Dans cet état : ni onglets, ni puces, ni recherche, ni bouton flottant tant qu'il n'y a aucun convive. Le bouton flottant réapparaît dès qu'une invitation existe.
- La feuille « Ajouter… » s'ouvre **par-dessus l'écran Invitations, sans changer d'onglet** ; après l'enregistrement, on reste sur Invitations et le guide montre l'étape suivante. Elle doit donc pouvoir s'ouvrir depuis les deux onglets (état remonté dans `App.tsx` ou composant partagé).
- Créer **un foyer** ne valide pas l'étape ① (un foyer sans membre ne s'invite pas) : après l'enregistrement d'un nouveau foyer, la feuille de création de convive s'ouvre avec ce foyer présélectionné. Ce chaînage vaut partout, pas seulement pendant le parcours. *(Call.)*
- Au moins une invitation mais aucune réalisée : le guide se réduit à une ligne au-dessus de la liste (« Dernière étape : après le repas, touchez « Passer en réalisée ». Attablés retiendra les plats servis. ») avec une croix ; la fermeture vaut pour la session seulement (état React, non persisté) : la ligne revient à l'ouverture suivante, comme l'auteur l'a demandé pour le parcours. *(Call.)*
- Le guide disparaît dès la première invitation réalisée.
- La logique (étapes faites, étape courante) vit dans une **fonction pure testée** (par ex. `src/utils/parcours.ts`).

**Bandeau des exemples** (`BandeauExemples`) : « Vous visitez avec des exemples. » / « Marc, Sophie, Léa… sont fictifs. Ouvrez une invitation pour voir les allergies et les plats déjà servis. » ; bouton principal « Commencer avec mes proches » (= efface les exemples via `effacerExemples`, avec `showUndo`, puis le parcours guidé s'affiche de lui-même) ; lien « Masquer ». Les captures du site cliquent désormais « Visiter avec des exemples » puis « Masquer ».

**Cul-de-sac de « Qui vient ? »** : bouton « + Nouveau convive » dans la section, qui ouvre la même feuille de création de convive que l'écran Convives (à extraire en composant partagé) ; le convive créé est enregistré dans `AppData` et coché dans l'invitation en cours, sans quitter l'éditeur.

### 5.4 Écran Invitations

- **En-tête** : « Attablés » au centre ; à droite loupe puis réglages.
- **Onglets** « À venir · n » / « Réalisées · n » (§5.2). « À venir » ouvert par défaut. `statut === 'prevue'` → À venir ; `'realisee'` → Réalisées.
- **Puces d'hôte** sous les onglets : « Tous » / « Chez moi » / « Chez les autres ».
- **Recherche** : la loupe ouvre un champ sous l'en-tête ; pendant une recherche, les résultats couvrent les deux statuts, groupés « À venir » puis « Réalisées » ; fermer la recherche rend les onglets.
- **Ordre « À venir »** : d'abord les invitations prévues **dont la date est passée** (les plus anciennes en premier), puis les futures par date croissante.
- **Carte « À venir »**, dans l'ordre de lecture :
  1. Si allergie stricte à table : **bandeau plein `--alerte`** en tête de carte, texte blanc gras : « ⚠ Arachides (Léa) · Fruits à coque (Nadia) » ; au-delà de ce qui tient sur une ligne, tronquer avec « +n ».
  2. Ligne « quand » : date en gras (`sam. 28 nov.`), délai relatif en `--ink` gras (« aujourd'hui », « demain », « dans 11 jours » ; pour une date passée : « hier », « il y a 2 jours »), hôte (« · Chez moi » / « · Chez Paul & Julie »).
  3. Titre (Baumans), puis prénoms des convives (pas d'avatars).
  4. Menu : une ligne par service renseigné, petite icône de service (apéro, entrée, plat, fromage, dessert — 5 nouvelles icônes dans `Icons.tsx`, couleur `--primary-ink`) + nom du plat.
  5. Si la date est passée : pied de carte `--success-bg`, « Le repas a eu lieu ? » + bouton plein `--success` « ✓ Passer en réalisée ». Pour une date future : **aucun** bouton.
  - Les préférences ne figurent pas sur la carte.
- **Carte « Réalisées »** : compacte, une ligne de titre + « date · hôte · convives (prénoms ou nombre) » + verdict à droite (♥ Coup de cœur en `--success`, ⊘ À éviter en `--error`). Pas de bandeau d'allergie.
- **Bouton flottant** « + Préparer une invitation » en safran, texte expresso, libellé conservé.
- États vides : onglet sans résultat pour un filtre → message sobre ; carnet vide → parcours guidé (§5.3).

### 5.5 Invitation (éditeur)

- **Bandeau d'allergies collé sous l'en-tête** (`position: sticky`, `--alerte`, texte blanc gras) dès qu'au moins une allergie stricte concerne les convives cochés : « ⚠ Arachides — Léa · Fruits à coque — Nadia ». Visible partout dans l'éditeur, y compris en mode « réalisé » figé. Le toucher fait défiler jusqu'à « La tablée ». Il **remplace** le « Rappel allergies strictes » au-dessus du menu et le bloc d'allergies du résumé figé.
- **« Tableau de bord de la tablée » devient « La tablée »** ; la section n'est plus repliable pour ses contraintes. Ordre fixe :
  1. Encadré « ⚠ Allergies strictes » (`--error-bg`, bordure `--error`) : une ligne par allergène, allergène en gras à gauche, prénoms à droite.
  2. « Préférences » (`--pref-bg`/`--pref`), même mise en ligne.
  3. Notes libres (`--surface-elevated`, icône crayon) : « Sophie — chèvre et brebis tolérés ».
  4. Aucune contrainte : message `--success` actuel.
- **« Déjà servi à ces convives »** devient un bloc distinct, **replié par défaut**, dont l'en-tête résume en pastilles : « n récents » (`--warning`), « ♥ n coups de cœur » (`--success`), « n plats » (neutre). Contenu déplié : liste actuelle inchangée.
- **Un seul composant d'affichage des allergies** (bandeau, encadré de la tablée, fiche convive) pour garantir une formulation unique « Allergène — Prénom(s) ».
- **Suggestions de plats** : `getDishSuggestions(allInvitations, value, courseKey)` — ne proposer que les plats déjà saisis **dans le même service**. L'alerte de doublon (`findDishConflicts`) continue de comparer **tous** les services.
- Libellés de services dans le menu précédés de leur icône (§5.4).
- Barre d'actions : « Enregistrer prévue » (neutre) et « ✓ Valider réalisée » (`--success`).

### 5.6 Écran Convives

- **Recherche** (inchangée) puis **puces** : « Tous · n » / « ⚠ Allergies · n » (convives ayant au moins une contrainte `strict` ; le filtre garde les foyers qui en contiennent, réduits à ces membres).
- **Section « Foyers »** (titre Baumans + nombre). Chaque foyer = carte dont l'en-tête est **teinté de la couleur du foyer** (teinte pâle en clair, sombre en sombre), tuile du foyer, nom (Baumans), « n membres », bouton « + » (ajouter un membre), menu « ⋮ » (Modifier le foyer, Supprimer le foyer → `ConfirmModal` actuel). Les membres sont **dans** la carte, chacun précédé d'un filet vertical à la couleur du foyer et d'un avatar d'initiale teinté.
  - La teinte se calcule en JS à partir de l'hexadécimal du foyer (mélange avec `--card`), pas avec `color-mix()` seul, faute de garantie sur les anciennes WebView.
- **Section « Individuels »** (titre + « n · sans foyer ») : lignes compactes dans une seule carte, avatar d'initiale neutre, **sans en-tête de groupe**.
- **Ligne de convive** (membre ou individuel) : prénom en gras ; dessous, pastilles : allergies strictes nommées en plein `--alerte` (« ⚠ Arachides »), préférences `--pref-bg`/`--pref`, « + note » discret s'il y a une note ; sinon « Aucune contrainte ».
- **Bouton flottant unique « + Ajouter »** → feuille « Ajouter… » : « Une personne — Un ami, un collègue, Mamie Odette… On pourra la rattacher à un foyer. » / « Un foyer — Une famille, un couple, des colocs : on les invite d'un seul geste. » Remplace « + Foyer » et « + Nouveau convive ». La même feuille sert à l'étape ① du parcours guidé.
- **Pictogrammes de catégorie** (demande de l'auteur) : **foyer = une assemblée de personnes** (groupe de trois silhouettes, distinct de l'icône « Convives » de la barre de navigation) ; **individuel = une personne seule**. Ils apparaissent devant les titres de section « Foyers » / « Individuels », sur les deux choix de la feuille « Ajouter… » et sur les intitulés « Par foyer » / « Individuels » de « Qui vient ? ». La tuile de chaque foyer garde le pictogramme choisi par l'utilisateur (maison, cœur, table…) ; les personnes gardent leur avatar d'initiale. *(Portée : call, à confirmer.)*
- **Fiche convive** (feuille actuelle) : allergies et préférences présentées avec le composant du §5.5.
- L'éditeur (« Qui vient ? ») garde ses intitulés « Par foyer » / « Convives individuels » ; harmoniser ce dernier en « Individuels ».

### 5.7 Thème sombre
Tous les écrans ci-dessus utilisent les jetons ; le sombre suit sans code spécifique, sauf la teinte des en-têtes de foyer (§5.6) et les bandeaux `--alerte` (identiques dans les deux thèmes).

### 5.8 Barre du bas
- Trois onglets, dans cet ordre : **Invitations · Convives · Plats** (Invitations reste à gauche et s'ouvre par défaut). Icône de « Plats » : couverts ou assiette, dans le style des icônes existantes.
- Onglet actif : pastille `--indic` (safran pâle ; équivalent sombre) derrière l'icône + libellé `--primary-ink` gras. Aucune pastille de compteur.
- Masquée pendant l'accueil (plein écran).
- Le bouton Retour Android depuis Convives ou Plats ramène à Invitations (comme aujourd'hui pour Convives).

### 5.9 Onglet « Plats »

**Rôle** (dit par l'auteur) : vérifier une idée de menu, enregistrer un plat qu'on aimerait proposer, faire la rétrospective.

**Source des plats** : l'union, par nom normalisé (`normalizeForCompare`), des plats présents dans les menus des invitations (prévues et réalisées, tous hôtes) et des **fiches de plat** enregistrées à la main (§5.11). Les plats des invitations ne sont jamais recopiés dans les fiches : ils sont lus.

**État d'un plat** (fonction pure testée), du plus fort au plus faible :
- **à éviter** — au moins un verdict « À éviter » (`--error`) ;
- **servi récemment** — servi (invitation réalisée) il y a moins de `prescriptionMois`, tous convives confondus ; libellé « il y a 1 mois » (`--warning`) ;
- **peut revenir** — servi, mais il y a au moins `prescriptionMois` (`--success`) ;
- **prévu** — jamais servi, présent dans une invitation à venir ; « prévu le 28 nov. » (neutre) ;
- **idée** — jamais servi ni prévu : uniquement une fiche (`--indic` / `--primary-ink`).
- **♥** s'ajoute si au moins un verdict « Coup de cœur ».
- L'état « récent » ici est global ; le calcul par tablée reste celui de l'éditeur.

**Écran** :
- Champ en tête « Vérifier ou enregistrer un plat… » (pas de loupe dans l'en-tête sur cet onglet).
- Puces de filtre : « Tous · n », « Idées · n », « ♥ · n », « Peuvent revenir · n », « À éviter · n » (défilement horizontal si nécessaire).
- Liste groupée par service (icône du service + nom Baumans + nombre), dans l'ordre apéro → dessert ; dans chaque groupe, le plus récent d'abord (date de dernière apparition ; idées en dernier, par ordre alphabétique). Un plat rattaché à plusieurs services apparaît dans chacun.
- Ligne : nom en gras (+ ♥), sous-ligne « hôte · date » de la dernière apparition (« Chez moi · 18 oct. », « Chez Paul & Julie · 12 mars »), mention « prévu le … » si une invitation à venir le contient, ou « jamais servi » ; pastille d'état à droite ; pictogrammes d'allergènes en petit sous le nom s'il y en a (§5.10).
- Les plats mangés **chez les autres** figurent dans la liste, hôte indiqué (ils comptent déjà pour l'anti-doublon).
- **Vérifier / enregistrer** : pendant la saisie, la liste se réduit aux plats qui correspondent (comparaison normalisée, comme la recherche actuelle) ; en tête, toujours, une ligne en pointillés safran **« + Enregistrer « Blanquette » »** (« Jamais servi : il rejoindra vos idées. ») — absente si le texte saisi correspond exactement à un plat connu.
- État vide (aucun plat) : courte explication + le champ.

**Feuille « Enregistrer un plat »** : nom (prérempli avec la saisie, mis en forme par `formatDishInput`), « Pour quel service ? (un ou plusieurs) » en puces à icônes (au moins un requis), « Allergènes (facultatif) » (§5.10), bouton « Enregistrer le plat ». Si le nom correspond à un plat déjà connu, la feuille l'indique et complète sa fiche au lieu d'en créer une seconde. Si un plat connu est **presque identique** (mêmes mots en ignorant le pluriel en -s/-x et les petits mots de, du, des, à, au, aux, la, le, les, l’, d’, et, en), la feuille affiche « Vous voulez dire « Lasagnes aux légumes » ? » avec un bouton qui ouvre ce plat ; l'utilisateur peut quand même enregistrer le sien.

**Fiche d'un plat** (toucher une ligne) :
- Titre = nom ; encadré d'état (« Servi il y a 1 mois — attendre encore 5 mois pour le resservir aux mêmes convives », « Peut revenir », « Idée : jamais servi »…) + ♥.
- Allergènes : pictogrammes avec libellés ; bouton « Renseigner » / « Modifier » (crée la fiche du plat si elle n'existe pas).
- Historique : chaque apparition (date, « prévu » le cas échéant, hôte, convives, verdict).
- Bouton principal « + Préparer une invitation avec ce plat » → éditeur, nouveau brouillon avec le plat placé dans son service (le premier si plusieurs).
- Pour une **idée** (fiche sans aucune apparition) : « Modifier » (nom, services) et « Supprimer » (avec annulation `showUndo`). Un plat déjà servi ou prévu ne se renomme pas ici (son nom vient des invitations) ; seuls ses services et allergènes se modifient.

**Autocomplétion du menu** (éditeur) : pour un service donné, propose les plats déjà saisis dans ce service **et** les fiches rattachées à ce service, ces dernières marquées « idée » si jamais servies. Chaque proposition affiche ses pictogrammes d'allergènes et un ⚠ rouge si l'un d'eux concerne la tablée.

### 5.10 Allergènes des plats

**Liste de référence** (constante dans le code, chaque entrée avec identifiant stable, libellé et pictogramme dessiné dans le style des icônes existantes, aucun import) :
- les 14 allergènes réglementaires : céréales contenant du gluten, crustacés, œufs, poissons, arachides, soja, lait, fruits à coque, céleri, moutarde, graines de sésame, anhydride sulfureux et sulfites, lupin, mollusques ;
- plus : FODMAP (« riche en FODMAP »), porc, alcool, viande.
- **Entrées propres à l'utilisateur** (« coriandre », « kiwi »…) : ce sont ses **contraintes personnalisées** des Réglages ; une contrainte qui n'est reliée à aucun allergène de référence devient elle-même un choix possible pour les plats. *(Call : évite une seconde liste à gérer.)*
- **Pictogramme d'une contrainte** (demande de l'auteur : réutiliser les pictos pour d'autres intolérances, ex. l'ail du FODMAP pour « sans ail ») : chaque contrainte peut recevoir un pictogramme choisi dans une grille — les 18 pictos d'allergènes, puis des aliments courants (Lucide : carotte, pomme, fruits rouges, agrumes, banane, raisin, légumes verts, graines germées, épicé, sucre, chocolat (dessin Attablés), café, volaille, viennoiserie, biscuit, bière). À défaut de choix : picto de l'allergène lié s'il n'y en a qu'un, sinon l'étiquette (`tag`).

**Modèle** :
- Fiche de plat : `allergenes: string[]` (identifiants de référence ou identifiants de contraintes personnalisées).
- `ContrainteTag` gagne `allergenes: string[]` (identifiants de référence) : « ce que cette contrainte interdit », et `icone?: string` (pictogramme choisi ; un nom inconnu est ignoré à la normalisation).
- Liaisons par défaut (appliquées à la migration et dans `getDefaultContraintes`) : Arachides → arachides ; Fruits à coque → fruits à coque ; Crustacés → crustacés ; Sans gluten → gluten ; Sans lactose → lait ; Végétarien → viande, poissons, crustacés, mollusques ; Végan → viande, poissons, crustacés, mollusques, œufs, lait ; Sans porc → porc ; Sans alcool → alcool. Les contraintes créées par l'utilisateur partent sans liaison.
- Réglages, éditeur de contrainte : nouveaux choix « Pictogramme » (grille à choix unique) et « Allergènes concernés » (grille de pictogrammes à cocher).

**Conflit** (fonction pure testée) : un plat entre en conflit avec un convive si l'un des allergènes du plat est lié à l'une de ses contraintes (identifiant de référence présent dans `tag.allergenes`, ou identifiant de contrainte personnalisée égal à `tag.id`). Gravité = niveau de la contrainte (`strict` / `preference`).

**Affichage** :
- Éditeur, sous le champ du menu : alerte **rouge** pour une contrainte stricte (« ⚠ Contient des fruits à coque — Nadia (allergie stricte) »), **bleue** pour une préférence (« Contient du lait — Sophie préfère sans lactose »). Ces alertes s'ajoutent à celles de doublon.
- Carte « À venir » : un ⚠ rouge devant la ligne du plat concerné quand il est en conflit strict avec un convive de l'invitation. *(Call.)*
- Onglet Plats et fiche : pictogrammes ; aucune alerte (pas de tablée).
- Saisie : dans la feuille « Enregistrer un plat » et la fiche, grille de pictogrammes avec libellés, regroupés (« Allergènes réglementaires », « Autres », « Mes contraintes »), repliée par défaut (« Allergènes (facultatif) »).

### 5.11 Modèle de données et migration
- `AppData` gagne `plats: PlatFiche[]` avec `PlatFiche = { id: 'plat-…', libelle, services: CourseKey[] (≥ 1), allergenes: string[] }` ; clé de rapprochement = `normalizeForCompare(libelle)` (unique parmi les fiches).
- `ContrainteTag` gagne `allergenes: string[]` ; `AppSettings` gagne `accueilVu: boolean` (§5.3).
- `CURRENT_DATA_VERSION` **reste à 1** : les changements n'ajoutent que des champs (décision du 2026-11-17 ; les versions de test ne tournent que sur les appareils de l'auteur). `migrateAndValidateAppData` : `plats` absent ou invalide → `[]` (entrées invalides filtrées, services hors liste retirés, fiche sans service écartée) ; `allergenes` des contraintes absent → liaisons par défaut pour les identifiants connus (`tag-arachides`…), `[]` sinon ; `accueilVu` absent → `true`. Les sauvegardes antérieures restent restaurables.
- `effacerExemples` : les données d'exemple peuvent inclure quelques fiches de plat (dont une idée) reconnues par identifiants fixes ; elles sont effacées avec le reste.
- `resteDesExemples` tient compte de ces fiches.

### 5.12 Pictogrammes : Lucide pour toute l'appli et le site
Décision de l'auteur : adopter **Lucide** (licence ISC, compatible GPL-3.0 et F-Droid) et **remplacer toutes les icônes** de l'appli et du site, pour un ensemble homogène (trait 2 px, grille 24, extrémités arrondies — style déjà employé par les icônes du site).
- **Comparaison faite** (lucide-static 1.74.0, @phosphor-icons/core 2.1.1, @tabler/icons 3.52.0) : Lucide couvre les 28 icônes actuelles, 10 des 14 allergènes réglementaires (wheat, shrimp, egg, fish, milk, bean, nut, shell, flask-conical pour sulfites, flower-2 pour lupin), porc (ham), alcool (wine), viande (beef), les variantes « sans » (wheat-off, milk-off, nut-off…), les services et la personne seule (user-round). Phosphor (style duotone actuel) manque lait, soja, viande, porc ; Tabler manque crustacés, mollusques, soja.
- **Intégration** : recopier dans le dépôt **uniquement les SVG utilisés** (≈ 60) dans un dossier partagé par l'appli et le site, sans dépendance `lucide-react` ni `lucide-static` à l'exécution. Nettoyer chaque SVG (seuls `path`, `circle`, `rect`, `line`, `polyline`, `polygon`, `ellipse` et leurs attributs géométriques ; `stroke="currentColor"`). Ajouter la mention de licence ISC de Lucide (fichier de licence tiers + mention dans le README ; à refléter dans le récapitulatif F-Droid si nécessaire).
- **À dessiner dans le style Lucide** (règles de dessin publiques de Lucide), même dossier, même nettoyage : arachides, céleri, moutarde (pot et cuillère), sésame, ail (sert à FODMAP et à toute contrainte « sans ail » ; nommé d'après ce qu'il montre), « assemblée » (trois personnes), et chocolat (tablette en biais à moitié emballée ; demandé par l'auteur pour la grille des contraintes). Ces dessins sont **montrés à l'auteur avant d'être généralisés**.
- **Correspondances retenues** (planche validée) : Invitations = calendar-days ; Convives = users-round ; Plats = hand-platter ; réglages = settings ; recherche = search ; alerte = triangle-alert ; coup de cœur = heart ; bien = thumbs-up ; à éviter = ban ; peut revenir = clock ; copier pour une IA = copy ; services : apéro, entrée = salad, plat, fromage = cheese, dessert = cake-slice. **À ajuster** : « Plat » et le pictogramme de foyer « Marmite » partageaient cooking-pot ; l'apéro (glass-water) est trop neutre — choisir des icônes distinctes et évocatrices.
- **Pictogrammes de foyer** : maison = house, cœur = heart, table = utensils, marmite = cooking-pot, convivial = wine, nature = leaf, soleil = sun, étoile = star (identifiants de données inchangés).
- Le style « duotone » (remplissage translucide) disparaît ; les tuiles de foyer gardent leur fond coloré.
- `FoyerTile`, `Icons.tsx` et les SVG en ligne du site sont réécrits sur cette base ; l'API des composants d'icônes peut rester la même pour limiter les changements d'appel.

## 6. Vérification et livraison (décisions de l'auteur et calls)

- Conçu en une fois, codé en une passe découpée : **un commit par chantier** (jetons, palette et pictogrammes Lucide → premier lancement → Invitations → éditeur → Convives → modèle v2 et allergènes → onglet Plats → site et captures), une seule version publiée. *(Call : 0.3.0, versionCode 3000, avec les fichiers synchronisés et les six changelogs exigés par le CLAUDE.md.)*
- Validation : `pnpm lint`, `pnpm test`, `pnpm build`, puis vérification dans le navigateur (`pnpm dev`) en clair et en sombre, au format téléphone : premier lancement (deux portes), « Revoir la présentation », parcours guidé (vider les données), invitation en retard, filtre allergies, recherche, retour Android simulé.
- Tests unitaires à ajouter : normalisation de `accueilVu` (absent → `true`) et premier chargement vide ; migration v1 → v2 (plats, liaisons d'allergènes par défaut) ; fonction du parcours guidé ; tri « À venir » (en retard d'abord) ; délai relatif ; suggestions filtrées par service (avec idées) ; état d'un plat ; conflit plat ↔ convive (strict, préférence, contrainte personnalisée).
- `pnpm site:captures` adapté (porte « exemples ») puis captures régénérées ; vérifier `pnpm site:build` avec `SITE_APK_FACTICE=1`.

## 7. Laissé au constructeur

- Valeurs fines non arrêtées : `--surface-active` et `--outline` clairs dans la gamme expresso (contrastes à vérifier), ombre en sombre, teintes exactes des en-têtes de foyer en sombre.
- Dessin des six pictogrammes absents de Lucide (§5.12) et de l'illustration d'accueil, dans le style Lucide ; choix des icônes « apéro » et « plat » distinctes de « marmite ».
- Découpage en composants (accueil, parcours, bandeau d'allergies, feuille « Ajouter… », feuille convive partagée) et emplacement des fonctions pures.
- Animation de passage en réalisée : facultative, sobre, respectant `prefers-reduced-motion`.
