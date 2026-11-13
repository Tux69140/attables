import { useEffect, useRef } from 'react';

interface BackEntry {
  id: string;
  onBack: () => void;
}

const backStack: BackEntry[] = [];
const ignoredPopIds = new Set<string>();
let listenerAttached = false;
let idCounter = 0;

function handlePopState() {
  const top = backStack[backStack.length - 1];
  if (!top) return;

  // Check if this popstate came from our own programmatic history.back()
  if (ignoredPopIds.has(top.id)) {
    ignoredPopIds.delete(top.id);
    return;
  }

  backStack.pop();
  top.onBack();
}

function ensureListener() {
  if (listenerAttached || typeof window === 'undefined') return;
  window.addEventListener('popstate', handlePopState);
  listenerAttached = true;
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

    ensureListener();

    const layerId = `attables-back-${++idCounter}`;
    const entry: BackEntry = {
      id: layerId,
      onBack: () => onBackRef.current(),
    };

    backStack.push(entry);
    window.history.pushState(
      { ...(window.history.state || {}), attablesLayerId: layerId },
      ''
    );

    return () => {
      const idx = backStack.findIndex((item) => item.id === layerId);
      if (idx !== -1) {
        // Closed programmatically via UI button, not via popstate
        backStack.splice(idx, 1);
        if (window.history.state?.attablesLayerId === layerId) {
          ignoredPopIds.add(layerId);
          window.history.back();
        }
      }
    };
  }, [active]);
}
