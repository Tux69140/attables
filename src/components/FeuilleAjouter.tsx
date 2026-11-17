/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import React from 'react';
import type { NomIcone } from '../icones/donnees';
import type { ContrainteTag, Convive, Foyer } from '../types/models';
import { FormulaireConvive } from './FeuilleConvive';
import { FormulaireFoyer } from './FeuilleFoyer';
import { Icone } from './Icone';
import { IconChevronRight } from './Icons';
import { BottomSheet } from './SharedUI';

/**
 * Étape du parcours « Ajouter… ». Une seule feuille sert toutes les étapes : enchaîner deux
 * feuilles distinctes ferait se croiser leurs entrées d'historique (bouton Retour d'Android).
 */
export type EtatAjout =
  | null
  | { etape: 'choix' }
  | { etape: 'foyer' }
  | { etape: 'convive'; foyerId?: string; apres?: (c: Convive) => void };

const Choix: React.FC<{ icone: NomIcone; titre: string; texte: string; onClick: () => void }> = ({
  icone,
  titre,
  texte,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full min-h-[72px] p-3.5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center gap-3.5 text-left active:scale-[0.99] transition-transform"
  >
    <span className="w-12 h-12 rounded-xl bg-[var(--indic)] text-[var(--primary-ink)] flex items-center justify-center shrink-0">
      <Icone nom={icone} size={26} />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-[16px] font-bold text-[var(--ink)]">{titre}</span>
      <span className="block text-[14px] text-[var(--ink-muted)] leading-snug">{texte}</span>
    </span>
    <IconChevronRight size={18} className="text-[var(--ink-muted)] shrink-0" />
  </button>
);

export const FeuilleAjouter: React.FC<{
  ajout: EtatAjout;
  foyers: Foyer[];
  contraintes: ContrainteTag[];
  onEtape: (etat: EtatAjout) => void;
  onEnregistrerFoyer: (f: Foyer) => void;
  onEnregistrerConvive: (c: Convive) => void;
  onFermer: () => void;
}> = ({ ajout, foyers, contraintes, onEtape, onEnregistrerFoyer, onEnregistrerConvive, onFermer }) => {
  const foyerDuMembre =
    ajout?.etape === 'convive' && ajout.foyerId ? foyers.find((f) => f.id === ajout.foyerId) : undefined;
  const titre =
    ajout?.etape === 'foyer'
      ? 'Nouveau foyer'
      : ajout?.etape === 'convive'
        ? foyerDuMembre
          ? `Membre de ${foyerDuMembre.nom}`
          : 'Nouveau convive'
        : 'Ajouter…';

  return (
    <BottomSheet open={ajout !== null} title={titre} zClass="z-[60]" onClose={onFermer}>
      {ajout?.etape === 'choix' && (
        <div className="flex flex-col gap-3">
          <Choix
            icone="user-round"
            titre="Une personne"
            texte="Un ami, un collègue, Mamie Odette… On pourra la rattacher à un foyer."
            onClick={() => onEtape({ etape: 'convive' })}
          />
          <Choix
            icone="assemblee"
            titre="Un foyer"
            texte="Une famille, un couple, des colocs : on les invite d’un seul geste."
            onClick={() => onEtape({ etape: 'foyer' })}
          />
        </div>
      )}
      {ajout?.etape === 'foyer' && <FormulaireFoyer onEnregistrer={onEnregistrerFoyer} />}
      {ajout?.etape === 'convive' && (
        <FormulaireConvive
          key={ajout.foyerId ?? 'sans-foyer'}
          foyerIdInitial={ajout.foyerId}
          foyers={foyers}
          contraintes={contraintes}
          onEnregistrer={onEnregistrerConvive}
        />
      )}
    </BottomSheet>
  );
};
