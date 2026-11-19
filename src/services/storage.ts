import { ICONES, type NomIcone } from '../icones/donnees';
import {
  AppData,
  COURSE_KEYS,
  ContrainteConvive,
  ContrainteNiveau,
  Convive,
  CourseKey,
  Foyer,
  Invitation,
  PlatFiche,
} from '../types/models';
import { ALLERGENES, estAutre, idAutre, LIAISONS_PAR_DEFAUT, libelleAutre, memeAllergene } from '../utils/allergenes';
import { cleDePlat } from '../utils/plats';

const STORAGE_KEY = 'attables_db_v1';
export const CURRENT_DATA_VERSION = 2;

/** Contrainte partagée des versions 1 (`AppData.contraintes`), lue seulement pour la migration. */
interface ContrainteV1 {
  id: string;
  libelle: string;
  niveau: ContrainteNiveau;
  allergenes: string[];
  icone?: NomIcone;
}

/** Contraintes livrées avec les versions 1 : celles d'une sauvegarde v1 qui n'en contient pas. */
function contraintesV1ParDefaut(): ContrainteV1[] {
  const tags: { id: string; libelle: string; niveau: ContrainteNiveau }[] = [
    { id: 'tag-arachides', libelle: 'Arachides', niveau: 'strict' },
    { id: 'tag-fruits-coque', libelle: 'Fruits à coque', niveau: 'strict' },
    { id: 'tag-crustaces', libelle: 'Crustacés', niveau: 'strict' },
    { id: 'tag-gluten', libelle: 'Sans gluten', niveau: 'strict' },
    { id: 'tag-lactose', libelle: 'Sans lactose', niveau: 'preference' },
    { id: 'tag-vegetarien', libelle: 'Végétarien', niveau: 'preference' },
    { id: 'tag-vegan', libelle: 'Végan', niveau: 'preference' },
    { id: 'tag-sans-porc', libelle: 'Sans porc', niveau: 'preference' },
    { id: 'tag-sans-alcool', libelle: 'Sans alcool', niveau: 'preference' },
  ];
  return tags.map((t) => ({ ...t, allergenes: [...(LIAISONS_PAR_DEFAUT[t.id] ?? [])] }));
}

