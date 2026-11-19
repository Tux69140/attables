/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Onglet « Plats » : vérifier une idée de menu, enregistrer un plat, faire la rétrospective.
 */
import React, { useMemo, useState } from 'react';
import { ICONE_SERVICE } from '../icones/services';
import {
  COURSE_KEYS,
  COURSE_LABELS,
  type Convive,
  type CourseKey,
  type Invitation,
  type PlatFiche,
} from '../types/models';
import { alimentsLibresConnus, iconeAllergene } from '../utils/allergenes';
import { formatJourMois } from '../utils/dates';
import { formatDishInput, getElapsedTimeInfo, getTodayIso } from '../utils/dishes';
import {
  cleDePlat,
  compterFiltres,
  type EtatPlat,
  type PlatConnu,
  rechercherPlats,
  repertoirePlats,
} from '../utils/plats';
import { Puces } from './Controles';
import { FeuillePlat, type ValeursPlat } from './FeuillePlat';
import { FichePlat } from './FichePlat';
import { Icone } from './Icone';
import { IconBan, IconClock, IconClose, IconHeart, IconPlus, IconSearch } from './Icons';

type Filtre = 'tous' | 'idees' | 'coeur' | 'peut_revenir' | 'a_eviter';

/** Feuille ouverte : nouveau plat (depuis la saisie), allergènes d'un plat connu, ou modification d'une idée. */
type Feuille = null | { mode: 'nouveau'; libelle: string } | { mode: 'allergenes' | 'modifier'; cle: string };

const garder = (p: PlatConnu, f: Filtre) =>
  f === 'tous' ||
  (f === 'idees' && p.etat === 'idee') ||
  (f === 'coeur' && p.coupDeCoeur) ||
  (f === 'peut_revenir' && p.etat === 'peut_revenir') ||
  (f === 'a_eviter' && p.etat === 'a_eviter');

