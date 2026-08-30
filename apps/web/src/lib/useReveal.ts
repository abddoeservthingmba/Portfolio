import { useEffect } from 'react';

/**
 * Reveals elements as they scroll into view.
 *
 * One IntersectionObserver for the whole page rather than one per element, and
 * no scroll listener at all — the browser does the work off the main thread,
 * so a page of a hundred revealing items costs the same as a page of three.
 *
 * Each element is unobserved once revealed. Entrances do not replay on scroll
 * back up, which reads as broken rather than delightful.
 */

const REVEAL_SELECTOR = '.reveal, .reveal-scale';

let observer: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') return null;

  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        entry.target.setAttribute('data-revealed', '');
        observer?.unobserve(entry.target);
      }
    },
    {
      // Fires slightly before the element reaches the viewport, so the motion
      // is already underway by the time it is properly visible.
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.05,
    },
  );

  return observer;
}

/**
 * Scans for reveal targets and observes them. Re-runs on the given deps, which
 * is how newly rendered content gets picked up after an async load.
 */
export function useReveal(deps: unknown[] = []): void {
  useEffect(() => {
    const active = getObserver();

    if (!active) {
      // No IntersectionObserver: show everything rather than hiding content.
      document
        .querySelectorAll(REVEAL_SELECTOR)
        .forEach((element) => element.setAttribute('data-revealed', ''));
      return;
    }

    // Anything already revealed stays revealed.
    const targets = document.querySelectorAll(`${REVEAL_SELECTOR}:not([data-revealed])`);
    targets.forEach((element) => active.observe(element));

    return () => targets.forEach((element) => active.unobserve(element));
  }, deps);
}