export function createSampleData(): AppData {
  const foyers: Foyer[] = [
    { id: 'foyer-martin', nom: 'Famille Martin', couleur: 'corail', picto: 'maison' },
    { id: 'foyer-paul-julie', nom: 'Paul & Julie', couleur: 'lagon', picto: 'table' },
    { id: 'foyer-claire-tom', nom: 'Claire & Tom', couleur: 'tournesol', picto: 'soleil' },
  ];

  const convives: Convive[] = [
    {
      id: 'conv-paul',
      nomAffiche: 'Paul',
      foyerId: 'foyer-paul-julie',
      contraintes: [{ id: 'ctr-ex-paul-crustaces', libelle: 'Crustacés', niveau: 'strict', allergenes: ['crustaces'] }],
      contrainteLibre: '',
    },
    {
      id: 'conv-julie',
      nomAffiche: 'Julie',
      foyerId: 'foyer-paul-julie',
      contraintes: [
        {
          id: 'ctr-ex-julie-vegetarien',
          libelle: 'Végétarien',
          niveau: 'preference',
          allergenes: ['viande', 'poissons', 'crustaces', 'mollusques'],
          icone: 'leaf',
        },
      ],
      contrainteLibre: 'Évite les plats trop épicés',
    },
    {
      id: 'conv-marc',
      nomAffiche: 'Marc',
      foyerId: 'foyer-martin',
      contraintes: [],
      contrainteLibre: '',
    },
    {
      id: 'conv-sophie',
      nomAffiche: 'Sophie',
      foyerId: 'foyer-martin',
      contraintes: [{ id: 'ctr-ex-sophie-lait', libelle: 'Lait', niveau: 'preference', allergenes: ['lait'] }],
      contrainteLibre: 'Fromages de chèvre/brebis tolérés',
    },
    {
      id: 'conv-lea',
      nomAffiche: 'Léa',
      foyerId: 'foyer-martin',
      contraintes: [{ id: 'ctr-ex-lea-arachides', libelle: 'Arachides', niveau: 'strict', allergenes: ['arachides'] }],
      contrainteLibre: '',
    },
    {
      id: 'conv-claire',
      nomAffiche: 'Claire',
      foyerId: 'foyer-claire-tom',
      contraintes: [{ id: 'ctr-ex-claire-alcool', libelle: 'Alcool', niveau: 'preference', allergenes: ['alcool'] }],
      contrainteLibre: '',
    },
    {
      id: 'conv-tom',
      nomAffiche: 'Tom',
      foyerId: 'foyer-claire-tom',
      contraintes: [],
      contrainteLibre: 'N’aime pas la coriandre',
    },
    {
      id: 'conv-nadia',
      nomAffiche: 'Nadia',
      contraintes: [
        { id: 'ctr-ex-nadia-porc', libelle: 'Porc', niveau: 'preference', allergenes: ['porc'] },
        { id: 'ctr-ex-nadia-fruits-a-coque', libelle: 'Fruits à coque', niveau: 'strict', allergenes: ['fruits-a-coque'] },
      ],
      contrainteLibre: '',
    },
  ];

  const invitations: Invitation[] = [
    {
      id: 'inv-1',
      statut: 'prevue',
      date: '2026-11-28',
      titre: 'Dîner d’automne',
      note: 'Vérifier le pain sans sésame ni traces d’arachides pour Léa.',
      hoteType: 'moi',
      hoteLabel: 'Moi',
      convivesIds: ['conv-marc', 'conv-sophie', 'conv-lea', 'conv-nadia'],
      menu: {
        apero: 'Velouté de potimarron en verrine',
        entree: '',
        plat: '',
        fromage: 'Chèvre cendré & Comté affiné',
        dessert: 'Poires pochées à la vanille',
      },
    },
    {
      id: 'inv-2',
      statut: 'prevue',
      date: '2026-11-15',
      titre: 'Brunch du dimanche',
      hoteType: 'autre',
      hoteLabel: 'Claire & Tom',
      hoteRefType: 'foyer',
      hoteRefId: 'foyer-claire-tom',
      convivesIds: ['conv-claire', 'conv-tom', 'conv-paul', 'conv-julie'],
      menu: {
        plat: 'Shakshuka aux herbes',
        dessert: 'Gâteau aux pommes maison',
      },
    },
    {
      id: 'inv-3',
      statut: 'realisee',
      date: '2026-10-18',
      titre: 'Soirée d’octobre',
      hoteType: 'moi',
      hoteLabel: 'Moi',
      convivesIds: ['conv-paul', 'conv-julie', 'conv-nadia'],
      verdict: 'coup_de_coeur',
      menu: {
        apero: 'Houmous de betterave & gressins',
        entree: 'Salade Niçoise',
        plat: 'Lasagnes aux légumes grillés',
        dessert: 'Mousse au chocolat noir',
      },
      menuVerdicts: {
        plat: 'coup_de_coeur',
        dessert: 'bien',
      },
    },
    {
      id: 'inv-4',
      statut: 'realisee',
      date: '2026-09-12',
      titre: 'Anniversaire de Paul',
      hoteType: 'autre',
      hoteLabel: 'Paul & Julie',
      hoteRefType: 'foyer',
      hoteRefId: 'foyer-paul-julie',
      convivesIds: ['conv-paul', 'conv-julie', 'conv-marc', 'conv-sophie'],
      verdict: 'bien',
      menu: {
        apero: 'Gougères au comté',
        plat: 'Risotto aux cèpes',
        fromage: 'Brie de Meaux',
        dessert: 'Tarte Tatin',
      },
      menuVerdicts: {
        plat: 'bien',
        dessert: 'coup_de_coeur',
      },
    },
    {
      id: 'inv-5',
      statut: 'realisee',
      date: '2025-05-10',
      titre: 'Dîner de printemps',
      hoteType: 'moi',
      hoteLabel: 'Moi',
      convivesIds: ['conv-marc', 'conv-sophie', 'conv-lea', 'conv-claire', 'conv-tom'],
      verdict: 'coup_de_coeur',
      menu: {
        apero: 'Tapenade d’olives noires',
        entree: 'Gaspacho de tomates anciennes',
        plat: 'Poulet rôti au citron & pommes grenaille',
        dessert: 'Salade de fraises à la menthe',
      },
      menuVerdicts: {
        entree: 'a_eviter',
        plat: 'coup_de_coeur',
      },
    },
  ];

  // Deux idées jamais servies et la fiche d'un plat déjà servi (Mousse, inv-3).
  const plats: PlatFiche[] = [
    { id: 'plat-exemple-pot-au-feu', libelle: 'Pot-au-feu', services: ['plat'], allergenes: ['viande', 'celeri'] },
    { id: 'plat-exemple-cervelle-canut', libelle: 'Cervelle de canut', services: ['apero'], allergenes: ['lait'] },
    { id: 'plat-exemple-mousse', libelle: 'Mousse au chocolat noir', services: ['dessert'], allergenes: ['oeufs', 'lait'] },
  ];

  return {
    version: CURRENT_DATA_VERSION,
    foyers,
    convives,
    invitations,
    plats,
    settings: {
      theme: 'appareil',
      prescriptionMois: 6,
      accueilVu: true,
    },
  };
}

