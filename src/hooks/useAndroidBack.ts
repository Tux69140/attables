import { useCallback, useEffect, useRef } from 'react';
import { creerPileRetour } from './pileRetour';

let pile: ReturnType<typeof creerPileRetour> | undefined;

function pileDuNavigateur() {
  if (!pile) {
    const p = creerPileRetour(window.history);
    window.addEventListener('popstate', p.surPopState);
    pile = p;
  }
  return pile;
}

/**
 * Registers an active view/modal/sheet on the browser/Android history stack so
 * hardware/gesture Back closes the topmost overlay instead of exiting the app.
 * Si `onBack` renvoie `false`, la couche reste ouverte (ex. une confirmation s'affiche d'abord) : elle
 * reprend aussitôt une entrée d'historique, sous ce qui s'ouvrira ensuite, pour que le Retour suivant la trouve.
 * Renvoie une fonction stable qui dit si cette couche est celle du dessus (faux si inactive).
 */
export function useAndroidBack(active: boolean, onBack: () => void | boolean): () => boolean {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  const idRef = useRef<string | null>(null);

  useEffect(() => {
    if (!active || typeof window === 'undefined') return;
    const p = pileDuNavigateur();
    const armer = () => {
      idRef.current = p.empiler(() => {
        idRef.current = null;
        if (onBackRef.current() === false) armer();
      });
    };
    armer();
    return () => {
      const id = idRef.current;
      idRef.current = null;
      if (id !== null) p.retirer(id);
    };
  }, [active]);

  return useCallback(
    () => idRef.current !== null && pile !== undefined && pile.estAuDessus(idRef.current),
    [],
  );
}
