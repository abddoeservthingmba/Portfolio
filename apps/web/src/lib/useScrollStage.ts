import { useEffect, useState } from 'react';

/**
 * Reports which stage of the journey is currently on screen.
 *
 * One IntersectionObserver over the stage elements, no scroll listener — the
 * same approach as useReveal, and for the same reason: the browser does the
 * work off the main thread, so tracking costs nothing during a scroll.
 *
 * Returns an index into the stage list, or 0 before anything has been observed.
 */
export function useScrollStage(count: number): number {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-stage]'));
    if (elements.length === 0) return;

    // Ratios are kept rather than compared on the fly: entries arrive only for
    // the elements that changed, so deciding a winner needs the last known
    // ratio of every stage, not just the ones in this callback.
    const ratios = new Map<Element, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target, entry.intersectionRatio);
        }

        let best: Element | null = null;
        let bestRatio = 0;

        for (const [element, ratio] of ratios) {
          if (ratio > bestRatio) {
            best = element;
            bestRatio = ratio;
          }
        }

        if (!best) return;

        const index = Number(best.getAttribute('data-stage'));
        if (Number.isInteger(index)) setActive(index);
      },
      {
        // A spread of thresholds, so "most visible" stays accurate through a
        // scroll rather than only updating at the edges.
        threshold: [0, 0.15, 0.3, 0.5, 0.7, 0.9],
      },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
    // Re-observes when the number of stages changes, which happens once as the
    // async sections finish rendering.
  }, [count]);

  return active;
}
