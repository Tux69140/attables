import React, { useMemo, useRef, useState } from 'react';
import { useHauteurMesuree } from '../hooks/useHauteurMesuree';
import {
  COURSE_LABELS,
  Convive,
  Foyer,
  Invitation,
  VERDICT_LABELS,
} from '../types/models';
import {
  formatDateFr,
  getDishesServedToGuests,
  normalizeForCompare,
} from '../utils/dishes';
import {
  IconAlert,
  IconBan,
  IconChevronRight,
  IconEdit,
  IconHeart,
  IconHome,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUsers,
} from './Icons';
import { getFoyerColorHex } from '../types/models';
import { teinteFoyer } from '../utils/teinte';
import { PastilleContrainte } from './Allergies';
import { Puces } from './Controles';
import { FeuilleConvive } from './FeuilleConvive';
import { Icone } from './Icone';
import { FeuilleFoyer } from './FeuilleFoyer';
import { BottomSheet, ConfirmModal, FoyerTile } from './SharedUI';

interface ConvivesTabProps {
  foyers: Foyer[];
  convives: Convive[];
  invitations: Invitation[];
  convivesById: Map<string, Convive>;
  prescriptionMois: number;
  chromeVisible?: boolean;
  onSaveFoyer: (foyer: Foyer) => void;
  onDeleteFoyer: (foyerId: string) => void;
  onSaveConvive: (convive: Convive) => void;
  onDeleteConvive: (conviveId: string) => void;
  /** Ouvre la feuille « Ajouter… » (personne ou foyer), tenue par App. */
  onAjouter: () => void;
  /** Thème sombre effectif : teinte des en-têtes de foyer. */
  sombre: boolean;
}

