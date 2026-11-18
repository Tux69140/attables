/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import React, { useEffect, useRef, useState } from 'react';
import { useAndroidBack } from '../hooks/useAndroidBack';
import { Icone } from './Icone';

/** Une entrée d'historique par écran au-delà du premier : Retour ramène à l'écran précédent. */
const CoucheRetour: React.FC<{ onRetour: () => void }> = ({ onRetour }) => {
  useAndroidBack(true, onRetour);
  return null;
};

/** Table vue de dessus, nappe vichy safran, quatre couverts. */
const Illustration: React.FC = () => (
  <svg viewBox="0 0 232 170" width="232" height="170" className="max-w-full" aria-hidden="true">
    <defs>
      <pattern id="accueil-vichy" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect width="10" height="10" style={{ fill: 'var(--card)' }} />
        <rect width="5" height="10" fill="rgba(240, 180, 41, 0.4)" />
        <rect width="10" height="5" fill="rgba(240, 180, 41, 0.4)" />
      </pattern>
    </defs>
    <rect x="16" y="22" width="200" height="126" rx="18" fill="url(#accueil-vichy)" style={{ stroke: 'var(--outline)' }} strokeWidth="1.5" />
    <g style={{ fill: 'var(--card)', stroke: 'var(--outline)' }} strokeWidth="2">
      <circle cx="70" cy="56" r="20" />
      <circle cx="162" cy="56" r="20" />
      <circle cx="70" cy="114" r="20" />
      <circle cx="162" cy="114" r="20" />
    </g>
    <g fill="none" style={{ stroke: 'var(--border)' }} strokeWidth="2">
      <circle cx="70" cy="56" r="12" />
      <circle cx="162" cy="56" r="12" />
      <circle cx="70" cy="114" r="12" />
      <circle cx="162" cy="114" r="12" />
    </g>
    <path
      d="M42 44v24M98 44v24M134 44v24M190 44v24M42 102v24M98 102v24M134 102v24M190 102v24"
      style={{ stroke: 'var(--ink-muted)' }}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <ellipse cx="116" cy="85" rx="18" ry="11" style={{ fill: 'var(--primary)' }} />
    <ellipse cx="116" cy="83" rx="10" ry="5" style={{ fill: 'var(--card)' }} opacity="0.5" />
  </svg>
);

const ETAPES = [
  { titre: 'Vos proches', texte: 'Seuls ou par foyer, avec leurs allergies et leurs goûts.' },
  {
    titre: 'Une invitation',
    texte: 'Cochez qui vient : Attablés réunit leurs allergies et rappelle ce qu’ils ont déjà mangé.',
  },
  {
    titre: 'Après le repas',
    texte:
      '« Passer en réalisée » : les plats sont retenus pour la prochaine fois, et vous les retrouvez dans l’onglet Plats.',
  },
];

