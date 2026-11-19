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
 * Renvoie une fonction stable qui dit si cette couche est celle du dessus (faux si inactive).
 */
export function useAndroidBack(active: boolean, onBack: () => void): () => boolean {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  const idRef = useRef<string | null>(null);

  useEffect(() => {
    if (!active || typeof window === 'undefined') return;
    const p = pileDuNavigateur();
    const id = p.empiler(() => onBackRef.current());
    idRef.current = id;
    return () => {
      idRef.current = null;
      p.retirer(id);
    };
  }, [active]);

  return useCallback(
    () => idRef.current !== null && pile !== undefined && pile.estAuDessus(idRef.current),
    [],
  );
}
