/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Affichage des contraintes d'une tablée, avec une formulation unique « Allergène — Prénom(s) ».
 */
import React, { useRef } from 'react';
import type { ContrainteTag, Convive } from '../types/models';
import { type ConflitAllergene, iconeContrainte } from '../utils/allergenes';
import type { AggregatedConstraints } from '../utils/dishes';
import { useHauteurMesuree } from '../hooks/useHauteurMesuree';
import { Icone } from './Icone';
import { IconAlert, IconCheck, IconEdit } from './Icons';

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
        {strict.map(({ tag, guests }) => `${tag.libelle} — ${prenoms(guests)}`).join(' · ')}
      </span>
    </button>
  );
};

const Ligne: React.FC<{ gauche: string; droite: string }> = ({ gauche, droite }) => (
  <div className="flex justify-between gap-3 px-3 py-1.5">
    <b className="font-bold">{gauche}</b>
    <span className="text-right">{droite}</span>
  </div>
);

/** Contraintes réunies : allergies strictes, préférences, notes libres. */
export const BlocTablee: React.FC<{ constraints: AggregatedConstraints }> = ({ constraints }) => {
  const { strict, preferences, freeNotes } = constraints;
  if (strict.length === 0 && preferences.length === 0 && freeNotes.length === 0) {
    return (
      <p className="px-3.5 py-2.5 rounded-xl bg-[var(--success-bg)] text-[var(--success)] text-[14px] font-semibold flex items-center gap-2">
        <IconCheck size={17} />
        Aucune allergie ni restriction signalée pour cette tablée.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      {strict.length > 0 && (
        <div className="rounded-xl bg-[var(--error-bg)] text-[var(--error)] border-[1.5px] border-[var(--error)] text-[15px] pb-1.5">
          <p className="px-3 pt-2 pb-1 text-[12px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <IconAlert size={15} /> Allergies strictes
          </p>
          {strict.map(({ tag, guests }) => (
            <Ligne key={tag.id} gauche={tag.libelle} droite={prenoms(guests)} />
          ))}
        </div>
      )}
      {preferences.length > 0 && (
        <div className="rounded-xl bg-[var(--pref-bg)] text-[var(--pref)] text-[14px] pb-1.5">
          <p className="px-3 pt-2 pb-1 text-[12px] font-bold uppercase tracking-wider">Préférences</p>
          {preferences.map(({ tag, guests }) => (
            <Ligne key={tag.id} gauche={tag.libelle} droite={prenoms(guests)} />
          ))}
        </div>
      )}
      {freeNotes.map(({ guest, note }) => (
        <p
          key={guest.id}
          className="px-3 py-2 rounded-xl bg-[var(--surface-elevated)] text-[14px] text-[var(--ink)] flex items-start gap-2"
        >
          <IconEdit size={15} className="shrink-0 mt-0.5 text-[var(--ink-muted)]" />
          <span>
            <b>{guest.nomAffiche}</b> <span className="text-[var(--ink-muted)]">— {note}</span>
          </span>
        </p>
      ))}
    </div>
  );
};

/** Pastille d'une contrainte : pleine rouge si stricte, bleue si préférence. */
export const PastilleContrainte: React.FC<{ tag: ContrainteTag }> = ({ tag }) => {
  const strict = tag.niveau === 'strict';
  const icone = iconeContrainte(tag);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-bold ${
        strict ? 'bg-[var(--alerte)] text-[var(--on-alerte)]' : 'bg-[var(--pref-bg)] text-[var(--pref)]'
      }`}
    >
      <Icone nom={strict && icone === 'tag' ? 'triangle-alert' : icone} size={14} />
      {tag.libelle}
      {strict && <span className="sr-only"> (allergie stricte)</span>}
    </span>
  );
};

/** « du lait », « des fruits à coque »… ; libellé brut pour une contrainte personnelle. */
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
            Contient {quoi} — {prenoms(c.convives)} (allergie stricte)
          </span>
        </p>
      ) : (
        <p
          key={`${c.allergeneId}-pref`}
          className="px-3 py-2 rounded-xl bg-[var(--pref-bg)] text-[var(--pref)] text-[14px] flex items-start gap-2"
        >
          <span>
            Contient {quoi} — {prenoms(c.convives)} (préférence)
          </span>
        </p>
      );
    })}
  </>
);
