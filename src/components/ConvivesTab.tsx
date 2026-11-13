import React, { useMemo, useState } from 'react';
import {
  COURSE_LABELS,
  ContrainteTag,
  Convive,
  FOYER_COLORS,
  FOYER_PICTOS,
  Foyer,
  FoyerColorId,
  FoyerPictoId,
  Invitation,
  VERDICT_LABELS,
} from '../types/models';
import {
  formatDateFr,
  getDishesServedToGuests,
  normalizeForCompare,
} from '../utils/dishes';
import {
  FoyerPictoIcon,
  IconAlert,
  IconBan,
  IconCheck,
  IconChevronRight,
  IconEdit,
  IconHeart,
  IconHome,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUsers,
} from './Icons';
import { BottomSheet, ConfirmModal, FoyerTile } from './SharedUI';

interface ConvivesTabProps {
  foyers: Foyer[];
  convives: Convive[];
  contraintes: ContrainteTag[];
  invitations: Invitation[];
  contraintesById: Map<string, ContrainteTag>;
  convivesById: Map<string, Convive>;
  prescriptionMois: number;
  chromeVisible?: boolean;
  onSaveFoyer: (foyer: Foyer) => void;
  onDeleteFoyer: (foyerId: string) => void;
  onSaveConvive: (convive: Convive) => void;
  onDeleteConvive: (conviveId: string) => void;
}

