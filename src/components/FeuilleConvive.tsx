/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import React, { useImperativeHandle, useRef, useState } from 'react';
import type { ContrainteConvive, Convive, Foyer } from '../types/models';
import { affaiblissements } from '../utils/allergenes';
import { ElementsPersonne, FeuilleAjoutElement, FeuilleElement, memesElements } from './ContraintesPersonne';
import { BottomSheet, ConfirmModal } from './SharedUI';

/** Ce que la feuille autour du formulaire peut lui demander. */
export interface PoigneeFiche {
  /**
   * Fermeture (Retour, voile, Échap, Fermer) : fiche inchangée ou nouveau convive sans nom → `onFermer` ;
   * sinon enregistrement annulable. Renvoie `false` si une confirmation s'affiche d'abord (la feuille reste ouverte).
   */
  fermer: () => boolean;
}

interface FormulaireConviveProps {
  convive?: Convive;
  foyerIdInitial?: string;
  foyers: Foyer[];
  /** Aliments libres déjà portés par des personnes ou des plats (`alimentsLibresConnus`). */
  libresConnus: string[];
  /** `annulable` : le bandeau « Annuler » doit suivre (allergie affaiblie confirmée, ou fermeture qui enregistre). */
  onEnregistrer: (c: Convive, annulable: boolean) => void;
}

/** Formulaire de création ou de modification d'un convive (sans feuille autour). */
export const FormulaireConvive: React.FC<
  FormulaireConviveProps & { onFermer: () => void; ref?: React.Ref<PoigneeFiche> }
