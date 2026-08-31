import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * One stage of the homepage journey.
 *
 * Layout only — no state, no observers. The `data-stage` attribute is the
 * contract with useScrollStage, which finds stages by that attribute rather
 * than by being handed refs.
 *
 * Deliberately not full viewport height. A stage sized to 100dvh forces
 * whatever it contains into a fixed box, and a project grid does not fit the
 * same box as a heading. Stages are given generous breathing room and allowed
 * to be as tall as their content needs.
 */
export function Stage({
  index,
  id,
  children,
  className,
}: {
  index: number;
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      data-stage={index}
      // scroll-margin-top clears the sticky header when a HUD link jumps here.
      className={cn('relative scroll-mt-28 py-16 sm:py-24', className)}
    >
      {children}
    </section>
  );
}

/**
 * The small "STAGE n" marker that gives each section its place in the sequence.
 * Separate from Stage itself because two of the five stages want it positioned
 * differently, and an `align` prop would be a worse answer than composition.
 */
export function StageLabel({ index, label }: { index: number; label: string }) {
  return (
    <p className="reveal mb-4 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.22em] text-subtle">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-border-strong bg-accent-2 text-[0.7rem] font-bold text-accent-2-fg">
        {index + 1}
      </span>
      {label}
    </p>
  );
}
