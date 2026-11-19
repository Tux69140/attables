# Corrections de l'audit — plan d'implémentation

> **Pour les agents :** sous-skill requis : superpowers:subagent-driven-development. Implémenteurs et relecteurs de tâche en `effort: "high"`, relecteur final de la branche en `effort: "xhigh"`. Les étapes utilisent des cases à cocher (`- [ ]`).

**But :** corriger toutes les remarques de l'audit impeccable (P1 à P3) et six points laissés par la relecture de la 0.3.0, sans régression du bouton Retour ni des allergies.

**Architecture :** tout reste dans le frontend React, plus une ligne Kotlin. Quatre petits outils partagés :
- une pile de focus pure, testée, et son crochet ;
- des helpers de retour de focus entre vues ;
- un crochet qui mesure les hauteurs des barres dans des variables CSS ;
- un bandeau « Annuler » unique, monté dans `App`.

Le reste consiste à retoucher les composants existants.

**Pile technique :** React 19, Vite, Tailwind v4, TypeScript, Tauri v2 Android (Kotlin). Tests `node:test` + `tsx`. Vérifications Playwright via `@playwright/test`, avec des scripts dans `.superpowers/` (dossier ignoré par git).

**Spec :** `docs/superpowers/specs/2026-11-18-corrections-audit-design.md`, à lire avant chaque tâche. Les numéros de lot ci-dessous renvoient à sa section 5.

## Contraintes globales

