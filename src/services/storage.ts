import { ICONES, type NomIcone } from '../icones/donnees';
import {
  AppData,
  COURSE_KEYS,
  ContrainteNiveau,
  ContrainteTag,
  Convive,
  CourseKey,
  Foyer,
  Invitation,
  PlatFiche,
} from '../types/models';
import { LIAISONS_PAR_DEFAUT } from '../utils/allergenes';
import { cleDePlat } from '../utils/plats';

const STORAGE_KEY = 'attables_db_v1';
export const CURRENT_DATA_VERSION = 1;

export function getDefaultContraintes(): ContrainteTag[] {
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
      contraintesIds: ['tag-crustaces'],
      contrainteLibre: '',
    },
    {
      id: 'conv-julie',
      nomAffiche: 'Julie',
      foyerId: 'foyer-paul-julie',
      contraintesIds: ['tag-vegetarien'],
      contrainteLibre: 'Évite les plats trop épicés',
    },
    {
      id: 'conv-marc',
      nomAffiche: 'Marc',
      foyerId: 'foyer-martin',
      contraintesIds: [],
      contrainteLibre: '',
    },
    {
      id: 'conv-sophie',
      nomAffiche: 'Sophie',
      foyerId: 'foyer-martin',
      contraintesIds: ['tag-lactose'],
      contrainteLibre: 'Fromages de chèvre/brebis tolérés',
    },
    {
      id: 'conv-lea',
      nomAffiche: 'Léa',
      foyerId: 'foyer-martin',
      contraintesIds: ['tag-arachides'],
      contrainteLibre: '',
    },
    {
      id: 'conv-claire',
      nomAffiche: 'Claire',
      foyerId: 'foyer-claire-tom',
      contraintesIds: ['tag-sans-alcool'],
      contrainteLibre: '',
    },
    {
      id: 'conv-tom',
      nomAffiche: 'Tom',
      foyerId: 'foyer-claire-tom',
      contraintesIds: [],
      contrainteLibre: 'N’aime pas la coriandre',
    },
    {
      id: 'conv-nadia',
      nomAffiche: 'Nadia',
      contraintesIds: ['tag-sans-porc', 'tag-fruits-coque'],
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
      date: '2026-12-06',
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
    contraintes: getDefaultContraintes(),
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
    contraintes: getDefaultContraintes(),
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

  const contraintes: ContrainteTag[] = Array.isArray(obj.contraintes)
    ? obj.contraintes
        .filter(
          (c): c is ContrainteTag =>
            Boolean(c && typeof c === 'object' && typeof (c as ContrainteTag).id === 'string' && typeof (c as ContrainteTag).libelle === 'string')
        )
        .map(normaliserContrainte)
    : getDefaultContraintes();

  const foyers: Foyer[] = obj.foyers.filter(
    (f): f is Foyer =>
      Boolean(f && typeof f === 'object' && typeof (f as Foyer).id === 'string' && typeof (f as Foyer).nom === 'string')
  );

  const convives: Convive[] = obj.convives
    .filter(
      (c): c is Convive =>
        Boolean(c && typeof c === 'object' && typeof (c as Convive).id === 'string' && typeof (c as Convive).nomAffiche === 'string')
    )
    .map((c) => ({
      ...c,
      contraintesIds: Array.isArray(c.contraintesIds) ? c.contraintesIds : [],
      contrainteLibre: typeof c.contrainteLibre === 'string' ? c.contrainteLibre : '',
    }));

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
    contraintes,
    invitations,
    plats: normaliserPlats(obj.plats),
    settings: { theme, prescriptionMois, accueilVu },
  };
}

const chaines = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

/** Liaisons absentes (données d'avant la 0.3.0) : celles par défaut ; pictogramme inconnu retiré. */
function normaliserContrainte(c: ContrainteTag): ContrainteTag {
  const brut = c as unknown as Record<string, unknown>;
  const allergenes = Array.isArray(brut.allergenes)
    ? chaines(brut.allergenes)
    : [...(LIAISONS_PAR_DEFAUT[c.id] ?? [])];
  const icone =
    typeof brut.icone === 'string' && Object.prototype.hasOwnProperty.call(ICONES, brut.icone) ? (brut.icone as NomIcone) : undefined;
  return {
    id: c.id,
    libelle: c.libelle,
    niveau: c.niveau === 'strict' ? 'strict' : 'preference',
    allergenes,
    ...(icone ? { icone } : {}),
  };
}

/** Fiches valides seulement : nom non vide, au moins un service connu, une fiche par nom normalisé. */
function normaliserPlats(v: unknown): PlatFiche[] {
  if (!Array.isArray(v)) return [];
  const vus = new Set<string>();
  const plats: PlatFiche[] = [];
  for (const p of v) {
    if (!p || typeof p !== 'object') continue;
    const brut = p as Record<string, unknown>;
    if (typeof brut.id !== 'string' || typeof brut.libelle !== 'string') continue;
    const cle = cleDePlat(brut.libelle);
    if (!cle || vus.has(cle)) continue;
    const services = chaines(brut.services).filter((s): s is CourseKey => (COURSE_KEYS as string[]).includes(s));
    if (services.length === 0) continue;
    vus.add(cle);
    plats.push({ id: brut.id, libelle: brut.libelle, services, allergenes: chaines(brut.allergenes) });
  }
  return plats;
}