export const ConvivesTab: React.FC<ConvivesTabProps> = ({
  foyers,
  convives,
  contraintes,
  invitations,
  contraintesById,
  convivesById,
  prescriptionMois,
  chromeVisible = true,
  onSaveFoyer,
  onDeleteFoyer,
  onSaveConvive,
  onDeleteConvive,
}) => {
  const [search, setSearch] = useState('');

  // Foyer form state
  const [foyerSheetOpen, setFoyerSheetOpen] = useState(false);
  const [editingFoyer, setEditingFoyer] = useState<Foyer | null>(null);
  const [foyerNom, setFoyerNom] = useState('');
  const [foyerCouleur, setFoyerCouleur] = useState<FoyerColorId>('corail');
  const [foyerPicto, setFoyerPicto] = useState<FoyerPictoId>('maison');

  // Convive form state
  const [conviveSheetOpen, setConviveSheetOpen] = useState(false);
  const [editingConvive, setEditingConvive] = useState<Convive | null>(null);
  const [conviveNom, setConviveNom] = useState('');
  const [conviveFoyerId, setConviveFoyerId] = useState<string>('');
  const [conviveTags, setConviveTags] = useState<string[]>([]);
  const [conviveLibre, setConviveLibre] = useState('');

  // Guest profile sheet
  const [viewedConvive, setViewedConvive] = useState<Convive | null>(null);

  // Confirm delete states
  const [confirmDeleteConvive, setConfirmDeleteConvive] = useState<Convive | null>(null);
  const [confirmDeleteFoyer, setConfirmDeleteFoyer] = useState<Foyer | null>(null);

  const openNewFoyer = () => {
    setEditingFoyer(null);
    setFoyerNom('');
    setFoyerCouleur('corail');
    setFoyerPicto('maison');
    setFoyerSheetOpen(true);
  };

  const openEditFoyer = (foyer: Foyer) => {
    setEditingFoyer(foyer);
    setFoyerNom(foyer.nom);
    setFoyerCouleur(foyer.couleur);
    setFoyerPicto(foyer.picto);
    setFoyerSheetOpen(true);
  };

  const handleSaveFoyerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foyerNom.trim()) return;
    onSaveFoyer({
      id: editingFoyer?.id ?? `foyer-${Date.now()}`,
      nom: foyerNom.trim(),
      couleur: foyerCouleur,
      picto: foyerPicto,
    });
    setFoyerSheetOpen(false);
  };

  const openNewConvive = (preselectedFoyerId?: string) => {
    setEditingConvive(null);
    setConviveNom('');
    setConviveFoyerId(preselectedFoyerId ?? '');
    setConviveTags([]);
    setConviveLibre('');
    setConviveSheetOpen(true);
  };

  const openEditConvive = (convive: Convive) => {
    setEditingConvive(convive);
    setConviveNom(convive.nomAffiche);
    setConviveFoyerId(convive.foyerId ?? '');
    setConviveTags([...convive.contraintesIds]);
    setConviveLibre(convive.contrainteLibre);
    setConviveSheetOpen(true);
  };

  const handleSaveConviveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!conviveNom.trim()) return;
    const saved: Convive = {
      id: editingConvive?.id ?? `conv-${Date.now()}`,
      nomAffiche: conviveNom.trim(),
      foyerId: conviveFoyerId || undefined,
      contraintesIds: conviveTags,
      contrainteLibre: conviveLibre.trim(),
    };
    onSaveConvive(saved);
    if (viewedConvive?.id === saved.id) {
      setViewedConvive(saved);
    }
    setConviveSheetOpen(false);
  };

  const toggleTagInForm = (tagId: string) => {
    setConviveTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const queryNorm = normalizeForCompare(search);

  const groupedFoyers = useMemo(() => {
    return foyers
      .map((foyer) => {
        const members = convives
          .filter((c) => c.foyerId === foyer.id)
          .sort((a, b) => a.nomAffiche.localeCompare(b.nomAffiche, 'fr'));
        const foyerMatches = !queryNorm || normalizeForCompare(foyer.nom).includes(queryNorm);
        const matchingMembers = foyerMatches
          ? members
          : members.filter((m) => normalizeForCompare(m.nomAffiche).includes(queryNorm));
        return {
          foyer,
          members: matchingMembers,
          totalMembers: members.length,
          visible: foyerMatches || matchingMembers.length > 0,
        };
      })
      .filter((item) => item.visible);
  }, [foyers, convives, queryNorm]);

  const ungroupedGuests = useMemo(() => {
    const foyerIds = new Set(foyers.map((f) => f.id));
    return convives
      .filter((c) => !c.foyerId || !foyerIds.has(c.foyerId))
      .filter((c) => !queryNorm || normalizeForCompare(c.nomAffiche).includes(queryNorm))
      .sort((a, b) => a.nomAffiche.localeCompare(b.nomAffiche, 'fr'));
  }, [convives, foyers, queryNorm]);

  // Viewed convive history
  const viewedHistory = useMemo(() => {
    if (!viewedConvive) return { meals: [], dishes: [] };
    const meals = invitations
      .filter((inv) => inv.convivesIds.includes(viewedConvive.id))
      .sort((a, b) => b.date.localeCompare(a.date));
    const dishes = getDishesServedToGuests(
      invitations,
      [viewedConvive.id],
      convivesById,
      undefined,
      prescriptionMois
    );
    return { meals, dishes };
  }, [viewedConvive, invitations, convivesById, prescriptionMois]);

  const countInvitationsForConvive = (conviveId: string) =>
    invitations.filter((inv) => inv.convivesIds.includes(conviveId)).length;

  const countMembersInFoyer = (foyerId: string) =>
    convives.filter((c) => c.foyerId === foyerId).length;

  const renderConviveRow = (guest: Convive) => {
    const strictTags = guest.contraintesIds
      .map((id) => contraintesById.get(id))
      .filter((t): t is ContrainteTag => Boolean(t && t.niveau === 'strict'));
    const prefTags = guest.contraintesIds
      .map((id) => contraintesById.get(id))
      .filter((t): t is ContrainteTag => Boolean(t && t.niveau === 'preference'));

    const summaryParts: string[] = [
      ...strictTags.map((t) => t.libelle),
      ...prefTags.map((t) => t.libelle),
    ];
    if (guest.contrainteLibre.trim()) summaryParts.push(guest.contrainteLibre.trim());

    return (
      <button
        key={guest.id}
        type="button"
        onClick={() => setViewedConvive(guest)}
        className="w-full min-h-[56px] px-4 py-3 text-left flex items-center justify-between gap-3 hover:bg-[var(--surface-elevated)]/70 active:bg-[var(--surface-active)]/50 transition-colors"
      >
        <div className="min-w-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[16px] font-semibold text-[var(--ink)] truncate">
              {guest.nomAffiche}
            </span>
            {strictTags.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--error)] shrink-0">
                <IconAlert size={14} />
                <span>Allergie</span>
              </span>
            )}
          </div>
          {summaryParts.length > 0 ? (
            <p className="text-[14px] text-[var(--ink-muted)] truncate">
              {summaryParts.join(' · ')}
            </p>
          ) : (
            <p className="text-[14px] text-[var(--ink-muted)]">Aucune contrainte</p>
          )}
        </div>
        <IconChevronRight size={18} className="text-[var(--ink-muted)] shrink-0" />
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4 pb-36">
      {/* Search bar */}
      <div className="relative">
        <IconSearch
          size={19}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] pointer-events-none"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un foyer ou un convive…"
          aria-label="Rechercher dans l’annuaire"
          className="w-full min-h-[46px] pl-10 pr-4 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--primary)]"
        />
      </div>

      {/* Empty State */}
      {groupedFoyers.length === 0 && ungroupedGuests.length === 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-7 text-center flex flex-col items-center gap-3 mt-2">
          <div className="w-12 h-12 rounded-2xl bg-[var(--surface-elevated)] text-[var(--ink-muted)] flex items-center justify-center">
            <IconUsers size={24} />
          </div>
          <h2 className="font-display text-xl text-[var(--ink)]">
            {foyers.length === 0 && convives.length === 0
              ? 'Annuaire vide'
              : 'Aucun convive trouvé'}
          </h2>
          <p className="text-[15px] text-[var(--ink-muted)] max-w-sm">
            {foyers.length === 0 && convives.length === 0
              ? 'Ajoutez vos proches et regroupez-les par foyer pour cocher toute une famille en un seul geste.'
              : 'Aucun foyer ni convive ne correspond à cette recherche.'}
          </p>
        </div>
      )}

      {/* Foyers list */}
      {groupedFoyers.map(({ foyer, members, totalMembers }) => (
        <section
          key={foyer.id}
          className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <FoyerTile color={foyer.couleur} picto={foyer.picto} sizePx={44} />
              <div className="min-w-0">
                <h2 className="font-display text-[19px] text-[var(--ink)] truncate">
                  {foyer.nom}
                </h2>
                <span className="text-[13px] text-[var(--ink-muted)] tabular-nums">
                  {totalMembers} {totalMembers > 1 ? 'membres' : 'membre'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => openNewConvive(foyer.id)}
                aria-label={`Ajouter un membre dans ${foyer.nom}`}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--primary)] hover:bg-[var(--surface-elevated)]"
              >
                <IconPlus size={19} />
              </button>
              <button
                type="button"
                onClick={() => openEditFoyer(foyer)}
                aria-label={`Modifier le foyer ${foyer.nom}`}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--ink-muted)] hover:bg-[var(--surface-elevated)]"
              >
                <IconEdit size={18} />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteFoyer(foyer)}
                aria-label={`Supprimer le foyer ${foyer.nom}`}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--error)] hover:bg-[var(--error-bg)]"
              >
                <IconTrash size={18} />
              </button>
            </div>
          </div>

          {members.length === 0 ? (
            <div className="px-4 py-3.5 text-[14px] text-[var(--ink-muted)]">
              Aucun membre dans ce foyer pour le moment.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]/70">
              {members.map(renderConviveRow)}
            </div>
          )}
        </section>
      ))}

      {/* Sans foyer section */}
      {ungroupedGuests.length > 0 && (
        <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-baseline justify-between">
            <h2 className="font-display text-[19px] text-[var(--ink)]">Sans foyer</h2>
            <span className="text-[13px] text-[var(--ink-muted)] tabular-nums">
              {ungroupedGuests.length}{' '}
              {ungroupedGuests.length > 1 ? 'convives' : 'convive'}
            </span>
          </div>
          <div className="divide-y divide-[var(--border)]/70">
            {ungroupedGuests.map(renderConviveRow)}
          </div>
        </section>
      )}

      {/* Floating Action Buttons (auto-hide on scroll down, reappear on slight scroll up) */}
      <div
        aria-hidden={!chromeVisible}
        className={`fixed bottom-above-nav left-0 right-0 z-30 pointer-events-none flex justify-center px-safe transition-all duration-200 ease-out ${
          chromeVisible ? 'translate-y-0 opacity-100' : 'translate-y-[160px] opacity-0'
        }`}
      >
        <div className="w-full max-w-[1080px] flex justify-end gap-2">
          <button
            type="button"
            tabIndex={chromeVisible ? 0 : -1}
            onClick={openNewFoyer}
            className={`${
              chromeVisible ? 'pointer-events-auto' : 'pointer-events-none'
            } min-h-[50px] px-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-[var(--ink)] font-semibold text-[14px] shadow-lg flex items-center gap-1.5 whitespace-nowrap active:scale-[0.97] transition-transform`}
          >
            <IconPlus size={18} />
            <span>Foyer</span>
          </button>
          <button
            type="button"
            tabIndex={chromeVisible ? 0 : -1}
            onClick={() => openNewConvive()}
            className={`${
              chromeVisible ? 'pointer-events-auto' : 'pointer-events-none'
            } min-h-[50px] px-4 rounded-2xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold text-[14px] shadow-lg flex items-center gap-1.5 whitespace-nowrap active:scale-[0.97] transition-transform`}
          >
            <IconPlus size={18} />
            <span>Nouveau convive</span>
          </button>
        </div>
      </div>

      {/* Sheet: Create / Edit Foyer */}
      <BottomSheet
        open={foyerSheetOpen}
        title={editingFoyer ? 'Modifier le foyer' : 'Nouveau foyer'}
        zClass="z-[55]"
        onClose={() => setFoyerSheetOpen(false)}
      >
        <form onSubmit={handleSaveFoyerSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)]">
            <FoyerTile color={foyerCouleur} picto={foyerPicto} sizePx={44} />
            <div className="text-[16px] font-semibold text-[var(--ink)] truncate">
              {foyerNom.trim() || 'Aperçu du pavé'}
            </div>
          </div>

          <div>
            <label
              htmlFor="foyer-nom"
              className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-1"
            >
              Nom du foyer
            </label>
            <input
              id="foyer-nom"
              type="text"
              required
              value={foyerNom}
              onChange={(e) => setFoyerNom(e.target.value)}
              placeholder="Ex. Famille Martin, Paul & Julie…"
              className="w-full min-h-[46px] px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[15px] text-[var(--ink)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div>
            <span className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-2">
              Couleur du pavé
            </span>
            <div className="grid grid-cols-4 gap-2.5">
              {FOYER_COLORS.map((c) => {
                const selected = foyerCouleur === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFoyerCouleur(c.id)}
                    aria-label={c.label}
                    aria-pressed={selected}
                    className={`min-h-[46px] rounded-xl flex items-center justify-center border-2 transition-transform active:scale-95 ${
                      selected ? 'border-[var(--ink)] scale-[1.03]' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.hex, color: '#1A263C' }}
                  >
                    {selected ? (
                      <IconCheck size={20} />
                    ) : (
                      <span className="text-[13px] font-semibold">{c.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-2">
              Pictogramme
            </span>
            <div className="grid grid-cols-4 gap-2">
              {FOYER_PICTOS.map((p) => {
                const selected = foyerPicto === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFoyerPicto(p.id)}
                    aria-pressed={selected}
                    className={`min-h-[54px] px-2 py-1.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-colors ${
                      selected
                        ? 'bg-[var(--surface-active)] border-[var(--primary)] text-[var(--ink)]'
                        : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--ink-muted)]'
                    }`}
                  >
                    <FoyerPictoIcon picto={p.id} size={20} />
                    <span className="text-[13px] font-medium truncate max-w-full">
                      {p.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="min-h-[48px] w-full rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold text-[15px] mt-1 active:scale-[0.98] transition-transform"
          >
            {editingFoyer ? 'Enregistrer les modifications' : 'Créer le foyer'}
          </button>
        </form>
      </BottomSheet>

      {/* Sheet: Full Guest Profile & History */}
      <BottomSheet
        open={Boolean(viewedConvive)}
        title={viewedConvive?.nomAffiche ?? ''}
        zClass="z-50"
        onClose={() => setViewedConvive(null)}
      >
        {viewedConvive && (
          <div className="flex flex-col gap-5">
            {/* Quick edit / delete actions */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => openEditConvive(viewedConvive)}
                className="flex-1 min-h-[44px] px-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--ink)] font-semibold text-[14px] flex items-center justify-center gap-2"
              >
                <IconEdit size={16} />
                <span>Modifier la fiche</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteConvive(viewedConvive)}
                className="min-h-[44px] px-4 rounded-xl bg-[var(--error-bg)] text-[var(--error)] font-semibold text-[14px] flex items-center justify-center gap-2"
              >
                <IconTrash size={16} />
                <span>Supprimer</span>
              </button>
            </div>

            {/* Contraintes du convive */}
            <div className="flex flex-col gap-2">
              <h3 className="font-display text-[18px] text-[var(--ink)]">
                Régime & allergies
              </h3>
              {viewedConvive.contraintesIds.length === 0 &&
              !viewedConvive.contrainteLibre.trim() ? (
                <p className="text-[14px] text-[var(--ink-muted)]">
                  Aucune contrainte enregistrée.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {viewedConvive.contraintesIds.map((cid) => {
                    const tag = contraintesById.get(cid);
                    if (!tag) return null;
                    return (
                      <div
                        key={cid}
                        className={`px-3.5 py-2 rounded-xl text-[14px] font-semibold flex items-center gap-2 ${
                          tag.niveau === 'strict'
                            ? 'bg-[var(--error-bg)] text-[var(--error)]'
                            : 'bg-[var(--warning-bg)] text-[var(--warning)]'
                        }`}
                      >
                        {tag.niveau === 'strict' && <IconAlert size={16} />}
                        <span>
                          {tag.niveau === 'strict' ? 'Allergie stricte · ' : 'Préférence · '}
                          {tag.libelle}
                        </span>
                      </div>
                    );
                  })}
                  {viewedConvive.contrainteLibre.trim() && (
                    <div className="px-3.5 py-2 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[14px] text-[var(--ink)]">
                      {viewedConvive.contrainteLibre}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Plats déjà mangés */}
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-[18px] text-[var(--ink)]">
                  Plats déjà mangés
                </h3>
                <span className="text-[13px] text-[var(--ink-muted)] tabular-nums">
                  {viewedHistory.dishes.length} plats
                </span>
              </div>
              {viewedHistory.dishes.length === 0 ? (
                <p className="text-[14px] text-[var(--ink-muted)]">
                  Aucun plat enregistré dans les invitations réalisées.
                </p>
              ) : (
                <div className="flex flex-col divide-y divide-[var(--border)]/70 border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface-elevated)]/40">
                  {viewedHistory.dishes.map((dish) => (
                    <div key={dish.normalizedKey} className="px-3.5 py-2.5 flex flex-col gap-0.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-[15px] font-semibold text-[var(--ink)]">
                          {dish.dishLabel}{' '}
                          <span className="font-normal text-[var(--ink-muted)]">
                            ({dish.courses.map((c) => COURSE_LABELS[c]).join(' / ')})
                          </span>
                        </div>
                        {dish.hasAEviter ? (
                          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--error)]">
                            <IconBan size={14} />
                            <span>{VERDICT_LABELS.a_eviter}</span>
                          </span>
                        ) : dish.hasCoupDeCoeur ? (
                          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--success)]">
                            <IconHeart size={14} filled />
                            <span>{VERDICT_LABELS.coup_de_coeur}</span>
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[13px] text-[var(--ink-muted)] tabular-nums">
                        {dish.occurrences
                          .map((o) => `${formatDateFr(o.date)} · ${o.hoteLabel}`)
                          .join(' ; ')}
                        {!dish.isRecent && !dish.hasAEviter && (
                          <span> · Servi {dish.elapsedLabel} — peut revenir</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Historique des repas */}
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-[18px] text-[var(--ink)]">
                  Historique des invitations
                </h3>
                <span className="text-[13px] text-[var(--ink-muted)] tabular-nums">
                  {viewedHistory.meals.length} repas
                </span>
              </div>
              {viewedHistory.meals.length === 0 ? (
                <p className="text-[14px] text-[var(--ink-muted)]">
                  Aucune invitation associée à ce convive.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {viewedHistory.meals.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex flex-col gap-0.5"
                    >
                      <div className="flex items-center justify-between text-[13px] text-[var(--ink-muted)] tabular-nums">
                        <span>
                          {formatDateFr(inv.date)} ·{' '}
                          {inv.statut === 'prevue' ? 'Prévue' : 'Réalisée'}
                        </span>
                        {inv.hoteType === 'autre' && (
                          <span className="inline-flex items-center gap-1 font-semibold text-[var(--ink)]">
                            <IconHome size={13} />
                            <span>Chez {inv.hoteLabel}</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[15px] font-semibold text-[var(--ink)]">
                        {inv.titre?.trim() ||
                          (inv.hoteType === 'autre'
                            ? `Repas chez ${inv.hoteLabel}`
                            : 'Repas à la maison')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Sheet: Create / Edit Convive (stacked above Guest Profile when opened from it) */}
      <BottomSheet
        open={conviveSheetOpen}
        title={editingConvive ? 'Modifier le convive' : 'Nouveau convive'}
        zClass="z-[55]"
        onClose={() => setConviveSheetOpen(false)}
      >
        <form onSubmit={handleSaveConviveSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="convive-nom"
              className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-1"
            >
              Nom affiché
            </label>
            <input
              id="convive-nom"
              type="text"
              required
              value={conviveNom}
              onChange={(e) => setConviveNom(e.target.value)}
              placeholder="Prénom, nom ou pseudo…"
              className="w-full min-h-[46px] px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[15px] text-[var(--ink)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div>
            <label
              htmlFor="convive-foyer"
              className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-1"
            >
              Foyer (optionnel)
            </label>
            <select
              id="convive-foyer"
              value={conviveFoyerId}
              onChange={(e) => setConviveFoyerId(e.target.value)}
              className="w-full min-h-[46px] px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[15px] text-[var(--ink)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="">Sans foyer</option>
              {foyers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[14px] font-semibold text-[var(--ink-muted)]">
              Contraintes alimentaires
            </span>
            <div className="flex flex-wrap gap-2">
              {contraintes.map((tag) => {
                const selected = conviveTags.includes(tag.id);
                const isStrict = tag.niveau === 'strict';
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTagInForm(tag.id)}
                    aria-pressed={selected}
                    className={`min-h-[44px] px-3.5 rounded-xl border text-[14px] font-semibold inline-flex items-center gap-1.5 transition-colors ${
                      selected
                        ? isStrict
                          ? 'bg-[var(--error-bg)] border-[var(--error)] text-[var(--error)]'
                          : 'bg-[var(--warning-bg)] border-[var(--warning)] text-[var(--warning)]'
                        : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--ink)]'
                    }`}
                  >
                    {isStrict && <IconAlert size={15} />}
                    {selected && !isStrict && <IconCheck size={15} />}
                    <span>{tag.libelle}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="convive-libre"
              className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-1"
            >
              Note libre (goûts, précisions…)
            </label>
            <textarea
              id="convive-libre"
              rows={2}
              value={conviveLibre}
              onChange={(e) => setConviveLibre(e.target.value)}
              placeholder="Ex. N’aime pas la coriandre, tolère le fromage de chèvre…"
              className="w-full p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[15px] text-[var(--ink)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <button
            type="submit"
            className="min-h-[48px] w-full rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold text-[15px] mt-1 active:scale-[0.98] transition-transform"
          >
            {editingConvive ? 'Enregistrer les modifications' : 'Ajouter le convive'}
          </button>
        </form>
      </BottomSheet>

      {/* Confirm Delete Convive */}
      <ConfirmModal
        open={Boolean(confirmDeleteConvive)}
        title={`Supprimer ${confirmDeleteConvive?.nomAffiche ?? ''} ?`}
        description={(() => {
          if (!confirmDeleteConvive) return '';
          const count = countInvitationsForConvive(confirmDeleteConvive.id);
          if (count === 0) {
            return `${confirmDeleteConvive.nomAffiche} n’apparaît dans aucune invitation. Vous pourrez annuler juste après.`;
          }
          return `Supprimer ${confirmDeleteConvive.nomAffiche} et le retirer de ${count} invitation${
            count > 1 ? 's' : ''
          } ? Vous pourrez annuler juste après.`;
        })()}
        confirmLabel="Supprimer le convive"
        onConfirm={() => {
          if (confirmDeleteConvive) {
            onDeleteConvive(confirmDeleteConvive.id);
            if (viewedConvive?.id === confirmDeleteConvive.id) {
              setViewedConvive(null);
            }
          }
          setConfirmDeleteConvive(null);
        }}
        onCancel={() => setConfirmDeleteConvive(null)}
      />

      {/* Confirm Delete Foyer */}
      <ConfirmModal
        open={Boolean(confirmDeleteFoyer)}
        title={`Supprimer le foyer « ${confirmDeleteFoyer?.nom ?? ''} » ?`}
        description={(() => {
          if (!confirmDeleteFoyer) return '';
          const count = countMembersInFoyer(confirmDeleteFoyer.id);
          if (count === 0) {
            return 'Ce foyer ne contient aucun membre. Vous pourrez annuler juste après.';
          }
          return `Ses ${count} membre${
            count > 1 ? 's seront déplacés' : ' sera déplacé'
          } dans « Sans foyer » sans être supprimé${count > 1 ? 's' : ''}.`;
        })()}
        confirmLabel="Supprimer le foyer"
        onConfirm={() => {
          if (confirmDeleteFoyer) {
            onDeleteFoyer(confirmDeleteFoyer.id);
          }
          setConfirmDeleteFoyer(null);
        }}
        onCancel={() => setConfirmDeleteFoyer(null)}
      />
    </div>
  );
};
