import React, { useMemo, useRef, useState } from 'react';
import { useAndroidBack } from '../hooks/useAndroidBack';
import { useAutoHideChrome } from '../hooks/useAutoHideChrome';
import { migrateAndValidateAppData } from '../services/storage';
import {
  AppData,
  ContrainteNiveau,
  ContrainteTag,
  Convive,
  ThemeMode,
} from '../types/models';
import { getTodayIso } from '../utils/dishes';
import {
  FoyerPictoIcon,
  IconAlert,
  IconArrowLeft,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconClose,
  IconDownload,
  IconEdit,
  IconPlus,
  IconShield,
  IconTrash,
  IconUpload,
} from './Icons';
import { ConfirmModal } from './SharedUI';

type SettingsSection =
  | 'root'
  | 'apparence'
  | 'memoire'
  | 'contraintes'
  | 'sauvegarde'
  | 'apropos';

const SECTION_TITLES: Record<SettingsSection, string> = {
  root: 'Réglages',
  apparence: 'Apparence',
  memoire: 'Mémoire des plats',
  contraintes: 'Contraintes alimentaires',
  sauvegarde: 'Sauvegarde & Données',
  apropos: 'À propos',
};

interface SettingsScreenProps {
  data: AppData;
  onChangeTheme: (theme: ThemeMode) => void;
  onChangePrescriptionMois: (mois: number) => void;
  onSaveTag: (tag: ContrainteTag) => void;
  onDeleteTag: (tagId: string) => void;
  onRestoreBackup: (restored: AppData) => void;
  onClearAllData: () => void;
  onResetSampleData: () => void;
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  data,
  onChangeTheme,
  onChangePrescriptionMois,
  onSaveTag,
  onDeleteTag,
  onRestoreBackup,
  onClearAllData,
  onResetSampleData,
  onClose,
}) => {
  const [section, setSection] = useState<SettingsSection>('root');
  const chromeVisible = useAutoHideChrome(`settings-${section}`);

  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagNiveau, setNewTagNiveau] = useState<ContrainteNiveau>('strict');

  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagLabel, setEditingTagLabel] = useState('');

  const [tagToDelete, setTagToDelete] = useState<ContrainteTag | null>(null);
  const [pendingRestore, setPendingRestore] = useState<AppData | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSampleConfirm, setShowSampleConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTagLabel.trim();
    if (!trimmed) return;
    onSaveTag({
      id: `tag-${Date.now()}`,
      libelle: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
      niveau: newTagNiveau,
    });
    setNewTagLabel('');
  };

  const handleSaveEditedTag = (tag: ContrainteTag) => {
    const trimmed = editingTagLabel.trim();
    if (trimmed) {
      onSaveTag({ ...tag, libelle: trimmed });
    }
    setEditingTagId(null);
  };

  const toggleTagNiveau = (tag: ContrainteTag) => {
    onSaveTag({
      ...tag,
      niveau: tag.niveau === 'strict' ? 'preference' : 'strict',
    });
  };

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

  const countGuestsUsingTag = (tagId: string) =>
    data.convives.filter((c: Convive) => c.contraintesIds.includes(tagId)).length;

  const strictTags = useMemo(
    () =>
      data.contraintes
        .filter((t) => t.niveau === 'strict')
        .sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr')),
    [data.contraintes]
  );

  const prefTags = useMemo(
    () =>
      data.contraintes
        .filter((t) => t.niveau === 'preference')
        .sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr')),
    [data.contraintes]
  );

  const themeSummaryLabel =
    data.settings.theme === 'appareil'
      ? 'Appareil (automatique)'
      : data.settings.theme === 'clair'
      ? 'Clair (Sable)'
      : 'Sombre (Nuit marine)';

  const renderTagRow = (tag: ContrainteTag) => {
    const isEditing = editingTagId === tag.id;
    const isStrict = tag.niveau === 'strict';
    return (
      <div
        key={tag.id}
        className="px-4 py-3 flex items-center justify-between gap-2 bg-[var(--card)]"
      >
        <div className="min-w-0 flex-1 flex flex-col gap-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editingTagLabel}
                onChange={(e) => setEditingTagLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveEditedTag(tag);
                  }
                }}
                autoFocus
                className="flex-1 min-h-[44px] px-3 rounded-lg bg-[var(--surface-elevated)] border border-[var(--primary)] text-[15px] text-[var(--ink)]"
              />
              <button
                type="button"
                onClick={() => handleSaveEditedTag(tag)}
                aria-label="Valider le libellé"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--on-primary)]"
              >
                <IconCheck size={18} />
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[15px] font-semibold text-[var(--ink)]">
                {tag.libelle}
              </span>
              <button
                type="button"
                onClick={() => toggleTagNiveau(tag)}
                className={`min-h-[34px] px-2.5 rounded-lg text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors ${
                  isStrict
                    ? 'bg-[var(--error-bg)] text-[var(--error)]'
                    : 'bg-[var(--warning-bg)] text-[var(--warning)]'
                }`}
                title="Appuyer pour basculer Allergie stricte / Préférence"
              >
                {isStrict && <IconAlert size={14} />}
                <span>{isStrict ? 'Allergie stricte' : 'Préférence'}</span>
              </button>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setEditingTagId(tag.id);
                setEditingTagLabel(tag.libelle);
              }}
              aria-label={`Renommer ${tag.libelle}`}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--ink-muted)] hover:bg-[var(--surface-elevated)]"
            >
              <IconEdit size={17} />
            </button>
            <button
              type="button"
              onClick={() => setTagToDelete(tag)}
              aria-label={`Supprimer ${tag.libelle}`}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--error)] hover:bg-[var(--error-bg)]"
            >
              <IconTrash size={17} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      {/* Centered-title 3-zone Top Bar */}
      <header
        className={`fixed top-0 left-0 right-0 z-30 bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--border)] pt-safe transition-transform duration-200 ease-out ${
          chromeVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-[1080px] mx-auto px-4 h-14 grid grid-cols-[44px_1fr_44px] items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            aria-label={section === 'root' ? 'Retour' : 'Retour aux réglages'}
            className="justify-self-start min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-xl text-[var(--ink)] hover:bg-[var(--surface-elevated)] active:scale-95 transition-transform"
          >
            <IconArrowLeft size={22} />
          </button>
          <h1 className="font-display text-[20px] text-[var(--ink)] text-center truncate px-1">
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

      <main className="flex-1 w-full max-w-[1080px] mx-auto px-4 pt-[72px] pb-14 flex flex-col gap-5">
        {/* ROOT: Android Settings Menu Hub */}
        {section === 'root' && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden divide-y divide-[var(--border)]">
            <button
              type="button"
              onClick={() => navigateToSection('apparence')}
              className="w-full min-h-[72px] px-4 py-3.5 flex items-center justify-between gap-3.5 text-left hover:bg-[var(--surface-elevated)]/60 active:bg-[var(--surface-active)]/50 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--ink)] flex items-center justify-center shrink-0">
                  <FoyerPictoIcon picto="soleil" size={22} />
                </div>
                <div className="min-w-0">
                  <div className="text-[16px] font-semibold text-[var(--ink)]">
                    Apparence
                  </div>
                  <div className="text-[14px] text-[var(--ink-muted)] truncate">
                    {themeSummaryLabel}
                  </div>
                </div>
              </div>
              <IconChevronRight size={19} className="text-[var(--ink-muted)] shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('memoire')}
              className="w-full min-h-[72px] px-4 py-3.5 flex items-center justify-between gap-3.5 text-left hover:bg-[var(--surface-elevated)]/60 active:bg-[var(--surface-active)]/50 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[var(--warning-bg)] text-[var(--warning)] flex items-center justify-center shrink-0">
                  <IconClock size={22} />
                </div>
                <div className="min-w-0">
                  <div className="text-[16px] font-semibold text-[var(--ink)]">
                    Mémoire des plats
                  </div>
                  <div className="text-[14px] text-[var(--ink-muted)] truncate tabular-nums">
                    Alerte forte sous {data.settings.prescriptionMois} mois
                  </div>
                </div>
              </div>
              <IconChevronRight size={19} className="text-[var(--ink-muted)] shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('contraintes')}
              className="w-full min-h-[72px] px-4 py-3.5 flex items-center justify-between gap-3.5 text-left hover:bg-[var(--surface-elevated)]/60 active:bg-[var(--surface-active)]/50 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[var(--error-bg)] text-[var(--error)] flex items-center justify-center shrink-0">
                  <IconAlert size={22} />
                </div>
                <div className="min-w-0">
                  <div className="text-[16px] font-semibold text-[var(--ink)]">
                    Contraintes alimentaires
                  </div>
                  <div className="text-[14px] text-[var(--ink-muted)] truncate tabular-nums">
                    {data.contraintes.length} tags · {strictTags.length} allergies strictes
                  </div>
                </div>
              </div>
              <IconChevronRight size={19} className="text-[var(--ink-muted)] shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('sauvegarde')}
              className="w-full min-h-[72px] px-4 py-3.5 flex items-center justify-between gap-3.5 text-left hover:bg-[var(--surface-elevated)]/60 active:bg-[var(--surface-active)]/50 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[var(--success-bg)] text-[var(--success)] flex items-center justify-center shrink-0">
                  <IconDownload size={21} />
                </div>
                <div className="min-w-0">
                  <div className="text-[16px] font-semibold text-[var(--ink)]">
                    Sauvegarde & Données
                  </div>
                  <div className="text-[14px] text-[var(--ink-muted)] truncate tabular-nums">
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
              className="w-full min-h-[72px] px-4 py-3.5 flex items-center justify-between gap-3.5 text-left hover:bg-[var(--surface-elevated)]/60 active:bg-[var(--surface-active)]/50 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--ink)] flex items-center justify-center shrink-0">
                  <IconShield size={22} />
                </div>
                <div className="min-w-0">
                  <div className="text-[16px] font-semibold text-[var(--ink)]">
                    À propos & Vie privée
                  </div>
                  <div className="text-[14px] text-[var(--ink-muted)] truncate">
                    Version 0.1.0 · 100 % sur votre appareil
                  </div>
                </div>
              </div>
              <IconChevronRight size={19} className="text-[var(--ink-muted)] shrink-0" />
            </button>
          </div>
        )}

        {/* SUB-SCREEN: Mémoire des plats */}
        {section === 'memoire' && (
          <div className="flex flex-col gap-4">
            <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-3">
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
                      className={`min-h-[48px] px-3 rounded-xl border text-[15px] font-semibold tabular-nums transition-colors ${
                        active
                          ? 'bg-[var(--primary)] text-[var(--on-primary)] border-[var(--primary)]'
                          : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--ink)]'
                      }`}
                    >
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
          <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden divide-y divide-[var(--border)]">
            {(
              [
                {
                  id: 'appareil',
                  title: 'Appareil',
                  desc: 'Suit automatiquement les réglages clair/sombre d’Android.',
                },
                {
                  id: 'clair',
                  title: 'Clair — Sable',
                  desc: 'Fond sable chaud et encre marine haute lisibilité.',
                },
                {
                  id: 'sombre',
                  title: 'Sombre — Nuit marine',
                  desc: 'Confort visuel en soirée ou faible luminosité.',
                },
              ] as const
            ).map((option) => {
              const active = data.settings.theme === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onChangeTheme(option.id)}
                  className="w-full min-h-[68px] px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-[var(--surface-elevated)]/60 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-[16px] font-semibold text-[var(--ink)]">
                      {option.title}
                    </div>
                    <div className="text-[14px] text-[var(--ink-muted)]">
                      {option.desc}
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      active
                        ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--on-primary)]'
                        : 'border-[var(--outline)]'
                    }`}
                    aria-hidden="true"
                  >
                    {active && <IconCheck size={14} />}
                  </div>
                </button>
              );
            })}
          </section>
        )}

        {/* SUB-SCREEN: Contraintes alimentaires */}
        {section === 'contraintes' && (
          <div className="flex flex-col gap-5">
            {/* Add new tag card */}
            <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-3">
              <h2 className="font-display text-[18px] text-[var(--ink)]">
                Ajouter un tag
              </h2>
              <form onSubmit={handleAddTag} className="flex flex-col gap-2.5">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newTagLabel}
                    onChange={(e) => setNewTagLabel(e.target.value)}
                    placeholder="Ex. Sésame, Sans œufs…"
                    aria-label="Libellé du nouveau tag"
                    className="flex-1 min-h-[46px] px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--primary)]"
                  />
                  <button
                    type="submit"
                    className="min-h-[46px] px-4 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold text-[15px] inline-flex items-center justify-center gap-2 shrink-0 active:scale-[0.98] transition-transform"
                  >
                    <IconPlus size={18} />
                    <span>Ajouter</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTagNiveau('strict')}
                    className={`min-h-[44px] px-3 rounded-xl border text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors ${
                      newTagNiveau === 'strict'
                        ? 'bg-[var(--error-bg)] border-[var(--error)] text-[var(--error)]'
                        : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--ink-muted)]'
                    }`}
                  >
                    <IconAlert size={16} />
                    <span>Allergie stricte</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTagNiveau('preference')}
                    className={`min-h-[44px] px-3 rounded-xl border text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors ${
                      newTagNiveau === 'preference'
                        ? 'bg-[var(--warning-bg)] border-[var(--warning)] text-[var(--warning)]'
                        : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--ink-muted)]'
                    }`}
                  >
                    <span>Préférence</span>
                  </button>
                </div>
              </form>
            </section>

            {/* Grouped existing tags */}
            <p className="text-[13px] text-[var(--ink-muted)] px-1">
              Touchez le badge d’un tag pour basculer entre Allergie stricte et Préférence.
            </p>
            {strictTags.length > 0 && (
              <section className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between px-1">
                  <h2 className="font-display text-[18px] text-[var(--ink)]">
                    Allergies & interdits stricts
                  </h2>
                  <span className="text-[13px] text-[var(--ink-muted)] tabular-nums">
                    {strictTags.length}
                  </span>
                </div>
                <div className="border border-[var(--border)] rounded-2xl overflow-hidden divide-y divide-[var(--border)]">
                  {strictTags.map(renderTagRow)}
                </div>
              </section>
            )}

            {prefTags.length > 0 && (
              <section className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between px-1">
                  <h2 className="font-display text-[18px] text-[var(--ink)]">
                    Régimes & préférences
                  </h2>
                  <span className="text-[13px] text-[var(--ink-muted)] tabular-nums">
                    {prefTags.length}
                  </span>
                </div>
                <div className="border border-[var(--border)] rounded-2xl overflow-hidden divide-y divide-[var(--border)]">
                  {prefTags.map(renderTagRow)}
                </div>
              </section>
            )}
          </div>
        )}

        {/* SUB-SCREEN: Sauvegarde & Données */}
        {section === 'sauvegarde' && (
          <div className="flex flex-col gap-4">
            <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-3">
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
                  <IconAlert size={17} />
                  <span>{restoreError}</span>
                </div>
              )}
            </section>

            <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden divide-y divide-[var(--border)]">
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
                    Remet les foyers, convives et repas de démonstration
                  </div>
                </div>
                <IconChevronRight size={18} className="text-[var(--ink-muted)] shrink-0" />
              </button>

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
            <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-2.5">
              <div>
                <h2 className="font-display text-[24px] text-[var(--ink)]">Attablés</h2>
                <p className="text-[15px] font-semibold text-[var(--ink-muted)] tabular-nums">
                  Version 0.1.0
                </p>
              </div>
              <p className="text-[15px] text-[var(--ink)] leading-relaxed">
                Carnet d’invitations personnel : gestion des foyers, suivi strict des
                allergies et préférences alimentaires, et mémoire anti-doublon des plats
                servis.
              </p>
            </section>

            <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-3.5">
              <div className="flex items-center gap-2.5">
                <IconShield size={22} className="text-[var(--primary)] shrink-0" />
                <h2 className="font-display text-[19px] text-[var(--ink)]">
                  Vie privée — 100 % sur votre appareil
                </h2>
              </div>

              <div className="flex flex-col gap-3 text-[14px] text-[var(--ink-muted)] leading-relaxed">
                <p>
                  <strong className="text-[var(--ink)]">Aucune collecte :</strong>{' '}
                  Attablés fonctionne entièrement hors ligne. Vos convives, foyers,
                  contraintes et menus ne quittent jamais votre appareil et ne sont envoyés
                  à aucun serveur. L’application ne contient ni publicité, ni outil de
                  mesure d’audience.
                </p>
                <p>
                  <strong className="text-[var(--ink)]">
                    Export vers une IA externe :
                  </strong>{' '}
                  Par défaut, le résumé généré pour votre assistant IA ne contient pas les
                  noms de vos invités. Lorsque vous le collez dans un service tiers, il
                  devient soumis aux conditions de ce service.
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

      {/* Confirm Delete Tag */}
      <ConfirmModal
        open={Boolean(tagToDelete)}
        title={`Supprimer le tag « ${tagToDelete?.libelle ?? ''} » ?`}
        description={(() => {
          if (!tagToDelete) return '';
          const count = countGuestsUsingTag(tagToDelete.id);
          if (count === 0) {
            return 'Aucun convive n’utilise ce tag actuellement. Vous pourrez annuler juste après.';
          }
          return `Ce tag sera retiré de la fiche de ${count} convive${
            count > 1 ? 's' : ''
          }. Vous pourrez annuler juste après.`;
        })()}
        confirmLabel="Supprimer le tag"
        onConfirm={() => {
          if (tagToDelete) onDeleteTag(tagToDelete.id);
          setTagToDelete(null);
        }}
        onCancel={() => setTagToDelete(null)}
      />

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
        description={`Supprimer les ${data.invitations.length} invitations, ${data.convives.length} convives et ${data.foyers.length} foyers pour repartir sur une base vide ? (Les tags de contraintes par défaut seront conservés, et vous pourrez annuler juste après.)`}
        confirmLabel="Tout vider"
        onConfirm={() => {
          setShowClearConfirm(false);
          onClearAllData();
        }}
        onCancel={() => setShowClearConfirm(false)}
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
