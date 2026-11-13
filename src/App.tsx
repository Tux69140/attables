/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ConvivesTab } from './components/ConvivesTab';
import { IconCalendar, IconGear, IconUsers } from './components/Icons';
import { InvitationEditor } from './components/InvitationEditor';
import { InvitationsTab } from './components/InvitationsTab';
import { SettingsScreen } from './components/SettingsModal';
import { UndoBanner } from './components/SharedUI';
import { useAndroidBack } from './hooks/useAndroidBack';
import { useAutoHideChrome } from './hooks/useAutoHideChrome';
import {
  createEmptyData,
  createSampleData,
  loadAppData,
  saveAppData,
} from './services/storage';
import { getTodayIso } from './utils/dishes';
import {
  AppData,
  ContrainteTag,
  Convive,
  Foyer,
  Invitation,
  ThemeMode,
  UndoActionState,
} from './types/models';

type MainTab = 'invitations' | 'convives';

export default function App() {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [activeTab, setActiveTab] = useState<MainTab>('invitations');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editorTarget, setEditorTarget] = useState<
    | { mode: 'new'; draft?: Partial<Invitation> }
    | { mode: 'edit'; invitation: Invitation }
    | null
  >(null);

  const [undoState, setUndoState] = useState<UndoActionState | null>(null);
  const undoTimerRef = useRef<number | null>(null);
  const chromeVisible = useAutoHideChrome(
    `${activeTab}-${Boolean(editorTarget)}-${settingsOpen}`
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab, settingsOpen]);

  useAndroidBack(
    activeTab === 'convives' && !editorTarget && !settingsOpen,
    () => setActiveTab('invitations')
  );

  const handleGoHome = useCallback(() => {
    setActiveTab('invitations');
    setEditorTarget(null);
    setSettingsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Persist every data update locally
  useEffect(() => {
    saveAppData(data);
  }, [data]);

  // Apply Light / Dark / System theme to <html> and Android status bar theme-color
  useEffect(() => {
    const applyTheme = () => {
      const mode = data.settings.theme;
      const prefersDark =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = mode === 'sombre' || (mode === 'appareil' && prefersDark);

      document.documentElement.classList.toggle('dark', isDark);

      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', isDark ? '#0D1624' : '#F7F6F1');
      }
    };

    applyTheme();

    if (data.settings.theme === 'appareil' && typeof window !== 'undefined') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      media.addEventListener('change', handler);
      return () => media.removeEventListener('change', handler);
    }
  }, [data.settings.theme]);

  const showUndo = useCallback((message: string, previousSnapshot: AppData) => {
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
    }
    setUndoState({
      id: String(Date.now()),
      message,
      snapshot: previousSnapshot,
    });
    undoTimerRef.current = window.setTimeout(() => {
      setUndoState(null);
      undoTimerRef.current = null;
    }, 7000);
  }, []);

  const handleUndo = useCallback(() => {
    if (!undoState) return;
    setData(undoState.snapshot);
    setUndoState(null);
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, [undoState]);

  const dismissUndo = useCallback(() => {
    setUndoState(null);
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const convivesById = useMemo(
    () => new Map(data.convives.map((c) => [c.id, c])),
    [data.convives]
  );

  const contraintesById = useMemo(
    () => new Map(data.contraintes.map((t) => [t.id, t])),
    [data.contraintes]
  );

  // Invitation handlers
  const handleSaveInvitation = (inv: Invitation) => {
    setData((prev) => {
      const exists = prev.invitations.some((item) => item.id === inv.id);
      const invitations = exists
        ? prev.invitations.map((item) => (item.id === inv.id ? inv : item))
        : [inv, ...prev.invitations];
      return { ...prev, invitations };
    });
    setEditorTarget(null);
  };

  const handleDeleteInvitation = (inv: Invitation) => {
    const snapshot = data;
    setData((prev) => ({
      ...prev,
      invitations: prev.invitations.filter((item) => item.id !== inv.id),
    }));
    setEditorTarget(null);
    showUndo('Invitation supprimée', snapshot);
  };

  const handleMarkRealisee = (invitationId: string) => {
    const snapshot = data;
    setData((prev) => ({
      ...prev,
      invitations: prev.invitations.map((item) =>
        item.id === invitationId ? { ...item, statut: 'realisee' } : item
      ),
    }));
    showUndo('Invitation passée en réalisée', snapshot);
  };

  const handleReinvite = (inv: Invitation) => {
    setEditorTarget({
      mode: 'new',
      draft: {
        date: getTodayIso(),
        hoteType: inv.hoteType,
        hoteLabel: inv.hoteLabel,
        hoteRefType: inv.hoteRefType,
        hoteRefId: inv.hoteRefId,
        convivesIds: [...inv.convivesIds],
      },
    });
    window.scrollTo({ top: 0 });
  };

  // Foyer handlers
  const handleSaveFoyer = (foyer: Foyer) => {
    setData((prev) => {
      const exists = prev.foyers.some((f) => f.id === foyer.id);
      const foyers = exists
        ? prev.foyers.map((f) => (f.id === foyer.id ? foyer : f))
        : [...prev.foyers, foyer];
      return { ...prev, foyers };
    });
  };

  const handleDeleteFoyer = (foyerId: string) => {
    const snapshot = data;
    const foyerName = data.foyers.find((f) => f.id === foyerId)?.nom ?? 'Foyer';
    setData((prev) => ({
      ...prev,
      foyers: prev.foyers.filter((f) => f.id !== foyerId),
      convives: prev.convives.map((c) =>
        c.foyerId === foyerId ? { ...c, foyerId: undefined } : c
      ),
    }));
    showUndo(`Foyer « ${foyerName} » supprimé`, snapshot);
  };

  // Convive handlers
  const handleSaveConvive = (convive: Convive) => {
    setData((prev) => {
      const exists = prev.convives.some((c) => c.id === convive.id);
      const convives = exists
        ? prev.convives.map((c) => (c.id === convive.id ? convive : c))
        : [...prev.convives, convive];
      return { ...prev, convives };
    });
  };

  const handleDeleteConvive = (conviveId: string) => {
    const snapshot = data;
    const guestName = data.convives.find((c) => c.id === conviveId)?.nomAffiche ?? 'Convive';
    setData((prev) => ({
      ...prev,
      convives: prev.convives.filter((c) => c.id !== conviveId),
      invitations: prev.invitations.map((inv) => ({
        ...inv,
        convivesIds: inv.convivesIds.filter((id) => id !== conviveId),
      })),
    }));
    showUndo(`${guestName} supprimé`, snapshot);
  };

  // Settings handlers
  const handleChangeTheme = (theme: ThemeMode) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, theme },
    }));
  };

  const handleSaveTag = (tag: ContrainteTag) => {
    setData((prev) => {
      const exists = prev.contraintes.some((t) => t.id === tag.id);
      const contraintes = exists
        ? prev.contraintes.map((t) => (t.id === tag.id ? tag : t))
        : [...prev.contraintes, tag];
      return { ...prev, contraintes };
    });
  };

  const handleDeleteTag = (tagId: string) => {
    const snapshot = data;
    const label = data.contraintes.find((t) => t.id === tagId)?.libelle ?? 'Tag';
    setData((prev) => ({
      ...prev,
      contraintes: prev.contraintes.filter((t) => t.id !== tagId),
      convives: prev.convives.map((c) => ({
        ...c,
        contraintesIds: c.contraintesIds.filter((id) => id !== tagId),
      })),
    }));
    showUndo(`Tag « ${label} » supprimé`, snapshot);
  };

  const handleRestoreBackup = (restored: AppData) => {
    const snapshot = data;
    setData(restored);
    setSettingsOpen(false);
    showUndo('Sauvegarde restaurée', snapshot);
  };

  const handleChangePrescriptionMois = (prescriptionMois: number) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, prescriptionMois },
    }));
  };

  const handleClearAllData = () => {
    const snapshot = data;
    setData(createEmptyData(data.settings));
    setSettingsOpen(false);
    showUndo('Données vidées', snapshot);
  };

  const handleResetSampleData = () => {
    const snapshot = data;
    const sample = createSampleData();
    setData({ ...sample, settings: data.settings });
    setSettingsOpen(false);
    showUndo('Exemples rechargés', snapshot);
  };

  // Full-screen Editor view
  if (editorTarget) {
    return (
      <>
        <InvitationEditor
          existing={editorTarget.mode === 'edit' ? editorTarget.invitation : undefined}
          initialDraft={editorTarget.mode === 'new' ? editorTarget.draft : undefined}
          allInvitations={data.invitations}
          foyers={data.foyers}
          convives={data.convives}
          convivesById={convivesById}
          contraintesById={contraintesById}
          prescriptionMois={data.settings.prescriptionMois}
          onSave={handleSaveInvitation}
          onReinvite={handleReinvite}
          onDelete={handleDeleteInvitation}
          onCancel={() => setEditorTarget(null)}
        />
        <UndoBanner
          message={undoState?.message ?? null}
          onUndo={handleUndo}
          onDismiss={dismissUndo}
        />
      </>
    );
  }

  // Full-screen Settings view
  if (settingsOpen) {
    return (
      <>
        <SettingsScreen
          data={data}
          onChangeTheme={handleChangeTheme}
          onChangePrescriptionMois={handleChangePrescriptionMois}
          onSaveTag={handleSaveTag}
          onDeleteTag={handleDeleteTag}
          onRestoreBackup={handleRestoreBackup}
          onClearAllData={handleClearAllData}
          onResetSampleData={handleResetSampleData}
          onClose={() => setSettingsOpen(false)}
        />
        <UndoBanner
          message={undoState?.message ?? null}
          onUndo={handleUndo}
          onDismiss={dismissUndo}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col">
      {/* Compact Android Top Bar */}
      <header
        className={`fixed top-0 left-0 right-0 z-30 bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--border)] pt-safe transition-transform duration-200 ease-out ${
          chromeVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-[1080px] mx-auto px-safe h-14 grid grid-cols-[44px_1fr_44px] items-center gap-2">
          <div className="w-[44px]" aria-hidden="true" />
          <button
            type="button"
            onClick={handleGoHome}
            aria-label="Retour à l'accueil Attablés"
            className="justify-self-center min-h-[44px] px-3 rounded-xl font-display text-[24px] tracking-tight text-[var(--ink)] whitespace-nowrap flex items-center justify-center hover:bg-[var(--surface-elevated)] active:scale-[0.98] transition-all"
          >
            Attablés
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Réglages"
            className="justify-self-end min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-[var(--ink)] hover:bg-[var(--surface-elevated)] active:scale-95 transition-transform"
          >
            <IconGear size={22} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1080px] mx-auto px-safe pt-below-header pb-inset">
        {activeTab === 'invitations' ? (
          <InvitationsTab
            invitations={data.invitations}
            convivesById={convivesById}
            contraintesById={contraintesById}
            chromeVisible={chromeVisible}
            onOpenNew={() => setEditorTarget({ mode: 'new' })}
            onOpenEdit={(invitation) => setEditorTarget({ mode: 'edit', invitation })}
            onMarkRealisee={handleMarkRealisee}
          />
        ) : (
          <ConvivesTab
            foyers={data.foyers}
            convives={data.convives}
            contraintes={data.contraintes}
            invitations={data.invitations}
            contraintesById={contraintesById}
            convivesById={convivesById}
            prescriptionMois={data.settings.prescriptionMois}
            chromeVisible={chromeVisible}
            onSaveFoyer={handleSaveFoyer}
            onDeleteFoyer={handleDeleteFoyer}
            onSaveConvive={handleSaveConvive}
            onDeleteConvive={handleDeleteConvive}
          />
        )}
      </main>

      {/* Android Bottom Navigation Bar */}
      <nav
        aria-label="Navigation principale"
        className={`fixed bottom-0 left-0 right-0 z-30 bg-[var(--card)]/95 backdrop-blur-md border-t border-[var(--border)] pb-safe transition-transform duration-200 ease-out ${
          chromeVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="max-w-[1080px] mx-auto px-inset grid grid-cols-2 h-16">
          <button
            type="button"
            onClick={() => setActiveTab('invitations')}
            aria-current={activeTab === 'invitations' ? 'page' : undefined}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
              activeTab === 'invitations'
                ? 'text-[var(--primary)] font-bold'
                : 'text-[var(--ink-muted)] font-semibold'
            }`}
          >
            <IconCalendar size={22} active={activeTab === 'invitations'} />
            <span className="text-[13px] leading-none">Invitations</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('convives')}
            aria-current={activeTab === 'convives' ? 'page' : undefined}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
              activeTab === 'convives'
                ? 'text-[var(--primary)] font-bold'
                : 'text-[var(--ink-muted)] font-semibold'
            }`}
          >
            <IconUsers size={22} active={activeTab === 'convives'} />
            <span className="text-[13px] leading-none">Convives</span>
          </button>
        </div>
      </nav>

      {/* Temporary Undo Banner positioned cleanly above floating CTAs */}
      <UndoBanner
        message={undoState?.message ?? null}
        bottomOffsetClass={chromeVisible ? 'bottom-above-fab' : 'bottom-safe-gap'}
        onUndo={handleUndo}
        onDismiss={dismissUndo}
      />
    </div>
  );
}
