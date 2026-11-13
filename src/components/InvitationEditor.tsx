import React, { useEffect, useMemo, useState } from 'react';
import {
  COURSE_KEYS,
  COURSE_LABELS,
  ContrainteTag,
  Convive,
  CourseKey,
  DishVerdict,
  Foyer,
  HoteType,
  Invitation,
  InvitationStatut,
  MenuCourses,
  VERDICT_LABELS,
} from '../types/models';
import {
  AiPromptOptions,
  ConsolidatedServedDish,
  aggregateConstraints,
  buildAiPromptMarkdown,
  findDishConflicts,
  formatDateFr,
  formatDishInput,
  getDishSuggestions,
  getDishesServedToGuests,
  getTodayIso,
  normalizeForCompare,
} from '../utils/dishes';
import {
  IconAlert,
  IconArrowLeft,
  IconBan,
  IconCheck,
  IconChevronDown,
  IconClock,
  IconCopy,
  IconHeart,
  IconHome,
  IconPromptExport,
  IconRepeat,
  IconSearch,
  IconShare,
  IconThumbUp,
  IconTrash,
} from './Icons';
import { BottomSheet, ConfirmModal, FoyerTile } from './SharedUI';
import { useAndroidBack } from '../hooks/useAndroidBack';
import { useAutoHideChrome } from '../hooks/useAutoHideChrome';

interface InvitationEditorProps {
  existing?: Invitation;
  initialDraft?: Partial<Invitation>;
  allInvitations: Invitation[];
  foyers: Foyer[];
  convives: Convive[];
  convivesById: Map<string, Convive>;
  contraintesById: Map<string, ContrainteTag>;
  prescriptionMois: number;
  onSave: (invitation: Invitation) => void;
  onReinvite?: (invitation: Invitation) => void;
  onDelete?: (invitation: Invitation) => void;
  onCancel: () => void;
}

