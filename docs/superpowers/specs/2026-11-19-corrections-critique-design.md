# Corrections de la critique impeccable — conception

- Date : 2026-11-19
- Branche : `corrections-audit` (HEAD = f562c5c)
- Références : `PRODUCT.md`, `DESIGN.md`, `CLAUDE.md`, rapport `/impeccable critique src` (26/40, 0 P0, 3 P1) enregistré dans `.impeccable/critique/2026-11-19T12-12-12Z__src.md`
- Périmètre retenu : les 3 problèmes P1 et les 2 problèmes P2 de la critique, avec les allergies en premier.

## 1. Intention

La critique a montré que la promesse centrale de `PRODUCT.md` (« une allergie stricte impossible à rater au moment de composer un menu ») a trois trous : un toucher rétrograde une allergie, on ne peut pas noter « allergique aux œufs » depuis la fiche d'une personne, un plat sans fiche ne dit rien. Elle a aussi montré qu'on perd sa saisie en quittant l'éditeur, et que le langage visuel n'applique pas toujours les règles de `DESIGN.md`.

La cause profonde des deux premiers trous est le modèle de données : aujourd'hui, une contrainte (« Arachides », « Végétarien »…) est définie **une seule fois** dans Réglages > Contraintes alimentaires, avec son niveau et ce qu'elle interdit, et chaque convive ne fait que la cocher. Changer la définition change tout le monde.

**Règle posée par l'utilisateur, qui gouverne tout le chantier : ce qu'une personne mange ou ne mange pas n'appartient qu'à elle.** Allergies, intolérances, préférences, régimes : rien n'est défini une fois pour tous. Modifier Léa ne touche jamais Marc.

## 2. Objectifs, non-objectifs, anti-objectifs

**Objectifs**
1. Chaque convive porte sa propre liste de « ce qu'il ne mange pas », chaque élément avec son niveau à lui.
2. Depuis la fiche d'une personne, on peut noter n'importe lequel des 14 allergènes réglementaires, les autres aliments de référence, un régime (pré-rempli, ajustable pour elle seule) ou un aliment libre (« Autre… »).
3. Retirer ou affaiblir une allergie d'une personne demande une confirmation qui la nomme, puis s'annule pendant 7 s.
4. Devant une tablée qui a au moins une allergie, un plat sans allergènes renseignés affiche une ligne neutre « Allergènes de ce plat non renseignés — vérifier ».
5. L'allergie s'écrit partout « Allergène — Prénom ».
6. Retour depuis l'éditeur ne perd plus rien.
7. Une seule façon de montrer « choisi », une seule action safran par écran, un focus clavier conforme, plus aucun texte sous 13 px.

**Non-objectifs**
- Les observations mineures de la critique : jargon (« annuaire », « prescription », « prompt Markdown », « pavé », « FODMAP »…), accords, `color-mix()` des modificateurs `/30` sur `var()`, en-têtes GPL manquants de 4 fichiers, fin de boucle « repas réalisé », ligne de date des cartes. Elles seront traitées à part.
- La publication : numéro de version, changelogs, APK.
- Le changement de la palette des foyers (le corail reste disponible ; seul le défaut change).

**Anti-objectifs** (échec même si tout « marche »)
- Une allergie existante perdue, affaiblie ou rendue moins visible par la migration ou par la nouvelle interface.
- Une définition commune réintroduite ailleurs (un réglage qui changerait plusieurs personnes à la fois).
- Une question bloquante à chaque sortie de l'éditeur.
- Une sauvegarde `.json` de la version actuelle qui ne se restaure plus.
- Une fonctionnalité CSS ou JS sans repli pour les anciennes WebView (`color-mix()`, `:has()` sans repli, `<dialog>`, `inert`…).

## 3. Contraintes