- Aucun réseau, aucune télémétrie, aucun SDK, aucune nouvelle dépendance (`package.json` inchangé hors scripts). Pas de permission `INTERNET`.
- Pas d'`inert`, pas de `<dialog>`, aucune fonctionnalité CSS ou JS récente sans repli : anciennes WebView Android, `minSdk = 24`.
- Préserver le pont `AttablesAndroid`, `signingConfigs`, `useAndroidBack` comme seule voie du Retour, et les tests de `pileRetour`.
- Toute action destructrice garde son instantané et `showUndo` (7 s).
- Contrastes inchangés. Jetons CSS plutôt que couleurs en dur.
- En-tête GPL-3.0-or-later / SPDX sur tout nouveau fichier source (copier celui de `src/hooks/pileRetour.ts`).
- `pnpm` uniquement, pas de `package-lock.json`.
- **Tests partiels en fin de tâche** (consigne de l'utilisateur). Une tâche est validée par :
  - `pnpm lint` (vérification des types, rapide) ;
  - les seuls fichiers de test concernés : `node --import tsx --test <fichiers>` ;
  - la vérification Playwright de la tâche, lancée depuis la racine du projet avec `pnpm dev` en route sur http://localhost:3000, aux tailles et thèmes que la tâche indique.

  Pas de `pnpm test` complet, pas de `pnpm build` (sauf la tâche 7, qui en a besoin pour sa simulation), pas de rejeu des scripts des autres tâches.
- **Tests complets à la fin de la tâche 10 seulement** : voir sa dernière étape.
- Commits sur `corrections-audit`, un par tâche, au format `fix(<zone>): …` en français, terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Pas de push.
- Ne jamais commiter `PRODUCT.md`, `DESIGN.md`, `.impeccable/`, `docs/` ni `.superpowers/` : on peut les modifier, sans les ajouter à git. `CLAUDE.md` se commite avec la tâche qui le modifie.
- Données d'exemple : premier lancement → accueil → « Visiter avec des exemples ». `.superpowers/voir.mjs <prefixe> [sombre] '<étapes js>'` produit des captures.

## Points de vigilance de la relecture

Le dernier point de chaque tâche concernée les vérifie :

1. **Une feuille qui en remplace une autre dans le même geste** (« Voir ce plat » : `FeuillePlat` se ferme, `FichePlat` s'ouvre). Le focus doit entrer dans la nouvelle feuille. À sa fermeture, il revient sur l'élément de la liste qui avait ouvert la première. Un seul Retour ferme la fiche. → Tâche 3.
2. **Supprimer une invitation depuis l'éditeur** : la vue change, l'annonce est faite et la carte a disparu. Attendu : une annonce « Invitation supprimée », le focus sur le `h1` « Invitations », un défilement borné et les barres visibles. → Tâches 2 et 5.
3. **Retour depuis l'éditeur alors que la recherche était ouverte** : le champ de recherche (`autoFocus`) ne vole pas le focus rendu à la carte et n'ouvre pas le clavier. → Tâche 5.
4. **Grand texte avec un bandeau d'allergies long** (3 allergies ou plus) dans l'éditeur, l'en-tête masqué puis réaffiché. Le bandeau doit rester collé sous l'en-tête mesuré, sans rien recouvrir d'essentiel ni être tronqué. → Tâche 7.
5. **Deux annulations identiques rapprochées, puis le focus 10 s dans le bandeau.** Attendu : deux annonces, le bandeau toujours affiché, puis sa disparition 7 s après la sortie du focus. → Tâche 2.

---

### Task 1: Titres des écrans (lot 4)

**Fichiers :**
- Modifier :
  - `src/components/InvitationsTab.tsx` (racine du rendu, liste hors recherche, l. ~128-200) ;
  - `src/components/ConvivesTab.tsx` (racine du rendu) ;
  - `src/components/PlatsTab.tsx` (racine du rendu, `h2` de service l. ~258-262) ;
  - `src/components/InvitationEditor.tsx` (`h1` l. ~394) ;
  - `src/components/SettingsModal.tsx` (`h1` l. ~289).

**Interfaces :**
- Produit : chaque vue a exactement un élément `h1` portant `tabIndex={-1}` et l'attribut `data-titre-vue`. Les tâches 4 et 5 le ciblent par `document.querySelector('[data-titre-vue]')`.
- Exception : l'accueil, qui gère ses trois `h1` lui-même (tâche 4).

- [ ] **Étape 1 :** ajouter en tête de chacun des trois onglets un `<h1 className="sr-only" tabIndex={-1} data-titre-vue>`, avec pour texte « Invitations », « Convives » et « Plats ». Ajouter `tabIndex={-1}` et `data-titre-vue` aux `h1` de l'éditeur et des Réglages.
- [ ] **Étape 2 :** dans `InvitationsTab`, hors recherche, envelopper la liste de l'onglet choisi (cartes ou état vide) dans `<section aria-labelledby="liste-invitations">`, avec un `<h2 id="liste-invitations" className="sr-only">` qui vaut « À venir » ou « Réalisées ».
- [ ] **Étape 3 :** `PlatsTab`, `h2` de service.
  - Le nombre reste visible, séparé du mot par une pastille sobre (`font-sans`, sans Baumans), et masqué aux lecteurs d'écran (`aria-hidden`).
  - Ajouter un `<span className="sr-only">` qui donne « , 5 plats » (« 1 plat » au singulier).
  - Nom accessible attendu : « Apéro, 5 plats ».
- [ ] **Étape 4 :** vérifier avec un script Playwright (`.superpowers/titres.mjs`) qui liste `h1` à `h6` (niveau et texte) pour Invitations (À venir, Réalisées, recherche « a »), Convives, Plats, l'éditeur et les Réglages (racine et une section).
  - Attendu : un seul `h1` par vue, aucun saut de niveau (pas de `h3` sans `h2` au-dessus).
  - Le `h2` de service se lit « Apéro, 5 plats ».
- [ ] **Étape 5 :** **Tests partiels :** `pnpm lint` au vert ; captures 412 et 320 de Plats, en clair (rien ne change visuellement, à part la pastille du nombre).
- [ ] **Étape 6 :** commit `fix(a11y): titre h1 par écran, h2 de liste et compteur lisible`.

### Task 2: Bandeau « Annuler » unique et annoncé (lot 1)

**Fichiers :**
- Modifier :
  - `src/components/SharedUI.tsx` (`UndoBanner`, l. ~150-190) ;
  - `src/App.tsx` (`showUndo`, `handleUndo` et `dismissUndo` l. ~120-155 ; les trois rendus de `UndoBanner` l. ~417, ~447 et ~630 ; les retours anticipés de l'éditeur et des Réglages l. ~397-456) ;
  - `CLAUDE.md` (paragraphe « Annulation »).

**Interfaces :**
- Produit :

```ts
export const UndoBanner: React.FC<{
  annonce: { id: string; message: string } | null;
  bottomOffsetClass?: string;
  onUndo: () => void;
  onDismiss: () => void;
  onPause: () => void;   // le focus entre dans le bandeau
  onReprise: () => void; // le focus en sort
}>;
```

- [ ] **Étape 1 :** `UndoBanner` rend **toujours** une zone `<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">`.
  - Elle contient `{annonce && <span key={annonce.id}>{annonce.message}</span>}`. La clé force une nouvelle annonce pour un message identique.
  - Le bandeau visible n'est rendu que si `annonce` existe, et la zone d'annonce ne contient pas ses boutons.
  - Le message visible passe à la ligne au lieu d'être tronqué (retirer `truncate`).
  - `onFocus` sur le conteneur visible appelle `onPause`. `onBlur` appelle `onReprise` si `e.relatedTarget` n'est pas dans le conteneur.
- [ ] **Étape 2 :** `App`.
  - Les branches éditeur, Réglages et onglets calculent leur JSX dans une variable au lieu de retourner tôt.
  - `App` rend ensuite cette variable, `{feuilleAjouter}` si la branche l'avait, puis **un seul** `<UndoBanner>`.
  - La branche Accueil peut garder son retour anticipé.
  - Positions actuelles conservées : `bottom-above-bar` dans l'éditeur et les Réglages ; `chromeVisible ? 'bottom-above-fab' : 'bottom-safe-gap'` dans les onglets.
  - Nouveaux gestionnaires :
    - `pauseUndo()` efface le minuteur ;
    - `repriseUndo()` relance un délai complet de 7 s si `undoState` existe toujours.
  - `annonce = undoState && { id: undoState.id, message: undoState.message }`.
- [ ] **Étape 3 :** vérification Playwright (`.superpowers/annonce.mjs`).
  - **(a)** Supprimer une invitation depuis l'éditeur (Modifier → Supprimer → confirmer) : la zone `[role=status]` existait avant la suppression (même nœud) et contient « Invitation supprimée ».
  - **(b)** Point de vigilance 5 : deux suppressions rapprochées → l'élément `span` enfant de la zone change d'identité (le nœud est recréé). Le focus est placé sur « Annuler » pendant 10 s : le bandeau est toujours là. On sort le focus : le bandeau disparaît entre 6,5 et 7,5 s plus tard.
- [ ] **Étape 4 :** dans `CLAUDE.md`, compléter « Annulation » : « un seul `UndoBanner`, monté par `App` quelle que soit la vue ; sa zone `role="status"` reste dans le DOM ; le minuteur s'arrête tant que le focus est dans le bandeau ».
- [ ] **Étape 5 :** **Tests partiels :** `pnpm lint` au vert ; captures du bandeau dans les trois vues, en clair et en sombre, aux mêmes positions qu'avant.
- [ ] **Étape 6 :** commit `fix(a11y): bandeau Annuler unique, annoncé et en pause sous le focus`.

### Task 3: Focus des feuilles et de la confirmation (lot 1)

**Fichiers :**
- Créer :
  - `src/hooks/pileFocus.ts` ;
  - `src/hooks/pileFocus.test.ts` ;
  - `src/hooks/usePiegeFocus.ts`.
- Modifier :
  - `src/components/SharedUI.tsx` (`ConfirmModal` l. ~25-100, `BottomSheet` l. ~102-150) ;
  - `CLAUDE.md` (paragraphe « Navigation Android »).

**Interfaces :**
- Produit (`pileFocus.ts`, sans DOM) :

```ts
export function creerPileFocus(): {
  empiler(): number;
  retirer(id: number): void;
  estAuSommet(id: number): boolean;
};
/** Index à focaliser quand Tab sort des bornes ; null = laisser faire le navigateur.
 *  `index` = position de l'élément actif parmi les `nb` focalisables, -1 s'il n'en fait pas partie. */
export function cibleTabulation(nb: number, index: number, arriere: boolean): number | null;
```

- Produit (`usePiegeFocus.ts`) : `usePiegeFocus(ouvert: boolean, conteneur: RefObject<HTMLElement | null>, titre: RefObject<HTMLElement | null>): void`.

- [ ] **Étape 1 : écrire les tests qui échouent** (`src/hooks/pileFocus.test.ts`) :

```ts
test('seule la couche du dessus gère la tabulation', () => {
  const pile = creerPileFocus();
  const a = pile.empiler();
  const b = pile.empiler();
  assert.equal(pile.estAuSommet(a), false);
  assert.equal(pile.estAuSommet(b), true);
  pile.retirer(b);
  assert.equal(pile.estAuSommet(a), true);
});

test('retirer une couche du milieu garde le sommet', () => {
  const pile = creerPileFocus();
  const a = pile.empiler();
  const b = pile.empiler();
  const c = pile.empiler();
  pile.retirer(b);
  assert.equal(pile.estAuSommet(c), true);
  pile.retirer(c);
  assert.equal(pile.estAuSommet(a), true);
});

test('cibleTabulation boucle aux extrémités seulement', () => {
  assert.equal(cibleTabulation(3, 2, false), 0);
  assert.equal(cibleTabulation(3, 0, true), 2);
  assert.equal(cibleTabulation(3, 1, false), null);
  assert.equal(cibleTabulation(3, 1, true), null);
  assert.equal(cibleTabulation(3, -1, false), 0);
  assert.equal(cibleTabulation(3, -1, true), 2);
  assert.equal(cibleTabulation(0, -1, false), null);
});
```

- [ ] **Étape 2 :** `node --import tsx --test src/hooks/pileFocus.test.ts` → ÉCHEC (module introuvable).
- [ ] **Étape 3 :** implémenter `pileFocus.ts` (identifiants croissants, tableau ordonné).
- [ ] **Étape 4 :** relancer → SUCCÈS.
- [ ] **Étape 5 : implémenter `usePiegeFocus`.** Une seule pile de module, comme `useAndroidBack`.
  - **Quand `ouvert` devient vrai** :
    - mémoriser `document.activeElement` ;
    - `empiler()` ;
    - focaliser `titre` (`preventScroll`) ;
    - écouter `keydown` sur `document` : si Tab et `estAuSommet`, calculer les focalisables visibles du conteneur (`a[href]`, `button`, `input`, `select`, `textarea` non désactivés, `[tabindex]` différent de -1), puis appliquer `cibleTabulation` avec `preventDefault`.
  - **Au nettoyage** :
    - `retirer` ;
    - rendre le focus à l'élément mémorisé s'il est encore `isConnected` et a des `getClientRects()` (`preventScroll`).
- [ ] **Étape 6 :** `BottomSheet` et `ConfirmModal` posent une `ref` sur le panneau et sur le titre (`h2`, avec `tabIndex={-1}`), puis appellent `usePiegeFocus(open, …)`. Le reste ne change pas : Échap, voile, `useAndroidBack`, `aria-modal`.
- [ ] **Étape 7 :** vérification Playwright au clavier (`.superpowers/focus-feuilles.mjs`).
  - **(a)** Convives → toucher un convive : le focus est sur le titre de la feuille. 15 Tab, puis 15 Maj+Tab : le focus reste dans la feuille. Échap : le focus revient sur la ligne du convive.
  - **(b)** Même chose en fermant par la croix, puis par `history.back()`.
  - **(c)** Réglages → Contraintes → supprimer un tag : la confirmation prend le focus. Annuler : le focus revient sur le bouton de suppression.
  - **(d)** Point de vigilance 1 : Plats → dans « Vérifier ou enregistrer un plat », saisir le nom d'un plat connu avec une faute de frappe → bouton d'enregistrement (la feuille « Enregistrer un plat » s'ouvre) → « Vous voulez dire … ? » → « Voir ce plat ». Le focus est dans `FichePlat`. Fermer : le focus revient sur l'élément d'origine de la liste. `history.back()` ensuite ne ferme qu'une couche (aucune entrée orpheline : `history.state` revient à sa valeur d'avant l'ouverture).
- [ ] **Étape 8 :** dans `CLAUDE.md`, « Navigation Android » : « toute modale ou feuille utilise aussi `usePiegeFocus` (focus sur le titre, Tab bouclé, focus rendu à la fermeture) ».
- [ ] **Étape 9 :** **Tests partiels :** `pnpm lint` et `node --import tsx --test src/hooks/pileFocus.test.ts src/hooks/pileRetour.test.ts` au vert.
- [ ] **Étape 10 :** commit `fix(a11y): focus gardé dans les feuilles et rendu à la fermeture`.

### Task 4: Focus à l'ouverture des vues plein écran (lot 1)

**Fichiers :**
- Créer : `src/hooks/focusVues.ts`.
- Modifier :
  - `src/components/InvitationEditor.tsx` ;
  - `src/components/SettingsModal.tsx` (`navigateToSection`, `handleBack` et le Retour de section l. ~108-127 ; boutons d'entrée de la racine l. ~303 et suivantes) ;
  - `src/components/Accueil.tsx`.

**Interfaces :**
- Consomme : `[data-titre-vue]` (tâche 1).
- Produit (`focusVues.ts`) :

```ts
/** Clé stable de l'élément actif (attribut data-focus-cle de lui-même ou d'un parent), sinon null. */
export function memoriserCleFocus(): string | null;
/** Focalise [data-focus-cle="cle"] s'il existe, sinon le titre de la vue ; toujours preventScroll. */
export function rendreFocus(cle: string | null): void;
export function focaliserTitreVue(): void;
```

- [ ] **Étape 1 :** implémenter `focusVues.ts`.
- [ ] **Étape 2 :** `InvitationEditor` appelle `focaliserTitreVue()` dans un effet de montage.
- [ ] **Étape 3 :** `SettingsScreen` (`SettingsModal.tsx`).
  - Au montage et à chaque entrée dans une section : `focaliserTitreVue()`.
  - Chaque bouton d'entrée de la racine porte `data-focus-cle={`section-${id}`}`.
  - Au retour à la racine (bouton ← et Retour d'Android) : `rendreFocus(`section-${sectionQuittée}`)` après le rendu (effet sur `section`).
- [ ] **Étape 4 :** `Accueil` : à chaque changement d'`index`, et au montage, focaliser le `h1` de l'écran courant via des refs (`tabIndex={-1}`, `preventScroll`, sans faire défiler la piste).
- [ ] **Étape 5 :** vérification Playwright.
  - Ouvrir l'éditeur, les Réglages et une section : `document.activeElement` est le `h1` de la vue.
  - Revenir à la racine : le focus est sur l'entrée de la section quittée.
  - Accueil (`localStorage` vidé) : « Suivant » met le focus sur le `h1` de l'écran 2.
- [ ] **Étape 6 :** **Tests partiels :** `pnpm lint` au vert (la vérification Playwright est l'étape 5).
- [ ] **Étape 7 :** commit `fix(a11y): focus sur le titre à l'ouverture des vues`.

### Task 5: Retour depuis l'éditeur et les Réglages (lots 5 et 1)

**Fichiers :**
- Modifier :
  - `src/App.tsx` ;
  - `src/hooks/useAutoHideChrome.ts` ;
  - `src/components/CarteInvitation.tsx` (bouton de la carte l. ~55, et `CarteRealisee`) ;
  - `src/components/InvitationsTab.tsx` (bouton flottant l. ~213 ; `autoFocus` du champ l. ~138).

**Interfaces :**
- Consomme : `memoriserCleFocus`, `rendreFocus` (tâche 4).
- Produit :
  - `useAutoHideChrome(resetKey)` renvoie `{ visible: boolean; recaler: () => void }`. `recaler()` force les barres visibles et prend `window.scrollY` comme référence.
  - Adapter les trois appelants : `App`, `InvitationEditor` et `SettingsModal`.

- [ ] **Étape 1 :** `data-focus-cle` sur les cibles stables :
  - boutons des cartes : `inv-${invitation.id}` ;
  - bouton flottant : `preparer-invitation` ;
  - roue des Réglages : `reglages`.
- [ ] **Étape 2 :** `useAutoHideChrome` expose `recaler`, et l'effet de `resetKey` l'utilise.
- [ ] **Étape 3 :** `App`.
  - Au démarrage : `history.scrollRestoration = 'manual'`, dans un effet de montage, si la propriété existe.
  - Avant toute ouverture de l'éditeur ou des Réglages (fonction unique `ouvrirVue(...)`, utilisée par tous les `setEditorTarget({…})` et `setSettingsOpen(true)`), mémoriser :
    - `{ onglet: activeTab, y: window.scrollY, cle: memoriserCleFocus() }` ;
    - puis `window.scrollTo(0, 0)`.
  - Au retour sur les onglets, quelle que soit la cause : effet `useLayoutEffect` déclenché quand `editorTarget` et `settingsOpen` redeviennent faux, si l'onglet n'a pas changé. Il enchaîne :
    - `window.scrollTo(0, min(y, max(0, scrollHeight - innerHeight)))` ;
    - `recaler()` ;
    - `rendreFocus(cle)` ;
    - puis efface la mémoire.
  - L'effet existant `scrollTo(0, 0)` sur `[activeTab, settingsOpen]` ne doit plus écraser cette restauration : le limiter au changement d'onglet.
- [ ] **Étape 4 :** le champ de recherche ne prend le focus qu'à l'ouverture par la loupe : remplacer `autoFocus` par un focus déclenché quand `recherche` passe de `null` à `''`, pas au remontage.
- [ ] **Étape 5 :** vérification Playwright à 320 × 640 (`.superpowers/retour-editeur.mjs`).
  - Faire défiler « À venir » jusqu'à la dernière carte et l'ouvrir. Revenir successivement par « Annuler » (←), par « Enregistrer » et par `history.back()`.
  - Attendu à chaque fois : `scrollY` à ±2 px de la valeur d'avant, en-tête et barre du bas visibles (`translate` nul), `document.activeElement` sur la carte.
  - Même essai avec les Réglages (roue → ←) : focus sur la roue.
  - **Point de vigilance 2 :** supprimer cette invitation depuis l'éditeur → focus sur le `h1` « Invitations », barres visibles, aucune erreur.
  - **Point de vigilance 3 :** loupe → saisir « a » → ouvrir un résultat → ← : focus sur la carte, pas sur le champ.
- [ ] **Étape 6 :** **Tests partiels :** `pnpm lint` et `node --import tsx --test src/hooks/pileRetour.test.ts` au vert (la vérification Playwright est l'étape 5).
- [ ] **Étape 7 :** commit `fix(navigation): retrouver sa place et ses barres en revenant de l'éditeur`.

### Task 6: Cibles de 44 px (lot 2)

**Fichiers :**
- Modifier :
  - `src/components/Controles.tsx` (`Puces`, l. ~101) ;
  - `src/components/FeuillePlat.tsx` (l. ~93 « Voir ce plat », l. ~113) ;
  - `src/components/FichePlat.tsx` (l. ~91) ;
  - `src/components/SettingsModal.tsx` (l. ~224) ;
  - `src/components/ParcoursGuide.tsx` (l. ~105) ;
  - `src/components/InvitationEditor.tsx` (l. ~450, ~471, ~491, ~798, ~1153, ~1217, ~1441) ;
  - plus tout ce que la mesure trouve encore.
- Outil (non commité) : `.superpowers/audit-a11y.mjs`.
- Documents (non commités) : `DESIGN.md` (l. ~356), `.impeccable/design.json`.

- [ ] **Étape 1 :** étendre `audit-a11y.mjs` pour qu'il parcoure une liste d'états et imprime les cibles sous 44 px par état. États à couvrir :
  - les 3 onglets et la recherche ;
  - une feuille de chaque sorte : foyer, convive, plat (`FeuillePlat`, `FichePlat`), Ajouter ;
  - l'éditeur (nouvelle invitation, invitation existante, repas réalisé) ;
  - les Réglages (racine et chaque section) ;
  - le guide de démarrage (carnet vide).

  Le lancer en 412 et 320, clair et sombre. Conserver la sortie de référence.
- [ ] **Étape 2 :** passer chaque contrôle visible à `min-h-[44px]`, et à `min-w-[44px]` s'il est étroit, en ajustant le rembourrage. `Puces` passe à `min-h-[44px]`.
- [ ] **Étape 3 :** « Voir ce plat » garde son aspect de lien. Sa zone tactile atteint 44 px par un pseudo-élément `after:absolute after:-inset-y-…` sur un parent `relative`, sans chevaucher la cible voisine. Vérifier avec `elementFromPoint` aux bords de la zone.
- [ ] **Étape 4 :** relancer l'audit → aucune cible sous 44 px dans aucun état, hors zones étendues vérifiées à l'étape 3. Captures de l'éditeur et des puces en 320 : la mise en page ne casse pas.
- [ ] **Étape 5 :** `DESIGN.md` : remplacer « Les puces actuelles font 40 px : dette relevée par l'audit. » par une phrase qui constate les 44 px. Même retouche dans `design.json` si la mention y figure.
- [ ] **Étape 6 :** **Tests partiels :** `pnpm lint` au vert (la mesure est l'étape 4).
- [ ] **Étape 7 :** commit `fix(a11y): cibles tactiles de 44 px partout`.

### Task 7: Grand texte (lot 3, plus le bandeau `-mx-4` du lot 7)

**Fichiers :**
- Créer : `src/hooks/useHauteurMesuree.ts`.
- Modifier :
  - `src-tauri/gen/android/app/src/main/java/attables/biovibralyon/fr/MainActivity.kt` (`onWebViewCreate`) ;
  - `src/index.css` (l. ~132-185) ;
  - `src/App.tsx` (en-tête l. ~460-500, barre du bas l. ~560-600) ;
  - `src/components/InvitationEditor.tsx` (en-tête l. ~379, barre d'actions l. ~1302) ;
  - `src/components/SettingsModal.tsx` (en-tête l. ~275) ;
  - `src/components/Allergies.tsx` (`BandeauAllergies` l. ~18-40) ;
  - `src/components/SharedUI.tsx` et `src/components/InvitationsTab.tsx` (textes `truncate` ou `whitespace-nowrap` essentiels) ;
  - `CLAUDE.md`.
- Outil (non commité) : `.superpowers/grand-texte.mjs`.

**Interfaces :**
- Produit : `useHauteurMesuree(ref: RefObject<HTMLElement | null>, variable: '--hauteur-entete' | '--hauteur-barre'): void`.
  - Un `ResizeObserver` écrit `${offsetHeight}px` sur `document.documentElement.style`.
  - La propriété est retirée au démontage.
  - Une seule vue est montée à la fois : une variable par rôle suffit.

- [ ] **Étape 1 : écrire l'outil `grand-texte.mjs <facteur> <largeur> <hauteur> <prefixe> ['<étapes js>']`**, contre le build servi par `pnpm exec vite preview --port 4173` (feuilles CSS statiques).
  - Avant tout rendu, réécrire chaque règle CSSOM qui porte `font-size` en `calc(<valeur d'origine> * facteur)`, et chaque `line-height` en px de la même façon.
  - Ajouter `body { font-size: calc(16px * facteur) }`.
  - Ne pas toucher à la taille de `html`, sinon les `rem` d'espacement grossiraient.
  - À chaque capture, imprimer :
    - `scrollWidth > innerWidth` ;
    - les éléments de texte coupés (`scrollWidth > clientWidth` ou `scrollHeight > clientHeight` avec `overflow` caché) ;
    - les recouvrements entre l'en-tête ou la barre et le premier ou le dernier élément de contenu.
- [ ] **Étape 2 :** lancer la matrice de la spec (320 à 100 et 130 % ; 360 et 412 à 100, 130 et 200 %) sur les états de la tâche 6. Garder la liste des défauts comme référence « avant ».
- [ ] **Étape 3 : Kotlin.**
  - Dans `onWebViewCreate`, après `super` : `webView.settings.textZoom = (resources.configuration.fontScale * 100).roundToInt()`, avec `import kotlin.math.roundToInt`.
  - Commentaire : « suit la taille de police d'Android ; à préserver si gen/android est régénéré ».
  - Ne pas toucher au pont.
- [ ] **Étape 4 :** `useHauteurMesuree` sur les en-têtes de l'App, de l'éditeur et des Réglages (`--hauteur-entete`), sur la barre du bas et sur la barre d'actions de l'éditeur (`--hauteur-barre`). Leurs `h-14` et `h-16` deviennent `min-h-14` et `min-h-16`.
- [ ] **Étape 5 :** `index.css`. Chaque classe qui suppose ces hauteurs (`.pt-below-header`, `.pb-below-bar`, `.bottom-above-nav`, `.bottom-above-fab`, `.bottom-above-bar`, `.bottom-safe-gap`) s'écrit `var(--hauteur-…, <expression actuelle de la hauteur>) + <écart actuel>`.
  - Règle : quand la variable est absente, chaque classe garde exactement sa valeur d'aujourd'hui.
  - Exemple : `.pt-below-header { padding-top: calc(var(--hauteur-entete, calc(3.5rem + var(--haut-systeme))) + 1rem); }`.
  - Chercher aussi `3.5rem` et `4rem` codés en dur dans `src/` : `BandeauAllergies` utilise `top: calc(3.5rem + var(--haut-systeme))`, à remplacer par `var(--hauteur-entete, …)`.
- [ ] **Étape 6 :** `BandeauAllergies` : remplacer `-mx-4 px-4` par l'inverse exact de la gouttière de `.px-safe`, c'est-à-dire des marges négatives et des rembourrages `max(1rem, env(safe-area-inset-left/right))`, via une classe dans `index.css`.
- [ ] **Étape 7 : textes essentiels qui passent à la ligne** au lieu d'être tronqués :
  - titres de feuille (`BottomSheet`) ;
  - `h1` de l'éditeur et des Réglages ;
  - libellé du bouton flottant ;
  - libellés de la barre du bas.

  Le bandeau d'allergies n'est jamais tronqué. Le message du bandeau « Annuler » est déjà traité (tâche 2).
- [ ] **Étape 8 :** en-tête de l'App.
  - Plus de débordement à 320 px : aujourd'hui, la grille `88px 1fr 88px` déborde de 3 px.
  - En grand texte, le titre « Attablés » peut se décentrer ou rétrécir sa zone.
  - La loupe et la roue restent à 44 px et ne se chevauchent jamais.
  - La disposition est libre, dans ces critères.
- [ ] **Étape 9 :** relancer la matrice.
  - Attendu : aucun défilement horizontal, aucun texte essentiel coupé, aucun contenu sous les barres, dans tous les états.
  - Les écarts restants doivent être expliqués dans le rapport, et ne concerner que des textes secondaires.
  - Point de vigilance 4 : éditeur avec 3 allergies ou plus, défilement bas puis haut à 200 % ; le bandeau reste collé sous l'en-tête mesuré.
  - À 200 %, le bandeau « Annuler » (après une suppression) ne chevauche ni le bouton flottant agrandi, ni la barre du bas.
- [ ] **Étape 10 :** `CLAUDE.md`, « Architecture » : mentionner la ligne `textZoom` de `MainActivity` à préserver, comme le pont, et la règle « pas de hauteur fixe pour l'en-tête et les barres : `useHauteurMesuree` et les variables `--hauteur-entete` / `--hauteur-barre` ».
- [ ] **Étape 11 :** **Tests partiels :** `pnpm lint` et `pnpm build` au vert (le build sert la simulation). Captures 412 à 100 % en clair et en sombre, identiques à celles d'avant la tâche à 1 px près.
- [ ] **Étape 12 :** commit `fix(a11y): suivre la taille de police d'Android sans rien couper`.

### Task 8: Finitions visuelles (lot 6)

**Fichiers :**
- Modifier :
  - `src/App.tsx` (l. ~461 et ~563) ;
  - `src/components/SharedUI.tsx` (voiles l. ~58 et ~125 ; `FoyerTile` l. ~15-16) ;
  - `src/components/SettingsModal.tsx` (l. ~276) ;
  - `src/components/InvitationEditor.tsx` (l. ~381 et ~1304 ; cartes l. ~499, ~623, ~917 ; liste l. ~850) ;
  - `src/components/Allergies.tsx` (l. ~63 et ~73) ;
  - `src/components/ChoixAllergenes.tsx` (l. ~37) ;
  - `src/components/FichePlat.tsx` (l. ~120) ;
  - `src/components/FeuilleFoyer.tsx` (l. ~63) ;
  - `src/index.css` (`:root` et `.dark`).
- Documents (non commités) : `DESIGN.md` (l. ~257, ~321, ~337, ~398), `.impeccable/design.json` (l. ~945, ~952).

- [ ] **Étape 1 :** retirer les 7 `backdrop-blur-*`.
  - Les barres deviennent opaques : `bg-[var(--bg)]` et `bg-[var(--card)]`, sans `/95`.
  - Les voiles gardent `bg-[#0D1624]/60`.
  - `grep -rn backdrop-blur src` → vide.
- [ ] **Étape 2 :** capitales espacées → casse normale, `font-bold`, même taille. Retirer `uppercase` et `tracking-wider`. `grep -rn "uppercase" src/components` → vide.
- [ ] **Étape 3 :** historique de `FichePlat` : retirer `rounded-xl border … overflow-hidden` de la `ul` et garder les filets `divide-y`. Même traitement pour la liste « Déjà servi » de l'éditeur (l. ~850).
- [ ] **Étape 4 :** cartes « Qui reçoit », « Qui vient » et « Menu » de l'éditeur : remplacer `bg-[var(--card)] border border-[var(--border)]` par la classe `.carte`. Signaler dans le rapport tout autre encadré intérieur qui serait une sous-carte, sans le modifier.
- [ ] **Étape 5 :** jeton `--encre-tuile: #1A263C` dans `:root` et dans `.dark`, avec la même valeur. `FoyerTile` et `FeuilleFoyer` utilisent `var(--encre-tuile)`, y compris pour la bordure à 15 % (`color-mix` n'existe pas sur les anciennes WebView : utiliser `border-[var(--encre-tuile)]/15` seulement si Tailwind le compile sans `color-mix`, sinon un jeton `--encre-tuile-filet` en `rgb(26 38 60 / 0.15)`). `grep -rn "1A263C" src` → uniquement dans `index.css`.
- [ ] **Étape 6 :** `DESIGN.md` et `design.json`. Les règles du verre interdit, de la casse normale et des jetons deviennent des constats : retirer « à retirer », « sont une dette » et « écrites en dur… l'encre de tuile ». Mentionner le jeton `--encre-tuile`.
- [ ] **Étape 7 :** **Tests partiels :** `pnpm lint` et `node --import tsx --test src/theme.test.ts` au vert. Captures avant et après de l'éditeur, de la fiche plat, de Convives (tuiles), des Réglages → Contraintes et du bandeau d'allergies, en clair et en sombre. `.superpowers/audit-a11y.mjs` ne montre aucune régression de contraste.
- [ ] **Étape 8 :** commit `fix(design): sans flou ni capitales, cartes sans bordure, jeton encre-tuile`.

### Task 9: Retour d'Android — présentation et recherche orpheline (lot 7)

**Fichiers :**
- Modifier :
  - `src/components/Accueil.tsx` (props et `CoucheRetour`, l. ~10-15 et ~87-115) ;
  - `src/App.tsx` (rendu de l'accueil l. ~368-395 ; état `recherche`).

- [ ] **Étape 1 :** `Accueil` reçoit `onRetourDebut?: () => void`. Si cette prop est fournie et que `index === 0`, monter `<CoucheRetour onRetour={onRetourDebut} />`. Sans la prop (premier lancement), rien ne change : Retour sur l'écran 1 quitte l'appli.
- [ ] **Étape 2 :** `App` passe `onRetourDebut` seulement quand `revoirAccueil` est vrai : `setRevoirAccueil(false)` puis `setSettingsOpen(true)`.
- [ ] **Étape 3 :** `App` : un effet remet `recherche` à `null` quand `data.invitations.length === 0`. La loupe disparaît, l'entrée d'historique est retirée par `useAndroidBack`.
- [ ] **Étape 4 :** vérification Playwright.
  - **(a)** Réglages → « Revoir la présentation » → `history.back()` : on est dans les Réglages (racine), l'appli est toujours là, et un second `history.back()` ferme les Réglages.
  - **(b)** Avec `localStorage` vide (premier lancement), écran 1 : comportement inchangé.
  - **(c)** Loupe ouverte → Réglages → vider toutes les données → confirmer → retour sur Invitations, le guide s'affiche. Refaire l'essai en supprimant les invitations une à une depuis l'éditeur. Un `history.back()` doit produire un effet visible (pas de Retour mort) : comparer `history.length` et `history.state` avant l'ouverture de la loupe et après la dernière suppression.
- [ ] **Étape 5 :** **Tests partiels :** `pnpm lint` et `node --import tsx --test src/hooks/pileRetour.test.ts` au vert (fichier de test inchangé).
- [ ] **Étape 6 :** commit `fix(navigation): Retour fiable depuis la présentation et après la recherche`.

### Task 10: Dates et pictogrammes par défaut (lot 7)

**Fichiers :**
- Modifier :
  - `src/utils/dates.ts` (exporter `ecartJours`, l. ~14) ;
  - `src/utils/dishes.ts` (`getElapsedTimeInfo`, l. ~93-123) ;
  - `src/utils/allergenes.ts` (`iconeContrainte`, l. ~139-146).
- Tests :
  - `src/utils/dishes.test.ts` ;
  - `src/utils/allergenes.test.ts`.

**Interfaces :**
- Produit :
  - `export const ecartJours: (dateIso: string, aujourdHui: string) => number`, avec le comportement actuel ;
  - `iconeContrainte`, ordre de résolution : icône choisie > icône par défaut de l'identifiant (`tag-vegetarien` → `'leaf'`, `tag-vegan` → `'sprout'`) > allergène unique lié > `'tag'`.

- [ ] **Étape 1 : écrire les tests qui échouent.**

Dans `dishes.test.ts` (importer `getElapsedTimeInfo`) :

```ts
test('getElapsedTimeInfo compte les jours civils malgré le passage à l’heure d’été', () => {
  const tz = process.env.TZ;
  process.env.TZ = 'Europe/Paris';
  try {
    assert.equal(getElapsedTimeInfo('2026-03-28', '2026-03-30').daysAgo, 2);
    assert.equal(getElapsedTimeInfo('2026-03-29', '2026-03-30').label, 'il y a 1 jour');
    assert.equal(getElapsedTimeInfo('2026-10-24', '2026-10-26').daysAgo, 2);
  } finally {
    if (tz === undefined) delete process.env.TZ;
    else process.env.TZ = tz;
  }
});
```

Dans `allergenes.test.ts` :

```ts
test('Végétarien et Végan ont un pictogramme par défaut, l’icône choisie l’emporte', () => {
  const defaut = getDefaultContraintes();
  const vege = defaut.find((t) => t.id === 'tag-vegetarien')!;
  const vegan = defaut.find((t) => t.id === 'tag-vegan')!;
  assert.equal(iconeContrainte(vege), 'leaf');
  assert.equal(iconeContrainte(vegan), 'sprout');
  assert.equal(iconeContrainte({ ...vegan, icone: 'carrot' }), 'carrot');
});
```

- [ ] **Étape 2 :** `node --import tsx --test src/utils/dishes.test.ts src/utils/allergenes.test.ts` → les deux nouveaux tests ÉCHOUENT. Aujourd'hui : `daysAgo` 1 au lieu de 2, et `'tag'` au lieu de `'leaf'`.
- [ ] **Étape 3 :** `getElapsedTimeInfo` calcule `daysAgo = Math.max(0, -ecartJours(dateIso, aujourdHui))`. Le calcul des mois ne change pas. `iconeContrainte` suit l'ordre de résolution ci-dessus (table interne `ICONE_PAR_DEFAUT: Partial<Record<string, NomIcone>>`).
- [ ] **Étape 4 :** **Tests partiels :** `node --import tsx --test src/utils/dishes.test.ts src/utils/allergenes.test.ts src/utils/dates.test.ts` → tout est vert.
- [ ] **Étape 5 :** `pnpm lint` au vert. Capture de Réglages → Contraintes : feuille et pousse visibles.
- [ ] **Étape 6 :** commit `fix(dates,pictos): jours exacts à l'heure d'été, feuille et pousse par défaut`.
- [ ] **Étape 7 : tests complets de toute la branche** (consigne de l'utilisateur).
  - `pnpm lint`, `pnpm test` (88 tests d'origine plus les nouveaux, tous verts) et `pnpm build`.
  - Rejouer tous les scripts Playwright des tâches 1 à 9, en 412 × 915 et 320 × 640, en clair et en sombre : `titres.mjs`, `annonce.mjs`, `focus-feuilles.mjs`, la vérification de la tâche 4, `retour-editeur.mjs`, la vérification de la tâche 9.
  - Relancer `audit-a11y.mjs` sur tous ses états (aucune cible sous 44 px, aucune régression de contraste) et la matrice complète de `grand-texte.mjs`.
  - Tout échec se corrige dans un commit `fix(<zone>): …` dédié, puis la tâche entière se rejoue jusqu'au vert.
  - Le rapport donne la sortie de chaque commande.

---

## Après la dernière tâche (contrôleur)

1. Relecture complète de la branche par un sous-agent en `effort: "xhigh"`, contre la spec et ce plan.
2. `/impeccable audit src`. Objectif : 0 P1, 0 P2, score au-dessus de 15/20.
3. Liste à transmettre à l'utilisateur pour son téléphone (APK `pnpm tauri android build --apk --debug`) :
   - TalkBack : annonce « Annuler », feuilles, retour depuis l'éditeur ;
   - taille de police à 130 % et au maximum, sur tous les écrans ;
   - bouton Retour : présentation revue, recherche, feuilles enchaînées.
4. superpowers:finishing-a-development-branch.