export const ConvivesTab: React.FC<ConvivesTabProps> = ({
  foyers,
  convives,
  invitations,
  convivesById,
  prescriptionMois,
  chromeVisible = true,
  onSaveFoyer,
  onDeleteFoyer,
  onSaveConvive,
  onDeleteConvive,
  onAjouter,
  sombre,
}) => {
  const [search, setSearch] = useState('');
  // Hauteur réelle du bouton flottant : le bandeau « Annuler » se place au-dessus.
  const boutonFlottant = useRef<HTMLDivElement>(null);
  useHauteurMesuree(boutonFlottant, '--hauteur-fab');
  const [filtre, setFiltre] = useState<'tous' | 'allergies'>('tous');
  const [menuFoyer, setMenuFoyer] = useState<Foyer | null>(null);
  const aAllergie = (c: Convive) => c.contraintes.some((e) => e.niveau === 'strict');

  // Feuilles de modification (convive, foyer) et d'ajout d'un membre à un foyer
  const [feuilleConvive, setFeuilleConvive] = useState<null | { convive?: Convive; foyerId?: string }>(null);
  const [feuilleFoyer, setFeuilleFoyer] = useState<Foyer | null>(null);

  // Guest profile sheet
  const [viewedConvive, setViewedConvive] = useState<Convive | null>(null);

  // Confirm delete states
  const [confirmDeleteConvive, setConfirmDeleteConvive] = useState<Convive | null>(null);
  const [confirmDeleteFoyer, setConfirmDeleteFoyer] = useState<Foyer | null>(null);

  const openNewConvive = (foyerId?: string) => setFeuilleConvive({ foyerId });
  const openEditConvive = (convive: Convive) => setFeuilleConvive({ convive });
  const openEditFoyer = (foyer: Foyer) => setFeuilleFoyer(foyer);

  const enregistrerConvive = (saved: Convive) => {
    onSaveConvive(saved);
    if (viewedConvive?.id === saved.id) setViewedConvive(saved);
    setFeuilleConvive(null);
  };

  const queryNorm = normalizeForCompare(search);

  const groupedFoyers = useMemo(() => {
    return foyers
      .map((foyer) => {
        const members = convives
          .filter((c) => c.foyerId === foyer.id)
          .sort((a, b) => a.nomAffiche.localeCompare(b.nomAffiche, 'fr'));
        const foyerMatches = !queryNorm || normalizeForCompare(foyer.nom).includes(queryNorm);
        const parNom = foyerMatches
          ? members
          : members.filter((m) => normalizeForCompare(m.nomAffiche).includes(queryNorm));
        // Filtre « Allergies » : le foyer est réduit à ses membres allergiques, masqué s'il n'en a pas.
        const matchingMembers = filtre === 'allergies' ? parNom.filter(aAllergie) : parNom;
        return {
          foyer,
          members: matchingMembers,
          totalMembers: members.length,
          visible: filtre === 'allergies' ? matchingMembers.length > 0 : foyerMatches || matchingMembers.length > 0,
        };
      })
      .filter((item) => item.visible);
  }, [foyers, convives, queryNorm, filtre]);

  const ungroupedGuests = useMemo(() => {
    const foyerIds = new Set(foyers.map((f) => f.id));
    return convives
      .filter((c) => !c.foyerId || !foyerIds.has(c.foyerId))
      .filter((c) => !queryNorm || normalizeForCompare(c.nomAffiche).includes(queryNorm))
      .filter((c) => filtre === 'tous' || aAllergie(c))
      .sort((a, b) => a.nomAffiche.localeCompare(b.nomAffiche, 'fr'));
  }, [convives, foyers, queryNorm, filtre]);

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

  const tagsDe = (guest: Convive) => [
    ...guest.contraintes.filter((e) => e.niveau === 'strict'),
    ...guest.contraintes.filter((e) => e.niveau !== 'strict'),
  ];

  /** Ligne d'un convive ; `couleur` : filet et avatar teintés du foyer, sinon neutres. */
  const renderConviveRow = (guest: Convive, couleur?: Foyer['couleur']) => {
    const tags = tagsDe(guest);
    const note = guest.contrainteLibre.trim();
    const hex = couleur ? getFoyerColorHex(couleur) : undefined;
    return (
      <button
        key={guest.id}
        type="button"
        onClick={() => setViewedConvive(guest)}
        className="w-full min-h-[56px] pl-3 pr-4 py-2.5 text-left flex items-center gap-3 active:bg-[var(--surface-active)]/50 transition-colors"
      >
        <span
          aria-hidden="true"
          className="self-stretch w-[3px] rounded-full shrink-0"
          style={{ backgroundColor: hex ?? 'transparent' }}
        />
        <span
          aria-hidden="true"
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-[15px] text-[var(--ink)] shrink-0"
          style={{ backgroundColor: couleur ? teinteFoyer(couleur, sombre) : 'var(--surface-elevated)' }}
        >
          {guest.nomAffiche.trim().charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1 flex flex-col gap-1">
          <span className="text-[16px] font-bold text-[var(--ink)] break-words min-w-0">{guest.nomAffiche}</span>
          {tags.length === 0 && !note ? (
            <span className="text-[14px] text-[var(--ink-muted)]">Aucune contrainte</span>
          ) : (
            <span className="flex flex-wrap items-center gap-1.5">
              {tags.map((t) => (
                <PastilleContrainte key={t.id} contrainte={t} />
              ))}
              {note && <span className="text-[13px] text-[var(--ink-muted)]">+ note</span>}
            </span>
          )}
        </span>
        <IconChevronRight size={18} className="text-[var(--ink-muted)] shrink-0" />
      </button>
    );
  };

  const nbAllergiques = convives.filter(aAllergie).length;
  const titreSection = (icone: 'assemblee' | 'user-round', titre: string, detail: string, id: string) => (
    <div className="flex items-baseline justify-between gap-2 px-0.5">
      <h2 id={id} className="font-display text-[21px] text-[var(--ink)] flex items-center gap-2">
        <Icone nom={icone} size={22} className="text-[var(--primary-ink)] self-center" />
        {titre}
      </h2>
      <span className="text-[14px] text-[var(--ink-muted)] tabular-nums">{detail}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 pb-below-fab-large">
      <h1 className="sr-only" tabIndex={-1} data-titre-vue>Convives</h1>
      {/* Search bar */}
      <div className="relative">
        <IconSearch
          size={19}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] pointer-events-none"
        />
        <input
          type="text"
          enterKeyHint="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un foyer ou un convive…"
          aria-label="Rechercher dans l’annuaire"
          className="w-full min-h-[46px] pl-10 pr-4 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--primary-ink)]"
        />
      </div>

      {convives.length > 0 && (
        <Puces
          ariaLabel="Filtrer les convives"
          valeur={filtre}
          onChange={setFiltre}
          options={[
            { id: 'tous', label: `Tous · ${convives.length}` },
            { id: 'allergies', label: `Allergies · ${nbAllergiques}`, icone: 'triangle-alert', ton: 'alerte' },
          ]}
        />
      )}

      {/* Empty State */}
      {groupedFoyers.length === 0 && ungroupedGuests.length === 0 && (
        <div className="carte p-7 text-center flex flex-col items-center gap-3 mt-2">
          <div className="w-12 h-12 rounded-2xl bg-[var(--surface-elevated)] text-[var(--ink-muted)] flex items-center justify-center">
            <IconUsers size={24} />
          </div>
          <h2 className="font-display text-xl text-[var(--ink)]">
            {foyers.length === 0 && convives.length === 0
              ? 'Annuaire vide'
              : filtre === 'allergies' && !queryNorm
                ? 'Aucune allergie stricte'
                : 'Aucun convive trouvé'}
          </h2>
          <p className="text-[15px] text-[var(--ink-muted)] max-w-sm">
            {foyers.length === 0 && convives.length === 0
              ? 'Ajoutez vos proches et regroupez-les par foyer pour cocher toute une famille en un seul geste.'
              : filtre === 'allergies' && !queryNorm
                ? 'Personne dans le carnet n’a d’allergie stricte.'
                : 'Aucun foyer ni convive ne correspond à cette recherche.'}
          </p>
        </div>
      )}

      {/* Foyers */}
      {groupedFoyers.length > 0 && (
        <section aria-labelledby="titre-foyers" className="flex flex-col gap-3">
          {titreSection('assemblee', 'Foyers', String(groupedFoyers.length), 'titre-foyers')}
          {groupedFoyers.map(({ foyer, members, totalMembers }) => (
            <article key={foyer.id} className="carte overflow-hidden">
              <div
                className="pl-3 pr-1.5 py-2.5 flex items-center justify-between gap-2"
                style={{ backgroundColor: teinteFoyer(foyer.couleur, sombre) }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FoyerTile color={foyer.couleur} picto={foyer.picto} sizePx={44} />
                  <div className="min-w-0">
                    <h3 className="font-display text-[19px] text-[var(--ink)] break-words min-w-0">{foyer.nom}</h3>
                    <span className="text-[13px] text-[var(--ink-muted)] tabular-nums">
                      {totalMembers} {totalMembers > 1 ? 'membres' : 'membre'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => openNewConvive(foyer.id)}
                    aria-label={`Ajouter un membre dans ${foyer.nom}`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--ink)]"
                  >
                    <IconPlus size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMenuFoyer(foyer)}
                    aria-label={`Actions du foyer ${foyer.nom}`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--ink)]"
                  >
                    <Icone nom="ellipsis-vertical" size={20} />
                  </button>
                </div>
              </div>
              {members.length === 0 ? (
                <p className="px-4 py-3.5 text-[14px] text-[var(--ink-muted)]">Aucun membre dans ce foyer pour le moment.</p>
              ) : (
                <div className="divide-y divide-[var(--border)]/70">{members.map((m) => renderConviveRow(m, foyer.couleur))}</div>
              )}
            </article>
          ))}
        </section>
      )}

      {/* Individuels */}
      {ungroupedGuests.length > 0 && (
        <section aria-labelledby="titre-individuels" className="flex flex-col gap-3">
          {titreSection('user-round', 'Individuels', `${ungroupedGuests.length} · sans foyer`, 'titre-individuels')}
          <div className="carte overflow-hidden divide-y divide-[var(--border)]/70">
            {ungroupedGuests.map((g) => renderConviveRow(g))}
          </div>
        </section>
      )}

      {/* Menu « ⋮ » d'un foyer */}
      <BottomSheet open={menuFoyer !== null} title={menuFoyer?.nom ?? ''} onClose={() => setMenuFoyer(null)}>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              if (menuFoyer) openEditFoyer(menuFoyer);
              setMenuFoyer(null);
            }}
            className="min-h-[52px] px-4 rounded-xl bg-[var(--surface-elevated)] text-[var(--ink)] font-semibold text-[15px] flex items-center gap-3"
          >
            <IconEdit size={18} />
            Modifier le foyer
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmDeleteFoyer(menuFoyer);
              setMenuFoyer(null);
            }}
            className="min-h-[52px] px-4 rounded-xl bg-[var(--error-bg)] text-[var(--error)] font-semibold text-[15px] flex items-center gap-3"
          >
            <IconTrash size={18} />
            Supprimer le foyer
          </button>
        </div>
      </BottomSheet>

      {/* Floating Action Buttons (auto-hide on scroll down, reappear on slight scroll up) */}
      <div
        ref={boutonFlottant}
        className={`fixed bottom-above-nav left-0 right-0 z-30 pointer-events-none flex justify-center px-safe chrome-mouvement ${
          chromeVisible ? 'translate-y-0 opacity-100' : 'translate-y-[160px] opacity-0'
        }`}
      >
        {/* aria-hidden sur ce conteneur interne : usePiegeFocus peut masquer le conteneur fixe sous une feuille. */}
        <div aria-hidden={!chromeVisible} className="w-full max-w-[1080px] flex justify-end gap-2">
          <button
            type="button"
            tabIndex={chromeVisible ? 0 : -1}
            onClick={onAjouter}
            className={`${
              chromeVisible ? 'pointer-events-auto' : 'pointer-events-none'
            } min-h-[50px] px-5 rounded-2xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold text-[15px] shadow-lg flex items-center gap-2 whitespace-nowrap active:scale-[0.97] transition-transform`}
          >
            <IconPlus size={18} />
            <span>Ajouter</span>
          </button>
        </div>
      </div>

      <FeuilleFoyer
        ouverte={feuilleFoyer !== null}
        foyer={feuilleFoyer ?? undefined}
        onEnregistrer={(f) => {
          onSaveFoyer(f);
          setFeuilleFoyer(null);
        }}
        onFermer={() => setFeuilleFoyer(null)}
      />

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
            <div className="flex flex-wrap items-center gap-2.5">
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
              {viewedConvive.contraintes.length === 0 &&
              !viewedConvive.contrainteLibre.trim() ? (
                <p className="text-[14px] text-[var(--ink-muted)]">
                  Aucune contrainte enregistrée.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {tagsDe(viewedConvive).map((t) => (
                      <PastilleContrainte key={t.id} contrainte={t} />
                    ))}
                  </div>
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

      {/* Au-dessus de la fiche du convive quand on l'ouvre depuis elle */}
      <FeuilleConvive
        ouverte={feuilleConvive !== null}
        convive={feuilleConvive?.convive}
        foyerIdInitial={feuilleConvive?.foyerId}
        foyers={foyers}
        onEnregistrer={enregistrerConvive}
        onFermer={() => setFeuilleConvive(null)}
      />

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