- `CLAUDE.md` s'applique en entier. En particulier :
  - `migrateAndValidateAppData` sert au chargement **et** à la restauration : la nouvelle structure y est normalisée et l'ancienne y est migrée. `CURRENT_DATA_VERSION` passe de 1 à 2.
  - Toute action destructrice capture un instantané et appelle `showUndo` (un seul `UndoBanner`, 7 s).
  - Toute nouvelle feuille ou modale utilise `useAndroidBack` et `usePiegeFocus`, le voile `.voile-feuille` et le panneau `.panneau-feuille`.
  - Aucune hauteur fixe d'en-tête ou de barre ; les textes essentiels passent à la ligne.
  - Mode démo : rien n'est écrit dans `localStorage`.
  - Données d'exemple reconnues par leurs identifiants fixes (`createSampleData`, `resteDesExemples`, `effacerExemples`).
  - Le texte pour une IA reste **anonymisé par défaut** (ni prénoms ni hôte), avec la même formulation de cette garantie.
  - Nouveaux fichiers source : en-tête copyright/SPDX GPL-3.0-or-later.
- `DESIGN.md` s'applique : jetons de couleur, règle du rouge réservé, safran muet, Baumans seulement sur les titres, cibles ≥ 44 px, pas de carte dans une carte, pas de filet latéral (hors filet de foyer).
- Une règle CSS globale de focus doit être écrite dans `@layer base` (Tailwind v4 range ses utilitaires dans `@layer utilities` ; une règle hors couche l'emporterait sur `focus:outline-none` des titres `h1[data-titre-vue]` et des champs).
- Validation : `pnpm lint`, `pnpm test`, `pnpm build`, puis vérification dans le navigateur (`pnpm dev`, 412 × 915, clair et sombre, police × 2).
- Aucune dépendance nouvelle, aucun réseau.

## 4. Approches envisagées et choix

| Sujet | Options | Choix de l'utilisateur |
|---|---|---|
| Protéger une allergie qu'on affaiblit | A. confirmation qui nomme, puis « Annuler » · B. « Annuler » seul · C. interdire l'affaiblissement | **A** |
| Noter une allergie depuis la fiche d'une personne | A. grille dans la fiche qui crée une contrainte commune en coulisse · B. livrer les 14 allergies par défaut · C. chaque personne porte ses propres contraintes (changement de modèle, migration) | **C**, étendu à tout : allergies, intolérances, préférences, régimes |
| Plat sans allergènes renseignés devant une tablée allergique | ligne neutre « à vérifier » · alerte ambre ou rouge · rien | **ligne neutre** |
| Dire qu'un plat n'a aucun allergène | A. tuile « Aucun de ces allergènes » · B. ligne seulement sans fiche · C. ligne tant que rien n'est coché | **A** |
| Forme de l'allergie | une forme unique « Allergène — Prénom » | **approuvé** |
| Retour dans l'éditeur | A. enregistre, puis « Annuler » · B. feuille « Enregistrer avant de quitter ? » · C. brouillon gardé de côté | **A** |
| Cohérence visuelle | application des règles de `DESIGN.md` | **approuvé** |

Pourquoi pas les autres : B (« 14 allergies par défaut ») surcharge la fiche (≈ 19 puces) et garde la définition commune ; la grille « en coulisse » garde aussi une définition commune, contraire à la règle de l'utilisateur. La feuille « Enregistrer avant de quitter ? » ajoute trois choix à chaque sortie, lourd pour un public senior ; le brouillon caché laisse croire qu'une invitation existe.

## 5. Conception décidée

### 5.1 Modèle de données (version 2)

*Choix de conception (Claude), validé par la règle de l'utilisateur :*

```ts
export type ContrainteNiveau = 'strict' | 'preference'; // affiché « Allergie » / « Évite »

/** Ce qu'une personne ne mange pas. Appartient à cette seule personne. */
export interface ContrainteConvive {
  id: string;             // 'ctr-<Date.now()>…', unique dans l'appli
  libelle: string;        // « Œufs », « Végétarienne », « Kiwi »
  niveau: ContrainteNiveau;
  allergenes: string[];   // identifiants de ALLERGENES, ou 'autre:<Libellé>' pour un aliment libre
  icone?: NomIcone;       // facultatif ; à défaut, déduit comme aujourd'hui (iconeContrainte)
}

export interface Convive {
  id: string;
  nomAffiche: string;
  foyerId?: string;
  contraintes: ContrainteConvive[];   // remplace contraintesIds
  contrainteLibre: string;
}

// AppData : le champ `contraintes: ContrainteTag[]` disparaît. version = 2.
// PlatFiche.allergenes : identifiants de ALLERGENES, ou 'autre:<Libellé>'.
// PlatFiche.sansAllergene?: boolean — vrai quand l'utilisateur a coché « Aucun de ces allergènes »
//   (exclusif : vrai seulement si `allergenes` est vide). Absent = faux.
```

- **Regroupement « par aliment »** (bandeau, carte, texte pour une IA) : par libellé de l'élément, comparé avec `normalizeForCompare`. « Végan » en allergie reste une seule entrée « Végan — Léa ». Deux libellés différents pour le même allergène (« Arachides », « Cacahuètes ») ne se regroupent pas : ce sont les mots de chaque personne. Les alertes sous un plat, elles, partent de l'allergène du plat (`conflitsPlat`). *Choix de Claude, après la relecture.*

- **Aliment libre (« Autre… »)** : identifiant `autre:` suivi du libellé tel que saisi et mis en forme (`formatDishInput` ou équivalent). Deux aliments libres sont le même si `normalizeForCompare` de leurs libellés est égal (insensible à la casse, aux accents, œ/æ). Il n'existe **aucune liste commune** : les aliments libres proposés dans une fiche de plat (ou dans « + Ajouter ») sont la réunion, sans doublon, de ceux déjà portés par des personnes ou des plats. Un aliment que plus personne ni aucun plat ne porte n'est plus proposé.
- **Correspondance plat ↔ personne** : un convive est concerné par un allergène `a` du plat si l'un de ses éléments contient `a` dans `allergenes` (comparaison normalisée pour `autre:`). Le niveau le plus fort l'emporte (une allergie bat « évite »).
- **Régimes pré-remplis** : Végétarien (viande, poissons, crustacés, mollusques) et Végan (les mêmes + œufs, lait), repris de `LIAISONS_PAR_DEFAUT`. Choisir un régime crée un élément `{ libelle: 'Végétarien', allergenes: [...] }` que l'on peut ajuster pour cette personne seule. « Sans porc », « Sans alcool », « Sans lactose » ne sont pas des régimes : ce sont les aliments Porc, Alcool, Lait avec le niveau « Évite » (pas de doublon). *Choix de Claude.*

### 5.2 Migration 1 → 2 (`migrateAndValidateAppData`)

Pour une donnée de version 1 (chargement ou restauration) :
1. Normaliser d'abord `contraintes` comme aujourd'hui (allergènes par défaut via `LIAISONS_PAR_DEFAUT` si absents).
2. Pour chaque convive, chaque `tagId` de `contraintesIds` dont la contrainte existe devient un élément `ContrainteConvive` **copié** : même libellé, même niveau, même icône, mêmes allergènes. Une contrainte sans allergène (contrainte personnelle) reçoit `allergenes: ['autre:<libellé>']`. Les identifiants inexistants sont ignorés.
3. Dans chaque fiche de plat, un identifiant de **contrainte** (avec ou sans allergènes) devient `autre:<libellé de la contrainte>`, **et** cet `autre:<libellé>` est ajouté aux `allergenes` de chaque élément migré depuis cette contrainte. On garde ainsi exactement les alertes de la v1, où `conflitsPlat` reconnaissait aussi `tag.id === a`. *Choix de Claude, après la relecture.* Les identifiants de `ALLERGENES` restent ; les inconnus sont retirés.
4. Le champ `contraintes` est retiré ; `version` passe à 2. `sansAllergene` est absent (faux) sur les fiches migrées.

Une donnée de version 2 est validée champ par champ avec des valeurs par défaut (`contraintes: []` si absent, niveau invalide → `strict` par prudence, allergènes non textuels retirés, `sansAllergene` forcé à faux si `allergenes` n'est pas vide). Les identifiants inconnus (ni `ALLERGENES` ni `autre:`) sont retirés sans erreur, ce qui ignore aussi les champs de compatibilité ci-dessous. Tests obligatoires : migration des exemples v1, d'une sauvegarde v1 avec contrainte personnelle, d'un plat citant une contrainte qui a des allergènes, d'un identifiant orphelin, et aller-retour v2.

**Compatibilité descendante de l'export.** Une sauvegarde v2 restaurée dans une ancienne version de l'appli (téléphone resté sur une version F-Droid antérieure) ferait sinon disparaître toutes les allergies sans rien dire. L'export `.json` écrit donc, en plus des champs v2, ce que lit la v1 : un `contraintes` (une contrainte par élément de personne : `id` = id de l'élément, même libellé et niveau, `allergenes` = ses identifiants de `ALLERGENES` seulement), un `contraintesIds` par convive (les id de ses éléments), et, dans chaque fiche de plat, pour chaque `autre:<libellé>`, les id des éléments de personnes qui portent ce même aliment libre. Le chargement v2 ignore ces champs. Test obligatoire : un export v2 relu par l'ancienne logique de conflits v1 donne les mêmes alertes. *Choix de Claude, après la relecture ; à retirer si l'utilisateur juge le cas trop rare.*

Les données d'exemple (`createSampleData`) sont réécrites directement en version 2, avec des identifiants fixes pour leurs éléments, et gardent les mêmes personnes et les mêmes contraintes qu'aujourd'hui.

### 5.3 Fiche d'une personne (correction 2 et correction 1)

```
Léa
─────────────────────────────────────
Ce que Léa ne mange pas
  ⚠ Arachides                 Allergie   ✕
    Lait                      Évite      ✕
    Végétarienne : viande,    Évite      ✕
      poissons, crustacés, mollusques
  [ + Ajouter ]
Note libre (goûts, précisions…)
  aide : « Une allergie ? Ajoutez-la ci-dessus pour être alerté. »
```

- Remplace la rangée de 9 puces de `FormulaireConvive` (`FeuilleConvive.tsx`).
- Chaque ligne montre le libellé (et, pour un élément à plusieurs allergènes, leur liste), son niveau en mots, et un bouton de retrait accessible (« Retirer Arachides »). Une allergie porte ⚠, le rouge plein et le mot « Allergie » ; « Évite » est en bleu de préférence. L'état n'est jamais porté par la couleur seule.
- Toucher une ligne ouvre son édition : libellé, niveau (Allergie / Évite), allergènes concernés (grille `ChoixAllergenes`). C'est l'actuel `FormulaireContrainte` des Réglages, déplacé et appliqué à l'élément de cette personne.
- **« + Ajouter »** ouvre une feuille : grille des 14 allergènes réglementaires, des autres aliments de référence (Porc, Alcool, Viande, FODMAP), des régimes (Végétarien, Végan), des aliments libres déjà connus, et un champ « Autre… ». Puis le niveau : deux grands boutons « Allergie » et « Évite », sans présélection. Un élément déjà présent n'est pas proposé deux fois. La disposition exacte est laissée au constructeur, dans les règles de `DESIGN.md`.
- **Correction 1, à l'enregistrement de la fiche** : si un élément `strict` a été retiré, est passé à « Évite », ou a perdu un allergène, une confirmation nomme la personne et ce qui change : titre « Retirer une allergie de Léa ? », texte « Les alertes ne signaleront plus : Arachides. Vous pourrez annuler juste après. », boutons « Continuer » et « Revenir à la fiche » (formulation neutre : l'appli ne connaît pas le genre des personnes, donc pas de « signalé(e) »). Après validation, enregistrement puis `showUndo` (« Fiche de Léa enregistrée »). Les autres modifications s'enregistrent sans confirmation, mais tout enregistrement de la fiche (bouton compris) affiche « Fiche de Léa enregistrée · Annuler » (décision de l'utilisateur après essai sur téléphone). La croix d'une ligne « Allergie » demande tout de suite « Retirer l'allergie Arachides de Léa ? » (« Retirer » / « Garder ») et cette allergie n'est plus redemandée à la fermeture ; la croix d'un « Évite » retire sans question.
- La même fiche sert à la création d'un convive (`FeuilleAjouter`, onglet Convives) et à sa modification.
- **Fermer la fiche ne perd rien** (même règle que l'éditeur, 5.7) : Retour, voile, Échap ou bouton Fermer sur une fiche modifiée enregistrent, puis « Annuler » (« Fiche de Léa enregistrée »). Si la fermeture affaiblirait une allergie, la confirmation de la correction 1 s'affiche d'abord ; « Continuer » enregistre et ferme, l'autre bouton ramène à la fiche. Une fiche de nouveau convive sans nom se ferme simplement. Valider la sous-feuille « + Ajouter » ou l'édition d'un élément met à jour la fiche affichée ; fermer l'édition d'un élément modifié applique ses changements à la fiche, comme ci-dessus. *Choix de Claude, après la relecture, par cohérence avec la correction 4.*
- **Échap ne ferme que la feuille du dessus.** Aujourd'hui, chaque feuille écoute Échap sur `window` (`SharedUI.tsx:52` et `:125`) : avec deux feuilles empilées, un seul Échap ferme les deux. La nouvelle sous-feuille rend ce défaut dangereux ; sa correction fait partie du chantier.

### 5.4 Réglages

- L'entrée et l'écran « Contraintes alimentaires » disparaissent (badge basculant compris). La racine passe de 6 à 5 entrées.
- Le texte de réinitialisation ne mentionne plus « les tags de contraintes par défaut ».

### 5.5 Éditeur : plat sans allergènes renseignés (correction 2)

Sous un champ du menu non vide, si la tablée choisie a au moins un élément `strict` et que le plat n'a **pas de fiche, ou une fiche sans aucun allergène coché et sans « Aucun de ces allergènes »** : une ligne neutre (fond lin, texte encre, aucune couleur de signal, aucun ⚠) « Allergènes de ce plat non renseignés — vérifier ». La toucher ouvre la fiche de ce plat (créée avec ce nom si elle n'existe pas) avec la grille des allergènes dépliée ; au retour, les alertes se recalculent.

