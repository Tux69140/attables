import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Retracts top/bottom chrome when scrolling down and reveals it on a slight scroll up.
 * `recaler()` force les barres visibles et prend le défilement actuel comme référence
 * (à appeler après avoir restauré un défilement).
 */
export function useAutoHideChrome(
  resetKey?: string | number | boolean
): { visible: boolean; recaler: () => void } {
  const [visible, setVisible] = useState(true);
  const lastYRef = useRef(0);
  const tickingRef = useRef(false);

  const recaler = useCallback(() => {
    setVisible(true);
    lastYRef.current = typeof window !== 'undefined' ? window.scrollY : 0;
  }, []);

  useEffect(() => {
    recaler();
  }, [resetKey, recaler]);

  useEffect(() => {
    lastYRef.current = window.scrollY;

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      window.requestAnimationFrame(() => {
        const currentY = Math.max(0, window.scrollY);
        const delta = currentY - lastYRef.current;

        if (currentY <= 24) {
          setVisible(true);
          lastYRef.current = currentY;
        } else if (delta > 14 && currentY > 56) {
          setVisible(false);
          lastYRef.current = currentY;
        } else if (delta < -6) {
          setVisible(true);
          lastYRef.current = currentY;
        }

        tickingRef.current = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return { visible, recaler };
}
