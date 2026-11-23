import { useLayoutEffect, useRef, useState } from 'react';

/**
 * A number that counts up to its value the first time it scrolls into view.
 *
 * It starts at zero before the first paint, so the count is visible rather
 * than a jump from the final number. Under reduced motion, or where
 * IntersectionObserver is missing, it simply shows the value.
 */
export function CountUp({
  value,
  suffix = '',
  duration = 1200,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useLayoutEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined' || !ref.current) return;

    setShown(0);
    let frame = 0;
    let started = false;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting || started) return;
      started = true;
      observer.disconnect();

      const begin = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - begin) / duration);
        // Ease-out cubic: fast at first, settling on the final figure.
        setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });

    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {shown}
      {suffix}
    </span>
  );
}
