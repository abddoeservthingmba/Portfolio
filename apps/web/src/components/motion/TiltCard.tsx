import { useRef } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * A card that tilts slightly toward the pointer, with a light that follows it.
 *
 * Written against CSS custom properties and driven inside a rAF, so a fast
 * pointer produces at most one style write per frame. Nothing here reads
 * layout during the move — the bounding box is measured once on enter, which
 * is what keeps this off the layout thread.
 *
 * Pointer-only: touch devices get the plain card, because a tilt that responds
 * to a tap is just a flicker.
 */
const MAX_TILT_DEG = 5;

export function TiltCard({
  children,
  className,
  disabled = false,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const box = useRef<DOMRect | null>(null);
  const frame = useRef(0);

  const handleEnter = () => {
    if (disabled) return;
    // Measured once, so the move handler never touches layout.
    box.current = ref.current?.getBoundingClientRect() ?? null;
  };

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || event.pointerType !== 'mouse' || !box.current) return;

    const rect = box.current;
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;

    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const element = ref.current;
      if (!element) return;

      element.style.setProperty('--rx', `${(0.5 - py) * MAX_TILT_DEG * 2}deg`);
      element.style.setProperty('--ry', `${(px - 0.5) * MAX_TILT_DEG * 2}deg`);
      element.style.setProperty('--mx', `${px * 100}%`);
      element.style.setProperty('--my', `${py * 100}%`);
    });
  };

  const handleLeave = () => {
    cancelAnimationFrame(frame.current);
    const element = ref.current;
    if (!element) return;

    element.style.setProperty('--rx', '0deg');
    element.style.setProperty('--ry', '0deg');
  };

  return (
    <div
      ref={ref}
      onPointerEnter={handleEnter}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={cn('group/tilt relative', className)}
      style={
        {
          transform:
            'perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translate3d(0,0,0)',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.4s var(--ease-out-expo)',
        } as React.CSSProperties
      }
    >
      {children}

      {/* The light that follows the pointer. Decorative, so hidden from AT. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/tilt:opacity-100"
        style={{
          background:
            'radial-gradient(340px circle at var(--mx, 50%) var(--my, 50%), var(--accent-glow), transparent 65%)',
        }}
      />
    </div>
  );
}
