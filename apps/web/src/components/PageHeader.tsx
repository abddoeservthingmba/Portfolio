import type { ReactNode } from 'react';
import { Reveal } from './motion/Reveal';
import { SplitText, SplitReveal } from './motion/SplitText';

/**
 * The heading block every public route opens with. One <h1> per page lives
 * here, which is what keeps the document outline correct without each page
 * having to remember.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
}: {
  title: string;
  description?: string;
  /** A short label above the title — section, count, or context. */
  eyebrow?: string;
}) {
  return (
    <header className="relative mb-12">
      {eyebrow && (
        <Reveal index={0} as="p" className="mb-3">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
            {eyebrow}
          </span>
        </Reveal>
      )}

      <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-text">
        <SplitReveal>
          <SplitText text={title} />
        </SplitReveal>
      </h1>

      {description && (
        <Reveal index={2} as="p" className="mt-4 max-w-prose text-base leading-relaxed text-muted">
          {description}
        </Reveal>
      )}

      <Reveal
        index={3}
        className="mt-8 h-px w-full bg-gradient-to-r from-border via-border to-transparent"
      />
    </header>
  );
}

/** A section heading within a page — always an h2, never a styled div. */
export function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <h2 className="text-xl font-semibold tracking-tight text-text sm:text-2xl">{title}</h2>
      {action}
    </div>
  );
}