export const InvitationEditor: React.FC<InvitationEditorProps> = ({
  existing,
  initialDraft,
  allInvitations,
  foyers,
  convives,
  convivesById,
  contraintesById,
  prescriptionMois,
  onSave,
  onReinvite,
  onDelete,
  onCancel,
}) => {
  const source = existing ?? initialDraft;
  const isRealisee = existing?.statut === 'realisee';
  const [unlockedEdit, setUnlockedEdit] = useState(false);
  const isFrozen = isRealisee && !unlockedEdit;

  const [date, setDate] = useState(source?.date ?? getTodayIso());
  const chromeVisible = useAutoHideChrome(existing?.id ?? (initialDraft ? 'reinvite' : 'new'));
  const [titre, setTitre] = useState(source?.titre ?? '');
  const [note, setNote] = useState(source?.note ?? '');
  const [hoteType, setHoteType] = useState<HoteType>(source?.hoteType ?? 'moi');
  const [hoteLabel, setHoteLabel] = useState(source?.hoteLabel ?? '');
  const [hoteRefType, setHoteRefType] = useState<'foyer' | 'convive' | undefined>(
    source?.hoteRefType
  );
  const [hoteRefId, setHoteRefId] = useState<string | undefined>(source?.hoteRefId);
  const [convivesIds, setConvivesIds] = useState<string[]>(source?.convivesIds ?? []);
  const [menu, setMenu] = useState<MenuCourses>(source?.menu ?? {});
  const [verdict, setVerdict] = useState<DishVerdict | undefined>(source?.verdict);
  const [menuVerdicts, setMenuVerdicts] = useState<Partial<Record<CourseKey, DishVerdict>>>(
    source?.menuVerdicts ?? {}
  );

  // Collapsible prep sections to keep vertical scroll comfortable on mobile
  const [hostOpen, setHostOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(() => !existing && !initialDraft);
  const [dashboardOpen, setDashboardOpen] = useState(true);

  const [guestSearch, setGuestSearch] = useState('');
  const [focusedCourse, setFocusedCourse] = useState<CourseKey | null>(null);
  const [selectedDishDetail, setSelectedDishDetail] = useState<ConsolidatedServedDish | null>(null);
  const [selectedGuestDetail, setSelectedGuestDetail] = useState<Convive | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useAndroidBack(true, onCancel);

  useEffect(() => {
    window.scrollTo(0, 0);
    const nextSource = existing ?? initialDraft;
    setUnlockedEdit(false);
    setDate(nextSource?.date ?? getTodayIso());
    setTitre(nextSource?.titre ?? '');
    setNote(nextSource?.note ?? '');
    setHoteType(nextSource?.hoteType ?? 'moi');
    setHoteLabel(nextSource?.hoteLabel ?? '');
    setHoteRefType(nextSource?.hoteRefType);
    setHoteRefId(nextSource?.hoteRefId);
    setConvivesIds(nextSource?.convivesIds ?? []);
    setMenu(nextSource?.menu ?? {});
    setVerdict(nextSource?.verdict);
    setMenuVerdicts(nextSource?.menuVerdicts ?? {});
    setHostOpen(false);
    setGuestsOpen(!existing && !initialDraft);
    setDashboardOpen(true);
    setGuestSearch('');
    setSelectedDishDetail(null);
    setSelectedGuestDetail(null);
    setShowAiSheet(false);
  }, [existing, initialDraft]);

  // AI Prompt modal state (anonymized by default)
  const [showAiSheet, setShowAiSheet] = useState(false);
  const [aiOptions, setAiOptions] = useState<AiPromptOptions>({
    mealType: 'Dîner',
    seasonOrTheme: '',
    timeOrBudget: '',
    freeInstruction: '',
    anonymize: true,
  });
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  const selectedSet = useMemo(() => new Set(convivesIds), [convivesIds]);

  const selectedGuests = useMemo(
    () =>
      convivesIds
        .map((id) => convivesById.get(id))
        .filter((g): g is Convive => Boolean(g)),
    [convivesIds, convivesById]
  );

  // Live aggregated constraints
  const constraints = useMemo(
    () => aggregateConstraints(convivesIds, convivesById, contraintesById),
    [convivesIds, convivesById, contraintesById]
  );

  // Live anti-duplicate served dishes (strictly from 'realisee' invitations)
  const servedDishes = useMemo(
    () =>
      getDishesServedToGuests(
        allInvitations,
        convivesIds,
        convivesById,
        existing?.id,
        prescriptionMois
      ),
    [allInvitations, convivesIds, convivesById, existing?.id, prescriptionMois]
  );

  // Dishes eaten by a specific guest for the guest detail bottom sheet
  const guestDetailDishes = useMemo(() => {
    if (!selectedGuestDetail) return [];
    return getDishesServedToGuests(
      allInvitations,
      [selectedGuestDetail.id],
      convivesById,
      existing?.id,
      prescriptionMois
    );
  }, [selectedGuestDetail, allInvitations, convivesById, existing?.id, prescriptionMois]);

  const toggleGuest = (guestId: string) => {
    setConvivesIds((prev) =>
      prev.includes(guestId) ? prev.filter((id) => id !== guestId) : [...prev, guestId]
    );
  };

  const toggleFoyer = (foyerId: string) => {
    const members = convives.filter((c) => c.foyerId === foyerId).map((c) => c.id);
    if (members.length === 0) return;
    const allSelected = members.every((id) => selectedSet.has(id));
    if (allSelected) {
      setConvivesIds((prev) => prev.filter((id) => !members.includes(id)));
    } else {
      setConvivesIds((prev) => Array.from(new Set([...prev, ...members])));
    }
  };

  const selectFoyerAsHost = (foyer: Foyer) => {
    setHoteType('autre');
    setHoteLabel(foyer.nom);
    setHoteRefType('foyer');
    setHoteRefId(foyer.id);
    const members = convives.filter((c) => c.foyerId === foyer.id).map((c) => c.id);
    if (members.length > 0) {
      setConvivesIds((prev) => Array.from(new Set([...prev, ...members])));
    }
  };

  const selectConviveAsHost = (guest: Convive) => {
    setHoteType('autre');
    setHoteLabel(guest.nomAffiche);
    setHoteRefType('convive');
    setHoteRefId(guest.id);
    setConvivesIds((prev) => (prev.includes(guest.id) ? prev : [...prev, guest.id]));
  };

  const handleMenuChange = (course: CourseKey, value: string) => {
    setMenu((prev) => ({ ...prev, [course]: value }));
  };

  const handleMenuBlur = (course: CourseKey) => {
    const val = menu[course] ?? '';
    const formatted = formatDishInput(val);
    if (formatted !== val) {
      setMenu((prev) => ({ ...prev, [course]: formatted }));
    }
    setTimeout(() => {
      setFocusedCourse((cur) => (cur === course ? null : cur));
    }, 150);
  };

  const toggleCourseVerdict = (course: CourseKey, next: DishVerdict) => {
    setMenuVerdicts((prev) => {
      const updated = { ...prev };
      if (updated[course] === next) {
        delete updated[course];
      } else {
        updated[course] = next;
      }
      return updated;
    });
  };

  const handleSubmit = (statut: InvitationStatut) => {
    const cleanedMenu: MenuCourses = {};
    const cleanedVerdicts: Partial<Record<CourseKey, DishVerdict>> = {};
    for (const k of COURSE_KEYS) {
      const formatted = formatDishInput(menu[k] ?? '');
      if (formatted) {
        cleanedMenu[k] = formatted;
        if (menuVerdicts[k]) cleanedVerdicts[k] = menuVerdicts[k];
      }
    }

    const finalHoteLabel =
      hoteType === 'moi' ? 'Moi' : hoteLabel.trim() || 'Hôte extérieur';

    const saved: Invitation = {
      id: existing?.id ?? `inv-${Date.now()}`,
      statut,
      date: date || getTodayIso(),
      titre: titre.trim() || undefined,
      note: note.trim() || undefined,
      hoteType,
      hoteLabel: finalHoteLabel,
      hoteRefType: hoteType === 'autre' ? hoteRefType : undefined,
      hoteRefId: hoteType === 'autre' ? hoteRefId : undefined,
      convivesIds,
      menu: cleanedMenu,
      verdict,
      menuVerdicts: Object.keys(cleanedVerdicts).length > 0 ? cleanedVerdicts : undefined,
    };

    onSave(saved);
  };

  const filteredFoyers = useMemo(() => {
    const q = normalizeForCompare(guestSearch);
    if (!q) return foyers;
    return foyers.filter((f) => {
      if (normalizeForCompare(f.nom).includes(q)) return true;
      return convives.some(
        (c) => c.foyerId === f.id && normalizeForCompare(c.nomAffiche).includes(q)
      );
    });
  }, [foyers, convives, guestSearch]);

  const filteredGuests = useMemo(() => {
    const q = normalizeForCompare(guestSearch);
    const sorted = [...convives].sort((a, b) =>
      a.nomAffiche.localeCompare(b.nomAffiche, 'fr')
    );
    if (!q) return sorted;
    return sorted.filter((c) => normalizeForCompare(c.nomAffiche).includes(q));
  }, [convives, guestSearch]);

  const generatedMarkdown = useMemo(
    () =>
      buildAiPromptMarkdown({
        options: aiOptions,
        hoteType,
        hoteLabel,
        date,
        selectedGuests,
        constraints,
        servedDishes,
        currentMenu: menu,
        prescriptionMois,
      }),
    [
      aiOptions,
      hoteType,
      hoteLabel,
      date,
      selectedGuests,
      constraints,
      servedDishes,
      menu,
      prescriptionMois,
    ]
  );

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedMarkdown);
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2400);
    } catch {
      // Fallback textarea copy
      const ta = document.createElement('textarea');
      ta.value = generatedMarkdown;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2400);
    }
  };

  const handleSharePrompt = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: titre.trim() || 'Idées de menu — Attablés',
          text: generatedMarkdown,
        });
      } catch {
        // User cancelled share sheet
      }
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      {/* Top App Bar */}
      <header
        className={`fixed top-0 left-0 right-0 z-30 bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--border)] pt-safe transition-transform duration-200 ease-out ${
          chromeVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-[1080px] mx-auto px-4 h-14 grid grid-cols-[44px_1fr_44px] items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            aria-label="Retour"
            className="justify-self-start min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-xl text-[var(--ink)] hover:bg-[var(--surface-elevated)] active:scale-95 transition-transform"
          >
            <IconArrowLeft size={22} />
          </button>
          <h1 className="font-display text-[20px] text-[var(--ink)] text-center truncate px-1">
            {isRealisee
              ? 'Repas réalisé'
              : existing
              ? 'Modifier l’invitation'
              : 'Préparer une invitation'}
          </h1>
          {existing && onDelete ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              aria-label="Supprimer cette invitation"
              className="justify-self-end min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-[var(--error)] hover:bg-[var(--error-bg)] active:scale-95 transition-transform"
            >
              <IconTrash size={20} />
            </button>
          ) : (
            <div className="w-[44px]" aria-hidden="true" />
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1080px] mx-auto px-4 pt-[72px] pb-32 flex flex-col gap-5">
        {isFrozen ? (
          /* FROZEN REALISED SUMMARY (Date, Titre, Hôte, Convives read-only; notes & verdicts editable) */
          <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[14px] text-[var(--ink-muted)] tabular-nums">
                  <span className="font-semibold text-[var(--ink)]">
                    {formatDateFr(date)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[var(--ink)]">
                    <IconHome size={15} className="text-[var(--primary)] shrink-0" />
                    <span>
                      {hoteType === 'moi' ? 'Chez moi' : `Chez ${hoteLabel || 'un proche'}`}
                    </span>
                  </span>
                </div>
                <h2 className="font-display text-[21px] text-[var(--ink)] leading-snug">
                  {titre.trim() ||
                    (hoteType === 'autre' && hoteLabel
                      ? `Repas chez ${hoteLabel}`
                      : 'Repas à la maison')}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setUnlockedEdit(true)}
                className="min-h-[38px] px-3 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-[13px] font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)] shrink-0"
              >
                Corriger
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[14px] font-semibold text-[var(--ink-muted)]">
                À table ({selectedGuests.length})
              </span>
              {selectedGuests.length === 0 ? (
                <p className="text-[14px] text-[var(--ink-muted)]">
                  Aucun convive enregistré.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selectedGuests.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGuestDetail(g)}
                      className="min-h-[38px] px-3 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-[14px] font-semibold text-[var(--ink)] hover:bg-[var(--surface-active)] transition-colors"
                    >
                      {g.nomAffiche}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {constraints.strict.length > 0 && (
              <div className="px-3.5 py-2.5 rounded-xl bg-[var(--error-bg)] text-[var(--error)] text-[14px] flex items-start gap-2">
                <IconAlert size={18} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Allergies strictes : </span>
                  <span>
                    {constraints.strict
                      .map(
                        (s) =>
                          `${s.tag.libelle} (${s.guests.map((g) => g.nomAffiche).join(', ')})`
                      )
                      .join(' · ')}
                  </span>
                </div>
              </div>
            )}
          </section>
        ) : (
          <>
            {isRealisee && unlockedEdit && (
              <div className="px-3.5 py-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-between gap-2 text-[14px]">
                <span className="text-[var(--ink-muted)]">
                  Mode correction activé pour ce repas réalisé.
                </span>
                <button
                  type="button"
                  onClick={() => setUnlockedEdit(false)}
                  className="min-h-[36px] px-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--ink)] font-semibold text-[13px] shrink-0"
                >
                  Reverrouiller
                </button>
              </div>
            )}

            {/* 1. QUI REÇOIT ? (Collapsible) */}
            <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setHostOpen((v) => !v)}
                aria-expanded={hostOpen}
                className="w-full min-h-[58px] px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-[var(--surface-elevated)]/50 transition-colors"
              >
                <div className="min-w-0">
                  <h2 className="font-display text-[19px] text-[var(--ink)]">Qui reçoit ?</h2>
                  <p className="text-[14px] text-[var(--ink-muted)] truncate flex items-center gap-1.5">
                    <IconHome size={14} className="text-[var(--primary)] shrink-0" />
                    <span>
                      {hoteType === 'moi'
                        ? 'Chez moi'
                        : `Chez ${hoteLabel.trim() || 'quelqu’un d’autre'}`}
                    </span>
                  </p>
                </div>
                <IconChevronDown
                  size={18}
                  className={`text-[var(--ink-muted)] shrink-0 transition-transform duration-200 ${
                    hostOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {hostOpen && (
                <div className="px-4 pb-4 pt-1 flex flex-col gap-3.5 border-t border-[var(--border)]/70">
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setHoteType('moi');
                        setHoteLabel('Moi');
                        setHoteRefType(undefined);
                        setHoteRefId(undefined);
                      }}
                      className={`min-h-[44px] px-3 rounded-lg font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors ${
                        hoteType === 'moi'
                          ? 'bg-[var(--card)] text-[var(--ink)] shadow-sm border border-[var(--border)]'
                          : 'text-[var(--ink-muted)]'
                      }`}
                    >
                      <IconHome size={17} />
                      <span>Chez moi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHoteType('autre');
                        if (hoteLabel === 'Moi') setHoteLabel('');
                      }}
                      className={`min-h-[44px] px-3 rounded-lg font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors ${
                        hoteType === 'autre'
                          ? 'bg-[var(--card)] text-[var(--ink)] shadow-sm border border-[var(--border)]'
                          : 'text-[var(--ink-muted)]'
                      }`}
                    >
                      <span>Chez un proche</span>
                    </button>
                  </div>

                  {hoteType === 'autre' && (
                    <div className="flex flex-col gap-3">
                      <div>
                        <label
                          htmlFor="hote-label-input"
                          className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-1.5"
                        >
                          Nom de l’hôte (ou sélection rapide ci-dessous)
                        </label>
                        <input
                          id="hote-label-input"
                          type="text"
                          value={hoteLabel}
                          onChange={(e) => {
                            setHoteLabel(e.target.value);
                            setHoteRefType(undefined);
                            setHoteRefId(undefined);
                          }}
                          placeholder="Ex. Paul & Julie, Mamie Odette…"
                          className="w-full min-h-[46px] px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--primary)]"
                        />
                      </div>

                      {(foyers.length > 0 || convives.length > 0) && (
                        <div className="flex flex-col gap-2">
                          <span className="text-[13px] font-semibold text-[var(--ink-muted)]">
                            Choisir dans l’annuaire (ajoute automatiquement aux présents) :
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {foyers.map((f) => {
                              const active = hoteRefType === 'foyer' && hoteRefId === f.id;
                              return (
                                <button
                                  key={f.id}
                                  type="button"
                                  onClick={() => selectFoyerAsHost(f)}
                                  className={`min-h-[44px] px-3.5 rounded-xl border text-[14px] font-semibold flex items-center gap-2 transition-colors ${
                                    active
                                      ? 'bg-[var(--surface-active)] border-[var(--primary)] text-[var(--ink)]'
                                      : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--ink)]'
                                  }`}
                                >
                                  <IconHome size={16} className="text-[var(--primary)]" />
                                  <span>{f.nom}</span>
                                </button>
                              );
                            })}
                            {convives.map((c) => {
                              const active = hoteRefType === 'convive' && hoteRefId === c.id;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => selectConviveAsHost(c)}
                                  className={`min-h-[44px] px-3.5 rounded-xl border text-[14px] font-medium transition-colors ${
                                    active
                                      ? 'bg-[var(--surface-active)] border-[var(--primary)] text-[var(--ink)] font-semibold'
                                      : 'bg-[var(--card)] border-[var(--border)] text-[var(--ink)]'
                                  }`}
                                >
                                  {c.nomAffiche}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* 2. QUI VIENT ? (Collapsible) */}
            <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setGuestsOpen((v) => !v)}
                aria-expanded={guestsOpen}
                className="w-full min-h-[58px] px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-[var(--surface-elevated)]/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <h2 className="font-display text-[19px] text-[var(--ink)]">Qui vient ?</h2>
                    <span className="text-[14px] font-semibold text-[var(--primary)] tabular-nums">
                      {selectedGuests.length}{' '}
                      {selectedGuests.length > 1 ? 'sélectionnés' : 'sélectionné'}
                    </span>
                  </div>
                  {!guestsOpen && (
                    <p className="text-[14px] text-[var(--ink-muted)] truncate">
                      {selectedGuests.length > 0
                        ? selectedGuests.map((g) => g.nomAffiche).join(', ')
                        : 'Touchez pour choisir les convives'}
                    </p>
                  )}
                </div>
                <IconChevronDown
                  size={18}
                  className={`text-[var(--ink-muted)] shrink-0 transition-transform duration-200 ${
                    guestsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {guestsOpen && (
                <div className="px-4 pb-4 pt-3 flex flex-col gap-3.5 border-t border-[var(--border)]/70">
                  <div className="relative">
                    <IconSearch
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] pointer-events-none"
                    />
                    <input
                      type="search"
                      value={guestSearch}
                      onChange={(e) => setGuestSearch(e.target.value)}
                      placeholder="Filtrer un foyer ou un convive…"
                      aria-label="Filtrer les convives"
                      className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  {/* 1-click Foyer toggles */}
                  {filteredFoyers.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[14px] font-semibold text-[var(--ink-muted)]">
                        Par foyer (1 clic)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filteredFoyers.map((f) => {
                          const members = convives.filter((c) => c.foyerId === f.id);
                          const selectedCount = members.filter((m) => selectedSet.has(m.id)).length;
                          const allSelected =
                            members.length > 0 && selectedCount === members.length;

                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => toggleFoyer(f.id)}
                              disabled={members.length === 0}
                              className={`min-h-[56px] p-2 pr-3.5 rounded-xl border flex items-center justify-between gap-3 text-left transition-colors ${
                                allSelected
                                  ? 'bg-[var(--success-bg)] border-[var(--primary)]'
                                  : 'bg-[var(--surface-elevated)]/60 border-[var(--border)] hover:bg-[var(--surface-elevated)]'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <FoyerTile color={f.couleur} picto={f.picto} sizePx={44} />
                                <div className="min-w-0">
                                  <div className="text-[15px] font-semibold text-[var(--ink)] truncate">
                                    {f.nom}
                                  </div>
                                  <div className="text-[13px] text-[var(--ink-muted)] tabular-nums">
                                    {selectedCount}/{members.length} présents
                                  </div>
                                </div>
                              </div>
                              <div
                                className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                                  allSelected
                                    ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--on-primary)]'
                                    : 'border-[var(--outline)] bg-[var(--card)]'
                                }`}
                                aria-hidden="true"
                              >
                                {allSelected && <IconCheck size={15} />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Individual Guest toggles */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[14px] font-semibold text-[var(--ink-muted)]">
                      Convives individuels
                    </span>
                    {filteredGuests.length === 0 ? (
                      <p className="text-[14px] text-[var(--ink-muted)] py-2">
                        Aucun convive trouvé. Ajoutez des convives depuis l’onglet « Convives ».
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {filteredGuests.map((guest) => {
                          const checked = selectedSet.has(guest.id);
                          const hasStrict = guest.contraintesIds.some(
                            (cid) => contraintesById.get(cid)?.niveau === 'strict'
                          );

                          return (
                            <button
                              key={guest.id}
                              type="button"
                              onClick={() => toggleGuest(guest.id)}
                              aria-pressed={checked}
                              className={`min-h-[44px] px-3.5 rounded-xl border text-[15px] font-semibold inline-flex items-center gap-2 transition-colors ${
                                checked
                                  ? 'bg-[var(--primary)] text-[var(--on-primary)] border-[var(--primary)]'
                                  : 'bg-[var(--card)] text-[var(--ink)] border-[var(--border)] hover:bg-[var(--surface-elevated)]'
                              }`}
                            >
                              {checked && <IconCheck size={16} />}
                              <span>{guest.nomAffiche}</span>
                              {hasStrict && (
                                <IconAlert
                                  size={15}
                                  className={
                                    checked ? 'text-[var(--on-primary)]' : 'text-[var(--error)]'
                                  }
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* 3. TABLEAU DE BORD TEMPS RÉEL DE LA TABLÉE (Collapsible) */}
            <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setDashboardOpen((v) => !v)}
                aria-expanded={dashboardOpen}
                className="w-full min-h-[58px] px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-[var(--surface-elevated)]/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-[19px] text-[var(--ink)]">
                    Tableau de bord de la tablée
                  </h2>
                  {!dashboardOpen && (
                    <p className="text-[14px] text-[var(--ink-muted)] truncate tabular-nums">
                      {selectedGuests.length === 0
                        ? 'Sélectionnez des convives'
                        : `${constraints.strict.length} allergie${
                            constraints.strict.length > 1 ? 's' : ''
                          } stricte${constraints.strict.length > 1 ? 's' : ''} · ${
                            servedDishes.length
                          } plat${servedDishes.length > 1 ? 's' : ''} déjà servi${
                            servedDishes.length > 1 ? 's' : ''
                          }`}
                    </p>
                  )}
                </div>
                <IconChevronDown
                  size={18}
                  className={`text-[var(--ink-muted)] shrink-0 transition-transform duration-200 ${
                    dashboardOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {dashboardOpen && (
                <div className="px-4 pb-4 pt-3 flex flex-col gap-4 border-t border-[var(--border)]/70">
                  {selectedGuests.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {selectedGuests.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setSelectedGuestDetail(g)}
                          className="min-h-[36px] px-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-[14px] font-semibold text-[var(--ink)] hover:bg-[var(--surface-active)] transition-colors"
                          title={`Voir les plats déjà servis à ${g.nomAffiche}`}
                        >
                          {g.nomAffiche}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedGuests.length === 0 ? (
                    <p className="text-[15px] text-[var(--ink-muted)]">
                      Sélectionnez au moins un convive ci-dessus pour afficher les allergies
                      réunies et l’historique anti-doublon.
                    </p>
                  ) : (
                    <>
                      {/* Contraintes réunies */}
                      <div className="flex flex-col gap-2.5">
                        <h3 className="text-[15px] font-bold text-[var(--ink)]">
                          Contraintes réunies
                        </h3>

                        {constraints.strict.length === 0 &&
                        constraints.preferences.length === 0 &&
                        constraints.freeNotes.length === 0 ? (
                          <div className="px-3.5 py-2.5 rounded-xl bg-[var(--success-bg)] text-[var(--success)] text-[14px] font-semibold flex items-center gap-2">
                            <IconCheck size={17} />
                            <span>
                              Aucune allergie ni restriction signalée pour cette tablée.
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {constraints.strict.map(({ tag, guests }) => (
                              <div
                                key={tag.id}
                                className="px-3.5 py-2.5 rounded-xl bg-[var(--error-bg)] text-[var(--error)] flex items-start gap-2.5"
                              >
                                <IconAlert size={19} className="shrink-0 mt-0.5" />
                                <div className="text-[15px] leading-snug">
                                  <span className="font-bold">
                                    Allergie stricte · {tag.libelle}
                                  </span>
                                  <span className="mx-1.5">—</span>
                                  <span className="font-semibold">
                                    {guests.map((g) => g.nomAffiche).join(', ')}
                                  </span>
                                </div>
                              </div>
                            ))}

                            {constraints.preferences.map(({ tag, guests }) => (
                              <div
                                key={tag.id}
                                className="px-3.5 py-2 rounded-xl bg-[var(--warning-bg)] text-[var(--warning)] text-[14px] leading-snug"
                              >
                                <span className="font-bold">
                                  Préférence · {tag.libelle}
                                </span>
                                <span className="mx-1.5">—</span>
                                <span>{guests.map((g) => g.nomAffiche).join(', ')}</span>
                              </div>
                            ))}

                            {constraints.freeNotes.map(({ guest, note: freeNote }) => (
                              <div
                                key={guest.id}
                                className="px-3.5 py-2 rounded-xl bg-[var(--surface-elevated)] text-[var(--ink)] text-[14px] leading-snug border border-[var(--border)]"
                              >
                                <span className="font-semibold">{guest.nomAffiche}</span>
                                <span className="mx-1.5 text-[var(--ink-muted)]">:</span>
                                <span className="text-[var(--ink-muted)]">{freeNote}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Déjà servi à ces convives (Anti-doublon) */}
                      <div className="flex flex-col gap-2.5 pt-3 border-t border-[var(--border)]">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="text-[15px] font-bold text-[var(--ink)]">
                            Déjà servi à ces convives
                          </h3>
                          <span className="text-[13px] text-[var(--ink-muted)] tabular-nums">
                            {servedDishes.length}{' '}
                            {servedDishes.length > 1 ? 'plats réalisés' : 'plat réalisé'}
                          </span>
                        </div>

                        {servedDishes.length === 0 ? (
                          <p className="text-[14px] text-[var(--ink-muted)]">
                            Aucun repas réalisé enregistré jusqu’ici avec ces convives.
                          </p>
                        ) : (
                          <div className="flex flex-col divide-y divide-[var(--border)]/70 border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface-elevated)]/40">
                            {servedDishes.map((dish) => {
                              const latest = dish.occurrences[0];
                              const courseStr = dish.courses
                                .map((c) => COURSE_LABELS[c])
                                .join(' / ');

                              return (
                                <button
                                  key={dish.normalizedKey}
                                  type="button"
                                  onClick={() => setSelectedDishDetail(dish)}
                                  className="w-full min-h-[56px] px-3.5 py-2.5 text-left hover:bg-[var(--surface-elevated)] active:bg-[var(--surface-active)] transition-colors flex flex-col gap-1"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="text-[15px] font-semibold text-[var(--ink)]">
                                      {dish.dishLabel}{' '}
                                      <span className="font-normal text-[var(--ink-muted)]">
                                        ({courseStr})
                                      </span>
                                    </div>

                                    {dish.hasAEviter ? (
                                      <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--error)]">
                                        <IconBan size={14} />
                                        <span>À éviter</span>
                                      </span>
                                    ) : dish.isRecent ? (
                                      <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--warning)]">
                                        <IconAlert size={14} />
                                        <span>Récent ({dish.elapsedLabel})</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--success)]">
                                        <IconClock size={14} />
                                        <span>
                                          Servi {dish.elapsedLabel} — peut revenir
                                        </span>
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-x-2 text-[13px] text-[var(--ink-muted)] tabular-nums">
                                    <span>
                                      {formatDateFr(latest.date)} ·{' '}
                                      {latest.guestNames.join(', ')} · {latest.hoteLabel}
                                    </span>
                                    {dish.hasCoupDeCoeur && !dish.hasAEviter && (
                                      <span className="inline-flex items-center gap-1 font-semibold text-[var(--success)]">
                                        <IconHeart size={13} filled />
                                        <span>Coup de cœur</span>
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
          </>
        )}

        {/* 4. SAISIE DU MENU & DÉTAILS (ou Menu & Appréciations si figé) */}
        <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-[19px] text-[var(--ink)]">
              {isFrozen ? 'Menu & Appréciations' : 'Menu & Détails'}
            </h2>
            {!isRealisee && (
              <button
                type="button"
                onClick={() => setShowAiSheet(true)}
                className="min-h-[44px] px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--ink)] font-semibold text-[14px] inline-flex items-center gap-2 hover:bg-[var(--surface-active)] active:scale-[0.98] transition-transform"
              >
                <IconPromptExport size={18} className="text-[var(--primary)]" />
                <span>Copier pour une IA</span>
              </button>
            )}
          </div>

          {!isFrozen ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="inv-date"
                    className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-1"
                  >
                    Date
                  </label>
                  <input
                    id="inv-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[15px] text-[var(--ink)] tabular-nums focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="inv-titre"
                    className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-1"
                  >
                    Titre / Occasion (optionnel)
                  </label>
                  <input
                    id="inv-titre"
                    type="text"
                    value={titre}
                    onChange={(e) => setTitre(e.target.value)}
                    placeholder="Ex. Noël 2026, Anniversaire…"
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              {/* Compact Strict Allergy Reminder right above Menu fields */}
              {!isRealisee && constraints.strict.length > 0 && (
                <div className="px-3.5 py-2.5 rounded-xl bg-[var(--error-bg)] text-[var(--error)] text-[14px] flex items-start gap-2">
                  <IconAlert size={17} className="shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <span className="font-bold">Rappel allergies strictes : </span>
                    <span>
                      {constraints.strict
                        .map(
                          (s) =>
                            `${s.tag.libelle} (${s.guests.map((g) => g.nomAffiche).join(', ')})`
                        )
                        .join(' · ')}
                    </span>
                  </div>
                </div>
              )}

              {/* 5 structured menu fields */}
              <div className="flex flex-col gap-3.5 pt-1">
                {COURSE_KEYS.map((courseKey) => {
                  const value = menu[courseKey] ?? '';
                  const conflict = findDishConflicts(value, servedDishes);
                  const suggestions =
                    focusedCourse === courseKey
                      ? getDishSuggestions(allInvitations, value)
                      : [];

                  return (
                    <div key={courseKey} className="relative flex flex-col gap-1.5">
                      <label
                        htmlFor={`course-${courseKey}`}
                        className="text-[14px] font-semibold text-[var(--ink)]"
                      >
                        {COURSE_LABELS[courseKey]}
                      </label>
                      <input
                        id={`course-${courseKey}`}
                        type="text"
                        value={value}
                        onFocus={() => setFocusedCourse(courseKey)}
                        onBlur={() => handleMenuBlur(courseKey)}
                        onChange={(e) => handleMenuChange(courseKey, e.target.value)}
                        placeholder={`Saisir ${COURSE_LABELS[courseKey].toLowerCase()}…`}
                        autoComplete="off"
                        className={`w-full min-h-[46px] px-3.5 rounded-xl bg-[var(--surface-elevated)] border text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none ${
                          conflict?.hasAEviter
                            ? 'border-[var(--error)]'
                            : conflict?.isRecent
                            ? 'border-[var(--warning)]'
                            : 'border-[var(--border)] focus:border-[var(--primary)]'
                        }`}
                      />

                      {/* Autocomplete dropdown */}
                      {focusedCourse === courseKey &&
                        suggestions.length > 0 &&
                        !(
                          suggestions.length === 1 &&
                          normalizeForCompare(suggestions[0].label) ===
                            normalizeForCompare(value)
                        ) && (
                          <div className="absolute left-0 right-0 top-[74px] z-20 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden divide-y divide-[var(--border)]/60">
                            {suggestions.map((sug) => {
                              const sugConflict = findDishConflicts(sug.label, servedDishes);
                              return (
                                <button
                                  key={`${sug.label}-${sug.course}`}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleMenuChange(courseKey, formatDishInput(sug.label));
                                    setFocusedCourse(null);
                                  }}
                                  className="w-full min-h-[44px] px-3.5 py-2 text-left flex items-center justify-between gap-2 hover:bg-[var(--surface-elevated)] text-[14px]"
                                >
                                  <span className="font-medium text-[var(--ink)] truncate">
                                    {sug.label}
                                  </span>
                                  {sugConflict?.hasAEviter ? (
                                    <span className="text-[13px] text-[var(--error)] font-semibold shrink-0 flex items-center gap-1">
                                      <IconBan size={14} />
                                      <span>À éviter</span>
                                    </span>
                                  ) : sugConflict?.isRecent ? (
                                    <span className="text-[13px] text-[var(--warning)] font-semibold shrink-0 flex items-center gap-1">
                                      <IconAlert size={14} />
                                      <span>Servi récemment</span>
                                    </span>
                                  ) : sugConflict ? (
                                    <span className="text-[13px] text-[var(--success)] font-semibold shrink-0 flex items-center gap-1">
                                      <IconClock size={14} />
                                      <span>Peut revenir ({sugConflict.elapsedLabel})</span>
                                    </span>
                                  ) : (
                                    <span className="text-[13px] text-[var(--ink-muted)] shrink-0">
                                      {COURSE_LABELS[sug.course]}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}

                      {/* Immediate anti-duplicate / temporal prescription / verdict feedback */}
                      {conflict && (
                        <div
                          role="alert"
                          className={`px-3 py-2 rounded-xl text-[14px] flex items-start gap-2 ${
                            conflict.hasAEviter
                              ? 'bg-[var(--error-bg)] text-[var(--error)]'
                              : conflict.isRecent
                              ? 'bg-[var(--warning-bg)] text-[var(--warning)]'
                              : 'bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--ink-muted)]'
                          }`}
                        >
                          {conflict.hasAEviter ? (
                            <IconBan size={17} className="shrink-0 mt-0.5" />
                          ) : conflict.isRecent ? (
                            <IconAlert size={17} className="shrink-0 mt-0.5" />
                          ) : (
                            <IconClock size={17} className="shrink-0 mt-0.5 text-[var(--success)]" />
                          )}
                          <span>
                            {conflict.hasAEviter ? (
                              <>
                                <strong>Plat marqué « À éviter »</strong> — servi le{' '}
                                {formatDateFr(conflict.occurrences[0].date)} (
                                {conflict.elapsedLabel}) à{' '}
                                <strong>{conflict.allGuestNames.join(', ')}</strong>.
                              </>
                            ) : conflict.isRecent ? (
                              <>
                                <strong>Servi récemment</strong> ({conflict.elapsedLabel}, le{' '}
                                {formatDateFr(conflict.occurrences[0].date)}) à{' '}
                                <strong>{conflict.allGuestNames.join(', ')}</strong> (
                                {conflict.occurrences[0].hoteLabel}).
                              </>
                            ) : (
                              <>
                                Servi <strong>{conflict.elapsedLabel}</strong> (le{' '}
                                {formatDateFr(conflict.occurrences[0].date)}) à{' '}
                                {conflict.allGuestNames.join(', ')} —{' '}
                                <strong>peut revenir</strong>
                                {conflict.hasCoupDeCoeur ? ' (Coup de cœur)' : ''}.
                              </>
                            )}
                          </span>
                        </div>
                      )}

                      {/* Verdicts displayed ONLY on already realised invitations */}
                      {isRealisee && value.trim().length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {(
                            [
                              { id: 'coup_de_coeur', label: 'Coup de cœur', Icon: IconHeart },
                              { id: 'bien', label: 'Bien', Icon: IconThumbUp },
                              { id: 'a_eviter', label: 'À éviter', Icon: IconBan },
                            ] as const
                          ).map(({ id, label, Icon }) => {
                            const active = menuVerdicts[courseKey] === id;
                            const activeCls =
                              id === 'coup_de_coeur'
                                ? 'bg-[var(--success-bg)] border-[var(--success)] text-[var(--success)]'
                                : id === 'a_eviter'
                                ? 'bg-[var(--error-bg)] border-[var(--error)] text-[var(--error)]'
                                : 'bg-[var(--surface-active)] border-[var(--outline)] text-[var(--ink)]';
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => toggleCourseVerdict(courseKey, id)}
                                aria-pressed={active}
                                className={`min-h-[38px] px-3 rounded-lg border text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors ${
                                  active
                                    ? activeCls
                                    : 'bg-[var(--card)] border-[var(--border)] text-[var(--ink-muted)]'
                                }`}
                              >
                                <Icon size={14} />
                                <span>{label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Read-only Menu with interactive per-dish verdicts */
            <div className="flex flex-col gap-3">
              {COURSE_KEYS.filter((k) => Boolean(menu[k]?.trim())).length === 0 ? (
                <p className="text-[14px] text-[var(--ink-muted)]">
                  Aucun plat enregistré pour ce repas.
                </p>
              ) : (
                COURSE_KEYS.map((courseKey) => {
                  const dishValue = menu[courseKey]?.trim();
                  if (!dishValue) return null;
                  return (
                    <div
                      key={courseKey}
                      className="p-3 rounded-xl bg-[var(--surface-elevated)]/60 border border-[var(--border)] flex flex-col gap-2"
                    >
                      <div>
                        <span className="text-[13px] font-semibold text-[var(--ink-muted)]">
                          {COURSE_LABELS[courseKey]}
                        </span>
                        <div className="text-[16px] font-semibold text-[var(--ink)]">
                          {dishValue}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(
                          [
                            { id: 'coup_de_coeur', label: 'Coup de cœur', Icon: IconHeart },
                            { id: 'bien', label: 'Bien', Icon: IconThumbUp },
                            { id: 'a_eviter', label: 'À éviter', Icon: IconBan },
                          ] as const
                        ).map(({ id, label, Icon }) => {
                          const active = menuVerdicts[courseKey] === id;
                          const activeCls =
                            id === 'coup_de_coeur'
                              ? 'bg-[var(--success-bg)] border-[var(--success)] text-[var(--success)]'
                              : id === 'a_eviter'
                              ? 'bg-[var(--error-bg)] border-[var(--error)] text-[var(--error)]'
                              : 'bg-[var(--surface-active)] border-[var(--outline)] text-[var(--ink)]';
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => toggleCourseVerdict(courseKey, id)}
                              aria-pressed={active}
                              className={`min-h-[38px] px-3 rounded-lg border text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors ${
                                active
                                  ? activeCls
                                  : 'bg-[var(--card)] border-[var(--border)] text-[var(--ink-muted)]'
                              }`}
                            >
                              <Icon size={14} />
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Global Meal Verdict — ONLY on already realised invitations */}
          {isRealisee && (
            <div className="pt-2 border-t border-[var(--border)]/70 flex flex-col gap-2">
              <span className="text-[14px] font-semibold text-[var(--ink-muted)]">
                Ressenti global sur le repas (optionnel)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'coup_de_coeur', label: VERDICT_LABELS.coup_de_coeur, Icon: IconHeart },
                    { id: 'bien', label: VERDICT_LABELS.bien, Icon: IconThumbUp },
                    { id: 'a_eviter', label: VERDICT_LABELS.a_eviter, Icon: IconBan },
                  ] as const
                ).map(({ id, label, Icon }) => {
                  const active = verdict === id;
                  const activeCls =
                    id === 'coup_de_coeur'
                      ? 'bg-[var(--success-bg)] border-[var(--success)] text-[var(--success)]'
                      : id === 'a_eviter'
                      ? 'bg-[var(--error-bg)] border-[var(--error)] text-[var(--error)]'
                      : 'bg-[var(--surface-active)] border-[var(--outline)] text-[var(--ink)]';
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setVerdict((prev) => (prev === id ? undefined : id))}
                      aria-pressed={active}
                      className={`min-h-[44px] px-2 rounded-xl border text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                        active
                          ? activeCls
                          : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--ink-muted)]'
                      }`}
                    >
                      <Icon size={15} />
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Note libre (toujours éditable) */}
          <div>
            <label
              htmlFor="inv-note"
              className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-1"
            >
              Note libre (optionnelle)
            </label>
            <textarea
              id="inv-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                isRealisee
                  ? 'Ce qui a bien fonctionné, ajustements pour la prochaine fois…'
                  : 'Idées de vins, courses à faire, timing…'
              }
              className="w-full p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
        </section>
      </main>

      {/* Bottom Action Bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-30 bg-[var(--card)]/95 backdrop-blur-md border-t border-[var(--border)] pb-safe transition-transform duration-200 ease-out ${
          chromeVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {isRealisee ? (
          <div className="max-w-[1080px] mx-auto px-4 py-3 flex items-center gap-2.5">
            {existing && onReinvite && (
              <button
                type="button"
                onClick={() => onReinvite(existing)}
                className="flex-1 min-h-[48px] px-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--ink)] font-semibold text-[14px] flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-[0.98] transition-transform"
              >
                <IconRepeat size={17} />
                <span>Réinviter ce groupe</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSubmit('realisee')}
              className="flex-1 min-h-[48px] px-3 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold text-[14px] flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-[0.98] transition-transform"
            >
              <IconCheck size={17} />
              <span>Enregistrer</span>
            </button>
          </div>
        ) : (
          <div className="max-w-[1080px] mx-auto px-4 py-3 flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleSubmit('prevue')}
              className="flex-1 min-h-[48px] px-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--ink)] font-semibold text-[14px] whitespace-nowrap active:scale-[0.98] transition-transform"
            >
              Enregistrer prévue
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('realisee')}
              className="flex-1 min-h-[48px] px-3 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold text-[14px] flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-[0.98] transition-transform"
            >
              <IconCheck size={17} />
              <span>Valider réalisée</span>
            </button>
          </div>
        )}
      </div>

      {/* Sheet: Dish Occurrence Detail */}
      <BottomSheet
        open={Boolean(selectedDishDetail)}
        title={selectedDishDetail?.dishLabel ?? ''}
        onClose={() => setSelectedDishDetail(null)}
      >
        {selectedDishDetail && (
          <div className="flex flex-col gap-3">
            <p className="text-[14px] text-[var(--ink-muted)]">
              Historique complet de ce plat auprès des convives sélectionnés :
            </p>
            <div className="flex flex-col gap-2.5">
              {selectedDishDetail.occurrences.map((occ, idx) => (
                <div
                  key={`${occ.invitationId}-${occ.course}-${idx}`}
                  className="p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between text-[14px] font-semibold text-[var(--ink)] tabular-nums">
                    <span>{formatDateFr(occ.date)}</span>
                    <span>{COURSE_LABELS[occ.course]}</span>
                  </div>
                  <div className="text-[14px] text-[var(--ink-muted)]">
                    {occ.hoteLabel} · Avec {occ.guestNames.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Sheet: Guest Dish History Detail */}
      <BottomSheet
        open={Boolean(selectedGuestDetail)}
        title={
          selectedGuestDetail
            ? `Déjà mangé par ${selectedGuestDetail.nomAffiche}`
            : ''
        }
        onClose={() => setSelectedGuestDetail(null)}
      >
        {selectedGuestDetail && (
          <div className="flex flex-col gap-3">
            {guestDetailDishes.length === 0 ? (
              <p className="text-[15px] text-[var(--ink-muted)]">
                Aucun plat enregistré dans les repas réalisés avec{' '}
                {selectedGuestDetail.nomAffiche}.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {guestDetailDishes.map((d) => (
                  <div
                    key={d.normalizedKey}
                    className="p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex flex-col gap-0.5"
                  >
                    <div className="text-[15px] font-semibold text-[var(--ink)]">
                      {d.dishLabel}{' '}
                      <span className="font-normal text-[var(--ink-muted)]">
                        ({d.courses.map((c) => COURSE_LABELS[c]).join(' / ')})
                      </span>
                    </div>
                    <div className="text-[13px] text-[var(--ink-muted)] tabular-nums">
                      {d.occurrences
                        .map((o) => `${formatDateFr(o.date)} · ${o.hoteLabel}`)
                        .join(' ; ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      {/* Sheet: Copier pour une IA */}
      <BottomSheet
        open={showAiSheet}
        title="Copier pour une IA"
        onClose={() => setShowAiSheet(false)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[14px] font-semibold text-[var(--ink-muted)]">
              Type de repas
            </span>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
              {(['Déjeuner', 'Dîner', 'Apéro dînatoire'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAiOptions((o) => ({ ...o, mealType: t }))}
                  className={`min-h-[42px] px-2 rounded-lg text-[13px] font-semibold transition-colors ${
                    aiOptions.mealType === t
                      ? 'bg-[var(--card)] text-[var(--ink)] border border-[var(--border)] shadow-sm'
                      : 'text-[var(--ink-muted)]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="ai-season"
                className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-1"
              >
                Saison ou thème
              </label>
              <input
                id="ai-season"
                type="text"
                value={aiOptions.seasonOrTheme}
                onChange={(e) =>
                  setAiOptions((o) => ({ ...o, seasonOrTheme: e.target.value }))
                }
                placeholder="Ex. Automne, cuisine italienne…"
                className="w-full min-h-[44px] px-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[14px] text-[var(--ink)]"
              />
            </div>
            <div>
              <label
                htmlFor="ai-budget"
                className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-1"
              >
                Temps / budget souhaité
              </label>
              <input
                id="ai-budget"
                type="text"
                value={aiOptions.timeOrBudget}
                onChange={(e) =>
                  setAiOptions((o) => ({ ...o, timeOrBudget: e.target.value }))
                }
                placeholder="Ex. Préparable la veille, budget modéré"
                className="w-full min-h-[44px] px-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[14px] text-[var(--ink)]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="ai-free"
              className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-1"
            >
              Consigne libre
            </label>
            <textarea
              id="ai-free"
              rows={2}
              value={aiOptions.freeInstruction}
              onChange={(e) =>
                setAiOptions((o) => ({ ...o, freeInstruction: e.target.value }))
              }
              placeholder="Ex. Un plat mijoté convivial, pas de friture…"
              className="w-full p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[14px] text-[var(--ink)]"
            />
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={aiOptions.anonymize}
            onClick={() =>
              setAiOptions((o) => ({ ...o, anonymize: !o.anonymize }))
            }
            className="min-h-[48px] px-3.5 py-2 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-between gap-3 text-left"
          >
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-[var(--ink)]">
                Anonymiser les convives
              </div>
              <div className="text-[13px] text-[var(--ink-muted)]">
                Remplace les prénoms par le nombre de personnes
              </div>
            </div>
            <div
              className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                aiOptions.anonymize ? 'bg-[var(--primary)]' : 'bg-[var(--outline)]'
              }`}
              aria-hidden="true"
            >
              <div
                className={`w-5 h-5 rounded-full bg-[var(--card)] transition-transform ${
                  aiOptions.anonymize ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>

          <div>
            <span className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-1">
              Aperçu du prompt Markdown
            </span>
            <pre className="p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[13px] text-[var(--ink)] whitespace-pre-wrap font-sans max-h-52 overflow-y-auto leading-relaxed">
              {generatedMarkdown}
            </pre>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="flex-1 min-h-[48px] px-4 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              {copiedFeedback ? <IconCheck size={18} /> : <IconCopy size={18} />}
              <span>
                {copiedFeedback ? 'Copié dans le presse-papier !' : 'Copier dans le presse-papier'}
              </span>
            </button>
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                type="button"
                onClick={handleSharePrompt}
                className="min-h-[48px] px-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--ink)] font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <IconShare size={18} />
                <span>Partager</span>
              </button>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={showDeleteConfirm}
        title="Supprimer cette invitation ?"
        description={`L’invitation ${
          titre.trim() ? `« ${titre.trim()} »` : `du ${formatDateFr(date)}`
        } sera supprimée. Vous pourrez annuler juste après.`}
        confirmLabel="Supprimer l’invitation"
        onConfirm={() => {
          setShowDeleteConfirm(false);
          if (existing && onDelete) onDelete(existing);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
