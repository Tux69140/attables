import React, { useEffect, useRef, useState } from 'react';
import { useAndroidBack } from '../hooks/useAndroidBack';
import { useAutoHideChrome } from '../hooks/useAutoHideChrome';
import { useHauteurMesuree } from '../hooks/useHauteurMesuree';
import { focaliserTitreVue, rendreFocus } from '../hooks/focusVues';
import { URL_NOTES_DE_VERSION, ouvrirLien } from '../services/liens';
import { migrateAndValidateAppData } from '../services/storage';
import { AppData, ThemeMode } from '../types/models';
import { getTodayIso } from '../utils/dishes';
import {
  FoyerPictoIcon,
  IconArrowLeft,
  IconBan,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconClose,
  IconDownload,
  IconShield,
  IconTrash,
  IconUpload,
  IconUtensils,
} from './Icons';
import { Puces } from './Controles';
import { ConfirmModal } from './SharedUI';

type SettingsSection =
  | 'root'
  | 'apparence'
  | 'memoire'
  | 'sauvegarde'
  | 'apropos';

const SECTION_TITLES: Record<SettingsSection, string> = {
  root: 'Réglages',
  apparence: 'Apparence',
  memoire: 'Mémoire des plats',
  sauvegarde: 'Sauvegarde & Données',
  apropos: 'À propos',
};

const THEMES: { id: ThemeMode; label: string; desc: string }[] = [
  { id: 'appareil', label: 'Appareil', desc: 'Suit automatiquement les réglages clair/sombre d’Android.' },
  { id: 'clair', label: 'Clair', desc: 'Safran — fond crème, encre expresso, touches safran.' },
  { id: 'sombre', label: 'Sombre', desc: 'Nuit marine — confort visuel en soirée ou faible luminosité.' },
];