export function createEmptyData(keepSettings?: Partial<AppData['settings']>): AppData {
  return {
    version: CURRENT_DATA_VERSION,
    foyers: [],
    convives: [],
    invitations: [],
    plats: [],
    settings: {
      theme: keepSettings?.theme ?? 'appareil',
      prescriptionMois: keepSettings?.prescriptionMois ?? 6,
      accueilVu: keepSettings?.accueilVu ?? false,
    },
  };
}

// Mode « démo » : copie publiée sur le site de présentation. Les exemples sont
// rechargés à chaque visite et rien n'est écrit dans localStorage.
// Chaînage optionnel : import.meta.env est indéfini sous Node (tests).
export const MODE_DEMO: boolean = import.meta.env?.MODE === 'demo';

export function creerStockage(demo: boolean): {
  charger(): AppData;
  enregistrer(data: AppData): void;
} {
  function enregistrer(data: AppData): void {
    if (demo) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Erreur lors de la sauvegarde locale :', err);
    }
  }

  function charger(): AppData {
    if (demo) {
      // La démo s'ouvre toujours en thème clair, quel que soit l'appareil.
      const exemple = createSampleData();
      return { ...exemple, settings: { ...exemple.settings, theme: 'clair' } };
    }
    // Nouvelle installation, ou stockage illisible : carnet vide, présentation à afficher.
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const vide = createEmptyData();
        enregistrer(vide);
        return vide;
      }
      const parsed = JSON.parse(raw);
      return migrateAndValidateAppData(parsed);
    } catch {
      const vide = createEmptyData();
      enregistrer(vide);
      return vide;
    }
  }

  return { charger, enregistrer };
}

const stockage = creerStockage(MODE_DEMO);

export function loadAppData(): AppData {
  return stockage.charger();
}

export function saveAppData(data: AppData): void {
  stockage.enregistrer(data);
}

export function migrateAndValidateAppData(input: unknown): AppData {
  if (!input || typeof input !== 'object') {
    throw new Error('Fichier de sauvegarde invalide.');
  }
  const obj = input as Record<string, unknown>;

  if (!Array.isArray(obj.foyers) || !Array.isArray(obj.convives) || !Array.isArray(obj.invitations)) {
    throw new Error('Structure de sauvegarde incomplète (foyers, convives ou invitations manquants).');
  }

  const foyers: Foyer[] = obj.foyers.filter(
    (f): f is Foyer =>
      Boolean(f && typeof f === 'object' && typeof (f as Foyer).id === 'string' && typeof (f as Foyer).nom === 'string')
  );

  // Version 2 ou plus récente (fichier d'une version future) : validée comme la v2, sans erreur,
  // pour ne pas jeter en silence les contraintes par personne. Sinon : migration depuis la v1.
  const v2OuPlus = typeof obj.version === 'number' && obj.version >= 2;
  const { convives, plats } = v2OuPlus ? validerV2(obj) : migrerV1(obj);

  const invitations: Invitation[] = obj.invitations
    .filter(
      (inv): inv is Invitation =>
        Boolean(inv && typeof inv === 'object' && typeof (inv as Invitation).id === 'string' && typeof (inv as Invitation).date === 'string')
    )
    .map((inv) => ({
      ...inv,
      statut: inv.statut === 'realisee' ? 'realisee' : 'prevue',
      hoteType: inv.hoteType === 'autre' ? 'autre' : 'moi',
      hoteLabel: typeof inv.hoteLabel === 'string' ? inv.hoteLabel : 'Moi',
      convivesIds: Array.isArray(inv.convivesIds) ? inv.convivesIds : [],
      menu: inv.menu && typeof inv.menu === 'object' ? inv.menu : {},
    }));

  const rawSettings = (obj.settings && typeof obj.settings === 'object' ? obj.settings : {}) as Record<string, unknown>;
  const theme =
    rawSettings.theme === 'clair' || rawSettings.theme === 'sombre' || rawSettings.theme === 'appareil'
      ? rawSettings.theme
      : 'appareil';
  const rawMois = Number(rawSettings.prescriptionMois);
  const prescriptionMois =
    Number.isFinite(rawMois) && rawMois >= 1 && rawMois <= 60 ? Math.round(rawMois) : 6;
  // Absent : données d'avant la 0.3.0, la présentation n'a pas à être revue.
  const accueilVu = typeof rawSettings.accueilVu === 'boolean' ? rawSettings.accueilVu : true;

  return {
    version: CURRENT_DATA_VERSION,
    foyers,
    convives,
    invitations,
    plats,
    settings: { theme, prescriptionMois, accueilVu },
  };
}

