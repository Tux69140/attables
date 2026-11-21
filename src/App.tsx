/**
 * Attablés — Carnet d'invitations personnel hors ligne
 * Copyright (C) 2026 Stéphane MICHEL <stephane@biovibralyon.fr>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { signalerThemeAuxBarres } from './services/barresSysteme';
import { Accueil } from './components/Accueil';
import { BandeauExemples } from './components/BandeauExemples';
import { ConvivesTab } from './components/ConvivesTab';
import { FeuilleAjouter, type EtatAjout } from './components/FeuilleAjouter';
import { IconGear, IconSearch } from './components/Icons';
import { InvitationEditor } from './components/InvitationEditor';
import { InvitationsTab, type Hote, type Onglet } from './components/InvitationsTab';
import { PlatsTab } from './components/PlatsTab';
import { Icone } from './components/Icone';
import { SettingsScreen } from './components/SettingsModal';
import { UndoBanner } from './components/SharedUI';
import { useAndroidBack } from './hooks/useAndroidBack';
import { useAutoHideChrome } from './hooks/useAutoHideChrome';
import { useHauteurMesuree } from './hooks/useHauteurMesuree';
import { focaliserTitreVue, focusPerdu, memoriserCleFocus, rendreFocus } from './hooks/focusVues';
import { focaliserFeuilleDuDessus } from './hooks/usePiegeFocus';
import {
  createEmptyData,
  createSampleData,
  loadAppData,
  MODE_DEMO,
  saveAppData,
} from './services/storage';
import { alimentsLibresConnus } from './utils/allergenes';
import { getTodayIso } from './utils/dishes';
import { dePrenom } from './utils/elision';
import { enregistrerFiche, type ValeursPlat } from './utils/plats';
import { effacerExemples, resteDesExemples } from './utils/exemples';
import { etatParcours, resumeProches } from './utils/parcours';
import {
  AppData,
  Convive,
  CourseKey,
  Foyer,
  Invitation,
  PlatFiche,
  ThemeMode,
  UndoActionState,
} from './types/models';

type MainTab = 'invitations' | 'convives' | 'plats';

type CibleEditeur =
  | { mode: 'new'; draft?: Partial<Invitation> }
  | { mode: 'edit'; invitation: Invitation };

/** Où l'on était sur les onglets avant d'ouvrir l'éditeur ou les Réglages. */
interface PlaceMemorisee {
  onglet: MainTab;
  y: number;
  cle: string | null;
}