interface SettingsScreenProps {
  data: AppData;
  onChangeTheme: (theme: ThemeMode) => void;
  onChangePrescriptionMois: (mois: number) => void;
  onRestoreBackup: (restored: AppData) => void;
  onClearAllData: () => void;
  onResetSampleData: () => void;
  resteDesExemples: boolean;
  onEffacerExemples: () => void;
  onRevoirPresentation: () => void;
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  data,
  onChangeTheme,
  onChangePrescriptionMois,
  onRestoreBackup,
  onClearAllData,
  onResetSampleData,
  resteDesExemples,
  onEffacerExemples,
  onRevoirPresentation,
  onClose,
}) => {
  const [section, setSection] = useState<SettingsSection>('root');
  const { visible: chromeVisible } = useAutoHideChrome(`settings-${section}`);
  // Hauteur réelle de l'en-tête (grand texte) : voir useHauteurMesuree.
  const enteteRef = useRef<HTMLElement>(null);
  useHauteurMesuree(enteteRef, '--hauteur-entete');

  const [pendingRestore, setPendingRestore] = useState<AppData | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSampleConfirm, setShowSampleConfirm] = useState(false);
  const [showEffacerExemplesConfirm, setShowEffacerExemplesConfirm] = useState(false);
  const [showLicenseDetails, setShowLicenseDetails] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Focus : titre de la vue à l'ouverture et à l'entrée dans une section ; au retour à la racine,
  // l'entrée de la section quittée (après le rendu).
  const sectionPrecedente = useRef<SettingsSection | null>(null);
  useEffect(() => {
    const quittee = sectionPrecedente.current;
    sectionPrecedente.current = section;
    if (section === 'root' && quittee && quittee !== 'root') rendreFocus(`section-${quittee}`);
    else focaliserTitreVue();
  }, [section]);

  const navigateToSection = (target: SettingsSection) => {
    setSection(target);
    window.scrollTo({ top: 0 });
  };

  const handleBack = () => {
    if (section !== 'root') {
      setSection('root');
      window.scrollTo({ top: 0 });
    } else {
      onClose();
    }
  };

  useAndroidBack(true, onClose);
  useAndroidBack(section !== 'root', () => {
    setSection('root');
    window.scrollTo({ top: 0 });
  });

  const handleExportJson = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attables-sauvegarde-${getTodayIso()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2600);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreError(null);
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const validated = migrateAndValidateAppData(parsed);
      setPendingRestore(validated);
    } catch (err) {
      setRestoreError(
        err instanceof Error
          ? err.message
          : 'Impossible de lire ce fichier de sauvegarde.'
      );
    }
  };

  const themeSummaryLabel =
    data.settings.theme === 'appareil'
      ? 'Appareil (automatique)'
      : data.settings.theme === 'clair'
      ? 'Clair (Safran)'
      : 'Sombre (Nuit marine)';

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      {/* Centered-title 3-zone Top Bar */}
      <header
        ref={enteteRef}
        className={`fixed top-0 left-0 right-0 z-30 bg-[var(--bg)] border-b border-[var(--border)] pt-safe chrome-mouvement ${
          chromeVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-[1080px] mx-auto px-safe min-h-14 grid grid-cols-[44px_1fr_44px] items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            aria-label={section === 'root' ? 'Retour' : 'Retour aux réglages'}
            className="justify-self-start min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-xl text-[var(--ink)] hover:bg-[var(--surface-elevated)] active:scale-95 transition-transform"
          >
            <IconArrowLeft size={22} />
          </button>
          <h1 tabIndex={-1} data-titre-vue className="focus:outline-none font-display text-[20px] text-[var(--ink)] text-center break-words min-w-0 px-1">
            {SECTION_TITLES[section]}
          </h1>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer les réglages"
            className="justify-self-end min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-[var(--ink-muted)] hover:bg-[var(--surface-elevated)] active:scale-95 transition-transform"
          >
            <IconClose size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1080px] mx-auto px-safe pt-below-header pb-safe-content flex flex-col gap-5">
        {/* ROOT: Android Settings Menu Hub */}
        {section === 'root' && (
          <div className="carte overflow-hidden divide-y divide-[var(--border)]">
            <button
              type="button"
              onClick={() => navigateToSection('apparence')}
              data-focus-cle="section-apparence"
              className="w-full min-h-[72px] px-4 py-3.5 flex items-center justify-between gap-3.5 text-left hover:bg-[var(--surface-elevated)]/60 active:bg-[var(--surface-active)]/50 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--primary-ink)] flex items-center justify-center shrink-0">
                  <FoyerPictoIcon picto="soleil" size={22} />
                </div>
                <div className="min-w-0">
                  <div className="text-[16px] font-semibold text-[var(--ink)]">
                    Apparence
                  </div>
                  <div className="text-[14px] text-[var(--ink-muted)] break-words min-w-0">
                    {themeSummaryLabel}
                  </div>
                </div>
              </div>
              <IconChevronRight size={19} className="text-[var(--ink-muted)] shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('memoire')}
              data-focus-cle="section-memoire"
              className="w-full min-h-[72px] px-4 py-3.5 flex items-center justify-between gap-3.5 text-left hover:bg-[var(--surface-elevated)]/60 active:bg-[var(--surface-active)]/50 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--primary-ink)] flex items-center justify-center shrink-0">
                  <IconClock size={22} />
                </div>
                <div className="min-w-0">
                  <div className="text-[16px] font-semibold text-[var(--ink)]">
                    Mémoire des plats
                  </div>
                  <div className="text-[14px] text-[var(--ink-muted)] break-words min-w-0 tabular-nums">
                    Alerte forte sous {data.settings.prescriptionMois} mois
                  </div>
                </div>
              </div>
              <IconChevronRight size={19} className="text-[var(--ink-muted)] shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('sauvegarde')}
              data-focus-cle="section-sauvegarde"
              className="w-full min-h-[72px] px-4 py-3.5 flex items-center justify-between gap-3.5 text-left hover:bg-[var(--surface-elevated)]/60 active:bg-[var(--surface-active)]/50 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--primary-ink)] flex items-center justify-center shrink-0">
                  <IconDownload size={21} />
                </div>
                <div className="min-w-0">
                  <div className="text-[16px] font-semibold text-[var(--ink)]">
                    Sauvegarde & Données
                  </div>
                  <div className="text-[14px] text-[var(--ink-muted)] break-words min-w-0 tabular-nums">
                    {data.invitations.length} invitations · {data.convives.length} convives ·{' '}
                    {data.foyers.length} foyers
                  </div>
                </div>
              </div>
              <IconChevronRight size={19} className="text-[var(--ink-muted)] shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('apropos')}
              data-focus-cle="section-apropos"
              className="w-full min-h-[72px] px-4 py-3.5 flex items-center justify-between gap-3.5 text-left hover:bg-[var(--surface-elevated)]/60 active:bg-[var(--surface-active)]/50 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--primary-ink)] flex items-center justify-center shrink-0">
                  <IconShield size={22} />
                </div>
                <div className="min-w-0">
                  <div className="text-[16px] font-semibold text-[var(--ink)]">
                    À propos & Vie privée
                  </div>
                  <div className="text-[14px] text-[var(--ink-muted)] break-words min-w-0">
                    Version 0.3.0 · GPL v3.0 · BioVibraLyon
                  </div>
                </div>
              </div>
              <IconChevronRight size={19} className="text-[var(--ink-muted)] shrink-0" />
            </button>

            <button
              type="button"
              onClick={onRevoirPresentation}
              className="w-full min-h-[72px] px-4 py-3.5 flex items-center justify-between gap-3.5 text-left hover:bg-[var(--surface-elevated)]/60 active:bg-[var(--surface-active)]/50 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--primary-ink)] flex items-center justify-center shrink-0">
                  <IconUtensils size={22} />
                </div>
                <div className="min-w-0">
                  <div className="text-[16px] font-semibold text-[var(--ink)]">Revoir la présentation</div>
                  <div className="text-[14px] text-[var(--ink-muted)] break-words min-w-0">Comment marche Attablés, en trois écrans</div>
                </div>
              </div>
              <IconChevronRight size={19} className="text-[var(--ink-muted)] shrink-0" />
            </button>
          </div>
        )}

        {/* SUB-SCREEN: Mémoire des plats */}
        {section === 'memoire' && (
          <div className="flex flex-col gap-4">
            <section className="carte p-4 flex flex-col gap-3">
              <h2 className="font-display text-[19px] text-[var(--ink)]">
                Délai de prescription des plats
              </h2>
              <p className="text-[14px] text-[var(--ink-muted)] leading-relaxed">
                Un plat servi avant ce délai déclenche une alerte « Servi récemment ».
                Au-delà, il passe en mention douce (« peut revenir »), sauf s’il est marqué
                « À éviter ».
              </p>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {[3, 6, 9, 12, 18, 24].map((mois) => {
                  const active = data.settings.prescriptionMois === mois;
                  return (
                    <button
                      key={mois}
                      type="button"
                      onClick={() => onChangePrescriptionMois(mois)}
                      aria-pressed={active}
                      className={`min-h-[48px] px-3 rounded-xl border text-[15px] font-semibold tabular-nums inline-flex items-center justify-center gap-1.5 transition-colors ${
                        active
                          ? 'bg-[var(--ink)] text-[var(--card)] border-[var(--ink)]'
                          : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--ink)]'
                      }`}
                    >
                      {active && <IconCheck size={16} />}
                      {mois} mois
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-3">
                <span className="text-[14px] font-semibold text-[var(--ink)]">
                  Réglage fin
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onChangePrescriptionMois(Math.max(1, data.settings.prescriptionMois - 1))
                    }
                    aria-label="Réduire d'un mois"
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--ink)] font-bold text-[18px]"
                  >
                    −
                  </button>
                  <span className="min-w-[74px] text-center text-[15px] font-bold text-[var(--ink)] tabular-nums">
                    {data.settings.prescriptionMois} mois
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onChangePrescriptionMois(Math.min(60, data.settings.prescriptionMois + 1))
                    }
                    aria-label="Augmenter d'un mois"
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--ink)] font-bold text-[18px]"
                  >
                    +
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* SUB-SCREEN: Apparence */}
        {section === 'apparence' && (
          <section className="carte p-4 flex flex-col gap-3">
            <Puces
              ariaLabel="Thème"
              valeur={data.settings.theme}
              onChange={onChangeTheme}
              options={THEMES}
            />
            <p className="text-[14px] text-[var(--ink-muted)]">
              {THEMES.find((t) => t.id === data.settings.theme)?.desc}
            </p>
          </section>
        )}

        {/* SUB-SCREEN: Sauvegarde & Données */}
        {section === 'sauvegarde' && (
          <div className="flex flex-col gap-4">
            <section className="carte p-4 flex flex-col gap-3">
              <p className="text-[14px] text-[var(--ink-muted)] leading-relaxed">
                Vos données sont stockées uniquement sur cet appareil. Exportez un fichier
                .json pour les sauvegarder ou les transférer.
              </p>

              <button
                type="button"
                onClick={handleExportJson}
                className="min-h-[48px] px-4 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                {exportSuccess ? <IconCheck size={18} /> : <IconDownload size={18} />}
                <span>
                  {exportSuccess
                    ? 'Sauvegarde exportée !'
                    : 'Exporter mes données (.json)'}
                </span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[48px] px-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--ink)] font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <IconUpload size={18} />
                <span>Restaurer une sauvegarde (.json)</span>
              </button>

              {restoreError && (
                <div
                  role="alert"
                  className="px-3.5 py-2.5 rounded-xl bg-[var(--error-bg)] text-[var(--error)] text-[14px] flex items-center gap-2"
                >
                  {/* ⚠ est réservé aux allergies. */}
                  <IconBan size={17} />
                  <span>{restoreError}</span>
                </div>
              )}
            </section>

            <section className="carte overflow-hidden divide-y divide-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowSampleConfirm(true)}
                className="w-full min-h-[58px] px-4 py-3 text-left flex items-center justify-between gap-3 hover:bg-[var(--surface-elevated)]/60 transition-colors"
              >
                <div>
                  <div className="text-[15px] font-semibold text-[var(--ink)]">
                    Recharger les données d’exemple
                  </div>
                  <div className="text-[13px] text-[var(--ink-muted)]">
                    Remet les foyers, convives et invitations de démonstration
                  </div>
                </div>
                <IconChevronRight size={18} className="text-[var(--ink-muted)] shrink-0" />
              </button>

              {resteDesExemples && (
                <button
                  type="button"
                  onClick={() => setShowEffacerExemplesConfirm(true)}
                  className="w-full min-h-[58px] px-4 py-3 text-left flex items-center justify-between gap-3 hover:bg-[var(--surface-elevated)]/60 transition-colors"
                >
                  <div>
                    <div className="text-[15px] font-semibold text-[var(--ink)]">
                      Effacer les exemples
                    </div>
                    <div className="text-[13px] text-[var(--ink-muted)]">
                      Retire Marc, Sophie et les autres ; vos propres données restent
                    </div>
                  </div>
                  <IconChevronRight size={18} className="text-[var(--ink-muted)] shrink-0" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="w-full min-h-[58px] px-4 py-3 text-left flex items-center justify-between gap-3 text-[var(--error)] hover:bg-[var(--error-bg)]/50 transition-colors"
              >
                <div>
                  <div className="text-[15px] font-semibold">
                    Vider toutes les données
                  </div>
                  <div className="text-[13px] opacity-85">
                    Supprime invitations, convives et foyers pour partir à vide
                  </div>
                </div>
                <IconTrash size={18} className="shrink-0" />
              </button>
            </section>
          </div>
        )}

        {/* SUB-SCREEN: À propos & Vie privée */}
        {section === 'apropos' && (
          <div className="flex flex-col gap-4">
            <section className="carte p-5 flex flex-col gap-2.5">
              <div>
                <h2 className="font-display text-[24px] text-[var(--ink)]">Attablés</h2>
                <p className="text-[15px] font-semibold text-[var(--ink-muted)] tabular-nums break-words">
                  Version 0.3.0 · attables.biovibralyon.fr
                </p>
              </div>
              <p className="text-[15px] text-[var(--ink)] leading-relaxed">
                Carnet d’invitations personnel : gestion des foyers, suivi strict des
                allergies et préférences alimentaires, et mémoire anti-doublon des plats
                servis.
              </p>
              <button
                type="button"
                onClick={() => void ouvrirLien(URL_NOTES_DE_VERSION)}
                className="min-h-[44px] px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--ink)] text-[14px] font-semibold text-left flex items-center justify-between gap-2"
              >
                <span>Notes de version</span>
                <IconChevronRight size={17} className="text-[var(--ink-muted)] shrink-0" />
              </button>
            </section>

            <section className="carte p-5 flex flex-col gap-3">
              <h2 className="font-display text-[19px] text-[var(--ink)]">
                Conception & Licence open source
              </h2>
              <div className="flex flex-col gap-2 text-[14px] text-[var(--ink-muted)] leading-relaxed">
                <p>
                  <strong className="text-[var(--ink)]">Concepteur :</strong> Stéphane
                  MICHEL — BioVibraLyon
                </p>
                <p>
                  <strong className="text-[var(--ink)]">Contact :</strong>{' '}
                  <a
                    href="mailto:stephane@biovibralyon.fr"
                    className="relative break-words text-[var(--primary-ink)] font-semibold underline underline-offset-2 after:absolute after:-inset-y-3 after:inset-x-0 after:content-['']"
                  >
                    stephane@biovibralyon.fr
                  </a>
                </p>
                <p>
                  <strong className="text-[var(--ink)]">Code source (GitHub) :</strong>{' '}
                  <span className="break-all select-all text-[var(--ink)]">
                    https://github.com/Tux69140/attables
                  </span>
                </p>
                <p>
                  <strong className="text-[var(--ink)]">Licence :</strong> GNU General
                  Public License v3.0 (<span className="font-semibold">GPL-3.0-or-later</span>).
                  Les œuvres modifiées ou dérivées redistribuées doivent rester open source
                  sous cette même licence et conserver la mention de l’auteur.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowLicenseDetails((v) => !v)}
                aria-expanded={showLicenseDetails}
                className="min-h-[44px] px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--ink)] text-[14px] font-semibold text-left flex items-center justify-between gap-2"
              >
                <span>
                  {showLicenseDetails
                    ? 'Masquer les clauses principales GPL v3.0'
                    : 'Lire les clauses principales GPL v3.0'}
                </span>
                <IconChevronRight
                  size={17}
                  className={`text-[var(--ink-muted)] transition-transform ${
                    showLicenseDetails ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {showLicenseDetails && (
                <div className="p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[13px] text-[var(--ink-muted)] leading-relaxed flex flex-col gap-2">
                  <p className="font-semibold text-[var(--ink)]">
                    Copyright © 2026 Stéphane MICHEL — BioVibraLyon (stephane@biovibralyon.fr)
                  </p>
                  <p>
                    Ce programme est un logiciel libre : vous pouvez le redistribuer et/ou
                    le modifier selon les termes de la Licence Publique Générale GNU (GNU
                    GPL) publiée par la Free Software Foundation, version 3 ou toute version
                    ultérieure.
                  </p>
                  <p>
                    Toute redistribution (originale ou modifiée) doit conserver la présente
                    mention de droit d’auteur, rester sous licence GNU GPL v3.0, et donner
                    accès au code source complet correspondant. Ce programme est distribué
                    sans aucune garantie.
                  </p>
                </div>
              )}
            </section>

            <section className="carte p-5 flex flex-col gap-3.5">
              <div className="flex items-center gap-2.5">
                <IconShield size={22} className="text-[var(--primary-ink)] shrink-0" />
                <h2 className="font-display text-[19px] text-[var(--ink)]">
                  Vie privée — 100 % sur votre appareil
                </h2>
              </div>

              <div className="flex flex-col gap-3 text-[14px] text-[var(--ink-muted)] leading-relaxed">
                <p>
                  <strong className="text-[var(--ink)]">Aucune collecte :</strong>{' '}
                  Attablés fonctionne entièrement sans connexion. Vos convives, foyers,
                  contraintes et menus restent sur votre appareil : Attablés n’envoie rien
                  de lui-même. L’application ne contient ni publicité, ni outil de mesure
                  d’audience.
                </p>
                <p>
                  <strong className="text-[var(--ink)]">
                    Export vers une IA externe :
                  </strong>{' '}
                  Par défaut, ce résumé est anonymisé : il ne reprend ni les prénoms, ni le
                  nom d’hôte saisis dans les champs prévus pour cela. Les notes libres écrites
                  pour un convive y figurent telles que vous les avez tapées. Relisez le texte
                  avant de le coller dans un autre service, qui applique ses propres
                  conditions.
                </p>
                <p>
                  <strong className="text-[var(--ink)]">Sauvegardes :</strong> Le fichier
                  d’export (.json) contient vos données en clair ; conservez-le dans un
                  endroit sûr.
                </p>
                <p>
                  <strong className="text-[var(--ink)]">Suppression :</strong> Désinstaller
                  l’application ou effacer ses données supprime définitivement toutes vos
                  informations locales.
                </p>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Confirm Restore Backup */}
      <ConfirmModal
        open={Boolean(pendingRestore)}
        title="Restaurer cette sauvegarde ?"
        description={
          pendingRestore
            ? `Cette action remplacera toutes vos données actuelles par cette sauvegarde (${pendingRestore.invitations.length} invitations, ${pendingRestore.convives.length} convives et ${pendingRestore.foyers.length} foyers).`
            : ''
        }
        confirmLabel="Écraser et restaurer"
        onConfirm={() => {
          if (pendingRestore) {
            onRestoreBackup(pendingRestore);
          }
          setPendingRestore(null);
        }}
        onCancel={() => setPendingRestore(null)}
      />

      {/* Confirm Clear All Data */}
      <ConfirmModal
        open={showClearConfirm}
        title="Vider toutes les données ?"
        description={`Supprimer les ${data.invitations.length} invitations, ${data.convives.length} convives et ${data.foyers.length} foyers pour repartir sur une base vide ? Vous pourrez annuler juste après.`}
        confirmLabel="Tout vider"
        onConfirm={() => {
          setShowClearConfirm(false);
          onClearAllData();
        }}
        onCancel={() => setShowClearConfirm(false)}
      />

      {/* Confirm Erase Sample Data */}
      <ConfirmModal
        open={showEffacerExemplesConfirm}
        title="Effacer les exemples ?"
        description="Les foyers, convives et invitations d’exemple seront retirés ; vos propres données restent. Vous pourrez annuler juste après."
        confirmLabel="Effacer"
        onConfirm={() => {
          setShowEffacerExemplesConfirm(false);
          onEffacerExemples();
        }}
        onCancel={() => setShowEffacerExemplesConfirm(false)}
      />

      {/* Confirm Reload Sample Data */}
      <ConfirmModal
        open={showSampleConfirm}
        title="Recharger les données d’exemple ?"
        description="Les données actuelles seront remplacées par le jeu d’exemples initial. Vous pourrez annuler juste après."
        confirmLabel="Charger les exemples"
        destructive={false}
        onConfirm={() => {
          setShowSampleConfirm(false);
          onResetSampleData();
        }}
        onCancel={() => setShowSampleConfirm(false)}
      />
    </div>
  );
};