**« Aucun de ces allergènes »** (choix de l'utilisateur) : une tuile de plus dans la grille d'allergènes de la fiche de plat (`ChoixAllergenes` en mode plat). Elle est exclusive : la cocher décoche tout le reste, cocher un allergène la décoche. Elle pose `sansAllergene: true`. `FichePlat` affiche alors « Aucun allergène » au lieu de « Non renseignés ». La grille de la fiche d'une personne ne montre pas cette tuile.

### 5.6 Forme unique de l'allergie (correction 3)

```
Carte d'invitation    ⚠ Crustacés — Paul · Arachides — Léa, Nadia
Bandeau de l'éditeur  ⚠ Crustacés — Paul · Arachides — Léa, Nadia   (inchangé)
Sous un plat          ⚠ Ce plat contient des crustacés — Paul est allergique      (rouge plein)
                        Ce plat contient du lait — Marc évite                     (bleu)
                        (plusieurs : « — Léa et Nadia sont allergiques », « — Marc et Sophie évitent »)
« La tablée »         Paul   ⚠ Crustacés
                      Léa    ⚠ Arachides  · évite : lait
                      Marc   évite : viande, poissons (végétarien)  · « pas de coriandre »
```

- Bandeau et carte : regroupés par aliment (« Arachides — Léa, Nadia »), allergies seulement. `resumeAllergiesStrictes` passe de « Crustacés (Paul) » à « Crustacés — Paul ».
- « La tablée » : une ligne par personne qui a au moins un élément ou une note ; allergies en pastilles rouges pleines (`PastilleContrainte`), « évite » en texte bleu, note libre entre guillemets. Le second grand bloc rouge (encadré dans la carte, relevé par le détecteur comme carte imbriquée) disparaît. L'état « aucune allergie ni restriction » reste.
- ⚠ est réservé aux allergies. « Servi récemment » prend l'horloge (`clock.svg` existe), en ambre, dans l'éditeur et partout où ⚠ ambre sert aujourd'hui à cela.
- Les intitulés à 12 px de l'ancien bloc disparaissent avec lui.
- Fiche convive de l'onglet Convives et cartes de foyer : les pastilles suivent la même règle (rouge plein = allergie, bleu pâle = évite).
- Texte pour une IA : allergies et « évite » regroupés par aliment avec le nombre de personnes, toujours sans prénom ; même formulation de la garantie d'anonymat.

### 5.7 Retour dans l'éditeur (correction 4)

- L'éditeur compare l'invitation qu'il enregistrerait (même construction que `handleSubmit`) à celle de départ.
- Retour (flèche et Android) : **si rien n'a changé**, ou s'il s'agit d'une nouvelle invitation **vide** (ni convive, ni plat, ni titre, ni note), fermeture simple. **Sinon**, enregistrement avec le statut actuel (une nouvelle reste « prévue », une réalisée reste « réalisée »), fermeture, puis `showUndo('Invitation enregistrée', instantané d'avant)`. « Annuler » restaure l'état d'avant (une nouvelle invitation disparaît, une modifiée revient à sa version précédente).
- « Enregistrer prévue » et « Valider réalisée » affichent le même bandeau (« Invitation enregistrée » ; « Repas enregistré comme réalisé » pour le second). *Libellés : choix de Claude.*
- Une feuille ouverte dans l'éditeur se ferme toujours en premier au Retour (pile existante inchangée).

### 5.8 Cohérence visuelle (correction 5)

- **Un seul état « choisi »** pour toute sélection : fond `var(--ink)`, texte `var(--card)`, coche ; non choisi : fond carte ou lin, filet. S'applique aux convives et aux foyers de « Qui vient ? » (aujourd'hui olive), aux mois de « prescription » (safran), au type de repas de la feuille IA (segment blanc), et à toutes les grilles et puces nouvelles. L'olive redevient réservée à « fait / réussi ».
- **Verdicts** (Coup de cœur, Bien, À éviter) : ils gardent leur couleur de sens et gagnent la coche une fois choisis. *Ajustement de Claude par rapport à la proposition orale (« fond plein ») : « À éviter » reste sur fond rouge pâle avec filet rouge, car le rouge plein est réservé aux allergies (`PRODUCT.md`, principe 1).*
- **Nouveau foyer** : couleur par défaut « lagon » au lieu de « corail » (`FeuilleFoyer.tsx`). Les foyers existants ne changent pas.
- **Réglages** : pastilles d'icône de la racine neutres (fond lin, icône safran brûlé).
- **Une action safran par écran** : « Commencer avec mes proches » (bandeau d'exemples) passe en bouton secondaire (lin, filet). Le bouton flottant reste l'action principale ; le bouton « Annuler » du bandeau reste safran (éphémère, prévu par `DESIGN.md`).
- **Focus clavier** : règle `:focus-visible` globale dans `@layer base` (contour 2 px `var(--primary-ink)`, décalage 2 px), qui ne s'applique pas aux éléments qui l'excluent volontairement (titres de vue, champs qui changent de filet).
- **Plus de texte sous 13 px** : toute classe `text-[12px]` (et inférieure) restante passe à 13 px, dont les tuiles de `ChoixAllergenes`.

### 5.9 Documentation

À mettre à jour à la fin : `CLAUDE.md` (paragraphe « Contraintes » de la logique métier, migration v2), `DESIGN.md` (pastilles, état « choisi », écran Réglages), `README.md` (ligne « tags paramétrables »), et le texte alternatif de la capture du site (`site/index.html:101`) si la capture de l'éditeur change ; régénérer les captures avec `pnpm site:captures`. *Choix de Claude.*

## 6. Laissé au constructeur

- Découpage en fichiers et noms des composants nouveaux (feuille « + Ajouter », ligne d'élément).
- Disposition de la feuille « + Ajouter » et de l'édition d'un élément, dans les règles de `DESIGN.md`.
- Ordre des tâches, sachant que la migration et le modèle passent en premier et que les tâches touchant `InvitationEditor.tsx` s'enchaînent sans parallélisme.
- Libellés secondaires non cités ici, en français courant, sans jargon.

## 7. Exécution

Toutes les tâches sont confiées à des sous-agents en effort **high**, relecture finale comprise (consigne de l'utilisateur pour ce chantier). Les tâches s'exécutent l'une après l'autre. À la fin : `pnpm lint`, `pnpm test`, `pnpm build`, vérification dans le navigateur, puis `/impeccable critique src` pour mesurer l'évolution (26/40 au départ).
