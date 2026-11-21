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
  // Reculs dont le popstate n'est pas encore émis : `attendre` les laisse tous aboutir,
  // y compris ceux qu'un popstate relance (purge des entrées orphelines).
  let enCours = 0;
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
      enCours += 1;
      setTimeout(() => {
        enCours -= 1;
        if (index === 0) return;
        index -= 1;
        surPopState();
      }, 0);
    },
  };
  return {
    historique,
    brancher: (f: () => void) => (surPopState = f),
    attendre: async () => {
      do await new Promise((r) => setTimeout(r, 0));
      while (enCours > 0);
    },
    /** Rang de l'entrée courante (0 = l'entrée d'origine). */
    profondeur: () => index,
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

test('estAuDessus : seule la dernière couche empilée', () => {
  const h = fauxHistorique();
  const pile = creerPileRetour(h.historique);
  const a = pile.empiler(() => {});
  const b = pile.empiler(() => {});
  assert.equal(pile.estAuDessus(b), true);
  assert.equal(pile.estAuDessus(a), false);
  pile.retirer(b);
  assert.equal(pile.estAuDessus(a), true);
  assert.equal(pile.estAuDessus('inconnue'), false);
});

test('couche ré-armée par son Retour, puis confirmation par-dessus, fermées ensemble par l’interface', async () => {
  // Comme `useAndroidBack` quand `onBack` renvoie false (fiche modifiée qui affaiblit une allergie) :
  // la couche reprend une entrée pendant `surPopState`, puis la confirmation s'ouvre au rendu suivant.
  for (const ordre of ['confirmation d’abord', 'fiche d’abord']) {
    const h = fauxHistorique();
    const pile = creerPileRetour(h.historique);
    h.brancher(pile.surPopState);
    const fermetures: string[] = [];
    pile.empiler(() => fermetures.push('onglet'));
    const etatOnglet = h.historique.state;
    const base = h.profondeur();

    let fiche: string | null = null;
    let confirmation: string | null = null;
    const armer = () => {
      fiche = pile.empiler(() => {
        fiche = null;
        fermetures.push('fiche refuse');
        armer(); // ré-armée pendant surPopState
        queueMicrotask(() => {
          confirmation = pile.empiler(() => fermetures.push('confirmation'));
        });
      });
    };
    armer();
    await h.attendre();

    h.historique.back(); // Retour : la fiche reste, la confirmation s'ouvre
    await h.attendre();
    assert.ok(fiche && confirmation, ordre);
    assert.equal(h.profondeur(), base + 2, `${ordre} : une entrée pour la fiche, une pour la confirmation`);

    // « Continuer » : fiche et confirmation se démontent dans le même rendu, dans un ordre non garanti.
    const ids = ordre === 'confirmation d’abord' ? [confirmation!, fiche!] : [fiche!, confirmation!];
    ids.forEach((id) => pile.retirer(id));
    await h.attendre();
    await h.attendre();
    assert.equal(h.profondeur(), base, `${ordre} : retour à la profondeur de l’onglet`);
    assert.equal(h.historique.state, etatOnglet, `${ordre} : aucune entrée orpheline`);

    h.historique.back(); // un seul Retour ferme l'onglet
    await h.attendre();
    assert.deepEqual(fermetures, ['fiche refuse', 'onglet'], ordre);
    assert.equal(h.profondeur(), 0, ordre);
  }
});
