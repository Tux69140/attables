/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { useAndroidBack } from '../hooks/useAndroidBack';
import { useHauteurMesuree } from '../hooks/useHauteurMesuree';
import { COURSE_KEYS, ContrainteTag, Convive, Invitation, PlatFiche } from '../types/models';
import { trierAVenir } from '../utils/dates';
import { getTodayIso, normalizeForCompare } from '../utils/dishes';
import type { EtatParcours } from '../utils/parcours';
import { CarteInvitation, CarteRealisee } from './CarteInvitation';
import { Onglets, Puces } from './Controles';
import { IconClose, IconPlus, IconSearch } from './Icons';
import { LigneDerniereEtape, ParcoursGuide } from './ParcoursGuide';

export type Onglet = 'avenir' | 'realisees';
export type Hote = 'tous' | 'moi' | 'autres';

interface InvitationsTabProps {
  invitations: Invitation[];
  convivesById: Map<string, Convive>;
  contraintesById: Map<string, ContrainteTag>;
  plats: PlatFiche[];
  chromeVisible?: boolean;
  onOpenNew: () => void;
  onOpenEdit: (invitation: Invitation) => void;
  onMarkRealisee: (invitationId: string) => void;
  /** Recherche ouverte par la loupe de l'en-tête (null = fermée). */
  recherche: string | null;
  onRecherche: (valeur: string | null) => void;
  /** Sous-onglet et filtre d'hôte, tenus par App pour les retrouver au retour de l'éditeur. */
  onglet: Onglet;
  onOnglet: (valeur: Onglet) => void;
  hote: Hote;
  onHote: (valeur: Hote) => void;
  /** Parcours guidé du premier usage (déduit des données). */
  parcours: EtatParcours;
  resumeProches: string;
  onAjouterProche: () => void;
  ligneParcoursFermee: boolean;
  onFermerLigneParcours: () => void;
}

const SUFFIXE_HOTE: Record<Hote, string> = { tous: '', moi: ' chez vous', autres: ' chez les autres' };

