/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { creerPileRetour, type HistoriqueMinimal } from './pileRetour';

/** Historique de navigateur simulé : `back()` émet son popstate plus tard, comme le vrai. */
function fauxHistorique() {
  const entrees: unknown[] = [null];
  let index = 0;
  let surPopState: () => void = () => {};
  const historique: HistoriqueMinimal = {
    get state() {
      return entrees[index];
    },
    pushState(state) {
      entrees.splice(index + 1);
      entrees.push(state);
      index += 1;
    },
    back() {
      setTimeout(() => {
        if (index === 0) return;
        index -= 1;
        surPopState();
      }, 0);
    },
  };
  return {
    historique,
    brancher: (f: () => void) => (surPopState = f),
    attendre: () => new Promise((r) => setTimeout(r, 5)),
  };
}

test('fermer par l\'interface la couche du dessus ne ferme pas celle du dessous', async () => {
  const h = fauxHistorique();
  const pile = creerPileRetour(h.historique);
  h.brancher(pile.surPopState);
  const fermetures: string[] = [];
  pile.empiler(() => fermetures.push('onglet'));
  const feuille = pile.empiler(() => fermetures.push('feuille'));

  pile.retirer(feuille);
  await h.attendre();
  assert.deepEqual(fermetures, []);

  h.historique.back(); // bouton Retour d'Android
  await h.attendre();
  assert.deepEqual(fermetures, ['onglet']);
});

test('le bouton Retour ferme la couche du dessus seulement', async () => {
  const h = fauxHistorique();
  const pile = creerPileRetour(h.historique);
  h.brancher(pile.surPopState);
  const fermetures: string[] = [];
  pile.empiler(() => fermetures.push('onglet'));
  const feuille = pile.empiler(() => fermetures.push('feuille'));

  h.historique.back();
  await h.attendre();
  assert.deepEqual(fermetures, ['feuille']);
  pile.retirer(feuille); // le composant se démonte ensuite : rien de plus
  await h.attendre();
  assert.deepEqual(fermetures, ['feuille']);
});
