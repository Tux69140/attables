/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import React from 'react';
import { ICONE_SERVICE } from '../icones/services';
import { COURSE_LABELS, type ContrainteTag, VERDICT_LABELS } from '../types/models';
import { ALLERGENES, iconeContrainte, libelleAllergene } from '../utils/allergenes';
import { formatJourMois, moisAvantRetour } from '../utils/dates';
import { getElapsedTimeInfo } from '../utils/dishes';
import type { PlatConnu } from '../utils/plats';
import { Icone } from './Icone';
import { IconBan, IconEdit, IconHeart, IconPlus, IconThumbUp, IconTrash } from './Icons';
import { BottomSheet } from './SharedUI';

/** Encadré d'état d'un plat, avec ce qu'il implique pour le resservir. */
const EncadreEtat: React.FC<{ plat: PlatConnu; aujourdHui: string; prescriptionMois: number }> = ({
  plat,
  aujourdHui,
  prescriptionMois,
}) => {
  const servi = plat.derniereServie ? getElapsedTimeInfo(plat.derniereServie.date, aujourdHui) : undefined;
  const [classe, texte] = (() => {
    switch (plat.etat) {
      case 'a_eviter':
        return ['bg-[var(--error-bg)] text-[var(--error)]', 'Marqué « À éviter » lors d’un repas.'];
      case 'recent': {
        const reste = moisAvantRetour(plat.derniereServie!.date, prescriptionMois, aujourdHui);
        return [
          'bg-[var(--warning-bg)] text-[var(--warning)]',
          `Servi ${servi?.label} — attendre encore ${reste} mois pour le resservir aux mêmes convives.`,
        ];
      }
      case 'peut_revenir':
        return ['bg-[var(--success-bg)] text-[var(--success)]', `Servi ${servi?.label} — peut revenir.`];
      case 'prevu':
        return [
          'bg-[var(--surface-elevated)] text-[var(--ink)]',
          `Prévu le ${plat.prevuLe ? formatJourMois(plat.prevuLe, aujourdHui) : ''} — jamais servi.`,
        ];
      default:
        return ['bg-[var(--indic)] text-[var(--primary-ink)]', 'Idée : jamais servi.'];
    }
  })();
  return (
    <div className={`px-3.5 py-2.5 rounded-xl text-[15px] font-semibold flex flex-col gap-1 ${classe}`}>
      <span>{texte}</span>
      {plat.coupDeCoeur && (
        <span className="inline-flex items-center gap-1.5 text-[var(--success)]">
          <IconHeart size={15} filled /> Coup de cœur
        </span>
      )}
    </div>
  );
};

export const FichePlat: React.FC<{
  plat: PlatConnu | null;
  aujourdHui: string;
  prescriptionMois: number;
  contraintesById: Map<string, ContrainteTag>;
  onFermer: () => void;
  onAllergenes: () => void;
  onPreparer: () => void;
  onModifier: () => void;
  onSupprimer: () => void;
}> = ({ plat, aujourdHui, prescriptionMois, contraintesById, onFermer, onAllergenes, onPreparer, onModifier, onSupprimer }) => {
  const idee = Boolean(plat && plat.apparitions.length === 0 && plat.fiche);
  return (
    <BottomSheet open={plat !== null} title={plat?.libelle ?? ''} onClose={onFermer}>
      {plat && (
        <div className="flex flex-col gap-5">
          <EncadreEtat plat={plat} aujourdHui={aujourdHui} prescriptionMois={prescriptionMois} />

          <p className="flex flex-wrap gap-x-3 gap-y-1 text-[14px] text-[var(--ink-muted)]">
            {plat.services.map((k) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <Icone nom={ICONE_SERVICE[k]} size={16} className="text-[var(--primary-ink)]" />
                {COURSE_LABELS[k]}
              </span>
            ))}
          </p>

          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-[18px] text-[var(--ink)]">Allergènes</h3>
              <button
                type="button"
                onClick={onAllergenes}
                className="min-h-[44px] px-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[14px] font-semibold text-[var(--ink)]"
              >
                {plat.allergenes.length > 0 ? 'Modifier' : 'Renseigner'}
              </button>
            </div>
            {plat.allergenes.length === 0 ? (
              <p className="text-[14px] text-[var(--ink-muted)]">Non renseignés.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {plat.allergenes.map((id) => {
                  const ref = ALLERGENES.find((a) => a.id === id);
                  const perso = contraintesById.get(id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-elevated)] text-[13px] font-semibold text-[var(--ink)]"
                    >
                      <Icone nom={ref?.icone ?? (perso ? iconeContrainte(perso) : 'tag')} size={15} className="text-[var(--primary-ink)]" />
                      {libelleAllergene(id, contraintesById)}
                    </span>
                  );
                })}
              </div>
            )}
          </section>

          {plat.apparitions.length > 0 && (
            <section className="flex flex-col gap-2">
              <h3 className="font-display text-[18px] text-[var(--ink)]">Historique</h3>
              <ul className="flex flex-col divide-y divide-[var(--border)]/70">
                {plat.apparitions.map((a) => (
                  <li key={`${a.invitationId}-${a.course}`} className="px-3.5 py-2.5 flex items-start justify-between gap-2 text-[14px]">
                    <span className="min-w-0">
                      <span className="block font-semibold text-[var(--ink)]">
                        {formatJourMois(a.date, aujourdHui)}
                        {a.statut === 'prevue' && <span className="ml-2 text-[var(--ink-muted)] font-normal">prévu</span>}
                        <span className="font-normal text-[var(--ink-muted)]"> · {a.hoteLabel}</span>
                      </span>
                      <span className="block text-[var(--ink-muted)]">{a.convives.join(', ') || 'Aucun convive'}</span>
                    </span>
                    {a.statut === 'realisee' && a.verdict && (
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 text-[13px] font-semibold ${
                          a.verdict === 'coup_de_coeur'
                            ? 'text-[var(--success)]'
                            : a.verdict === 'a_eviter'
                              ? 'text-[var(--error)]'
                              : 'text-[var(--ink-muted)]'
                        }`}
                      >
                        {a.verdict === 'coup_de_coeur' ? <IconHeart size={14} filled /> : a.verdict === 'a_eviter' ? <IconBan size={14} /> : <IconThumbUp size={14} />}
                        {VERDICT_LABELS[a.verdict]}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <button
            type="button"
            onClick={onPreparer}
            className="min-h-[50px] w-full rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold text-[15px] inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <IconPlus size={18} />
            Préparer une invitation avec ce plat
          </button>

          {idee && (
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onModifier}
                className="flex-1 min-h-[44px] rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--ink)] font-semibold text-[14px] inline-flex items-center justify-center gap-2"
              >
                <IconEdit size={16} />
                Modifier
              </button>
              <button
                type="button"
                onClick={onSupprimer}
                className="flex-1 min-h-[44px] rounded-xl bg-[var(--error-bg)] text-[var(--error)] font-semibold text-[14px] inline-flex items-center justify-center gap-2"
              >
                <IconTrash size={16} />
                Supprimer
              </button>
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  );
};
