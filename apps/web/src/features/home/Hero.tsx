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
          <Skeleton className="h-7 w-40 rounded-pill" />
          <Skeleton className="h-16 w-3/4" />
          <Skeleton className="h-16 w-1/2" />
          <Skeleton className="h-5 w-full max-w-prose" />
        </div>
      </section>
    );
  }

  const [firstName, ...rest] = (settings?.siteTitle ?? 'Portfolio').split(' ');

  return (
    <section className="relative isolate py-10 sm:py-16">
      {/* Ambient colour behind the type. Decorative only. */}
      <div className="aurora" aria-hidden="true" />

      <Reveal index={0}>
        <span className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface/70 px-3.5 py-1.5 text-xs font-medium text-muted backdrop-blur">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          Available for opportunities
        </span>
      </Reveal>

      <h1 className="mt-7">
        <SplitReveal>
          <span className="block text-[clamp(2.5rem,8vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-text">
            <SplitText text={firstName ?? ''} />
          </span>
          {rest.length > 0 && (
            <span className="text-gradient block text-[clamp(2.5rem,8vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
              <SplitText text={rest.join(' ')} startIndex={1} />
            </span>
          )}
        </SplitReveal>
      </h1>

      {settings?.tagline && (
        <Reveal index={2} as="p" className="mt-6 max-w-2xl text-lg text-muted sm:text-xl">
          {settings.tagline}
        </Reveal>
      )}

      {settings?.bio && (
        <Reveal index={3} as="p" className="mt-5 max-w-prose leading-relaxed text-muted">
          {settings.bio.split('\n\n')[0]}
        </Reveal>
      )}

      <Reveal index={4} className="mt-9 flex flex-wrap items-center gap-3">
        <Magnetic>
          <Link to="/projects" className={cn(buttonStyles('primary', 'lg'), 'squish group')}>
            View work
            <span
              aria-hidden="true"
              className="transition-transform duration-400 [transition-timing-function:var(--ease-spring)] group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </Magnetic>
        <Magnetic>
          <Link to="/contact" className={cn(buttonStyles('secondary', 'lg'), 'squish')}>
            Get in touch
          </Link>
        </Magnetic>
      </Reveal>
    </section>
  );
}
