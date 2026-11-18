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

test('fermer une feuille et en ouvrir une autre dans le même geste', async () => {
  const h = fauxHistorique();
  const pile = creerPileRetour(h.historique);
  h.brancher(pile.surPopState);
  const fermetures: string[] = [];
  pile.empiler(() => fermetures.push('onglet'));
  const feuille = pile.empiler(() => fermetures.push('feuille'));

  pile.retirer(feuille);
  pile.empiler(() => fermetures.push('fiche')); // même rendu React
  await h.attendre();
  assert.deepEqual(fermetures, []);

  h.historique.back(); // un seul Retour ferme la fiche
  await h.attendre();
  assert.deepEqual(fermetures, ['fiche']);
  h.historique.back(); // le suivant, l'onglet
  await h.attendre();
  assert.deepEqual(fermetures, ['fiche', 'onglet']);
});

test('l’historique reste aligné après un changement de feuille fermé par l’interface', async () => {
  const h = fauxHistorique();
  const pile = creerPileRetour(h.historique);
  h.brancher(pile.surPopState);
  const fermetures: string[] = [];
  pile.empiler(() => fermetures.push('onglet'));
  const feuille = pile.empiler(() => fermetures.push('feuille'));
  pile.retirer(feuille);
  const fiche = pile.empiler(() => fermetures.push('fiche'));
  await h.attendre();

  pile.retirer(fiche); // bouton « Fermer » de la fiche
  await h.attendre();
  h.historique.back();
  await h.attendre();
  assert.deepEqual(fermetures, ['onglet']);
  assert.equal(h.historique.state, null, 'aucune entrée orpheline');
});

test('supprimer une invitation depuis l’éditeur : éditeur et confirmation fermés dans le même rendu', async () => {
  for (const ordre of ['editeur d’abord', 'confirmation d’abord']) {
    const h = fauxHistorique();
    const pile = creerPileRetour(h.historique);
    h.brancher(pile.surPopState);
    const fermetures: string[] = [];
    pile.empiler(() => fermetures.push('recherche'));
    const etatRecherche = h.historique.state;
    const editeur = pile.empiler(() => fermetures.push('editeur'));
    const confirmation = pile.empiler(() => fermetures.push('confirmation'));
    await h.attendre();

    // La confirmation et l'éditeur se démontent ensemble ; l'ordre des nettoyages React n'est pas garanti.
    if (ordre === 'editeur d’abord') {
      pile.retirer(editeur);
      pile.retirer(confirmation);
    } else {
      pile.retirer(confirmation);
      pile.retirer(editeur);
    }
    await h.attendre();
    assert.deepEqual(fermetures, [], ordre);
    assert.equal(h.historique.state, etatRecherche, `${ordre} : aucune entrée orpheline au-dessus de la recherche`);

    h.historique.back(); // un seul Retour ferme la recherche
    await h.attendre();
    assert.deepEqual(fermetures, ['recherche'], ordre);
    assert.equal(h.historique.state, null, ordre);
  }
});

test('« Vider toutes les données » : Réglages, sous-écran et confirmation fermés dans le même rendu', async () => {
  const h = fauxHistorique();
  const pile = creerPileRetour(h.historique);
  h.brancher(pile.surPopState);
  const fermetures: string[] = [];
  pile.empiler(() => fermetures.push('recherche'));
  const etatRecherche = h.historique.state;
  const reglages = pile.empiler(() => fermetures.push('reglages'));
  const sousEcran = pile.empiler(() => fermetures.push('sous-ecran'));
  const confirmation = pile.empiler(() => fermetures.push('confirmation'));
  await h.attendre();

  pile.retirer(reglages); // le parent d'abord, la confirmation en dernier
  pile.retirer(sousEcran);
  pile.retirer(confirmation);
  await h.attendre();
  assert.deepEqual(fermetures, []);
  assert.equal(h.historique.state, etatRecherche, 'aucune entrée orpheline au-dessus de la recherche');

  h.historique.back();
  await h.attendre();
  assert.deepEqual(fermetures, ['recherche']);
  assert.equal(h.historique.state, null);
});

test('une couche ouverte pendant la purge des entrées orphelines garde une entrée alignée', async () => {
  const h = fauxHistorique();
  const pile = creerPileRetour(h.historique);
  h.brancher(pile.surPopState);
  const fermetures: string[] = [];
  const base = pile.empiler(() => fermetures.push('base'));
  void base;
  const a = pile.empiler(() => fermetures.push('a'));
  const b = pile.empiler(() => fermetures.push('b'));
  pile.retirer(a);
  pile.retirer(b);
  pile.empiler(() => fermetures.push('c')); // ouverte dans le même rendu
  await h.attendre();
  assert.deepEqual(fermetures, []);

  h.historique.back();
  await h.attendre();
  assert.deepEqual(fermetures, ['c']);
  h.historique.back();
  await h.attendre();
  assert.deepEqual(fermetures, ['c', 'base']);
  assert.equal(h.historique.state, null);
});

test('Retour utilisateur avec une orpheline sous la couche du dessus', async () => {
  const h = fauxHistorique();
  const pile = creerPileRetour(h.historique);
  h.brancher(pile.surPopState);
  const fermetures: string[] = [];
  pile.empiler(() => fermetures.push('base'));
  const milieu = pile.empiler(() => fermetures.push('milieu'));
  pile.empiler(() => fermetures.push('dessus'));
  await h.attendre();

  pile.retirer(milieu); // fermée par l'interface alors qu'elle n'est pas au sommet : entrée orpheline
  await h.attendre();
  assert.deepEqual(fermetures, []);

  h.historique.back(); // Retour utilisateur : ferme « dessus » seulement
  await h.attendre();
  assert.deepEqual(fermetures, ['dessus']);

  h.historique.back(); // un seul Retour par couche visible : pas de Retour mort sur l'orpheline
  await h.attendre();
  assert.deepEqual(fermetures, ['dessus', 'base']);
  assert.equal(h.historique.state, null);
});
