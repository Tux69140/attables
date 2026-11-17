import { useEffect, useRef } from 'react';
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
 */
export function useAndroidBack(active: boolean, onBack: () => void) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!active || typeof window === 'undefined') return;
    const p = pileDuNavigateur();
    const id = p.empiler(() => onBackRef.current());
    return () => p.retirer(id);
  }, [active]);
}
