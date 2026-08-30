import { useEffect, useRef } from 'react';

/**
 * A hairline progress bar across the top of the page.
 *
 * Uses a scroll-driven animation where the browser supports it, which runs
 * entirely off the main thread. The rAF-throttled listener is the fallback,
 * and only registers when the native path is unavailable.
 */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = ref.current;
    if (!bar) return;

    // Native scroll timeline: no JavaScript runs while scrolling at all.
    if (CSS.supports('animation-timeline: scroll()')) {
      bar.style.animation = 'grow-progress linear';
      // Not yet in TypeScript's CSSStyleDeclaration, so set it by name.
      bar.style.setProperty('animation-timeline', 'scroll()');
      return;
    }

    let frame = 0;

    const update = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      bar.style.transform = `scaleX(${progress})`;
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent"
    >
      <div
        ref={ref}
        className="h-full origin-left bg-gradient-to-r from-accent to-accent-2"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  );
}