export default function App() {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [activeTab, setActiveTab] = useState<MainTab>('invitations');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bandeauMasque, setBandeauMasque] = useState(false);
  const [editorTarget, setEditorTarget] = useState<CibleEditeur | null>(null);

  const [undoState, setUndoState] = useState<UndoActionState | null>(null);
  const [ajout, setAjout] = useState<EtatAjout>(null);
  // « Revoir la présentation » (Réglages) ; rappel « Dernière étape » masqué pour la session.
  const [revoirAccueil, setRevoirAccueil] = useState(false);
  const [ligneParcoursFermee, setLigneParcoursFermee] = useState(false);
  // Recherche de l'onglet Invitations, ouverte par la loupe de l'en-tête (null = fermée).
  const [recherche, setRecherche] = useState<string | null>(null);
  // Sous-onglet « À venir / Réalisées » et filtre d'hôte, gardés pour la session (retour de l'éditeur).
  const [ongletInvitations, setOngletInvitations] = useState<Onglet>('avenir');
  const [hoteInvitations, setHoteInvitations] = useState<Hote>('tous');
  // Thème sombre effectif (réglage, ou système en mode « Appareil ») : teintes calculées en JS.
  const [sombre, setSombre] = useState(false);
  // Hauteurs réelles de l'en-tête et de la barre du bas (grand texte) : voir useHauteurMesuree.
  const enteteRef = useRef<HTMLElement>(null);
  const barreRef = useRef<HTMLElement>(null);
  useHauteurMesuree(enteteRef, '--hauteur-entete');
  useHauteurMesuree(barreRef, '--hauteur-barre');
  const undoTimerRef = useRef<number | null>(null);
  const { visible: chromeVisible, recaler } = useAutoHideChrome(
    `${activeTab}-${Boolean(editorTarget)}-${settingsOpen}`
  );
  const placeRef = useRef<PlaceMemorisee | null>(null);
  const vueOuverte = Boolean(editorTarget) || settingsOpen;
  const accueilAffiche = !data.settings.accueilVu || revoirAccueil;

  // Le défilement est restauré à la main : le navigateur ne doit pas s'en mêler.
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  }, []);

  // Changer d'onglet repart du haut (le retour de l'éditeur ou des Réglages restaure la place, ci-dessous).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Ouvre l'éditeur ou les Réglages en mémorisant la place sur les onglets. Si une vue plein écran
  // est déjà ouverte (« Réinviter » depuis l'éditeur), la mémoire prise à la sortie de la liste est gardée.
  const ouvrirVue = (vue: CibleEditeur | 'reglages') => {
    if (!vueOuverte) {
      placeRef.current = { onglet: activeTab, y: window.scrollY, cle: memoriserCleFocus() };
    }
    window.scrollTo(0, 0);
    if (vue === 'reglages') setSettingsOpen(true);
    else setEditorTarget(vue);
  };

  // Retour sur les onglets, quelle qu'en soit la cause : place, barres, puis focus.
  // Les dépendances se limitent volontairement à `vueOuverte` : `activeTab` et `accueilAffiche` sont lus
  // au moment de la fermeture, pas à chaque changement (pas d'ESLint ici pour le rappeler).
  useLayoutEffect(() => {
    if (vueOuverte) return;
    // La présentation reprend la main (« Revoir la présentation ») : la place est gardée, le Retour
    // depuis l'écran 1 rouvre les Réglages sans l'écraser (onRetourDebut), et leur fermeture la restaure.
    if (accueilAffiche) return;
    const place = placeRef.current;
    if (!place) return;
    placeRef.current = null;
    // L'onglet a changé entre-temps : rien à restaurer.
    if (place.onglet !== activeTab) return;
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo(0, Math.min(place.y, max));
    recaler();
    rendreFocus(place.cle);
  }, [vueOuverte]);

  // Pas sous la présentation : sa propre couche de Retour (écran 1 → Réglages) doit être celle du dessus.
  useAndroidBack(
    activeTab !== 'invitations' && !editorTarget && !settingsOpen && !accueilAffiche,
    () => setActiveTab('invitations')
  );

  const handleGoHome = useCallback(() => {
    setActiveTab('invitations');
    setEditorTarget(null);
    setSettingsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Plus d'invitation : la recherche n'a plus d'objet, la loupe disparaît (et son entrée d'historique avec elle).
  useEffect(() => {
    if (data.invitations.length === 0) setRecherche(null);
  }, [data.invitations.length]);

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
      setSombre(isDark);

      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', isDark ? '#0D1624' : '#FBF8F3');
      }

      signalerThemeAuxBarres(isDark);
    };

    applyTheme();

    if (data.settings.theme === 'appareil' && typeof window !== 'undefined') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      media.addEventListener('change', handler);
      return () => media.removeEventListener('change', handler);
    }
  }, [data.settings.theme]);

  const DELAI_ANNULATION_MS = 7000;

  const armerMinuteurUndo = useCallback(() => {
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
    }
    undoTimerRef.current = window.setTimeout(() => {
      setUndoState(null);
      undoTimerRef.current = null;
    }, DELAI_ANNULATION_MS);
  }, []);

  const showUndo = useCallback((message: string, previousSnapshot: AppData) => {
    setUndoState({
      id: String(Date.now()),
      message,
      snapshot: previousSnapshot,
    });
    armerMinuteurUndo();
  }, [armerMinuteurUndo]);

  // Le focus entre dans le bandeau : le minuteur s'arrête (WCAG 2.2.1).
  const pauseUndo = useCallback(() => {
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  // Le focus en sort : un délai complet repart, si le bandeau est toujours là.
  const repriseUndo = useCallback(() => {
    if (undoState) armerMinuteurUndo();
  }, [undoState, armerMinuteurUndo]);

  // « Annuler » ou « Fermer » au clavier : le bandeau disparaît avec le focus, qui revient à la feuille encore
  // ouverte (fiche d'où l'on vient d'enregistrer), sinon au titre de la vue.
  const quitterBandeau = useCallback(() => {
    if (!document.activeElement?.closest('[data-bandeau-annuler]')) return;
    window.requestAnimationFrame(() => {
      if (focusPerdu() && !focaliserFeuilleDuDessus()) focaliserTitreVue();
    });
  }, []);

  const handleUndo = useCallback(() => {
    if (!undoState) return;
    quitterBandeau();
    setData(undoState.snapshot);
    setUndoState(null);
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, [undoState, quitterBandeau]);

  const dismissUndo = useCallback(() => {
    quitterBandeau();
    setUndoState(null);
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, [quitterBandeau]);

  const convivesById = useMemo(
    () => new Map(data.convives.map((c) => [c.id, c])),
    [data.convives]
  );
  // Aliments libres (« Autre… ») déjà notés : proposés dans la fiche d'une personne.
  const libresConnus = useMemo(() => alimentsLibresConnus(data.convives, data.plats), [data.convives, data.plats]);

  // Invitation handlers
  const handleSaveInvitation = (inv: Invitation, message: string) => {
    const snapshot = data;
    setData((prev) => {
      const exists = prev.invitations.some((item) => item.id === inv.id);
      const invitations = exists
        ? prev.invitations.map((item) => (item.id === inv.id ? inv : item))
        : [inv, ...prev.invitations];
      return { ...prev, invitations };
    });
    setEditorTarget(null);
    showUndo(message, snapshot);
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
    ouvrirVue({
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
    const snapshot = data;
    setData((prev) => {
      const exists = prev.convives.some((c) => c.id === convive.id);
      const convives = exists
        ? prev.convives.map((c) => (c.id === convive.id ? convive : c))
        : [...prev.convives, convive];
      return { ...prev, convives };
    });
    showUndo(`Fiche ${dePrenom(convive.nomAffiche)} enregistrée`, snapshot);
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

  // Fiches de plat (onglet Plats, ligne « vérifier » de l'éditeur)
  // Chaque enregistrement d'une fiche (bouton ou fermeture d'une feuille modifiée) est annulable.
  const handleEnregistrerFiche = (v: ValeursPlat) => {
    const snapshot = data;
    setData((prev) => ({ ...prev, plats: enregistrerFiche(prev.plats, v, `plat-${Date.now()}`) }));
    showUndo('Plat enregistré', snapshot);
  };

  const handleRemplacerFiche = (fiche: PlatFiche) => {
    const snapshot = data;
    setData((prev) => ({ ...prev, plats: prev.plats.map((p) => (p.id === fiche.id ? fiche : p)) }));
    showUndo('Plat enregistré', snapshot);
  };

  const handleSupprimerFiche = (id: string) => {
    const snapshot = data;
    setData((prev) => ({ ...prev, plats: prev.plats.filter((p) => p.id !== id) }));
    showUndo('Plat supprimé', snapshot);
  };

  const handlePreparerAvecPlat = (libelle: string, course: CourseKey) => {
    ouvrirVue({ mode: 'new', draft: { menu: { [course]: libelle } } });
  };

  const handleEffacerExemples = () => {
    const snapshot = data;
    setData(effacerExemples(data));
    setSettingsOpen(false);
    showUndo('Exemples effacés', snapshot);
  };

  // Parcours « Ajouter… » : choix, puis foyer (enchaîné sur son premier membre) ou personne.
  const ouvrirAjout = () => setAjout({ etape: 'choix' });
  const demanderNouveauConvive = (apres: (c: Convive) => void) => setAjout({ etape: 'convive', apres });

  const feuilleAjouter = (
    <FeuilleAjouter
      ajout={ajout}
      foyers={data.foyers}
      libresConnus={libresConnus}
      onEtape={setAjout}
      onEnregistrerFoyer={(foyer) => {
        handleSaveFoyer(foyer);
        setAjout({ etape: 'convive', foyerId: foyer.id });
      }}
      onEnregistrerConvive={(convive) => {
        handleSaveConvive(convive);
        const apres = ajout?.etape === 'convive' ? ajout.apres : undefined;
        setAjout(null);
        apres?.(convive);
      }}
      onFermer={() => setAjout(null)}
    />
  );

  // Présentation : nouvelle installation, ou revue depuis les Réglages
  if (accueilAffiche) {
    const marquerVu = (prev: AppData): AppData => ({ ...prev, settings: { ...prev.settings, accueilVu: true } });
    return (
      <Accueil
        carnetVide={
          data.foyers.length === 0 &&
          data.convives.length === 0 &&
          data.invitations.length === 0 &&
          data.plats.length === 0
        }
        onCommencer={() => {
          setData(marquerVu);
          setRevoirAccueil(false);
          setActiveTab('invitations');
        }}
        onVisiter={() => {
          setData((prev) => marquerVu({ ...createSampleData(), settings: prev.settings }));
          setBandeauMasque(false);
          setRevoirAccueil(false);
          setActiveTab('invitations');
        }}
        onFermer={() => {
          setData(marquerVu);
          setRevoirAccueil(false);
        }}
        onRetourDebut={
          revoirAccueil
            ? () => {
                // Pas ouvrirVue : la place mémorisée à l'ouverture des Réglages doit survivre.
                setRevoirAccueil(false);
                window.scrollTo(0, 0);
                setSettingsOpen(true);
              }
            : undefined
        }
      />
    );
  }

  // Vue plein écran de l'éditeur
  const vueEditeur = editorTarget && (
    <>
      <InvitationEditor
        existing={editorTarget.mode === 'edit' ? editorTarget.invitation : undefined}
        initialDraft={editorTarget.mode === 'new' ? editorTarget.draft : undefined}
        allInvitations={data.invitations}
        foyers={data.foyers}
        convives={data.convives}
        convivesById={convivesById}
        prescriptionMois={data.settings.prescriptionMois}
        plats={data.plats}
        onDemanderNouveauConvive={demanderNouveauConvive}
        onEnregistrerFiche={handleEnregistrerFiche}
        onSave={handleSaveInvitation}
        onReinvite={handleReinvite}
        onDelete={handleDeleteInvitation}
        onCancel={() => setEditorTarget(null)}
      />
      {feuilleAjouter}
    </>
  );

  // Vue plein écran des Réglages
  const vueReglages = settingsOpen && (
    <>
      <SettingsScreen
        data={data}
        onChangeTheme={handleChangeTheme}
        onChangePrescriptionMois={handleChangePrescriptionMois}
        onRestoreBackup={handleRestoreBackup}
        onClearAllData={handleClearAllData}
        onResetSampleData={handleResetSampleData}
        resteDesExemples={resteDesExemples(data)}
        onEffacerExemples={handleEffacerExemples}
        onRevoirPresentation={() => {
          setSettingsOpen(false);
          setRevoirAccueil(true);
        }}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );

  // Vue à onglets
  const vueOnglets = (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col">
      {/* Compact Android Top Bar */}
      <header
        ref={enteteRef}
        className={`fixed top-0 left-0 right-0 z-30 bg-[var(--bg)] border-b border-[var(--border)] pt-safe chrome-mouvement ${
          chromeVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        {/* Titre exactement centré tant que la place suffit : case gauche de 80 px = case droite nette de 80 px (88 px moins
            la marge négative). Quand la place manque (grand texte), les boutons passent sous le titre au lieu de déborder ;
            ils gardent leurs 44 px et ne chevauchent jamais le titre. */}
        <div className="max-w-[1080px] mx-auto px-safe min-h-14 flex flex-wrap items-center gap-x-2">
          <div aria-hidden="true" className="flex-[0_1_80px]" />
          <div className="flex-auto flex justify-center">
            <button
              type="button"
              onClick={handleGoHome}
              aria-label="Retour à l'accueil Attablés"
              className="min-h-[44px] px-3 rounded-xl font-display text-[24px] tracking-tight text-[var(--ink)] flex items-center justify-center hover:bg-[var(--surface-elevated)] active:scale-[0.98] transition-all"
            >
              Attablés
            </button>
          </div>
          <div className="w-[88px] shrink-0 ml-auto -mr-2 flex items-center justify-end">
            {activeTab === 'invitations' && data.invitations.length > 0 && (
              <button
                type="button"
                onClick={() => setRecherche((r) => (r === null ? '' : null))}
                aria-label="Rechercher"
                aria-pressed={recherche !== null}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--ink)] hover:bg-[var(--surface-elevated)] active:scale-95 transition-transform"
              >
                <IconSearch size={22} />
              </button>
            )}
            <button
              type="button"
              data-focus-cle="reglages"
              onClick={() => ouvrirVue('reglages')}
              aria-label="Réglages"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--ink)] hover:bg-[var(--surface-elevated)] active:scale-95 transition-transform"
            >
              <IconGear size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1080px] mx-auto px-safe pt-below-header pb-inset">
        {resteDesExemples(data) && !bandeauMasque && (
          <BandeauExemples
            demo={MODE_DEMO}
            onCommencer={handleEffacerExemples}
            onMasquer={() => setBandeauMasque(true)}
          />
        )}
        {activeTab === 'invitations' ? (
          <InvitationsTab
            invitations={data.invitations}
            convivesById={convivesById}
            plats={data.plats}
            chromeVisible={chromeVisible}
            recherche={recherche}
            onRecherche={setRecherche}
            onglet={ongletInvitations}
            onOnglet={setOngletInvitations}
            hote={hoteInvitations}
            onHote={setHoteInvitations}
            onOpenNew={() => ouvrirVue({ mode: 'new' })}
            onOpenEdit={(invitation) => ouvrirVue({ mode: 'edit', invitation })}
            onMarkRealisee={handleMarkRealisee}
            parcours={etatParcours(data)}
            resumeProches={resumeProches(data)}
            onAjouterProche={ouvrirAjout}
            ligneParcoursFermee={ligneParcoursFermee}
            onFermerLigneParcours={() => setLigneParcoursFermee(true)}
          />
        ) : activeTab === 'plats' ? (
          <PlatsTab
            invitations={data.invitations}
            plats={data.plats}
            convivesById={convivesById}
            prescriptionMois={data.settings.prescriptionMois}
            onEnregistrerFiche={handleEnregistrerFiche}
            onRemplacerFiche={handleRemplacerFiche}
            onSupprimerFiche={handleSupprimerFiche}
            onPreparerAvecPlat={handlePreparerAvecPlat}
          />
        ) : (
          <ConvivesTab
            foyers={data.foyers}
            convives={data.convives}
            invitations={data.invitations}
            convivesById={convivesById}
            prescriptionMois={data.settings.prescriptionMois}
            chromeVisible={chromeVisible}
            onSaveFoyer={handleSaveFoyer}
            onDeleteFoyer={handleDeleteFoyer}
            onSaveConvive={handleSaveConvive}
            libresConnus={libresConnus}
            onDeleteConvive={handleDeleteConvive}
            onAjouter={ouvrirAjout}
            sombre={sombre}
          />
        )}
      </main>
      {feuilleAjouter}

      {/* Android Bottom Navigation Bar */}
      <nav
        ref={barreRef}
        aria-label="Navigation principale"
        className={`fixed bottom-0 left-0 right-0 z-30 bg-[var(--card)] border-t border-[var(--border)] pb-safe chrome-mouvement ${
          chromeVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="max-w-[1080px] mx-auto px-inset min-h-16 flex flex-wrap">
          {(
            [
              { id: 'invitations', label: 'Invitations', icone: 'calendar-days' },
              { id: 'convives', label: 'Convives', icone: 'users-round' },
              { id: 'plats', label: 'Plats', icone: 'hand-platter' },
            ] as const
          ).map(({ id, label, icone }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              aria-current={activeTab === id ? 'page' : undefined}
              className={`min-h-[44px] px-1 flex-1 basis-0 min-w-fit flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === id ? 'text-[var(--primary-ink)] font-bold' : 'text-[var(--ink-muted)] font-semibold'
              }`}
            >
              <span
                className={`w-14 h-7 rounded-full flex items-center justify-center transition-colors ${
                  activeTab === id ? 'bg-[var(--indic)]' : ''
                }`}
              >
                <Icone nom={icone} size={22} />
              </span>
              <span className="text-[13px] leading-none text-center">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );

  // Un seul bandeau « Annuler », monté quelle que soit la vue : sa zone d'annonce
  // reste dans le DOM, donc le message est annoncé même quand la vue change dans le même geste.
  const annonce = undoState && { id: undoState.id, message: undoState.message };
  const decalageBandeau = editorTarget || settingsOpen
    ? undefined
    : chromeVisible ? 'bottom-above-fab' : 'bottom-safe-gap';

  return (
    <>
      {editorTarget ? vueEditeur : settingsOpen ? vueReglages : vueOnglets}
      <UndoBanner
        annonce={annonce}
        bottomOffsetClass={decalageBandeau}
        onUndo={handleUndo}
        onDismiss={dismissUndo}
        onPause={pauseUndo}
        onReprise={repriseUndo}
      />
    </>
  );
}
