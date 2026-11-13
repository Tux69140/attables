export type FoyerColorId =
  | 'corail'
  | 'tournesol'
  | 'abricot'
  | 'pomme'
  | 'lagon'
  | 'ciel'
  | 'framboise'
  | 'lilas';

export type FoyerPictoId =
  | 'maison'
  | 'coeur'
  | 'table'
  | 'feuille'
  | 'soleil'
  | 'verre'
  | 'etoile'
  | 'marmite';

export interface FoyerColorOption {
  id: FoyerColorId;
  label: string;
  hex: string;
}

export const FOYER_COLORS: FoyerColorOption[] = [
  { id: 'corail', label: 'Corail', hex: '#FF7A5C' },
  { id: 'tournesol', label: 'Tournesol', hex: '#FFC93C' },
  { id: 'abricot', label: 'Abricot', hex: '#FF9F45' },
  { id: 'pomme', label: 'Pomme', hex: '#8CCB4E' },
  { id: 'lagon', label: 'Lagon', hex: '#2BBFB0' },
  { id: 'ciel', label: 'Ciel', hex: '#5AA9FF' },
  { id: 'framboise', label: 'Framboise', hex: '#F0598A' },
  { id: 'lilas', label: 'Lilas', hex: '#A98BF0' },
];

export const FOYER_PICTOS: { id: FoyerPictoId; label: string }[] = [
  { id: 'maison', label: 'Maison' },
  { id: 'table', label: 'Table' },
  { id: 'coeur', label: 'Cœur' },
  { id: 'marmite', label: 'Marmite' },
  { id: 'verre', label: 'Convivial' },
  { id: 'feuille', label: 'Nature' },
  { id: 'soleil', label: 'Soleil' },
  { id: 'etoile', label: 'Étoile' },
];

export function getFoyerColorHex(colorId: FoyerColorId): string {
  return FOYER_COLORS.find((c) => c.id === colorId)?.hex ?? '#FF7A5C';
}

export interface Foyer {
  id: string;
  nom: string;
  couleur: FoyerColorId;
  picto: FoyerPictoId;
}

export type ContrainteNiveau = 'strict' | 'preference';

export interface ContrainteTag {
  id: string;
  libelle: string;
  niveau: ContrainteNiveau;
}

export interface Convive {
  id: string;
  nomAffiche: string;
  foyerId?: string;
  contraintesIds: string[];
  contrainteLibre: string;
}

export type InvitationStatut = 'prevue' | 'realisee';
export type HoteType = 'moi' | 'autre';
export type CourseKey = 'apero' | 'entree' | 'plat' | 'fromage' | 'dessert';

export const COURSE_LABELS: Record<CourseKey, string> = {
  apero: 'Apéro',
  entree: 'Entrée',
  plat: 'Plat',
  fromage: 'Fromage',
  dessert: 'Dessert',
};

export const COURSE_KEYS: CourseKey[] = ['apero', 'entree', 'plat', 'fromage', 'dessert'];

export interface MenuCourses {
  apero?: string;
  entree?: string;
  plat?: string;
  fromage?: string;
  dessert?: string;
}

export type DishVerdict = 'coup_de_coeur' | 'bien' | 'a_eviter';

export const VERDICT_LABELS: Record<DishVerdict, string> = {
  coup_de_coeur: 'Coup de cœur',
  bien: 'Bien',
  a_eviter: 'À éviter',
};

export interface Invitation {
  id: string;
  statut: InvitationStatut;
  date: string; // YYYY-MM-DD
  titre?: string;
  note?: string;
  hoteType: HoteType;
  hoteLabel: string;
  hoteRefType?: 'foyer' | 'convive';
  hoteRefId?: string;
  convivesIds: string[];
  menu: MenuCourses;
  verdict?: DishVerdict;
  menuVerdicts?: Partial<Record<CourseKey, DishVerdict>>;
}

export type ThemeMode = 'appareil' | 'clair' | 'sombre';

export interface AppSettings {
  theme: ThemeMode;
  prescriptionMois: number;
}

export interface AppData {
  version: number;
  foyers: Foyer[];
  convives: Convive[];
  contraintes: ContrainteTag[];
  invitations: Invitation[];
  settings: AppSettings;
}

export interface UndoActionState {
  id: string;
  message: string;
  snapshot: AppData;
}