> = ({ convive, foyerIdInitial, foyers, libresConnus, onEnregistrer, onFermer, ref }) => {
  const [id] = useState(() => convive?.id ?? `conv-${Date.now()}`);
  const [nom, setNom] = useState(convive?.nomAffiche ?? '');
  const [foyerId, setFoyerId] = useState(convive?.foyerId ?? foyerIdInitial ?? '');
  const [libre, setLibre] = useState(convive?.contrainteLibre ?? '');
  const [contraintes, setContraintes] = useState<ContrainteConvive[]>(convive?.contraintes ?? []);
  const [enEdition, setEnEdition] = useState<ContrainteConvive | null>(null);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [confirmation, setConfirmation] = useState<{ convive: Convive; affaiblies: string[] } | null>(null);
  const prenom = nom.trim();

  // Nom vidé sur une fiche existante : on garde l'ancien plutôt que de perdre la personne.
  const construire = (): Convive => ({
    id,
    nomAffiche: prenom || convive?.nomAffiche || '',
    ...(foyerId ? { foyerId } : {}),
    contraintes,
    contrainteLibre: libre.trim(),
  });

  const inchangee = (c: Convive) =>
    convive !== undefined &&
    c.nomAffiche === convive.nomAffiche &&
    (c.foyerId ?? '') === (convive.foyerId ?? '') &&
    c.contrainteLibre === convive.contrainteLibre.trim() &&
    memesElements(c.contraintes, convive.contraintes);

  /** Enregistre, ou demande d'abord confirmation si une allergie est affaiblie ; vrai si c'est fait. */
  const enregistrer = (c: Convive, annulable: boolean): boolean => {
    const affaiblies = affaiblissements(convive?.contraintes ?? [], c.contraintes);
    if (affaiblies.length > 0) {
      setConfirmation({ convive: c, affaiblies });
      return false;
    }
    onEnregistrer(c, annulable);
    return true;
  };

  useImperativeHandle(ref, () => ({
    fermer: () => {
      if (!convive && !prenom) {
        onFermer();
        return true;
      }
      const c = construire();
      if (inchangee(c)) {
        onFermer();
        return true;
      }
      return enregistrer(c, true);
    },
  }));

  const soumettre = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prenom) return;
    enregistrer(construire(), false);
  };

  return (
    <>
      <form onSubmit={soumettre} className="flex flex-col gap-4">
        <div>
          <label htmlFor="convive-nom" className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-1">
            Nom affiché
          </label>
          <input
            id="convive-nom"
            type="text"
            required
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Prénom, nom ou pseudo…"
            className="w-full min-h-[46px] px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[15px] text-[var(--ink)] focus:outline-none focus:border-[var(--primary-ink)]"
          />
        </div>

        <div>
          <label htmlFor="convive-foyer" className="block text-[14px] font-semibold text-[var(--ink-muted)] mb-1">
            Foyer (optionnel)
          </label>
          <select
            id="convive-foyer"
            value={foyerId}
            onChange={(e) => setFoyerId(e.target.value)}
            className="w-full min-h-[46px] px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[15px] text-[var(--ink)] focus:outline-none focus:border-[var(--primary-ink)]"
          >
            <option value="">Sans foyer</option>
            {foyers.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
              </option>
            ))}
          </select>
        </div>

        <ElementsPersonne
          prenom={prenom}
          contraintes={contraintes}
          onOuvrir={setEnEdition}
          onRetirer={(idElement) => setContraintes((prev) => prev.filter((x) => x.id !== idElement))}
          onAjouter={() => setAjoutOuvert(true)}
        />

        <div>
          <label htmlFor="convive-libre" className="block text-[14px] font-semibold text-[var(--ink-muted)]">
            Note libre (goûts, précisions…)
          </label>
          <p id="convive-libre-aide" className="text-[13px] text-[var(--ink-muted)] mb-1">
            Une allergie ? Ajoutez-la ci-dessus pour être alerté.
          </p>
          <textarea
            id="convive-libre"
            rows={2}
            value={libre}
            onChange={(e) => setLibre(e.target.value)}
            aria-describedby="convive-libre-aide"
            placeholder="Ex. N’aime pas la coriandre, tolère le fromage de chèvre…"
            className="w-full p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[15px] text-[var(--ink)] focus:outline-none focus:border-[var(--primary-ink)]"
          />
        </div>

        <button
          type="submit"
          className="min-h-[48px] w-full rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold text-[15px] mt-1 active:scale-[0.98] transition-transform"
        >
          {convive ? 'Enregistrer les modifications' : 'Ajouter le convive'}
        </button>
      </form>

      {/* Hors du <form> : leurs propres formulaires ne doivent pas soumettre la fiche. */}
      {enEdition && (
        <FeuilleElement
          element={enEdition}
          libresConnus={libresConnus}
          onAppliquer={(c) => setContraintes((prev) => prev.map((x) => (x.id === c.id ? c : x)))}
          onFermer={() => setEnEdition(null)}
        />
      )}
      {ajoutOuvert && (
        <FeuilleAjoutElement
          prenom={prenom}
          contraintes={contraintes}
          libresConnus={libresConnus}
          onAjouter={(c) => setContraintes((prev) => [...prev, c])}
          onFermer={() => setAjoutOuvert(false)}
        />
      )}
      <ConfirmModal
        open={confirmation !== null}
        title={`Retirer une allergie de ${confirmation?.convive.nomAffiche ?? ''} ?`}
        description={`Les alertes ne signaleront plus : ${confirmation?.affaiblies.join(', ') ?? ''}. Vous pourrez annuler juste après.`}
        confirmLabel="Continuer"
        cancelLabel="Revenir à la fiche"
        onConfirm={() => {
          if (!confirmation) return;
          setConfirmation(null);
          onEnregistrer(confirmation.convive, true);
        }}
        onCancel={() => setConfirmation(null)}
      />
    </>
  );
};

/** Feuille de création ou de modification d'un convive : sa fermeture passe par la fiche (`PoigneeFiche`). */
export const FeuilleConvive: React.FC<FormulaireConviveProps & { ouverte: boolean; onFermer: () => void }> = ({
  ouverte,
  onFermer,
  ...formulaire
}) => {
  const fiche = useRef<PoigneeFiche>(null);
  return (
    <BottomSheet
      open={ouverte}
      title={formulaire.convive ? 'Modifier le convive' : 'Nouveau convive'}
      zClass="z-[55]"
      onClose={() => (fiche.current ? fiche.current.fermer() : (onFermer(), true))}
    >
      <FormulaireConvive
        key={formulaire.convive?.id ?? 'nouveau'}
        ref={fiche}
        {...formulaire}
        onFermer={onFermer}
      />
    </BottomSheet>
  );
};
