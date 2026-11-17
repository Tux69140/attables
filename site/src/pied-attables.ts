/*
 * Copyright (C) 2026 Stéphane MICHEL
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
// Le pied de site d'Attablés : son contenu. La présentation commune est dans pied-de-site.js.
import { version } from '../../package.json';
import { poserPied } from './pied-de-site.js';
import './pied-de-site.css';
import './pied-attables.css';
import '../../src/polices.css';

poserPied({
  nom: 'Attablés',
  logo: '<img class="pied-icone" src="/icone-attables.png" alt="" width="30" height="30">',
  phrase: 'Le carnet des invités : qui est venu, qui ne mange pas de quoi, ce qu’on a déjà servi.',
  engagement: 'Sans publicité ni mesure d’audience',
  version,
  liens: [
    { texte: 'Essayer la démo', href: '/demo/' },
    { texte: 'Télécharger', href: '/#telecharger' },
    { texte: 'Notes de version', href: '/notes-de-version.html' },
    { texte: 'Code source (GitHub)', href: 'https://github.com/Tux69140/attables' },
  ],
  legal: [
    { texte: 'Mentions légales', href: '/mentions-legales.html' },
    { texte: 'Confidentialité', href: '/confidentialite.html' },
    { texte: 'Conditions d’utilisation', href: '/conditions-utilisation.html' },
  ],
});

// Adresses e-mail des pages légales : composées ici (la CSP interdit les scripts en ligne).
document.querySelectorAll<HTMLAnchorElement>('.email-link').forEach((a) => {
  const u = a.dataset.user;
  const d = a.dataset.domain;
  if (!u || !d) return;
  a.href = 'mailto:' + u + '@' + d;
  a.textContent = u + ' [at] ' + d;
});