const PastilleEtat: React.FC<{ plat: PlatConnu; aujourdHui: string }> = ({ plat, aujourdHui }) => {
  const styles: Record<EtatPlat, string> = {
    a_eviter: 'bg-[var(--error-bg)] text-[var(--error)]',
    recent: 'bg-[var(--warning-bg)] text-[var(--warning)]',
    peut_revenir: 'bg-[var(--success-bg)] text-[var(--success)]',
    prevu: 'bg-[var(--surface-elevated)] text-[var(--ink-muted)]',
    idee: 'bg-[var(--indic)] text-[var(--primary-ink)]',
  };
  const texte =
    plat.etat === 'a_eviter'
      ? 'à éviter'
      : plat.etat === 'recent'
        ? `récent · ${getElapsedTimeInfo(plat.derniereServie!.date, aujourdHui).label}`
        : plat.etat === 'peut_revenir'
          ? 'peut revenir'
          : plat.etat === 'prevu'
            ? 'prévu'
            : 'idée';
  return (
    <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[13px] font-bold ${styles[plat.etat]}`}>
      {plat.etat === 'a_eviter' && <IconBan size={13} />}
      {plat.etat === 'recent' && <IconClock size={13} />}
      {texte}
    </span>
  );
};

export const PlatsTab: React.FC<{
  invitations: Invitation[];
  plats: PlatFiche[];
  convivesById: Map<string, Convive>;
  prescriptionMois: number;
  /** Crée la fiche, ou complète celle du même plat. */
  onEnregistrerFiche: (v: ValeursPlat) => void;
  /** Remplace une fiche existante (services et allergènes, nom d'une idée). */
  onRemplacerFiche: (fiche: PlatFiche) => void;
  onSupprimerFiche: (id: string) => void;
  onPreparerAvecPlat: (libelle: string, course: CourseKey) => void;
}> = ({
  invitations,
  plats,
  convivesById,
  prescriptionMois,
  onEnregistrerFiche,
  onRemplacerFiche,
  onSupprimerFiche,
  onPreparerAvecPlat,
}) => {
  const aujourdHui = getTodayIso();
  const [saisie, setSaisie] = useState('');
  const [filtre, setFiltre] = useState<Filtre>('tous');
  const [cleOuverte, setCleOuverte] = useState<string | null>(null);
  const [feuille, setFeuille] = useState<Feuille>(null);
  const [erreur, setErreur] = useState<string | undefined>();

  const liste = useMemo(
    () => repertoirePlats(invitations, plats, convivesById, prescriptionMois, aujourdHui),
    [invitations, plats, convivesById, prescriptionMois, aujourdHui]
  );
  const libresConnus = useMemo(() => alimentsLibresConnus([...convivesById.values()], plats), [convivesById, plats]);
  const compteurs = compterFiltres(liste);
  const { resultats, proposerEnregistrement } = rechercherPlats(liste, saisie);
  const visibles = resultats.filter((p) => garder(p, filtre));
  const platOuvert = liste.find((p) => p.cle === cleOuverte) ?? null;
  const platFeuille = feuille && feuille.mode !== 'nouveau' ? liste.find((p) => p.cle === feuille.cle) : undefined;

  const fermerFeuille = () => {
    setFeuille(null);
    setErreur(undefined);
  };

  const enregistrer = (v: ValeursPlat) => {
    if (feuille?.mode === 'nouveau') {
      onEnregistrerFiche(v);
      setSaisie('');
      fermerFeuille();
      return;
    }
    if (!platFeuille) return;
    if (platFeuille.fiche) {
      const nouveauNom = feuille?.mode === 'modifier' ? v.libelle : platFeuille.fiche.libelle;
      const autre = liste.find((p) => p.cle !== platFeuille.cle && p.cle === cleDePlat(nouveauNom));
      if (autre) {
        setErreur(`« ${autre.libelle} » existe déjà.`);
        return;
      }
      const { sansAllergene: _ancien, ...fiche } = platFeuille.fiche;
      onRemplacerFiche({
        ...fiche,
        libelle: nouveauNom,
        services: v.services,
        allergenes: v.allergenes,
        ...(v.sansAllergene && v.allergenes.length === 0 ? { sansAllergene: true } : {}),
      });
      if (feuille?.mode === 'modifier') setCleOuverte(cleDePlat(nouveauNom));
    } else {
      onEnregistrerFiche({ ...v, libelle: platFeuille.libelle });
    }
    fermerFeuille();
  };

  const ligne = (plat: PlatConnu) => {
    const der = plat.derniereServie ?? plat.apparitions[0];
    const sousLigne = [
      plat.derniereServie ? `${der!.hoteLabel} · ${formatJourMois(der!.date, aujourdHui)}` : plat.etat === 'idee' ? 'jamais servi' : '',
      plat.prevuLe ? `prévu le ${formatJourMois(plat.prevuLe, aujourdHui)}` : '',
    ]
      .filter(Boolean)
      .join(' · ');
    return (
      <button
        type="button"
        onClick={() => setCleOuverte(plat.cle)}
        className="w-full min-h-[56px] px-4 py-2.5 text-left flex items-center justify-between gap-3 active:bg-[var(--surface-active)]/50 transition-colors"
      >
        <span className="min-w-0 flex flex-col gap-0.5">
          <span className="text-[16px] font-bold text-[var(--ink)] flex items-center gap-1.5">
            <span className="break-words min-w-0">{plat.libelle}</span>
            {plat.coupDeCoeur && (
              <>
                <IconHeart size={15} filled className="text-[var(--success)] shrink-0" />
                <span className="sr-only">coup de cœur</span>
              </>
            )}
          </span>
          {sousLigne && <span className="text-[14px] text-[var(--ink-muted)] break-words min-w-0">{sousLigne}</span>}
          {plat.allergenes.length > 0 && (
            <span className="flex flex-wrap gap-1.5 text-[var(--ink-muted)]" aria-label="Allergènes renseignés">
              {plat.allergenes.map((id) => (
                <Icone key={id} nom={iconeAllergene(id)} size={15} />
              ))}
            </span>
          )}
        </span>
        <PastilleEtat plat={plat} aujourdHui={aujourdHui} />
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4 pb-below-nav">
      <h1 className="sr-only" tabIndex={-1} data-titre-vue>Plats</h1>
      <div className="relative">
        <IconSearch size={19} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] pointer-events-none" />
        <input
          type="text"
          enterKeyHint="search"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder="Vérifier ou enregistrer un plat…"
          aria-label="Vérifier ou enregistrer un plat"
          className="w-full min-h-[48px] pl-10 pr-12 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[16px] text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--primary-ink)]"
        />
        {saisie && (
          <button
            type="button"
            onClick={() => setSaisie('')}
            aria-label="Effacer la saisie"
            className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--ink-muted)]"
          >
            <IconClose size={18} />
          </button>
        )}
      </div>

      {proposerEnregistrement && (
        <button
          type="button"
          onClick={() => setFeuille({ mode: 'nouveau', libelle: formatDishInput(saisie) })}
          className="w-full min-h-[56px] px-4 py-2.5 rounded-2xl border-2 border-dashed border-[var(--primary)] bg-[var(--card)] text-left flex items-center gap-3"
        >
          <IconPlus size={20} className="text-[var(--primary-ink)] shrink-0" />
          <span>
            <span className="block text-[16px] text-[var(--ink)]">
              Enregistrer <b>« {formatDishInput(saisie)} »</b>
            </span>
            <span className="block text-[14px] text-[var(--ink-muted)]">Jamais servi : il rejoindra vos idées.</span>
          </span>
        </button>
      )}

      {liste.length === 0 ? (
        <div className="carte p-6 text-center flex flex-col items-center gap-2">
          <Icone nom="hand-platter" size={28} className="text-[var(--primary-ink)]" />
          <h2 className="font-display text-xl text-[var(--ink)]">Aucun plat pour l’instant</h2>
          <p className="text-[15px] text-[var(--ink-muted)] max-w-sm">
            Les plats de vos menus apparaîtront ici. Notez aussi ceux que vous aimeriez proposer : tapez leur nom
            ci-dessus.
          </p>
        </div>
      ) : (
        <>
          <Puces
            ariaLabel="Filtrer les plats"
            valeur={filtre}
            onChange={setFiltre}
            options={[
              { id: 'tous', label: `Tous · ${compteurs.tous}` },
              { id: 'idees', label: `Idées · ${compteurs.idees}` },
              { id: 'coeur', label: `Coups de cœur · ${compteurs.coeur}`, icone: 'heart' },
              { id: 'peut_revenir', label: `Peuvent revenir · ${compteurs.peut_revenir}` },
              { id: 'a_eviter', label: `À éviter · ${compteurs.a_eviter}`, icone: 'ban' },
            ]}
          />
          {visibles.length === 0 ? (
            <p className="py-8 text-center text-[15px] text-[var(--ink-muted)]">
              {saisie.trim() ? 'Aucun plat connu ne correspond.' : 'Aucun plat dans ce filtre.'}
            </p>
          ) : (
            COURSE_KEYS.map((k) => {
              const groupe = visibles.filter((p) => p.services.includes(k));
              if (groupe.length === 0) return null;
              return (
                <section key={k} aria-labelledby={`plats-${k}`} className="flex flex-col gap-2">
                  <h2 id={`plats-${k}`} className="font-display text-[20px] text-[var(--ink)] flex items-center gap-2 px-0.5">
                    <Icone nom={ICONE_SERVICE[k]} size={20} className="text-[var(--primary-ink)]" />
                    {COURSE_LABELS[k]}
                    <span
                      aria-hidden="true"
                      className="font-sans text-[13px] font-bold leading-none px-2 py-1 rounded-full bg-[var(--surface-elevated)] text-[var(--ink-muted)] tabular-nums"
                    >
                      {groupe.length}
                    </span>
                    <span className="sr-only">
                      , {groupe.length} {groupe.length > 1 ? 'plats' : 'plat'}
                    </span>
                  </h2>
                  <ul className="carte overflow-hidden divide-y divide-[var(--border)]/70">
                    {groupe.map((p) => (
                      <li key={p.cle}>{ligne(p)}</li>
                    ))}
                  </ul>
                </section>
              );
            })
          )}
        </>
      )}

      <FichePlat
        plat={platOuvert}
        aujourdHui={aujourdHui}
        prescriptionMois={prescriptionMois}
        onFermer={() => setCleOuverte(null)}
        onAllergenes={() => platOuvert && setFeuille({ mode: 'allergenes', cle: platOuvert.cle })}
        onModifier={() => platOuvert && setFeuille({ mode: 'modifier', cle: platOuvert.cle })}
        onPreparer={() => platOuvert && onPreparerAvecPlat(platOuvert.libelle, platOuvert.services[0] ?? 'plat')}
        onSupprimer={() => {
          if (platOuvert?.fiche) {
            setCleOuverte(null);
            onSupprimerFiche(platOuvert.fiche.id);
          }
        }}
      />

      <FeuillePlat
        ouverte={feuille !== null && (feuille.mode === 'nouveau' || Boolean(platFeuille))}
        titre={
          feuille?.mode === 'nouveau'
            ? 'Enregistrer un plat'
            : feuille?.mode === 'modifier'
              ? 'Modifier l’idée'
              : `Allergènes · ${platFeuille?.libelle ?? ''}`
        }
        initial={
          feuille?.mode === 'nouveau'
            ? { libelle: feuille.libelle, services: [], allergenes: [], sansAllergene: false }
            : {
                libelle: platFeuille?.libelle ?? '',
                services: platFeuille?.services ?? [],
                allergenes: platFeuille?.allergenes ?? [],
                sansAllergene: platFeuille?.fiche?.sansAllergene ?? false,
              }
        }
        nomModifiable={feuille?.mode !== 'allergenes'}
        allergenesOuverts={feuille?.mode === 'allergenes'}
        cleActuelle={platFeuille?.cle}
        liste={liste}
        libresConnus={libresConnus}
        erreur={erreur}
        libelleBouton={feuille?.mode === 'nouveau' ? 'Enregistrer le plat' : 'Enregistrer'}
        onEnregistrer={enregistrer}
        onOuvrirPlat={(cle) => {
          fermerFeuille();
          setCleOuverte(cle);
        }}
        onFermer={fermerFeuille}
      />
    </div>
  );
};

