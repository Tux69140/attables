/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import React from 'react';
import type { NomIcone } from '../icones/donnees';
import { FoyerPictoId } from '../types/models';
import { Icone } from './Icone';

/**
 * Icônes nommées de l'appli, fines enveloppes de <Icone> (pictogrammes Lucide).
 * Les noms et tailles par défaut d'origine sont conservés pour ne pas toucher aux appels.
 */
interface IconProps {
  className?: string;
  size?: number;
}

const icone = (nom: NomIcone, tailleParDefaut: number): React.FC<IconProps> => {
  const Composant: React.FC<IconProps> = ({ size = tailleParDefaut, className = '' }) => (
    <Icone nom={nom} size={size} className={className} />
  );
  Composant.displayName = `Icon(${nom})`;
  return Composant;
};

const PICTO_FOYER: Record<FoyerPictoId, NomIcone> = {
  maison: 'house',
  coeur: 'heart',
  table: 'utensils',
  marmite: 'soup',
  verre: 'wine',
  feuille: 'leaf',
  soleil: 'sun',
  etoile: 'star',
};

export const FoyerPictoIcon: React.FC<{ picto: FoyerPictoId; size?: number; className?: string }> = ({
  picto,
  size = 24,
  className = '',
}) => <Icone nom={PICTO_FOYER[picto]} size={size} className={className} />;

export const IconCalendar = icone('calendar-days', 22);
export const IconUsers = icone('users-round', 22);
export const IconGear = icone('settings', 22);
export const IconPlus = icone('plus', 20);
export const IconSearch = icone('search', 20);
export const IconHome = icone('house', 18);
export const IconAlert = icone('triangle-alert', 20);
export const IconCheck = icone('check', 20);
export const IconArrowLeft = icone('arrow-left', 22);
export const IconChevronRight = icone('chevron-right', 18);
export const IconClose = icone('x', 20);
export const IconTrash = icone('trash-2', 18);
export const IconEdit = icone('pencil', 18);
export const IconCopy = icone('copy', 18);
export const IconShare = icone('share-2', 18);
export const IconUndo = icone('undo-2', 18);
export const IconDownload = icone('download', 18);
export const IconUpload = icone('upload', 18);
export const IconUtensils = icone('utensils', 18);
export const IconPromptExport = icone('clipboard-copy', 20);
export const IconThumbUp = icone('thumbs-up', 17);
export const IconBan = icone('ban', 17);
export const IconClock = icone('clock', 18);
export const IconShield = icone('shield-check', 20);
export const IconChevronDown = icone('chevron-down', 18);
export const IconRepeat = icone('repeat', 18);

export const IconHeart: React.FC<IconProps & { filled?: boolean }> = ({
  size = 17,
  className = '',
  filled = false,
}) => <Icone nom="heart" size={size} className={className} plein={filled} />;