/**
 * Sauvegarde `.json` lisible aussi par les versions 1 de l'appli : en plus des champs v2,
 * une contrainte partagée par élément de personne (`contraintes`), les `contraintesIds` de
 * chaque convive et, dans chaque fiche de plat, les éléments qui portent ses aliments libres.
 * Le chargement v2 ignore ces ajouts.
 */
export function preparerExport(data: AppData): Record<string, unknown> {
  const elements = data.convives.flatMap((c) => c.contraintes);
  return {
    ...data,
    contraintes: elements.map((e) => ({
      id: e.id,
      libelle: e.libelle,
      niveau: e.niveau,
      allergenes: e.allergenes.filter((a) => !estAutre(a)),
      ...(e.icone ? { icone: e.icone } : {}),
    })),
    convives: data.convives.map((c) => ({ ...c, contraintesIds: c.contraintes.map((e) => e.id) })),
    plats: data.plats.map((p) => {
      const allergenes = [...p.allergenes];
      for (const a of p.allergenes) {
        if (!estAutre(a)) continue;
        for (const e of elements) {
          if (e.allergenes.some((x) => memeAllergene(x, a)) && !allergenes.includes(e.id)) allergenes.push(e.id);
        }
      }
      return { ...p, allergenes };
    }),
  };
}

const chaines = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

const estObjet = (v: unknown): v is Record<string, unknown> => Boolean(v && typeof v === 'object');

const iconeValide = (v: unknown): NomIcone | undefined =>
  typeof v === 'string' && Object.prototype.hasOwnProperty.call(ICONES, v) ? (v as NomIcone) : undefined;

/** Identifiant de ALLERGENES, ou aliment libre au libellé non vide. */
const allergeneValide = (id: string): boolean =>
  ALLERGENES.some((a) => a.id === id) || (estAutre(id) && libelleAutre(id).trim() !== '');

/** Allergènes valides, sans doublon (le premier vu est gardé). */
function allergenesValides(v: unknown): string[] {
  const res: string[] = [];
  for (const id of chaines(v)) {
    if (allergeneValide(id) && !res.some((x) => memeAllergene(x, id))) res.push(id);
  }
  return res;
}

/** Convive valide, construit champ par champ (aucune clé à valeur `undefined`). */
function lireConvive(brut: Record<string, unknown>, contraintes: ContrainteConvive[]): Convive {
  return {
    id: brut.id as string,
    nomAffiche: brut.nomAffiche as string,
    ...(typeof brut.foyerId === 'string' ? { foyerId: brut.foyerId } : {}),
    contraintes,
    contrainteLibre: typeof brut.contrainteLibre === 'string' ? brut.contrainteLibre : '',
  };
}

const convivesBruts = (obj: Record<string, unknown>): Record<string, unknown>[] =>
  (obj.convives as unknown[]).filter(
    (c): c is Record<string, unknown> => estObjet(c) && typeof c.id === 'string' && typeof c.nomAffiche === 'string'
  );

/** Version 2 : chaque champ validé, valeurs par défaut ; les champs de compatibilité v1 sont ignorés. */
function validerV2(obj: Record<string, unknown>): { convives: Convive[]; plats: PlatFiche[] } {
  const convives = convivesBruts(obj).map((brut) => {
    const contraintes: ContrainteConvive[] = (Array.isArray(brut.contraintes) ? brut.contraintes : [])
      .filter(
        (e): e is Record<string, unknown> =>
          estObjet(e) && typeof e.id === 'string' && typeof e.libelle === 'string' && e.libelle.trim() !== ''
      )
      .map((e) => {
        const icone = iconeValide(e.icone);
        return {
          id: e.id as string,
          libelle: e.libelle as string,
          // Niveau inconnu : allergie, par prudence.
          niveau: e.niveau === 'preference' ? 'preference' : 'strict',
          allergenes: allergenesValides(e.allergenes),
          ...(icone ? { icone } : {}),
        };
      });
    return lireConvive(brut, contraintes);
  });
  return { convives, plats: normaliserPlats(obj.plats, allergenesValides) };
}

/** Pictogrammes que les versions 1 déduisaient de l'identifiant des régimes livrés. */
const ICONE_V1: Partial<Record<string, NomIcone>> = { 'tag-vegetarien': 'leaf', 'tag-vegan': 'sprout' };

