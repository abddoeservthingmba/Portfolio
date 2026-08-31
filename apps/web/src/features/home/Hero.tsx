import { Link } from 'react-router';
import { buttonStyles } from '@/components/buttonStyles';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/Skeleton';
import { Reveal } from '@/components/motion/Reveal';
import { SplitText, SplitReveal } from '@/components/motion/SplitText';
import { Magnetic } from '@/components/motion/Magnetic';
import type { SiteSettings } from '@/types/content';

/**
 * The hero renders its own structure immediately and fills in text as settings
 * arrive, rather than blocking the whole page on one request (C3 cold start).
 */
export function Hero({
  settings,
  isLoading,
}: {
  settings: SiteSettings | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <section className="relative py-10">
        <div className="space-y-5">
          <Skeleton className="h-9 w-52 rounded-pill" />
          <Skeleton className="h-20 w-3/4" />
          <Skeleton className="h-20 w-1/2" />
          <Skeleton className="h-5 w-full max-w-prose" />
        </div>
      </section>
    );
  }

  const [firstName, ...rest] = (settings?.siteTitle ?? 'Portfolio').split(' ');

  return (
    <section className="relative isolate py-8 sm:py-14">
      <div className="aurora" aria-hidden="true" />

      <div className="flex flex-wrap items-center gap-3">
        <Reveal index={0}>
          <span className="sticker inline-flex items-center gap-2 rounded-pill border-2 border-border-strong bg-accent-2 px-4 py-2 text-sm font-semibold text-accent-2-fg shadow-[var(--shadow-sm)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Open to opportunities
          </span>
        </Reveal>

        {settings?.location && (
          <Reveal index={1}>
            <span
              className="sticker inline-flex rounded-pill border-2 border-border-strong bg-surface px-4 py-2 text-sm font-semibold text-text shadow-[var(--shadow-sm)]"
              style={{ '--tilt': '2.5deg' } as React.CSSProperties}
            >
              {settings.location}
            </span>
          </Reveal>
        )}
      </div>

      <h1 className="mt-8">
        <SplitReveal>
          <span className="block text-[clamp(2.75rem,9vw,6.5rem)] font-extrabold leading-[0.9] tracking-[-0.045em] text-text">
            <SplitText text={firstName ?? ''} />
          </span>
          {rest.length > 0 && (
            <span className="text-gradient block text-[clamp(2.75rem,9vw,6.5rem)] font-extrabold leading-[0.9] tracking-[-0.045em]">
              <SplitText text={rest.join(' ')} startIndex={1} />
            </span>
          )}
        </SplitReveal>
      </h1>

      {settings?.tagline && (
        <Reveal
          index={2}
          as="p"
          className="mt-7 max-w-2xl text-lg font-medium text-text sm:text-xl"
        >
          {settings.tagline}
        </Reveal>
      )}

      {settings?.bio && (
        <Reveal index={3} as="p" className="mt-5 max-w-prose leading-relaxed text-muted">
          {settings.bio.split('\n\n')[0]}
        </Reveal>
      )}

      <Reveal index={4} className="mt-10 flex flex-wrap items-center gap-4">
        <Magnetic>
          <Link
            to="/projects"
            className={cn(buttonStyles('primary', 'lg'), 'group')}
            // A slow, occasional nudge. Constant movement stops being a signal.
            style={{ animation: 'wiggle 6s var(--ease-smooth) infinite' }}
          >
            See the work
            <span
              aria-hidden="true"
              className="transition-transform duration-400 [transition-timing-function:var(--ease-spring)] group-hover:translate-x-1.5"
            >
              →
            </span>
          </Link>
        </Magnetic>

        <Magnetic>
          {/*
            An in-page jump to the final stage rather than a route change — the
            contact form is the end of this page now, not somewhere else.
          */}
          <a href="#contact" className={buttonStyles('secondary', 'lg')}>
            Say hello
          </a>
        </Magnetic>
      </Reveal>

      {/*
        The cue that this page is travelled rather than read. Hidden from
        assistive tech: it describes a gesture, and the same destinations are
        already in the header and the progress rail.
      */}
      <Reveal index={5} className="mt-16 hidden sm:block">
        <span
          aria-hidden="true"
          className="scroll-cue inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.24em] text-subtle"
        >
          <span className="scroll-cue-track">
            <span className="scroll-cue-dot" />
          </span>
          Scroll to begin
        </span>
      </Reveal>
    </section>
  );
}
