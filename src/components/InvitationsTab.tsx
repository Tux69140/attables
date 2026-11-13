import React, { useMemo, useState } from 'react';
import {
  COURSE_KEYS,
  COURSE_LABELS,
  ContrainteTag,
  Convive,
  Invitation,
  VERDICT_LABELS,
} from '../types/models';
import { formatDateFr, normalizeForCompare } from '../utils/dishes';
import {
  IconAlert,
  IconBan,
  IconCheck,
  IconChevronRight,
  IconHeart,
  IconHome,
  IconPlus,
  IconSearch,
  IconThumbUp,
  IconUtensils,
} from './Icons';

type HostFilter = 'toutes' | 'moi' | 'autres';
type StatusFilter = 'toutes' | 'prevues' | 'realisees';

interface InvitationsTabProps {
  invitations: Invitation[];
  convivesById: Map<string, Convive>;
  contraintesById: Map<string, ContrainteTag>;
  chromeVisible?: boolean;
  onOpenNew: () => void;
  onOpenEdit: (invitation: Invitation) => void;
  onMarkRealisee: (invitationId: string) => void;
}

export const InvitationsTab: React.FC<InvitationsTabProps> = ({
  invitations,
  convivesById,
  contraintesById,
  chromeVisible = true,
  onOpenNew,
  onOpenEdit,
  onMarkRealisee,
}) => {
  const [hostFilter, setHostFilter] = useState<HostFilter>('toutes');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('toutes');
  const [searchQuery, setSearchQuery] = useState('');

  const statusCounts = useMemo(() => {
    let prevuesCount = 0;
    let realiseesCount = 0;
    for (const inv of invitations) {
      if (inv.statut === 'prevue') prevuesCount += 1;
      else realiseesCount += 1;
    }
    return { total: invitations.length, prevues: prevuesCount, realisees: realiseesCount };
  }, [invitations]);

  const filtered = useMemo(() => {
    const q = normalizeForCompare(searchQuery);

    return invitations.filter((inv) => {
      if (hostFilter === 'moi' && inv.hoteType !== 'moi') return false;
      if (hostFilter === 'autres' && inv.hoteType !== 'autre') return false;
      if (statusFilter === 'prevues' && inv.statut !== 'prevue') return false;
      if (statusFilter === 'realisees' && inv.statut !== 'realisee') return false;

      if (!q) return true;

      const titleMatch = inv.titre && normalizeForCompare(inv.titre).includes(q);
      const hostMatch = normalizeForCompare(inv.hoteLabel).includes(q);
      const dishMatch = COURSE_KEYS.some((k) => {
        const val = inv.menu[k];
        return val ? normalizeForCompare(val).includes(q) : false;
      });
      const guestMatch = inv.convivesIds.some((cid) => {
        const g = convivesById.get(cid);
        return g ? normalizeForCompare(g.nomAffiche).includes(q) : false;
      });

      return Boolean(titleMatch || hostMatch || dishMatch || guestMatch);
    });
  }, [invitations, hostFilter, statusFilter, searchQuery, convivesById]);

  const prevues = useMemo(
    () =>
      filtered
        .filter((inv) => inv.statut === 'prevue')
        .sort((a, b) => a.date.localeCompare(b.date)),
    [filtered]
  );

  const realisees = useMemo(
    () =>
      filtered
        .filter((inv) => inv.statut === 'realisee')
        .sort((a, b) => b.date.localeCompare(a.date)),
    [filtered]
  );

  const renderCard = (inv: Invitation) => {
    const guests = inv.convivesIds
      .map((id) => convivesById.get(id))
      .filter((g): g is Convive => Boolean(g));

    const hasStrictAllergy = guests.some((g) =>
      g.contraintesIds.some((cid) => contraintesById.get(cid)?.niveau === 'strict')
    );

    const dishesList = COURSE_KEYS.map((k) => ({
      key: k,
      label: COURSE_LABELS[k],
      value: inv.menu[k]?.trim(),
    })).filter((item) => Boolean(item.value));

    const guestSummary =
      guests.length > 0
        ? guests.map((g) => g.nomAffiche).join(', ')
        : 'Aucun convive sélectionné';

    return (
      <article
        key={inv.id}
        className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden transition-colors"
      >
        <button
          type="button"
          onClick={() => onOpenEdit(inv)}
          className="w-full text-left p-4 flex flex-col gap-2.5 hover:bg-[var(--surface-elevated)]/60 active:bg-[var(--surface-active)]/50 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
        >
          {/* Metadata line — clean unboxed text with separators */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-[var(--ink-muted)] tabular-nums">
              <span className="font-semibold text-[var(--ink)]">
                {formatDateFr(inv.date)}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {guests.length} {guests.length > 1 ? 'convives' : 'convive'}
              </span>
              {inv.hoteType === 'autre' && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[var(--ink)]">
                    <IconHome size={15} className="text-[var(--primary)] shrink-0" />
                    <span>Chez {inv.hoteLabel}</span>
                  </span>
                </>
              )}
            </div>
            <IconChevronRight size={18} className="text-[var(--ink-muted)] shrink-0" />
          </div>

          {/* Primary title */}
          <h3 className="font-display text-[20px] leading-snug text-[var(--ink)]">
            {inv.titre?.trim() ||
              (inv.hoteType === 'autre' ? `Repas chez ${inv.hoteLabel}` : 'Repas à la maison')}
          </h3>

          {/* Guest names */}
          <p className="text-[15px] text-[var(--ink-muted)] leading-snug">
            {guestSummary}
          </p>

          {/* Strict allergy alert indicator & Verdict (never color alone: icon + text) */}
          {(hasStrictAllergy || inv.verdict) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {hasStrictAllergy && (
                <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--error)]">
                  <IconAlert size={16} className="shrink-0" />
                  <span>Allergie stricte à table</span>
                </div>
              )}
              {inv.verdict === 'coup_de_coeur' && (
                <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--success)]">
                  <IconHeart size={15} filled className="shrink-0" />
                  <span>{VERDICT_LABELS.coup_de_coeur}</span>
                </div>
              )}
              {inv.verdict === 'bien' && (
                <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink-muted)]">
                  <IconThumbUp size={15} className="shrink-0" />
                  <span>{VERDICT_LABELS.bien}</span>
                </div>
              )}
              {inv.verdict === 'a_eviter' && (
                <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--error)]">
                  <IconBan size={15} className="shrink-0" />
                  <span>{VERDICT_LABELS.a_eviter}</span>
                </div>
              )}
            </div>
          )}

          {/* Menu preview */}
          {dishesList.length > 0 && (
            <div className="pt-2 border-t border-[var(--border)]/70 flex flex-col gap-1">
              {dishesList.map((d) => (
                <div key={d.key} className="text-[14px] flex items-baseline gap-2">
                  <span className="text-[var(--ink-muted)] font-semibold shrink-0 w-[68px]">
                    {d.label}
                  </span>
                  <span className="text-[var(--ink)] truncate">{d.value}</span>
                </div>
              ))}
            </div>
          )}
        </button>

        {/* Quick action for upcoming invitations */}
        {inv.statut === 'prevue' && (
          <div className="px-4 pb-3.5 pt-1 flex items-center justify-end border-t border-[var(--border)]/50 bg-[var(--surface-elevated)]/40">
            <button
              type="button"
              onClick={() => onMarkRealisee(inv.id)}
              className="min-h-[44px] px-4 rounded-xl bg-[var(--success-bg)] text-[var(--success)] font-semibold text-[14px] inline-flex items-center gap-2 active:scale-[0.98] transition-transform"
            >
              <IconCheck size={17} />
              <span>Passer en réalisée</span>
            </button>
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="flex flex-col gap-4 pb-28">
      {/* Filter & Search controls */}
      <div className="flex flex-col gap-3">
        <div
          className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]"
          role="tablist"
          aria-label="Filtrer par hôte"
        >
          {(
            [
              { id: 'toutes', label: 'Toutes' },
              { id: 'moi', label: 'Chez moi' },
              { id: 'autres', label: 'Chez les autres' },
            ] as const
          ).map((tab) => {
            const active = hostFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setHostFilter(tab.id)}
                className={`min-h-[44px] px-2 rounded-lg text-[14px] font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-[var(--card)] text-[var(--ink)] shadow-sm border border-[var(--border)]'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]"
          role="tablist"
          aria-label="Filtrer par statut"
        >
          {(
            [
              { id: 'toutes', label: `Toutes (${statusCounts.total})` },
              { id: 'prevues', label: `Prévues (${statusCounts.prevues})` },
              { id: 'realisees', label: `Réalisées (${statusCounts.realisees})` },
            ] as const
          ).map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatusFilter(tab.id)}
                className={`min-h-[44px] px-2 rounded-lg text-[13px] font-semibold whitespace-nowrap tabular-nums transition-colors ${
                  active
                    ? 'bg-[var(--card)] text-[var(--ink)] shadow-sm border border-[var(--border)]'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative">
          <IconSearch
            size={19}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] pointer-events-none"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un titre, un plat ou un convive…"
            aria-label="Rechercher dans les invitations"
            className="w-full min-h-[46px] pl-10 pr-4 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>

      {/* Empty state */}
      {prevues.length === 0 && realisees.length === 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-7 text-center flex flex-col items-center gap-3 mt-2">
          <div className="w-12 h-12 rounded-2xl bg-[var(--surface-elevated)] text-[var(--ink-muted)] flex items-center justify-center">
            <IconUtensils size={24} />
          </div>
          <h2 className="font-display text-xl text-[var(--ink)]">
            {invitations.length === 0
              ? 'Aucune invitation enregistrée'
              : 'Aucun résultat pour cette recherche'}
          </h2>
          <p className="text-[15px] text-[var(--ink-muted)] max-w-sm">
            {invitations.length === 0
              ? 'Préparez votre premier repas pour suivre les allergies et éviter les doublons de plats.'
              : 'Essayez un autre mot-clé ou réinitialisez le filtre ci-dessus.'}
          </p>
        </div>
      )}

      {/* Prévues section */}
      {prevues.length > 0 && (
        <section aria-labelledby="sec-prevues" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between px-0.5">
            <h2 id="sec-prevues" className="font-display text-[21px] text-[var(--ink)]">
              Prévues
            </h2>
            <span className="text-[14px] text-[var(--ink-muted)] tabular-nums">
              {prevues.length} {prevues.length > 1 ? 'repas' : 'repas'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {prevues.map(renderCard)}
          </div>
        </section>
      )}

      {/* Réalisées section */}
      {realisees.length > 0 && (
        <section aria-labelledby="sec-realisees" className="flex flex-col gap-3 mt-2">
          <div className="flex items-baseline justify-between px-0.5">
            <h2 id="sec-realisees" className="font-display text-[21px] text-[var(--ink)]">
              Réalisées
            </h2>
            <span className="text-[14px] text-[var(--ink-muted)] tabular-nums">
              {realisees.length} {realisees.length > 1 ? 'repas' : 'repas'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {realisees.map(renderCard)}
          </div>
        </section>
      )}

      {/* Floating Green CTA */}
      <div
        aria-hidden={!chromeVisible}
        className={`fixed bottom-above-nav left-0 right-0 z-30 pointer-events-none flex justify-center px-safe transition-all duration-200 ease-out ${
          chromeVisible ? 'translate-y-0 opacity-100' : 'translate-y-[160px] opacity-0'
        }`}
      >
        <div className="w-full max-w-[1080px] flex justify-end">
          <button
            type="button"
            tabIndex={chromeVisible ? 0 : -1}
            onClick={onOpenNew}
            className={`${
              chromeVisible ? 'pointer-events-auto' : 'pointer-events-none'
            } min-h-[50px] px-5 rounded-2xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold text-[15px] shadow-lg flex items-center gap-2 active:scale-[0.97] transition-transform`}
          >
            <IconPlus size={20} />
            <span className="whitespace-nowrap">Préparer une invitation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
