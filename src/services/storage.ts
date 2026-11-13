import { AppData, ContrainteTag, Convive, Foyer, Invitation } from '../types/models';

const STORAGE_KEY = 'attables_db_v1';
export const CURRENT_DATA_VERSION = 1;

export function getDefaultContraintes(): ContrainteTag[] {
  return [
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

  return {
    version: CURRENT_DATA_VERSION,
    foyers,
    convives,
    contraintes: getDefaultContraintes(),
    invitations,
    settings: {
      theme: 'appareil',
      prescriptionMois: 6,
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
    settings: {
      theme: keepSettings?.theme ?? 'appareil',
      prescriptionMois: keepSettings?.prescriptionMois ?? 6,
    },
  };
}

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const sample = createSampleData();
      saveAppData(sample);
      return sample;
    }
    const parsed = JSON.parse(raw);
    return migrateAndValidateAppData(parsed);
  } catch {
    const sample = createSampleData();
    saveAppData(sample);
    return sample;
  }
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Erreur lors de la sauvegarde locale :', err);
  }
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
    ? obj.contraintes.filter(
        (c): c is ContrainteTag =>
          Boolean(c && typeof c === 'object' && typeof (c as ContrainteTag).id === 'string' && typeof (c as ContrainteTag).libelle === 'string')
      )
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

  return {
    version: CURRENT_DATA_VERSION,
    foyers,
    convives,
    contraintes,
    invitations,
    settings: { theme, prescriptionMois },
  };
}
