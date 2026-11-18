/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import React from 'react';
import type { EtatParcours } from '../utils/parcours';
import { IconCheck, IconClose, IconPlus } from './Icons';

interface Etape {
  numero: 1 | 2 | 3;
  titre: string;
  texte: string;
  action?: { label: string; onClick: () => void };
}

/** Carte « Pour bien démarrer » : étapes faites cochées, étape courante avec son bouton, suivantes grisées. */
export const ParcoursGuide: React.FC<{
  etat: EtatParcours;
  resume: string;
  onAjouterProche: () => void;
  onPreparerInvitation: () => void;
}> = ({ etat, resume, onAjouterProche, onPreparerInvitation }) => {
  const etapes: Etape[] = [
    {
      numero: 1,
      titre: 'Ajoutez vos proches',
      texte: etat.proches ? resume : 'Une personne, ou un foyer entier (famille, couple).',
      action: { label: 'Ajouter un proche', onClick: onAjouterProche },
    },
    {
      numero: 2,
      titre: 'Préparez une invitation',
      texte: 'Cochez qui vient : allergies et plats déjà servis s’affichent.',
      action: { label: 'Préparer une invitation', onClick: onPreparerInvitation },
    },
    { numero: 3, titre: 'Après le repas', texte: '« Passer en réalisée » : Attablés retient les plats.' },
  ];
  const faite = (n: number) => (n === 1 ? etat.proches : n === 2 ? etat.invitation : etat.realisee);

  return (
    <section aria-labelledby="parcours-titre" className="carte p-4 flex flex-col gap-3.5">
      <div>
        <h2 id="parcours-titre" className="font-display text-[22px] text-[var(--ink)]">
          Pour bien démarrer
        </h2>
        {etat.etapeCourante === 1 && <p className="text-[14px] text-[var(--ink-muted)]">Trois étapes, dans l’ordre.</p>}
      </div>
      <ol className="flex flex-col gap-3.5">
        {etapes.map((e) => {
          const fait = faite(e.numero);
          const courante = etat.etapeCourante === e.numero;
          return (
            <li key={e.numero} className={`flex gap-3 items-start ${!fait && !courante ? 'opacity-55' : ''}`}>
              <span
                className={`w-8 h-8 rounded-full font-bold text-[15px] flex items-center justify-center shrink-0 ${
                  fait
                    ? 'bg-[var(--success-bg)] text-[var(--success)]'
                    : courante
                      ? 'bg-[var(--primary)] text-[var(--on-primary)]'
                      : 'bg-[var(--surface-elevated)] text-[var(--ink-muted)]'
                }`}
                aria-hidden="true"
              >
                {fait ? <IconCheck size={17} /> : e.numero}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className={`text-[16px] font-bold ${fait ? 'text-[var(--ink-muted)]' : 'text-[var(--ink)]'}`}>
                  {e.titre}
                  {fait && <span className="sr-only"> — fait</span>}
                </h3>
                <p className="text-[14px] text-[var(--ink-muted)] leading-snug">{e.texte}</p>
                {courante && e.action && (
                  <button
                    type="button"
                    onClick={e.action.onClick}
                    className="mt-2.5 min-h-[44px] px-4 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold text-[15px] inline-flex items-center gap-2 active:scale-[0.98] transition-transform"
                  >
                    <IconPlus size={18} />
                    {e.action.label}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

/** Rappel d'une ligne tant qu'aucune invitation n'est réalisée ; masquable pour la session. */
export const LigneDerniereEtape: React.FC<{ onFermer: () => void }> = ({ onFermer }) => (
  <div className="p-3 pr-1.5 rounded-2xl bg-[var(--success-bg)] flex gap-2.5 items-start">
    <span className="w-7 h-7 rounded-full bg-[var(--card)] text-[var(--success)] font-bold text-[14px] flex items-center justify-center shrink-0">
      3
    </span>
    <p className="flex-1 text-[14px] leading-snug text-[var(--ink)] pt-0.5">
      <b>Dernière étape :</b> après le repas, touchez « Passer en réalisée ». Attablés retiendra les plats servis.
    </p>
    <button
      type="button"
      onClick={onFermer}
      aria-label="Masquer ce rappel"
      className="min-h-[44px] min-w-[44px] -my-1.5 flex items-center justify-center rounded-xl text-[var(--ink-muted)]"
    >
      <IconClose size={18} />
    </button>
  </div>
);