/**
 * Version 1 : chaque contrainte partagée citée par un convive devient un élément copié pour lui ;
 * une contrainte sans allergène devient l'aliment libre de son libellé. Une contrainte citée par
 * une fiche de plat y devient aussi cet aliment libre, ajouté aux éléments qui en viennent.
 */
function migrerV1(obj: Record<string, unknown>): { convives: Convive[]; plats: PlatFiche[] } {
  const contraintes: ContrainteV1[] = Array.isArray(obj.contraintes)
    ? obj.contraintes
        .filter((c): c is Record<string, unknown> => estObjet(c) && typeof c.id === 'string' && typeof c.libelle === 'string')
        .map(normaliserContrainteV1)
    : contraintesV1ParDefaut();
  const parId = new Map(contraintes.map((t) => [t.id, t]));
  // Éléments créés pour chaque contrainte : ceux qui reçoivent l'aliment libre d'une fiche de plat.
  const elementsParTag = new Map<string, ContrainteConvive[]>();

  const convives = convivesBruts(obj).map((brut) => {
    const elements: ContrainteConvive[] = [];
    for (const tagId of new Set(chaines(brut.contraintesIds))) {
      const tag = parId.get(tagId);
      if (!tag || !tag.libelle.trim()) continue;
      const allergenes = tag.allergenes.filter((a) => ALLERGENES.some((r) => r.id === a));
      const icone = tag.icone ?? ICONE_V1[tag.id];
      const element: ContrainteConvive = {
        id: `ctr-${brut.id as string}-${tag.id}`,
        libelle: tag.libelle,
        niveau: tag.niveau,
        allergenes: allergenes.length > 0 ? allergenes : [idAutre(tag.libelle)],
        ...(icone ? { icone } : {}),
      };
      elements.push(element);
      elementsParTag.set(tag.id, [...(elementsParTag.get(tag.id) ?? []), element]);
    }
    return lireConvive(brut, elements);
  });

  const allergenesPlat = (v: unknown): string[] => {
    const res: string[] = [];
    for (const id of chaines(v)) {
      const tag = parId.get(id);
      let a: string | undefined;
      if (tag && tag.libelle.trim()) {
        a = idAutre(tag.libelle);
        for (const element of elementsParTag.get(tag.id) ?? []) {
          if (!element.allergenes.some((x) => memeAllergene(x, a!))) element.allergenes.push(a);
        }
      } else if (allergeneValide(id)) {
        a = id;
      }
      if (a && !res.some((x) => memeAllergene(x, a!))) res.push(a);
    }
    return res;
  };

  return { convives, plats: normaliserPlats(obj.plats, allergenesPlat) };
}

/** Liaisons absentes (données d'avant la 0.3.0) : celles par défaut ; pictogramme inconnu retiré. */
function normaliserContrainteV1(brut: Record<string, unknown>): ContrainteV1 {
  const id = brut.id as string;
  const icone = iconeValide(brut.icone);
  return {
    id,
    libelle: brut.libelle as string,
    niveau: brut.niveau === 'strict' ? 'strict' : 'preference',
    allergenes: Array.isArray(brut.allergenes) ? chaines(brut.allergenes) : [...(LIAISONS_PAR_DEFAUT[id] ?? [])],
    ...(icone ? { icone } : {}),
  };
}

/**
 * Fiches valides seulement : nom non vide, au moins un service connu, une fiche par nom normalisé.
 * « Aucun de ces allergènes » n'est gardé que sur une fiche sans allergène.
 */
function normaliserPlats(v: unknown, lireAllergenes: (v: unknown) => string[]): PlatFiche[] {
  if (!Array.isArray(v)) return [];
  const vus = new Set<string>();
  const plats: PlatFiche[] = [];
  for (const p of v) {
    if (!estObjet(p)) continue;
    if (typeof p.id !== 'string' || typeof p.libelle !== 'string') continue;
    const cle = cleDePlat(p.libelle);
    if (!cle || vus.has(cle)) continue;
    const services = chaines(p.services).filter((s): s is CourseKey => (COURSE_KEYS as string[]).includes(s));
    if (services.length === 0) continue;
    vus.add(cle);
    const allergenes = lireAllergenes(p.allergenes);
    const sansAllergene = p.sansAllergene === true && allergenes.length === 0;
    plats.push({ id: p.id, libelle: p.libelle, services, allergenes, ...(sansAllergene ? { sansAllergene } : {}) });
  }
  return plats;
}