export const InvitationsTab: React.FC<InvitationsTabProps> = ({
  invitations,
  convivesById,
  contraintesById,
  plats,
  chromeVisible = true,
  onOpenNew,
  onOpenEdit,
  onMarkRealisee,
  recherche,
  onRecherche,
  onglet,
  onOnglet,
  hote,
  onHote,
  parcours,
  resumeProches,
  onAjouterProche,
  ligneParcoursFermee,
  onFermerLigneParcours,
}) => {
  const aujourdHui = getTodayIso();
  useAndroidBack(recherche !== null, () => onRecherche(null));

  // Le champ ne prend le focus qu'à l'ouverture par la loupe (null → ''), jamais au remontage
  // (retour de l'éditeur : le focus revient à la carte, sans clavier).
  const champRecherche = useRef<HTMLInputElement>(null);
  // Hauteur réelle du bouton flottant (son libellé passe à la ligne en grand texte) : le bandeau « Annuler » se place au-dessus.
  const boutonFlottant = useRef<HTMLDivElement>(null);
  useHauteurMesuree(boutonFlottant, '--hauteur-fab');
  const recherchePrecedente = useRef(recherche);
  useEffect(() => {
    if (recherchePrecedente.current === null && recherche === '') champRecherche.current?.focus();
    recherchePrecedente.current = recherche;
  }, [recherche]);

  const q = normalizeForCompare(recherche ?? '');

  const { aVenir, realisees } = useMemo(() => {
    const retenues = invitations.filter((inv) => {
      if (hote === 'moi' && inv.hoteType !== 'moi') return false;
      if (hote === 'autres' && inv.hoteType !== 'autre') return false;
      if (!q) return true;
      const dans = (texte?: string) => Boolean(texte && normalizeForCompare(texte).includes(q));
      return (
        dans(inv.titre) ||
        dans(inv.hoteLabel) ||
        COURSE_KEYS.some((k) => dans(inv.menu[k])) ||
        inv.convivesIds.some((id) => dans(convivesById.get(id)?.nomAffiche))
      );
    });
    return {
      aVenir: trierAVenir(
        retenues.filter((i) => i.statut === 'prevue'),
        aujourdHui
      ),
      realisees: retenues.filter((i) => i.statut === 'realisee').sort((a, b) => b.date.localeCompare(a.date)),
    };
  }, [invitations, hote, q, convivesById, aujourdHui]);

  // Aucune invitation : seulement le guide (rien à filtrer ni à chercher).
  if (parcours.affichage === 'complet') {
    return (
      <div className="flex flex-col gap-4 pb-below-nav">
        <h1 className="sr-only" tabIndex={-1} data-titre-vue>Invitations</h1>
        <ParcoursGuide
          etat={parcours}
          resume={resumeProches}
          onAjouterProche={onAjouterProche}
          onPreparerInvitation={onOpenNew}
        />
      </div>
    );
  }

  const carteAVenir = (inv: Invitation) => (
    <CarteInvitation
      key={inv.id}
      invitation={inv}
      convivesById={convivesById}
      contraintesById={contraintesById}
      plats={plats}
      aujourdHui={aujourdHui}
      onOuvrir={() => onOpenEdit(inv)}
      onMarquerRealisee={() => onMarkRealisee(inv.id)}
    />
  );
  const carteRealisee = (inv: Invitation) => (
    <CarteRealisee
      key={inv.id}
      invitation={inv}
      convivesById={convivesById}
      aujourdHui={aujourdHui}
      onOuvrir={() => onOpenEdit(inv)}
    />
  );
  const vide = (texte: string) => (
    <p className="py-10 px-4 text-center text-[15px] text-[var(--ink-muted)]">{texte}</p>
  );
  const grille = (enfants: React.ReactNode) => <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{enfants}</div>;

  return (
    <div className="flex flex-col gap-4 pb-below-fab">
      <h1 className="sr-only" tabIndex={-1} data-titre-vue>Invitations</h1>
      {parcours.affichage === 'ligne' && !ligneParcoursFermee && <LigneDerniereEtape onFermer={onFermerLigneParcours} />}

      {recherche !== null ? (
        <div className="relative">
          <IconSearch size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] pointer-events-none" />
          <input
            type="text"
            enterKeyHint="search"
            ref={champRecherche}
            value={recherche}
            onChange={(e) => onRecherche(e.target.value)}
            placeholder="Un titre, un plat ou un convive…"
            aria-label="Rechercher dans les invitations"
            className="w-full min-h-[46px] pl-10 pr-12 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--primary-ink)]"
          />
          <button
            type="button"
            onClick={() => onRecherche(null)}
            aria-label="Fermer la recherche"
            className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--ink-muted)]"
          >
            <IconClose size={18} />
          </button>
        </div>
      ) : (
        <Onglets
          ariaLabel="Invitations"
          valeur={onglet}
          onChange={onOnglet}
          options={[
            { id: 'avenir', label: 'À venir', compte: aVenir.length },
            { id: 'realisees', label: 'Réalisées', compte: realisees.length },
          ]}
        />
      )}

      <Puces
        ariaLabel="Filtrer par hôte"
        valeur={hote}
        onChange={onHote}
        options={[
          { id: 'tous', label: 'Tous' },
          { id: 'moi', label: 'Chez moi', icone: 'house' },
          { id: 'autres', label: 'Chez les autres' },
        ]}
      />

      {recherche !== null && q ? (
        aVenir.length + realisees.length === 0 ? (
          vide(`Aucun résultat pour « ${recherche.trim()} ».`)
        ) : (
          <>
            {aVenir.length > 0 && (
              <section aria-labelledby="res-avenir" className="flex flex-col gap-3">
                <h2 id="res-avenir" className="font-display text-[20px] text-[var(--ink)]">À venir</h2>
                {grille(aVenir.map(carteAVenir))}
              </section>
            )}
            {realisees.length > 0 && (
              <section aria-labelledby="res-realisees" className="flex flex-col gap-3">
                <h2 id="res-realisees" className="font-display text-[20px] text-[var(--ink)]">Réalisées</h2>
                {grille(realisees.map(carteRealisee))}
              </section>
            )}
          </>
        )
      ) : (
        <section aria-labelledby="liste-invitations">
          <h2 id="liste-invitations" className="sr-only">
            {onglet === 'avenir' ? 'À venir' : 'Réalisées'}
          </h2>
          {onglet === 'avenir'
            ? aVenir.length === 0
              ? vide(`Aucune invitation à venir${SUFFIXE_HOTE[hote]}.`)
              : grille(aVenir.map(carteAVenir))
            : realisees.length === 0
              ? vide(`Aucune invitation réalisée${SUFFIXE_HOTE[hote]}.`)
              : grille(realisees.map(carteRealisee))}
        </section>
      )}

      {/* Bouton flottant : dès qu'une invitation existe (avant, le guide porte le bouton) */}
      {invitations.length > 0 && (
        <div
          ref={boutonFlottant}
          aria-hidden={!chromeVisible}
          className={`fixed bottom-above-nav left-0 right-0 z-30 pointer-events-none flex justify-center px-safe chrome-mouvement ${
            chromeVisible ? 'translate-y-0 opacity-100' : 'translate-y-[160px] opacity-0'
          }`}
        >
          <div className="w-full max-w-[1080px] flex justify-end">
            <button
              type="button"
              tabIndex={chromeVisible ? 0 : -1}
              data-focus-cle="preparer-invitation"
              onClick={onOpenNew}
              className={`${
                chromeVisible ? 'pointer-events-auto' : 'pointer-events-none'
              } min-h-[50px] px-5 rounded-2xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold text-[15px] shadow-lg flex items-center gap-2 active:scale-[0.97] transition-transform`}
            >
              <IconPlus size={20} />
              <span className="text-center">Préparer une invitation</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
