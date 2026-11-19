/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Affichage des contraintes d'une tablée, avec une formulation unique « Allergène — Prénom(s) ».
 */
import React, { useRef } from 'react';
import type { ContrainteConvive, Convive } from '../types/models';
import { type ConflitAllergene, iconeContrainte, listePrenoms, texteEvite } from '../utils/allergenes';
import type { AggregatedConstraints } from '../utils/dishes';
import { useHauteurMesuree } from '../hooks/useHauteurMesuree';
import { Icone } from './Icone';
import { IconAlert, IconCheck } from './Icons';

const prenoms = (guests: Convive[]) => guests.map((g) => g.nomAffiche).join(', ');

/** Bandeau rouge collé sous l'en-tête de l'éditeur ; le toucher mène à « La tablée ». */
export const BandeauAllergies: React.FC<{
  strict: AggregatedConstraints['strict'];
  onToucher: () => void;
  /** En-tête affiché : le bandeau se place dessous, sinon tout en haut. */
  enteteVisible?: boolean;
}> = ({ strict, onToucher, enteteVisible = true }) => {
  if (strict.length === 0) return null;
  return <BandeauAllergiesVisible strict={strict} onToucher={onToucher} enteteVisible={enteteVisible} />;
};

// Composant à part : le bandeau n'existe que s'il y a des allergies, et sa hauteur (qui grandit avec le texte et le nombre
// d'allergies, jamais tronquée) est mesurée pour que l'ancre « La tablée » s'arrête sous lui.
const BandeauAllergiesVisible: React.FC<{
  strict: AggregatedConstraints['strict'];
  onToucher: () => void;
  enteteVisible: boolean;
}> = ({ strict, onToucher, enteteVisible }) => {
  const ref = useRef<HTMLButtonElement>(null);
  useHauteurMesuree(ref, '--hauteur-bandeau');
  return (
    <button
      ref={ref}
      type="button"
      onClick={onToucher}
      style={{
        top: enteteVisible
          ? 'calc(var(--hauteur-entete, calc(3.5rem + var(--haut-systeme) + 1px)) - 1px)'
          : 'var(--haut-systeme)',
      }}
      className="sticky z-20 bandeau-pleine-largeur py-2 min-h-[44px] bg-[var(--alerte)] text-[var(--on-alerte)] text-[14px] font-bold text-left flex items-center gap-2 shadow-md chrome-mouvement"
    >
      <IconAlert size={17} className="shrink-0" />
      <span className="sr-only">Allergies strictes : </span>
      <span className="leading-snug">
        {strict.map(({ libelle, guests }) => `${libelle} — ${prenoms(guests)}`).join(' · ')}
      </span>
    </button>
  );
};

/** Contraintes réunies, une ligne par personne : allergies en pastilles rouges, « évite » en bleu, note libre entre guillemets. */
export const BlocTablee: React.FC<{ constraints: AggregatedConstraints }> = ({ constraints }) => {
  const { parPersonne } = constraints;
  if (parPersonne.length === 0) {
    return (
      <p className="px-3.5 py-2.5 rounded-xl bg-[var(--success-bg)] text-[var(--success)] text-[14px] font-semibold flex items-center gap-2">
        <IconCheck size={17} />
        Aucune allergie ni restriction signalée pour cette tablée.
      </p>
    );
  }
  return (
    <ul className="flex flex-col divide-y divide-[var(--border)]">
      {parPersonne.map(({ guest, strict, evite, note }) => (
        <li key={guest.id} className="py-2 first:pt-0 last:pb-0 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[14px]">
          <b className="font-bold text-[var(--ink)] break-words min-w-0">{guest.nomAffiche}</b>
          {strict.map((e) => (
            <PastilleContrainte key={e.id} contrainte={e} />
          ))}
          {evite.length > 0 && (
            <span className="text-[var(--pref)] break-words min-w-0">
              évite : {evite.map(texteEvite).join(', ')}
            </span>
          )}
          {note && <span className="text-[var(--ink)] break-words min-w-0">« {note} »</span>}
        </li>
      ))}
    </ul>
  );
};

/** Pastille d'une contrainte : pleine rouge si stricte, bleue si préférence. */
export const PastilleContrainte: React.FC<{ contrainte: ContrainteConvive }> = ({ contrainte }) => {
  const strict = contrainte.niveau === 'strict';
  const icone = iconeContrainte(contrainte);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-bold ${
        strict ? 'bg-[var(--alerte)] text-[var(--on-alerte)]' : 'bg-[var(--pref-bg)] text-[var(--pref)]'
      }`}
    >
      <Icone nom={strict && icone === 'tag' ? 'triangle-alert' : icone} size={14} />
      {contrainte.libelle}
      {strict && <span className="sr-only"> (allergie stricte)</span>}
    </span>
  );
};

/** « du lait », « des fruits à coque »… ; libellé brut pour un aliment libre. */
const CONTIENT: Record<string, string> = {
  gluten: 'du gluten',
  crustaces: 'des crustacés',
  oeufs: 'des œufs',
  poissons: 'du poisson',
  arachides: 'des arachides',
  soja: 'du soja',
  lait: 'du lait',
  'fruits-a-coque': 'des fruits à coque',
  celeri: 'du céleri',
  moutarde: 'de la moutarde',
  sesame: 'du sésame',
  sulfites: 'des sulfites',
  lupin: 'du lupin',
  mollusques: 'des mollusques',
  fodmap: 'des aliments riches en FODMAP',
  porc: 'du porc',
  alcool: 'de l’alcool',
  viande: 'de la viande',
};

/** Alertes sous un champ du menu : rouge pour une allergie stricte, bleue pour une préférence. */
export const AlertesAllergenes: React.FC<{ conflits: ConflitAllergene[] }> = ({ conflits }) => (
  <>
    {conflits.map((c) => {
      const quoi = CONTIENT[c.allergeneId] ?? c.libelle.toLowerCase();
      return c.niveau === 'strict' ? (
        <p
          key={`${c.allergeneId}-strict`}
          role="alert"
          className="px-3 py-2 rounded-xl bg-[var(--alerte)] text-[var(--on-alerte)] text-[14px] font-semibold flex items-start gap-2"
        >
          <IconAlert size={17} className="shrink-0 mt-px" />
          <span>
            Ce plat contient {quoi} — {listePrenoms(c.convives)}{' '}
            {c.convives.length > 1 ? 'sont allergiques' : 'est allergique'}
          </span>
        </p>
      ) : (
        <p
          key={`${c.allergeneId}-pref`}
          className="px-3 py-2 rounded-xl bg-[var(--pref-bg)] text-[var(--pref)] text-[14px] flex items-start gap-2"
        >
          <span>
            Ce plat contient {quoi} — {listePrenoms(c.convives)} {c.convives.length > 1 ? 'évitent' : 'évite'}
          </span>
        </p>
      );
    })}
  </>
);
