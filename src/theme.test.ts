/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const css = readFileSync(new URL('./index.css', import.meta.url), 'utf8');

/** Variables `--nom: #rrggbb` du premier bloc dont le sélecteur est exactement `selecteur`. */
function variables(selecteur: string): Record<string, string> {
  const debut = css.search(new RegExp(`^${selecteur.replace('.', '\\.')}\\s*\\{`, 'm'));
  assert.ok(debut >= 0, `bloc ${selecteur} introuvable`);
  const bloc = css.slice(debut, css.indexOf('}', debut));
  const vars: Record<string, string> = {};
  for (const [, nom, valeur] of bloc.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) vars[nom] = valeur.toUpperCase();
  return vars;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const PAIRES: [string, string][] = [
  ['ink', 'bg'], ['ink', 'card'], ['ink-muted', 'bg'], ['ink-muted', 'card'],
  ['on-primary', 'primary'], ['primary-ink', 'card'], ['success', 'card'], ['success', 'success-bg'],
  ['pref', 'pref-bg'], ['warning', 'warning-bg'], ['error', 'error-bg'], ['on-alerte', 'alerte'],
];

test('contrastes AA en clair et en sombre', () => {
  const clair = variables(':root');
  const sombre = { ...clair, ...variables('.dark') };
  for (const [nomTheme, vars] of [['clair', clair], ['sombre', sombre]] as const) {
    for (const [texte, fond] of PAIRES) {
      assert.ok(vars[texte], `${nomTheme} : --${texte} manquant`);
      assert.ok(vars[fond], `${nomTheme} : --${fond} manquant`);
      const c = contraste(vars[texte], vars[fond]);
      assert.ok(c >= 4.5, `${nomTheme} : --${texte} sur --${fond} = ${c.toFixed(2)}:1 (< 4,5)`);
    }
  }
});

test("le safran n'est pas le vert de succès", () => {
  const clair = variables(':root');
  const sombre = { ...clair, ...variables('.dark') };
  assert.notEqual(clair.primary, clair.success);
  assert.notEqual(sombre.primary, sombre.success);
});
