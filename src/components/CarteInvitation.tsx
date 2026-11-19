/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import React from 'react';
import { ICONE_SERVICE } from '../icones/services';
import {
  COURSE_KEYS,
  COURSE_LABELS,
  Convive,
  Invitation,
  PlatFiche,
  VERDICT_LABELS,
} from '../types/models';
import { conflitsPlat, resumeAllergiesStrictes } from '../utils/allergenes';
import { delaiRelatif, estAMarquer, formatDateCourte } from '../utils/dates';
import { aggregateConstraints } from '../utils/dishes';
import { trouverFiche } from '../utils/plats';
import { Icone } from './Icone';
import { IconAlert, IconBan, IconCheck, IconHeart, IconThumbUp } from './Icons';

const titreInvitation = (inv: Invitation) =>
  inv.titre?.trim() || (inv.hoteType === 'autre' ? `Repas chez ${inv.hoteLabel}` : 'Repas à la maison');

const lieu = (inv: Invitation) => (inv.hoteType === 'moi' ? 'Chez moi' : `Chez ${inv.hoteLabel}`);

const invites = (inv: Invitation, convivesById: Map<string, Convive>) =>
  inv.convivesIds.map((id) => convivesById.get(id)).filter((g): g is Convive => Boolean(g));

/** Carte « À venir » : allergies strictes en tête, quand, titre, qui, menu, et « Passer en réalisée » le jour venu. */
export const CarteInvitation: React.FC<{
  invitation: Invitation;
  convivesById: Map<string, Convive>;
  plats: PlatFiche[];
  aujourdHui: string;
  onOuvrir: () => void;
  onMarquerRealisee: () => void;
}> = ({ invitation: inv, convivesById, plats, aujourdHui, onOuvrir, onMarquerRealisee }) => {
  const convives = invites(inv, convivesById);
  const { strict } = aggregateConstraints(inv.convivesIds, convivesById);
  const allergies = resumeAllergiesStrictes(strict);
  const menu = COURSE_KEYS.map((k) => ({ k, plat: inv.menu[k]?.trim() })).filter(
    (m): m is { k: (typeof COURSE_KEYS)[number]; plat: string } => Boolean(m.plat)
  );
  const conflitStrict = (plat: string) => {
    const fiche = trouverFiche(plats, plat);
    return Boolean(fiche && conflitsPlat(fiche.allergenes, convives).some((c) => c.niveau === 'strict'));
  };

  return (
    <article className="carte overflow-hidden">
      <button
        type="button"
        data-focus-cle={`inv-${inv.id}`}
        onClick={onOuvrir}
        className="w-full text-left flex flex-col active:bg-[var(--surface-active)]/40 transition-colors"
      >
        {strict.length > 0 && (
          <div className="px-4 py-2 bg-[var(--alerte)] text-[var(--on-alerte)] text-[14px] font-bold flex items-center gap-2">
            <IconAlert size={16} className="shrink-0" />
            <span className="sr-only">Allergies strictes : </span>
            <span className="break-words min-w-0 flex-1">{allergies.texte}</span>
            {allergies.reste > 0 && (
              <span className="shrink-0 px-1.5 rounded-full bg-white/20 tabular-nums">+{allergies.reste}</span>
            )}
          </div>
        )}
        <div className="p-4 flex flex-col gap-1.5">
          <p className="text-[14px] text-[var(--ink-muted)] flex flex-wrap gap-x-1.5">
            <b className="text-[var(--ink)]">{formatDateCourte(inv.date)}</b>
            <b className="text-[var(--ink)]">{delaiRelatif(inv.date, aujourdHui)}</b>
            <span>· {lieu(inv)}</span>
          </p>
          <h3 className="font-display text-[20px] leading-snug text-[var(--ink)]">{titreInvitation(inv)}</h3>
          <p className="text-[15px] text-[var(--ink-muted)] leading-snug">
            {convives.length > 0 ? convives.map((g) => g.nomAffiche).join(', ') : 'Aucun convive pour l’instant'}
          </p>
          {menu.length > 0 && (
            <ul className="mt-1.5 pt-2.5 border-t border-[var(--border)] flex flex-col gap-1">
              {menu.map(({ k, plat }) => {
                const alerte = conflitStrict(plat);
                return (
                  <li key={k} className="text-[15px] text-[var(--ink)] flex items-center gap-2 min-w-0">
                    <Icone nom={ICONE_SERVICE[k]} size={17} className="text-[var(--primary-ink)] shrink-0" />
                    <span className="sr-only">{COURSE_LABELS[k]} : </span>
                    {alerte && (
                      <>
                        <IconAlert size={16} className="text-[var(--alerte)] shrink-0" />
                        <span className="sr-only">contient un allergène d’un convive, </span>
                      </>
                    )}
                    <span className={`break-words min-w-0 ${alerte ? 'font-semibold text-[var(--alerte)]' : ''}`}>{plat}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </button>
      {estAMarquer(inv, aujourdHui) && (
        <div className="px-4 py-2.5 bg-[var(--success-bg)] flex items-center justify-between gap-3">
          <span className="text-[14px] font-semibold text-[var(--success)]">Le repas a eu lieu ?</span>
          <button
            type="button"
            onClick={onMarquerRealisee}
            className="min-h-[44px] px-4 rounded-xl bg-[var(--success)] text-[var(--card)] font-semibold text-[14px] inline-flex items-center gap-2 active:scale-[0.98] transition-transform"
          >
            <IconCheck size={17} />
            Passer en réalisée
          </button>
        </div>
      )}
    </article>
  );
};

/** Carte « Réalisée », compacte : titre, date · lieu · convives, verdict. */
export const CarteRealisee: React.FC<{
  invitation: Invitation;
  convivesById: Map<string, Convive>;
  aujourdHui: string;
  onOuvrir: () => void;
}> = ({ invitation: inv, convivesById, aujourdHui, onOuvrir }) => {
  const convives = invites(inv, convivesById);
  const annee = inv.date.slice(0, 4);
  const date = formatDateCourte(inv.date) + (annee !== aujourdHui.slice(0, 4) ? ` ${annee}` : '');
  const qui =
    convives.length === 0
      ? 'personne'
      : convives.length <= 3
        ? convives.map((g) => g.nomAffiche).join(', ')
        : `${convives.length} convives`;

  return (
    <button
      type="button"
      data-focus-cle={`inv-${inv.id}`}
      onClick={onOuvrir}
      className="carte w-full text-left px-4 py-3 flex items-center gap-3 active:bg-[var(--surface-active)]/40 transition-colors"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[18px] leading-snug text-[var(--ink)] break-words min-w-0">{titreInvitation(inv)}</span>
        <span className="block text-[14px] text-[var(--ink-muted)] break-words min-w-0">
          {date} · {lieu(inv)} · {qui}
        </span>
      </span>
      {inv.verdict === 'coup_de_coeur' && (
        <span className="shrink-0 inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--success)]">
          <IconHeart size={15} filled />
          {VERDICT_LABELS.coup_de_coeur}
        </span>
      )}
      {inv.verdict === 'bien' && (
        <span className="shrink-0 inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--ink-muted)]">
          <IconThumbUp size={15} />
          {VERDICT_LABELS.bien}
        </span>
      )}
      {inv.verdict === 'a_eviter' && (
        <span className="shrink-0 inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--error)]">
          <IconBan size={15} />
          {VERDICT_LABELS.a_eviter}
        </span>
      )}
    </button>
  );
};
