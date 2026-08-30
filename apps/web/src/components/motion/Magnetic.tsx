import { useRef } from 'react';
import type { ReactNode } from 'react';

/**
 * Pulls its child gently toward the pointer, then springs back on leave.
 *
 * The bounding box is read once on enter and the move handler only writes a
 * transform inside a rAF, so dragging the cursor across a row of these costs
 * one style write per frame and never triggers layout.
 *
 * Mouse only. On touch there is no hover state to anticipate, so the element
 * would simply jump under the finger.
 */
const PULL = 0.28;
const MAX_PX = 12;

export function Magnetic({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const box = useRef<DOMRect | null>(null);
  const frame = useRef(0);

  const clamp = (value: number) => Math.max(-MAX_PX, Math.min(MAX_PX, value));

  return (
    <span
      ref={ref}
      className={className}
      style={{ display: 'inline-block', transition: 'transform 0.5s var(--ease-spring)' }}
      onPointerEnter={() => {
        box.current = ref.current?.getBoundingClientRect() ?? null;
      }}
      onPointerMove={(event) => {
        if (event.pointerType !== 'mouse' || !box.current) return;

        const rect = box.current;
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);

        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => {
          const element = ref.current;
          if (!element) return;

          // Short transition while tracking, so it follows rather than lags.
          element.style.transition = 'transform 0.18s var(--ease-smooth)';
          element.style.transform = `translate3d(${clamp(dx * PULL)}px, ${clamp(dy * PULL)}px, 0)`;
        });
      }}
      onPointerLeave={() => {
        cancelAnimationFrame(frame.current);
        const element = ref.current;
        if (!element) return;

        // Longer, springier return — the snap back is the satisfying part.
        element.style.transition = 'transform 0.5s var(--ease-spring)';
        element.style.transform = 'translate3d(0,0,0)';
      }}
    >
      {children}
    </span>
  );
}
