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
      {/*
        The same marker the homepage stages carry, so an inner route reads as
        part of the journey rather than as a different site. It was previously a
        bare line of letterspaced text, which is the one thing on the page that
        looked unfinished next to the stage labels.
      */}
      {eyebrow && (
        <Reveal index={0} as="p" className="mb-5">
          <span
            className="episode-tag sticker text-text"
            style={{ '--tilt': '-1.5deg' } as React.CSSProperties}
          >
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
            {eyebrow}
          </span>
        </Reveal>
      )}

      <h1 className="display display-xl text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[0.95] text-text">
        <SplitReveal>
          <SplitText text={title} />
        </SplitReveal>
      </h1>

      {description && (
        <Reveal index={2} as="p" className="mt-5 max-w-prose text-base leading-relaxed text-muted">
          {description}
        </Reveal>
      )}

      {/*
        An accent segment butted against a full-width rule, rather than a rule
        that fades out. A gradient to transparent reads as a rendering artefact
        at this weight; a deliberate short bar reads as a mark.
      */}
      <Reveal index={3} className="mt-9 flex" aria-hidden="true">
        <span className="h-0.5 w-16 shrink-0 bg-accent" />
        <span className="h-0.5 flex-1 bg-border" />
      </Reveal>
    </header>
  );
}

/** A section heading within a page — always an h2, never a styled div. */
export function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <h2 className="display text-xl text-text sm:text-2xl">{title}</h2>
      {action}
    </div>
  );
}