const Porte: React.FC<{ principale?: boolean; titre: string; texte: string; onClick: () => void }> = ({
  principale,
  titre,
  texte,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full min-h-[64px] px-4 py-3 rounded-2xl text-left active:scale-[0.99] transition-transform ${
      principale
        ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-lg'
        : 'bg-[var(--card)] text-[var(--ink)] border border-[var(--border)]'
    }`}
  >
    <span className="block text-[17px] font-bold">{titre}</span>
    <span className={`block text-[14px] ${principale ? '' : 'text-[var(--ink-muted)]'}`}>{texte}</span>
  </button>
);

/**
 * Présentation du premier lancement (et « Revoir la présentation ») : trois écrans glissés
 * par scroll-snap, puis deux portes d'entrée — ou « C'est parti » si le carnet n'est pas vide.
 */
export const Accueil: React.FC<{
  carnetVide: boolean;
  onCommencer: () => void;
  onVisiter: () => void;
  onFermer: () => void;
}> = ({ carnetVide, onCommencer, onVisiter, onFermer }) => {
  const piste = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const titres = useRef<(HTMLHeadingElement | null)[]>([]);

  // Le focus suit l'écran courant : son titre, sans faire défiler la piste.
  useEffect(() => {
    titres.current[index]?.focus({ preventScroll: true });
  }, [index]);

  const aller = (i: number) => {
    const el = piste.current;
    if (!el) return;
    const reduit = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: i * el.clientWidth, behavior: reduit ? 'auto' : 'smooth' });
    setIndex(i);
  };

  const surDefilement = () => {
    const el = piste.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-[var(--bg)] text-[var(--ink)] flex flex-col pt-safe">
      <div className="nappe" aria-hidden="true" />
      {index > 0 && <CoucheRetour key={index} onRetour={() => aller(index - 1)} />}
      <div className="h-14 shrink-0 max-w-[560px] w-full mx-auto px-safe flex items-center justify-end">
        {index < 2 && (
          <button
            type="button"
            onClick={() => aller(2)}
            className="min-h-[44px] px-3 rounded-xl text-[15px] font-semibold text-[var(--ink-muted)]"
          >
            Passer
          </button>
        )}
      </div>

      <div
        ref={piste}
        onScroll={surDefilement}
        className="flex-1 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory [scrollbar-width:none]"
        aria-roledescription="carrousel"
      >
        {/* 1. La promesse */}
        <section aria-label="Écran 1 sur 3" className="w-full shrink-0 snap-center overflow-y-auto">
          <div className="max-w-[560px] mx-auto px-safe pt-4 flex flex-col items-center text-center gap-5">
            <Illustration />
            <h1 ref={(el) => { titres.current[0] = el; }} tabIndex={-1} className="focus:outline-none font-display text-[30px] leading-tight">Qui a déjà mangé quoi ?</h1>
            <p className="text-[17px] text-[var(--ink-muted)] max-w-[22rem]">
              Attablés s’en souvient pour vous : les plats servis, les allergies, les goûts de chacun.
            </p>
          </div>
        </section>

        {/* 2. Comment ça marche */}
        <section aria-label="Écran 2 sur 3" className="w-full shrink-0 snap-center overflow-y-auto">
          <div className="max-w-[560px] mx-auto px-safe pt-2 flex flex-col gap-4">
            <h1 ref={(el) => { titres.current[1] = el; }} tabIndex={-1} className="focus:outline-none font-display text-[28px] text-center">Comment ça marche</h1>
            <ol className="flex flex-col gap-3">
              {ETAPES.map((e, i) => (
                <li key={e.titre} className="carte p-3.5 flex gap-3 items-start">
                  <span className="w-8 h-8 rounded-full bg-[var(--primary)] text-[var(--on-primary)] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-[15px] leading-snug">
                    <b className="block text-[16px]">{e.titre}</b>
                    <span className="text-[var(--ink-muted)]">{e.texte}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="p-3.5 rounded-2xl bg-[var(--success-bg)] text-[var(--success)] text-[15px] font-semibold flex gap-2.5 items-center">
              <Icone nom="shield-check" size={20} className="shrink-0" />
              Tout reste sur ce téléphone. Sans compte, sans connexion.
            </p>
          </div>
        </section>

        {/* 3. Par où commencer ? */}
        <section aria-label="Écran 3 sur 3" className="w-full shrink-0 snap-center overflow-y-auto">
          <div className="max-w-[560px] mx-auto px-safe pt-6 flex flex-col gap-4">
            <h1 ref={(el) => { titres.current[2] = el; }} tabIndex={-1} className="focus:outline-none font-display text-[28px] text-center">Par où commencer ?</h1>
            {carnetVide ? (
              <>
                <Porte
                  principale
                  titre="Commencer avec mes proches"
                  texte="Carnet vide, on vous guide pas à pas."
                  onClick={onCommencer}
                />
                <Porte
                  titre="Visiter avec des exemples"
                  texte="Marc, Sophie, Léa… effaçables d’un geste."
                  onClick={onVisiter}
                />
              </>
            ) : (
              <Porte principale titre="C’est parti" texte="Retour à votre carnet." onClick={onFermer} />
            )}
          </div>
        </section>
      </div>

      <div className="shrink-0 max-w-[560px] w-full mx-auto px-safe pt-3 pb-6 pb-safe flex items-center justify-between gap-3">
        <div className="flex gap-2" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-[var(--primary)]' : 'w-2 bg-[var(--border)]'}`}
            />
          ))}
        </div>
        {index < 2 && (
          <button
            type="button"
            onClick={() => aller(index + 1)}
            className="min-h-[48px] px-6 rounded-2xl bg-[var(--ink)] text-[var(--card)] font-semibold text-[15px] active:scale-[0.98] transition-transform"
          >
            Suivant
          </button>
        )}
      </div>
    </div>
  );
};
