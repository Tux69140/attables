# Corrections de la critique impeccable — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** ce qu'une personne mange ou ne mange pas lui appartient (modèle v2 avec migration), l'allergie devient impossible à rater et s'écrit d'une seule façon, Retour ne perd plus rien, et le langage visuel applique `DESIGN.md`.

**Architecture :** les contraintes passent de `AppData.contraintes` (définitions communes) à `Convive.contraintes` (éléments propres à chaque personne). La logique pure (`allergenes.ts`, `dishes.ts`, `plats.ts`, `storage.ts`) change d'abord, avec ses tests ; les écrans suivent, tâche par tâche. Aucune dépendance nouvelle.

**Tech Stack :** React 19, TypeScript, Vite, Tailwind v4, tests `node:test` + `tsx`, Tauri v2 (Android).

**Spec :** `docs/superpowers/specs/2026-11-19-corrections-critique-design.md` (à lire en entier avant toute tâche ; ses sections sont citées « spec 5.x »).

**Exécution :** sous-agents en effort **high**, relecture finale comprise ; tâches **l'une après l'autre** (plusieurs touchent `InvitationEditor.tsx`). Branche `corrections-critique`, créée depuis `corrections-audit` (HEAD f562c5c).

## Global Constraints

- Tout `CLAUDE.md` s'applique ; en particulier : aucun réseau, aucune dépendance, aucun SDK ; pnpm seulement.
- Valider chaque tâche : `pnpm lint` (tsc), `pnpm test`, `pnpm build` ; vérifier dans le navigateur (`pnpm dev`, http://localhost:3000, 412 × 915) quand la tâche touche l'interface.
- Lancer un seul fichier de test : `node --import tsx --test src/chemin/fichier.test.ts`.
- Nouveaux fichiers source : en-tête copyright/SPDX GPL-3.0-or-later identique à celui de `src/App.tsx`.
- UI en français courant ; pas de jargon (« tag », « entité », « données »).
- Couleurs par jetons (`var(--ink)`, `var(--alerte)`…) ; rouge plein réservé aux allergies et aux confirmations de suppression ; cibles ≥ 44 px ; hauteurs `min-h-*`, jamais `h-*` pour ce qui contient du texte ; textes qui passent à la ligne, jamais `truncate` sur une allergie.
- Anciennes WebView : pas de `color-mix()` (donc pas de modificateur `/NN` de Tailwind sur `var(...)` dans le code nouveau), pas de `:has()`, `<dialog>`, `inert`.
- Toute nouvelle feuille : `BottomSheet` ou `ConfirmModal` de `SharedUI.tsx` (qui portent déjà `useAndroidBack`, `usePiegeFocus`, `.voile-feuille`, `.panneau-feuille`).
- Toute action destructrice : instantané `data` avant, puis `showUndo(message, instantané)` dans `App.tsx`.
- Texte pour une IA : anonymisé par défaut (ni prénoms ni hôte) ; ne pas changer la phrase qui l'annonce dans l'interface.
- Commit à la fin de chaque tâche, message en français au format du dépôt (`feat(…): …`, `fix(…): …`), terminé par la ligne `Co-Authored-By` demandée par la session.

## Review Focus

1. **Grande police Android (× 2)** : la fiche d'une personne, la feuille « + Ajouter », la confirmation d'affaiblissement et « La tablée » par personne passent à la ligne sans rien couper ni déborder → vérification navigateur des tâches 3 et 6 (`document.documentElement.style.fontSize = '32px'`).
2. **Retour / Échap avec deux couches ouvertes** (fiche + sous-feuille, fiche + confirmation) : seule la couche du dessus se ferme, et la fiche n'est pas enregistrée à moitié → test `pileRetour` de la tâche 2, vérification clavier de la tâche 3.
3. **Aliment libre écrit différemment** (« kiwi » sur une personne, « Kiwi » sur un plat) : l'alerte se déclenche → test `conflitsPlat` de la tâche 1.
4. **Nouveau convive créé depuis l'éditeur** (« Qui vient ? » › nouveau convive) puis feuille fermée sans bouton : le convive est enregistré une seule fois, coché dans l'éditeur, l'éditeur garde sa saisie → vérification navigateur de la tâche 3.
5. **Aller-retour d'une sauvegarde v2** (export avec champs de compatibilité, puis restauration) : données identiques, aucun identifiant `ctr-…` resté dans les allergènes d'un plat → test de la tâche 1.

---

### Task 1 : Modèle v2, migration, export compatible et logique des contraintes

Spec 5.1, 5.2, 5.4, et l'agrégat du texte pour une IA (5.6, dernier point). Les écrans sont seulement **adaptés** pour compiler et garder leur aspect ; leur refonte vient aux tâches suivantes.

**Files :**
- Modify : `src/types/models.ts`, `src/utils/allergenes.ts`, `src/utils/dishes.ts`, `src/services/storage.ts`, `src/App.tsx`, `src/components/{Allergies,CarteInvitation,ChoixAllergenes,ConvivesTab,FeuilleAjouter,FeuilleConvive,FeuillePlat,FichePlat,InvitationEditor,InvitationsTab,PlatsTab,SettingsModal}.tsx`
- Create : `src/components/ContraintesPersonne.tsx` (reçoit `FormulaireContrainte` déplacé de `SettingsModal.tsx`, renommé `FormulaireElement`, typé sur `ContrainteConvive` ; non utilisé avant la tâche 3)
- Test : `src/utils/allergenes.test.ts`, `src/utils/dishes.test.ts`, `src/services/storage.test.ts`, `src/utils/exemples.test.ts`, `src/utils/parcours.test.ts`, `src/utils/plats.test.ts`, `src/icones/nettoyer.test.ts` (adapter ce qui cite `contraintesIds` / `ContrainteTag`)

**Interfaces :**
- Produces (`models.ts`) :
  ```ts
  export type ContrainteNiveau = 'strict' | 'preference';
  export interface ContrainteConvive { id: string; libelle: string; niveau: ContrainteNiveau; allergenes: string[]; icone?: NomIcone }
  export interface Convive { id: string; nomAffiche: string; foyerId?: string; contraintes: ContrainteConvive[]; contrainteLibre: string }
  export interface PlatFiche { id: string; libelle: string; services: CourseKey[]; allergenes: string[]; sansAllergene?: boolean }
  // AppData : plus de champ `contraintes`. ContrainteTag disparaît de models.ts.
  ```
- Produces (`allergenes.ts`) :
  - `REGIMES: { id: 'vegetarien' | 'vegan'; libelle: string; allergenes: string[]; icone: NomIcone }[]` = Végétarien `['viande','poissons','crustaces','mollusques']` icône `leaf` ; Végan `[...végétarien, 'oeufs','lait']` icône `sprout`.
  - `idAutre(libelle: string): string` → `'autre:' + formatDishInput(libelle)` ; `estAutre(id: string): boolean` ; `libelleAutre(id: string): string`.
  - `memeAllergene(a: string, b: string): boolean` — égalité stricte, ou deux `autre:` dont `normalizeForCompare` des libellés est égal.
  - `libelleAllergene(id: string): string` (référence, sinon libellé d'un `autre:`, sinon l'id brut) ; `iconeAllergene(id: string): NomIcone` (référence, sinon `'tag'`).
  - `iconeContrainte(c: { icone?: NomIcone; allergenes: string[] }): NomIcone` — choisie, sinon celle de l'unique allergène, sinon `'tag'`.
  - `conflitsPlat(allergenesPlat: string[], convives: Convive[]): ConflitAllergene[]` — même tri et même forme `ConflitAllergene` qu'aujourd'hui ; un convive est concerné si l'un de ses éléments contient un allergène `memeAllergene` ; le strict l'emporte.
  - `alimentsLibresConnus(convives: Convive[], plats: PlatFiche[]): string[]` — ids `autre:` distincts (dédoublonnés par `memeAllergene`, premier vu gardé), triés `localeCompare(…, 'fr')`.
  - `choixAllergenes(libresConnus: string[]): { reglementaires: Allergene[]; autres: Allergene[]; libres: string[] }`.
  - `resumeAllergiesStrictes(strict: AggregatedConstraints['strict'], max = 2)` — même rendu qu'aujourd'hui, adapté à la nouvelle forme (la tâche 6 change le rendu).
  - Supprimés : `retirerContrainte`, `ICONE_PAR_DEFAUT`. `LIAISONS_PAR_DEFAUT` reste (migration).
- Produces (`dishes.ts`) :
  ```ts
  export interface GroupeContrainte { cle: string; libelle: string; icone: NomIcone; guests: Convive[] } // cle = normalizeForCompare(libelle)
  export interface ContraintesPersonne { guest: Convive; strict: ContrainteConvive[]; evite: ContrainteConvive[]; note: string }
  export interface AggregatedConstraints { strict: GroupeContrainte[]; preferences: GroupeContrainte[]; parPersonne: ContraintesPersonne[]; freeNotes: { guest: Convive; note: string }[] }
  export function aggregateConstraints(selectedGuestIds: string[], convivesById: Map<string, Convive>): AggregatedConstraints
  ```
  `strict` et `preferences` regroupés par `cle`, libellé et icône du premier élément vu, triés par libellé (`fr`) ; `parPersonne` dans l'ordre de `selectedGuestIds`, seulement les personnes qui ont au moins un élément ou une note.
- Produces (`storage.ts`) : `CURRENT_DATA_VERSION = 2` ; `createSampleData()` et `createEmptyData()` en v2 ; `migrateAndValidateAppData(input: unknown): AppData` ; `preparerExport(data: AppData): Record<string, unknown>` ; `getDefaultContraintes` devient interne (`contraintesV1ParDefaut`, migration seulement).
- Produces (UI) : `ChoixAllergenes` props `{ valeur: string[]; onChange: (v: string[]) => void; libresConnus: string[]; replie?: boolean }` (groupe « Mes contraintes » remplacé par les aliments libres connus) ; `PastilleContrainte` prend `{ contrainte: ContrainteConvive }` ; plus aucun `contraintesById` / `contraintes` dans les props des écrans.

- [ ] **Step 1 : écrire les tests de la logique pure (ils échouent)**

`src/utils/allergenes.test.ts` (remplacer les tests qui citent `ContrainteTag`) :
```ts
const c = (id: string, nom: string, ...els: ContrainteConvive[]): Convive => ({ id, nomAffiche: nom, contraintes: els, contrainteLibre: '' });
const el = (id: string, libelle: string, niveau: ContrainteNiveau, allergenes: string[]): ContrainteConvive => ({ id, libelle, niveau, allergenes });

test('conflitsPlat : allergie stricte d\'une personne', () => {
  const lea = c('conv-lea', 'Léa', el('ctr-1', 'Arachides', 'strict', ['arachides']));
  const r = conflitsPlat(['arachides'], [lea]);
  assert.deepEqual(r.map((x) => [x.allergeneId, x.niveau, x.convives.map((g) => g.id)]), [['arachides', 'strict', ['conv-lea']]]);
});
test('conflitsPlat : même aliment, niveaux propres à chacun', () => {
  const lea = c('conv-lea', 'Léa', el('ctr-1', 'Lait', 'strict', ['lait']));
  const marc = c('conv-marc', 'Marc', el('ctr-2', 'Lait', 'preference', ['lait']));
  const r = conflitsPlat(['lait'], [lea, marc]);
  assert.deepEqual(r.map((x) => [x.niveau, x.convives.map((g) => g.nomAffiche)]), [['strict', ['Léa']], ['preference', ['Marc']]]);
});
test('conflitsPlat : aliment libre, casse et accents différents', () => {
  const lea = c('conv-lea', 'Léa', el('ctr-1', 'Kiwi', 'strict', ['autre:kiwi']));
  assert.equal(conflitsPlat(['autre:Kiwi'], [lea]).length, 1);
});
test('conflitsPlat : régime ajusté pour une seule personne', () => {
  const lea = c('conv-lea', 'Léa', el('ctr-1', 'Végétarienne', 'preference', ['viande', 'crustaces', 'mollusques']));
  assert.equal(conflitsPlat(['poissons'], [lea]).length, 0);
  assert.equal(conflitsPlat(['viande'], [lea]).length, 1);
});
test('idAutre / libelleAllergene / memeAllergene', () => {
  assert.equal(idAutre('  kiwi '), 'autre:Kiwi');
  assert.equal(libelleAllergene('autre:Kiwi'), 'Kiwi');
  assert.equal(libelleAllergene('oeufs'), 'Œufs');
  assert.ok(memeAllergene('autre:Céleri rave', 'autre:celeri rave'));
  assert.ok(!memeAllergene('autre:Kiwi', 'kiwi'));
});
test('alimentsLibresConnus : réunion sans doublon, triée', () => {
  const lea = c('conv-lea', 'Léa', el('ctr-1', 'Kiwi', 'strict', ['autre:Kiwi']));
  const plats = [{ id: 'p', libelle: 'Salade', services: ['entree'], allergenes: ['autre:kiwi', 'autre:Ananas', 'oeufs'] }] as PlatFiche[];
  assert.deepEqual(alimentsLibresConnus([lea], plats), ['autre:Ananas', 'autre:Kiwi']);
});
```
`src/utils/dishes.test.ts` : test `aggregateConstraints regroupe par libellé et détaille par personne` — Léa (Arachides strict, Lait preference, note « pas de coriandre »), Nadia (arachides strict libellé « arachides »), Marc (rien) → `strict` = un groupe `cle 'arachides'` avec Léa et Nadia ; `preferences` = un groupe Lait (Léa) ; `parPersonne` = [Léa, Nadia] (Marc absent) ; `freeNotes` = [Léa]. Test `buildAiPromptMarkdown anonymisé : nombre de personnes, sans prénom` → contient `Arachides (2 personnes)` et `Lait (1 personne)`, ne contient ni `Léa` ni `Nadia`.

`src/services/storage.test.ts` :
```ts
test('v1 → v2 : chaque convive reçoit une copie de ses contraintes', () => {
  const v1 = { version: 1, foyers: [], invitations: [], plats: [],
    contraintes: [{ id: 'tag-arachides', libelle: 'Arachides', niveau: 'strict', allergenes: ['arachides'] },
                  { id: 'tag-vegetarien', libelle: 'Végétarien', niveau: 'preference' }],
    convives: [{ id: 'conv-lea', nomAffiche: 'Léa', contraintesIds: ['tag-arachides', 'tag-vegetarien', 'tag-inconnu'], contrainteLibre: '' }] };
  const d = migrateAndValidateAppData(v1);
  assert.equal(d.version, 2);
  assert.equal('contraintes' in d, false);
  const els = d.convives[0].contraintes;
  assert.deepEqual(els.map((e) => [e.libelle, e.niveau, e.allergenes]), [
    ['Arachides', 'strict', ['arachides']],
    ['Végétarien', 'preference', ['viande', 'poissons', 'crustaces', 'mollusques']],
  ]);
  assert.equal(els[1].icone, 'leaf');                 // pictogramme par défaut de tag-vegetarien conservé
  assert.equal(new Set(els.map((e) => e.id)).size, 2); // ids uniques
});
test('v1 → v2 : contrainte personnelle devient un aliment libre, sur la personne et sur le plat', () => {
  const v1 = { foyers: [], invitations: [],
    contraintes: [{ id: 'tag-kiwi', libelle: 'Kiwi', niveau: 'strict', allergenes: [] }],
    convives: [{ id: 'conv-lea', nomAffiche: 'Léa', contraintesIds: ['tag-kiwi'], contrainteLibre: '' }],
    plats: [{ id: 'p1', libelle: 'Pavlova', services: ['dessert'], allergenes: ['tag-kiwi', 'oeufs', 'zzz'] }] };
  const d = migrateAndValidateAppData(v1);
  assert.deepEqual(d.convives[0].contraintes[0].allergenes, ['autre:Kiwi']);
  assert.deepEqual(d.plats[0].allergenes, ['autre:Kiwi', 'oeufs']);
  assert.equal(conflitsPlat(d.plats[0].allergenes, d.convives).length, 2);
});
test('v1 → v2 : plat qui cite une contrainte ayant des allergènes garde son alerte', () => {
  const v1 = { foyers: [], invitations: [],
    contraintes: [{ id: 'tag-x', libelle: 'Fruits exotiques', niveau: 'strict', allergenes: ['fruits-a-coque'] }],
    convives: [{ id: 'conv-lea', nomAffiche: 'Léa', contraintesIds: ['tag-x'], contrainteLibre: '' }],
    plats: [{ id: 'p1', libelle: 'Salade', services: ['entree'], allergenes: ['tag-x'] }] };
  const d = migrateAndValidateAppData(v1);
  assert.deepEqual(d.plats[0].allergenes, ['autre:Fruits exotiques']);
  assert.deepEqual(d.convives[0].contraintes[0].allergenes, ['fruits-a-coque', 'autre:Fruits exotiques']);
  assert.equal(conflitsPlat(d.plats[0].allergenes, d.convives)[0].niveau, 'strict');
});
test('v2 : validation (niveau inconnu → strict, sansAllergene faux si allergènes, ids inconnus retirés)', () => {
  const v2 = { version: 2, foyers: [], invitations: [],
    convives: [{ id: 'conv-lea', nomAffiche: 'Léa', contrainteLibre: '',
      contraintes: [{ id: 'ctr-1', libelle: 'Œufs', niveau: 'grave', allergenes: ['oeufs', 'ctr-9', 42] }] }],
    plats: [{ id: 'p1', libelle: 'Flan', services: ['dessert'], allergenes: ['oeufs', 'ctr-1'], sansAllergene: true }] };
  const d = migrateAndValidateAppData(v2);
  assert.equal(d.convives[0].contraintes[0].niveau, 'strict');
  assert.deepEqual(d.convives[0].contraintes[0].allergenes, ['oeufs']);
  assert.deepEqual(d.plats[0].allergenes, ['oeufs']);
  assert.equal(d.plats[0].sansAllergene ?? false, false);
});
test('exemples v2 : mêmes personnes et contraintes qu\'avant', () => {
  const d = createSampleData();
  assert.equal(d.version, 2);
  const lib = (id: string) => d.convives.find((x) => x.id === id)!.contraintes.map((e) => `${e.libelle}/${e.niveau}`);
  assert.deepEqual(lib('conv-paul'), ['Crustacés/strict']);
  assert.deepEqual(lib('conv-julie'), ['Végétarien/preference']);
  assert.deepEqual(lib('conv-sophie'), ['Lait/preference']);
  assert.deepEqual(lib('conv-lea'), ['Arachides/strict']);
  assert.deepEqual(lib('conv-claire'), ['Alcool/preference']);
  assert.deepEqual(lib('conv-nadia'), ['Porc/preference', 'Fruits à coque/strict']);
});
test('export compatible : relu par la logique v1, mêmes alertes', () => {
  const d: AppData = { ...createEmptyData(), plats: [{ id: 'p1', libelle: 'Salade', services: ['entree'], allergenes: ['autre:Kiwi', 'arachides'] }],
    convives: [
      c('conv-lea', 'Léa', el('ctr-k1', 'Kiwi', 'strict', ['autre:Kiwi']), el('ctr-a1', 'Arachides', 'strict', ['arachides'])),
      c('conv-marc', 'Marc', el('ctr-k2', 'Kiwi', 'preference', ['autre:kiwi'])),
    ] };
  const e = preparerExport(d) as any;
  assert.deepEqual(e.contraintes.map((t: any) => [t.id, t.niveau, t.allergenes]), [
    ['ctr-k1', 'strict', []], ['ctr-a1', 'strict', ['arachides']], ['ctr-k2', 'preference', []]]);
  assert.deepEqual(e.convives.map((x: any) => x.contraintesIds), [['ctr-k1', 'ctr-a1'], ['ctr-k2']]);
  assert.deepEqual([...e.plats[0].allergenes].sort(), ['arachides', 'autre:Kiwi', 'ctr-k1', 'ctr-k2'].sort());
  // Ancienne règle v1, recopiée ici : concerné si tag.id === a || tag.allergenes.includes(a) ; strict l'emporte.
  const v1Niveau = (conv: any, a: string) => {
    let n: string | undefined;
    for (const id of conv.contraintesIds) {
      const t = e.contraintes.find((x: any) => x.id === id);
      if (t && (t.id === a || t.allergenes.includes(a))) n = t.niveau === 'strict' ? 'strict' : (n ?? 'preference');
    }
    return n;
  };
  const niveau = (conv: any) => e.plats[0].allergenes.map((a: string) => v1Niveau(conv, a)).filter(Boolean);
  assert.ok(niveau(e.convives[0]).includes('strict'));          // Léa : arachides et kiwi
  assert.deepEqual([...new Set(niveau(e.convives[1]))], ['preference']); // Marc : kiwi
});
test('aller-retour : export puis restauration redonnent les mêmes données', () => {
  const d = createSampleData();
  assert.deepEqual(migrateAndValidateAppData(JSON.parse(JSON.stringify(preparerExport(d)))), d);
});
test('mode démo : les exemples chargés sont en v2', () => {
  const d = creerStockage(true).charger();
  assert.equal(d.version, 2);
  assert.ok(d.convives.every((x) => Array.isArray(x.contraintes) && !('contraintesIds' in x)));
});
```

- [ ] **Step 2 : lancer les tests, vérifier qu'ils échouent** — `pnpm test` : FAIL (fonctions absentes / types).

- [ ] **Step 3 : implémenter `models.ts`, `allergenes.ts`, `dishes.ts`, `storage.ts`**

Migration (spec 5.2) : est v1 toute donnée dont `version` n'est pas `2`. Ids des éléments migrés : `ctr-<convive.id>-<tag.id>` (déterministes, uniques). Icône par défaut d'un ancien `tag-vegetarien` / `tag-vegan` posée explicitement (`leaf` / `sprout`). Données d'exemple : ids fixes `ctr-ex-<prénom sans accent>-<allergène>` (ex. `ctr-ex-nadia-porc`), libellés et niveaux du test ci-dessus, Julie avec `icone: 'leaf'`. `preparerExport` (spec 5.2, « Compatibilité descendante ») : `{ ...data, contraintes: [...], convives: [... + contraintesIds], plats: [... allergenes + ids d'éléments portant le même aliment libre] }`. Chargement v2 : un id d'allergène ni `ALLERGENES` ni `autre:` est retiré (ce qui enlève les ids `ctr-…` de compatibilité) ; champs `contraintes` / `contraintesIds` ignorés. Texte pour une IA, anonymisé : `${libelle} (${n} personne${n > 1 ? 's' : ''})` ; nominatif : `${libelle} (Léa, Nadia)` comme aujourd'hui.

- [ ] **Step 4 : lancer les tests** — `pnpm test` : PASS.

- [ ] **Step 5 : adapter les écrans pour compiler, sans refonte**

- `SettingsModal.tsx` : retirer l'entrée et l'écran « Contraintes alimentaires » (spec 5.4), `onSaveTag`/`onDeleteTag`, la confirmation de suppression de tag ; déplacer `FormulaireContrainte` vers `ContraintesPersonne.tsx` (`FormulaireElement`, mêmes champs, `onEnregistrer(c: ContrainteConvive)`) ; texte de réinitialisation : `Supprimer les ${n} invitations, ${n} convives et ${n} foyers pour repartir sur une base vide ? Vous pourrez annuler juste après.` ; export : `JSON.stringify(preparerExport(data), null, 2)`.
- `App.tsx` : retirer `contraintesById`, `handleSaveTag`, `handleDeleteTag`.
- `FeuilleConvive.tsx` : temporairement, la rangée de puces affiche les éléments existants en `PastilleContrainte` (lecture seule) ; l'enregistrement les conserve tels quels.
- Les autres écrans : nouvelles signatures (`aggregateConstraints`, `conflitsPlat`, `libelleAllergene`, `iconeAllergene`, `ChoixAllergenes`), aspect inchangé.

- [ ] **Step 6 : valider** — `pnpm lint` sans erreur, `pnpm test` PASS, `pnpm build` OK. Navigateur : premier lancement « Visiter avec des exemples », l'éditeur du « Dîner d'automne » montre le bandeau « Arachides — Léa · Fruits à coque — Nadia » ; Réglages n'a plus « Contraintes alimentaires » ; export puis restauration d'une sauvegarde : rien ne change.

- [ ] **Step 7 : commit** — `feat(données): chaque personne porte ses propres contraintes (version 2, migration, export compatible)`

---

### Task 2 : Échap ne ferme que la couche du dessus

Spec 5.3, dernier point.

**Files :**
- Modify : `src/hooks/pileRetour.ts`, `src/hooks/useAndroidBack.ts`, `src/components/SharedUI.tsx:44-52,118-125`
- Test : `src/hooks/pileRetour.test.ts`

**Interfaces :**
- Produces : `creerPileRetour(...)` renvoie aussi `estAuDessus(id: string): boolean` ; `useAndroidBack(active, onBack): () => boolean` renvoie une fonction stable qui dit si la couche est celle du dessus (faux si inactive).

- [ ] **Step 1 : test** — `test('estAuDessus : seule la dernière couche empilée', …)` : empiler A puis B → `estAuDessus(B)` vrai, `estAuDessus(A)` faux ; retirer B → `estAuDessus(A)` vrai ; id inconnu → faux.
- [ ] **Step 2 : lancer** — `node --import tsx --test src/hooks/pileRetour.test.ts` : FAIL.
- [ ] **Step 3 : implémenter** ; dans `ConfirmModal` et `BottomSheet`, Échap n'agit que si `estAuDessus()`.
- [ ] **Step 4 : lancer** — PASS ; `pnpm lint`.
- [ ] **Step 5 : vérifier** — onglet Convives, fiche Léa › « Modifier » : un Échap ferme seulement « Modifier le convive », un second ferme la fiche.
- [ ] **Step 6 : commit** — `fix(clavier): Échap ne ferme que la feuille du dessus`

---

### Task 3 : Fiche d'une personne (« Ce que Léa ne mange pas »)

Spec 5.3 en entier (sauf Échap, tâche 2).

**Files :**
- Modify : `src/components/ContraintesPersonne.tsx`, `src/components/FeuilleConvive.tsx`, `src/components/FeuilleAjouter.tsx`, `src/components/ConvivesTab.tsx`, `src/App.tsx`, `src/utils/allergenes.ts`
- Test : `src/utils/allergenes.test.ts`

**Interfaces :**
- Consumes : `ContrainteConvive`, `REGIMES`, `ALLERGENES`, `idAutre`, `alimentsLibresConnus`, `iconeContrainte`, `FormulaireElement`, `ChoixAllergenes` (tâche 1).
- Produces :
  - `affaiblissements(avant: ContrainteConvive[], apres: ContrainteConvive[]): string[]` (`allergenes.ts`) — libellés des éléments `strict` d'`avant` qui, dans `apres` (même `id`), ont disparu, sont passés à `preference`, ou ont perdu au moins un allergène ; ordre d'`avant`.
  - `dejaPresent(contraintes: ContrainteConvive[], allergenes: string[]): boolean` (`allergenes.ts`) — vrai si un élément a exactement le même ensemble d'allergènes (`memeAllergene`).
  - `FormulaireConvive` / `FeuilleConvive` : `onEnregistrer: (c: Convive, annulable: boolean) => void`.
  - `App.tsx` : `handleSaveConvive(c: Convive, annulable: boolean)` — si `annulable`, instantané puis `showUndo(\`Fiche de ${c.nomAffiche} enregistrée\`, instantané)`.

- [ ] **Step 1 : tests**
```ts
test('affaiblissements', () => {
  const ara = el('ctr-1', 'Arachides', 'strict', ['arachides']);
  const vegan = el('ctr-2', 'Végan', 'strict', ['viande', 'oeufs', 'lait']);
  const lait = el('ctr-3', 'Lait', 'preference', ['lait']);
  assert.deepEqual(affaiblissements([ara, vegan, lait], [vegan, lait]), ['Arachides']);                       // retirée
  assert.deepEqual(affaiblissements([ara], [{ ...ara, niveau: 'preference' }]), ['Arachides']);              // passée à « Évite »
  assert.deepEqual(affaiblissements([vegan], [{ ...vegan, allergenes: ['viande', 'oeufs'] }]), ['Végan']);   // allergène retiré
  assert.deepEqual(affaiblissements([lait], []), []);                                                       // « Évite » retiré : rien
  assert.deepEqual(affaiblissements([ara], [{ ...ara, libelle: 'Cacahuètes' }]), []);                       // renommée : rien
});
test('dejaPresent', () => {
  assert.ok(dejaPresent([el('ctr-1', 'Œufs', 'strict', ['oeufs'])], ['oeufs']));
  assert.ok(!dejaPresent([el('ctr-1', 'Végan', 'preference', ['oeufs', 'lait'])], ['oeufs']));
});
```
- [ ] **Step 2 : lancer** — FAIL.
- [ ] **Step 3 : implémenter `affaiblissements`, `dejaPresent`** ; lancer — PASS.
- [ ] **Step 4 : interface de la fiche** (`ContraintesPersonne.tsx`, `FeuilleConvive.tsx`) selon le croquis de la spec 5.3 :
  - titre de section `Ce que ${prénom} ne mange pas` (`Ce qu'il ou elle ne mange pas` tant que le nom est vide → écrire `Ce que cette personne ne mange pas`) ; une ligne par élément : pictogramme, libellé, liste des allergènes si plusieurs, mot du niveau (`Allergie` avec ⚠ sur fond `var(--alerte)` texte `var(--on-alerte)` ; `Évite` en `var(--pref)` sur `var(--pref-bg)`), bouton de retrait `aria-label={\`Retirer ${libelle}\`}` ; toucher la ligne ouvre `FormulaireElement` dans une `BottomSheet` titrée `Modifier « ${libelle} »`.
  - bouton `+ Ajouter` (en pointillés safran brûlé, `DESIGN.md`) → `BottomSheet` `Ajouter pour ${prénom}` : groupes « Allergènes », « Autres aliments », « Régimes » (`REGIMES`), « Déjà notés ailleurs » (`alimentsLibresConnus`, masqué si vide), champ `Autre…` avec bouton `Choisir` ; les choix pour lesquels `dejaPresent` est vrai sont absents ; après le choix, deux boutons pleine largeur `Allergie` et `Évite` (sans présélection), qui ajoutent l'élément (`id: \`ctr-${Date.now()}\``, libellé, allergènes, icône du régime le cas échéant) et ferment la sous-feuille.
  - note libre : aide `Une allergie ? Ajoutez-la ci-dessus pour être alerté.` (sous le libellé « Note libre (goûts, précisions…) »).
- [ ] **Step 5 : enregistrement et fermeture** (spec 5.3) :
  - Bouton `Enregistrer les modifications` / `Ajouter le convive` : si `affaiblissements` non vide → `ConfirmModal` (titre `Retirer une allergie de ${prénom} ?`, description `Les alertes ne signaleront plus : ${libellés joints par ', '}. Vous pourrez annuler juste après.`, `confirmLabel="Continuer"`, `cancelLabel="Revenir à la fiche"`, destructif) puis `onEnregistrer(c, true)` ; sinon `onEnregistrer(c, false)`.
  - Fermeture (Retour, voile, Échap, bouton Fermer) : fiche inchangée, ou nouveau convive sans nom → fermer ; sinon, même chemin que le bouton mais avec `annulable = true` dans tous les cas. Le brouillon remonte dans `FeuilleConvive` (ou s'expose autrement : au choix du constructeur) pour que la fermeture le connaisse.
  - Même règle pour l'étape convive de `FeuilleAjouter` et pour la fermeture de l'édition d'un élément (ses changements s'appliquent au brouillon de la fiche).
  - `App.tsx` : tous les `onEnregistrerConvive` passent par `handleSaveConvive`. La création depuis l'éditeur (`onDemanderNouveauConvive`) appelle toujours `apres(c)` une seule fois.
- [ ] **Step 6 : `ConvivesTab.tsx`** — pastilles des membres et de la fiche depuis `convive.contraintes` (`PastilleContrainte`).
- [ ] **Step 7 : valider** — `pnpm lint`, `pnpm test`, `pnpm build`. Navigateur, données d'exemple : ajouter « Œufs › Allergie » à Léa puis fermer par Retour → bandeau « Fiche de Léa enregistrée · Annuler », l'invitation « Dîner d'automne » affiche Œufs — Léa ; retirer Arachides → confirmation, « Revenir à la fiche » ne change rien, « Continuer » enregistre puis « Annuler » restaure ; « Végétarien » sur Marc, décocher Poissons dans son édition → Julie (Végétarien) inchangée ; « Autre… » Kiwi sur Léa → proposé dans la fiche d'un plat ; Review Focus 1, 2 et 4 (police × 2, Échap fiche + sous-feuille, nouveau convive depuis « Qui vient ? » fermé par Retour).
- [ ] **Step 8 : commit** — `feat(convives): la fiche d'une personne porte ses allergies, intolérances et régimes`

---

### Task 4 : Fiche de plat — « Aucun de ces allergènes » et aliments libres

Spec 5.1 (`sansAllergene`), 5.5 (second paragraphe).

**Files :**
- Modify : `src/utils/plats.ts`, `src/components/ChoixAllergenes.tsx`, `src/components/FeuillePlat.tsx`, `src/components/FichePlat.tsx`, `src/components/PlatsTab.tsx`, `src/App.tsx`
- Test : `src/utils/plats.test.ts`

**Interfaces :**
- Consumes : `PlatFiche.sansAllergene`, `alimentsLibresConnus`, `idAutre` (tâche 1).
- Produces :
  - `ValeursPlat` = `{ libelle: string; services: CourseKey[]; allergenes: string[]; sansAllergene: boolean }` ; `enregistrerFiche(plats, entree: ValeursPlat, id)` pose `sansAllergene: true` seulement si `entree.sansAllergene && entree.allergenes.length === 0`, sinon retire le champ.
  - `allergenesRenseignes(fiche: PlatFiche | undefined): boolean` (`plats.ts`) = fiche existe et (`allergenes` non vide ou `sansAllergene`).
  - `ChoixAllergenes` : props en plus `aucun?: { valeur: boolean; onChange: (v: boolean) => void }` (tuile « Aucun de ces allergènes » en tête, exclusive) et `autreLibre?: boolean` (champ « Autre… » qui ajoute `idAutre(saisie)`).
- [ ] **Step 1 : tests** — `enregistrerFiche : sansAllergene seulement sans allergène` (vrai + `[]` → `sansAllergene: true` ; vrai + `['oeufs']` → champ absent) ; `allergenesRenseignes` (undefined → faux ; `[]` sans champ → faux ; `[]` + `sansAllergene` → vrai ; `['oeufs']` → vrai).
- [ ] **Step 2 : lancer** — FAIL ; **Step 3 : implémenter** ; **Step 4 : lancer** — PASS.
- [ ] **Step 5 : interface** — fiche de plat : `ChoixAllergenes` avec `aucun` et `autreLibre` ; cocher un allergène décoche « Aucun », cocher « Aucun » vide les allergènes. `FichePlat` : `Aucun allergène` si `sansAllergene`, `Non renseignés` si rien. Icônes des aliments libres : `iconeAllergene` (`'tag'`). Le champ « Autre… » existe aussi dans la grille de `FormulaireElement` (fiche personne).
- [ ] **Step 6 : valider** — lint, test, build ; navigateur : onglet Plats, « Poires pochées » (nouvelle fiche, Dessert) › « Aucun de ces allergènes » → fiche affiche « Aucun allergène ».
- [ ] **Step 7 : commit** — `feat(plats): dire qu'un plat n'a aucun allergène`

---

### Task 5 : Éditeur — ligne « Allergènes de ce plat non renseignés — vérifier »

Spec 5.5, premier paragraphe.

**Files :**
- Modify : `src/components/InvitationEditor.tsx` (rendu des champs du menu, autour des lignes 990-1120), `src/App.tsx`, `src/utils/plats.ts`
- Test : `src/utils/plats.test.ts`

**Interfaces :**
- Consumes : `allergenesRenseignes`, `ValeursPlat`, `FeuillePlat` (tâche 4).
- Produces :
  - `aVerifier(valeurPlat: string, fiche: PlatFiche | undefined, tableeAvecAllergie: boolean): boolean` (`plats.ts`) = `valeurPlat.trim() !== '' && tableeAvecAllergie && !allergenesRenseignes(fiche)`.
  - `InvitationEditorProps.onEnregistrerFiche: (v: ValeursPlat) => void` (App : `handleEnregistrerFiche`).
- [ ] **Step 1 : test** — `aVerifier` : champ vide → faux ; tablée sans allergie → faux ; pas de fiche → vrai ; fiche `sansAllergene` → faux ; fiche avec `['oeufs']` → faux.
- [ ] **Step 2 : lancer** — FAIL ; **Step 3 : implémenter** ; **Step 4 : lancer** — PASS.
- [ ] **Step 5 : interface** — sous le champ, quand `aVerifier(...)` : bouton pleine largeur, fond `var(--surface-elevated)`, filet `var(--border)`, texte `var(--ink)` 14 px, sans ⚠ ni couleur de signal, libellé exact `Allergènes de ce plat non renseignés — vérifier`, min 44 px. Le toucher ouvre `FeuillePlat` dans l'éditeur (`nomModifiable={false}`, `allergenesOuverts`, `initial` = fiche existante ou `{ libelle: valeur, services: [courseKey], allergenes: [], sansAllergene: false }`, `libelleBouton="Enregistrer"`, `liste` calculée comme dans `PlatsTab`) ; enregistrer appelle `onEnregistrerFiche` et ferme ; les alertes se recalculent.
- [ ] **Step 6 : valider** — lint, test, build ; navigateur : « Dîner d'automne », entrée « Salade de chèvre aux noix » → la ligne apparaît ; la toucher, cocher Fruits à coque, enregistrer → « Ce plat contient des fruits à coque — Nadia… » apparaît, la ligne disparaît.
- [ ] **Step 7 : commit** — `feat(éditeur): signaler un plat dont les allergènes ne sont pas renseignés`

---

### Task 6 : Une seule forme pour l'allergie

Spec 5.6.

**Files :**
- Modify : `src/utils/allergenes.ts`, `src/components/Allergies.tsx`, `src/components/CarteInvitation.tsx`, `src/components/InvitationEditor.tsx` (⚠ ambre des lignes ≈ 893 et ≈ 1077), `src/components/PlatsTab.tsx` (pastille « il y a … » ambre)
- Test : `src/utils/allergenes.test.ts`

**Interfaces :**
- Consumes : `AggregatedConstraints.parPersonne` (tâche 1), `PastilleContrainte`.
- Produces : `listePrenoms(convives: Convive[]): string` (`allergenes.ts`) ; `resumeAllergiesStrictes` au format `Libellé — Prénom, Prénom`.
- [ ] **Step 1 : tests** — `listePrenoms` : `['Léa']` → `'Léa'` ; `['Léa','Nadia']` → `'Léa et Nadia'` ; trois → `'Léa, Nadia et Paul'`. `resumeAllergiesStrictes` : `{ texte: 'Arachides — Léa, Nadia · Crustacés — Paul', reste: 1 }` pour trois groupes et `max = 2`.
- [ ] **Step 2 : lancer** — FAIL ; **Step 3 : implémenter** ; **Step 4 : lancer** — PASS.
- [ ] **Step 5 : interface**
  - `AlertesAllergenes` : strict `Ce plat contient ${quoi} — ${listePrenoms} ${n > 1 ? 'sont allergiques' : 'est allergique'}` (rouge plein, ⚠, `role="alert"`) ; préférence `Ce plat contient ${quoi} — ${listePrenoms} ${n > 1 ? 'évitent' : 'évite'}` (bleu).
  - `BlocTablee` : une ligne par `parPersonne` (prénom en gras ; allergies en `PastilleContrainte` rouges ; `évite : ${libellés en minuscules, joints par ', '}` en `var(--pref)` ; note entre guillemets « » en `var(--ink)`), plus d'encadré « Allergies strictes » ni « Préférences » ; état vide inchangé.
  - Carte d'invitation : `resumeAllergiesStrictes`.
  - « Servi récemment » : icône horloge (`clock`) en ambre à la place de ⚠, dans l'éditeur et sur la pastille ambre de l'onglet Plats (qui gagne aussi le mot `récent`).
- [ ] **Step 6 : valider** — lint, test, build ; navigateur clair et sombre : carte « Dîner d'automne » `⚠ Arachides — Léa · Fruits à coque — Nadia` ; éditeur : « La tablée » une ligne par personne, aucun encadré rouge pâle ; police × 2 (Review Focus 1).
- [ ] **Step 7 : commit** — `feat(allergies): une seule forme « Allergène — Prénom », la tablée par personne`

---

### Task 7 : Retour dans l'éditeur enregistre, avec « Annuler »

Spec 5.7.

**Files :**
- Modify : `src/components/InvitationEditor.tsx` (`handleSubmit` ≈ l. 280, bouton Retour ≈ l. 400, `useAndroidBack` l. 136), `src/App.tsx` (`handleSaveInvitation` l. 258), `src/utils/dishes.ts` (ou un nouveau `src/utils/invitations.ts`)
- Test : fichier de test du module choisi

**Interfaces :**
- Produces :
  - `invitationVide(inv: Invitation): boolean` — aucun convive, menu sans plat non vide, ni titre ni note.
  - `memeInvitation(a: Invitation, b: Invitation): boolean` — égalité de contenu en ignorant `id`.
  - `InvitationEditorProps.onSave: (invitation: Invitation, message: string) => void` ; `App.handleSaveInvitation(inv, message)` : instantané, enregistrement, fermeture, `showUndo(message, instantané)`.
- [ ] **Step 1 : tests** — `invitationVide` (brouillon neuf → vrai ; un convive → faux ; un plat → faux ; un titre → faux) ; `memeInvitation` (même contenu, ids différents → vrai ; un plat différent → faux ; un verdict différent → faux).
- [ ] **Step 2 : lancer** — FAIL ; **Step 3 : implémenter** ; **Step 4 : lancer** — PASS.
- [ ] **Step 5 : éditeur** — extraire la construction de `handleSubmit` en `construire(statut)` ; au montage, garder `construire(statutDepart)` comme référence (`statutDepart = existing?.statut ?? 'prevue'`). `quitter()` (flèche Retour et `useAndroidBack`) : si `memeInvitation(construire(statutDepart), référence)` ou (`!existing` et `invitationVide(...)`) → `onCancel()` ; sinon `onSave(construire(statutDepart), 'Invitation enregistrée')`. Boutons : « Enregistrer prévue » → `'Invitation enregistrée'` ; « Valider réalisée » → `'Repas enregistré comme réalisé'`.
- [ ] **Step 6 : valider** — lint, test, build ; navigateur : nouvelle invitation, taper un plat, Retour → bandeau « Invitation enregistrée · Annuler », Annuler la fait disparaître ; nouvelle invitation vide, Retour → rien ; invitation existante ouverte puis Retour sans rien toucher → pas de bandeau ; une feuille ouverte dans l'éditeur se ferme d'abord au Retour.
- [ ] **Step 7 : commit** — `feat(éditeur): Retour enregistre l'invitation et propose Annuler`

---

### Task 8 : Cohérence visuelle

Spec 5.8.

**Files :**
- Modify : `src/index.css`, `src/components/InvitationEditor.tsx` (« Qui vient ? » ≈ l. 700-780, verdicts ≈ l. 1150-1290, type de repas ≈ l. 1455), `src/components/SettingsModal.tsx` (mois ≈ l. 467-515, pastilles de la racine), `src/components/FeuilleFoyer.tsx:17`, `src/components/BandeauExemples.tsx` (bouton « Commencer avec mes proches »), `src/components/CarteInvitation.tsx:59,142`, tout fichier qui garde `text-[12px]` ou moins (`grep -rn "text-\[1[01]px\]\|text-\[12px\]" src`)

- [ ] **Step 1 : état « choisi » unique** — fond `var(--ink)`, texte `var(--card)`, `IconCheck` 16 px, filet `var(--ink)` ; non choisi : fond `var(--card)` (ou `var(--surface-elevated)` dans une carte), filet `var(--border)`, texte `var(--ink)`. À appliquer : convives et foyers de « Qui vient ? », mois de prescription, type de repas de la feuille IA, et toute grille ou puce de sélection restante. `aria-pressed` (ou `role="radio"` + `aria-checked` pour un choix unique) conservé.
- [ ] **Step 2 : verdicts** — couleur actuelle conservée (olive pâle / lin pressé / rouge pâle + filet), plus `IconCheck` quand choisi ; jamais de rouge plein.
- [ ] **Step 3 : petites corrections** — `FeuilleFoyer` : défaut `'lagon'` ; Réglages : pastilles d'icône de la racine en `var(--surface-elevated)` + icône `var(--primary-ink)` ; bandeau d'exemples : « Commencer avec mes proches » en bouton secondaire (fond `var(--surface-elevated)`, filet `var(--border)`, texte `var(--ink)`) ; toute taille ≤ 12 px → `text-[13px]`.
- [ ] **Step 4 : focus clavier** — dans `src/index.css`, `@layer base { :focus-visible { outline: 2px solid var(--primary-ink); outline-offset: 2px; } }` ; retirer les `focus-visible:outline-*` devenus redondants de `CarteInvitation.tsx`.
- [ ] **Step 5 : valider** — lint, test, build ; navigateur clair et sombre : « Qui vient ? » sans olive pour la sélection ; Tab au clavier montre le contour safran brûlé sur boutons et puces, pas sur les titres `h1[data-titre-vue]` ni les champs (qui gardent leur filet) ; un seul bouton safran visible sur l'onglet Invitations avec le bandeau d'exemples ; `grep -rn "text-\[1[012]px\]" src` ne renvoie rien.
- [ ] **Step 6 : commit** — `fix(design): un seul état « choisi », une action safran, focus conforme`

---

### Task 9 : Documentation et captures du site

Spec 5.9.

**Files :**
- Modify : `CLAUDE.md` (logique métier « Contraintes », persistance : v2, migration, `preparerExport`), `DESIGN.md` (pastilles « Allergie » / « Évite », état « choisi », racine des Réglages sans « Contraintes alimentaires », ⚠ réservé, horloge pour « récent »), `README.md:16`, `site/index.html:101` (texte alternatif, si la capture change), `site/public/captures/*` via `pnpm site:captures`

- [ ] **Step 1 : mettre à jour les trois documents** (formulations courtes, dans le style existant ; garder la garantie d'anonymat du texte pour une IA telle quelle).
- [ ] **Step 2 : régénérer les captures** — `pnpm site:captures` ; relire chaque capture modifiée ; ajuster le texte alternatif de `site/index.html:101` à ce que montre la nouvelle capture (ex. « évite : lait pour Sophie, porc pour Nadia »).
- [ ] **Step 3 : valider** — `pnpm test` (inclut `site/**/*.test.ts`), `SITE_APK_FACTICE=1 pnpm site:build`.
- [ ] **Step 4 : commit** — `docs: contraintes propres à chaque personne, captures du site`

---

## Après la dernière tâche

Relecture de toute la branche (`git diff f562c5c..HEAD`) par un sous-agent en effort **high** ; suite complète `pnpm lint && pnpm test && pnpm build` ; puis `/impeccable critique src` pour comparer à 26/40.
