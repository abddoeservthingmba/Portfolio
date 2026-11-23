import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { buttonStyles } from '@/components/buttonStyles';
import { Card } from '@/components/Card';
import { Skeleton } from '@/components/Skeleton';
import { Reveal } from '@/components/motion/Reveal';
import { SplitText, SplitReveal } from '@/components/motion/SplitText';
import { TiltCard } from '@/components/motion/TiltCard';
import { CountUp } from '@/components/motion/CountUp';
import type { ResumeVersion, SiteSettings } from '@/types/content';

export interface HeroStats {
  /** Whole years since the earliest role, or null when no roles are listed. */
  years: number | null;
  projects: number;
  skills: number;
  certifications: number;
}

/**
 * The first screen a recruiter or engineering manager sees.
 *
 * Built to answer four questions in the first few seconds: who this is, what
 * role they do, where they are, and how to get the résumé or get in touch. The
 * at-a-glance card carries the numbers a reviewer scans for, counted up on
 * arrival. Every figure is computed from live content.
 */
export function Hero({
  settings,
  resume,
  stats,
  isLoading,
}: {
  settings: SiteSettings | null;
  resume: ResumeVersion | null;
  stats: HeroStats;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <section className="grid gap-12 py-12 lg:grid-cols-[1.35fr_1fr] lg:items-center">
        <div className="space-y-5">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-16 w-3/4" />
          <Skeleton className="h-6 w-full max-w-prose" />
          <Skeleton className="h-5 w-2/3" />
        </div>
        <Skeleton className="h-64 w-full" />
      </section>
    );
  }

  const glance: Array<[string, ReactNode]> = [
    ...(settings?.location ? [['Based in', settings.location] as [string, ReactNode]] : []),
    ...(stats.years !== null
      ? [['Experience', <CountUp key="years" value={stats.years} suffix="+ years" />] as [string, ReactNode]]
      : []),
    ['Projects', <CountUp key="projects" value={stats.projects} />],
    ['Skills', <CountUp key="skills" value={stats.skills} />],
    ['Certifications', <CountUp key="certs" value={stats.certifications} />],
  ];

  const name = settings?.siteTitle ?? 'Portfolio';

  return (
    <section className="relative isolate grid gap-12 py-10 sm:py-16 lg:grid-cols-[1.35fr_1fr] lg:items-center">
      <HeroShapes />

      <div>
        <Reveal index={0}>
          <p className="inline-flex items-center gap-2 text-sm font-medium text-muted">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Open to opportunities
          </p>
        </Reveal>

        <h1 className="display mt-5 text-[clamp(2.5rem,6.5vw,4.75rem)] leading-[1.02] text-text">
          <SplitReveal>
            <SplitText text={name} />
          </SplitReveal>
        </h1>

        {settings?.tagline && (
          <Reveal index={2} as="p" className="mt-5 text-lg font-medium text-text sm:text-xl">
            {settings.tagline}
          </Reveal>
        )}

        {settings?.bio && (
          <Reveal index={3} as="p" className="mt-4 max-w-prose leading-relaxed text-muted">
            {settings.bio.split('\n\n')[0]}
          </Reveal>
        )}

        <Reveal index={4} className="mt-9 flex flex-wrap items-center gap-3">
          <Link to="/projects" className={buttonStyles('primary', 'lg')}>
            View projects
          </Link>

          {resume && (
            <a
              href={resume.fileUrl}
              target="_blank"
              rel="noreferrer noopener"
              className={buttonStyles('secondary', 'lg')}
            >
              Download résumé
            </a>
          )}

          <a href="#contact" className={buttonStyles('ghost', 'lg')}>
            Contact
          </a>
        </Reveal>
      </div>

      <Reveal index={5} variant="scale">
        <TiltCard>
          <Card className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-subtle">
              At a glance
            </p>

            <dl className="mt-5 divide-y divide-border">
              {glance.map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-6 py-3.5">
                  <dt className="text-sm text-muted">{label}</dt>
                  <dd className="display text-base text-text">{value}</dd>
                </div>
              ))}
            </dl>

            {settings?.emailPublic && (
              <a
                href={`mailto:${settings.emailPublic}`}
                className="mt-4 block truncate text-sm font-medium text-accent underline-offset-4 hover:underline"
              >
                {settings.emailPublic}
              </a>
            )}
          </Card>
        </TiltCard>
      </Reveal>
    </section>
  );
}

/**
 * Drifting geometric forms behind the hero. Pure decoration: hidden from
 * assistive tech, inert to the pointer, and styled per visual style in
 * index.css (solid primaries for Geometric, soft orbs for Glass, none for
 * Minimal).
 */
function HeroShapes() {
  return (
    <div aria-hidden="true" className="hero-shapes pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <span className="shape shape-ring" style={{ top: '4%', right: '8%', animationDelay: '0s' }} />
      <span className="shape shape-square" style={{ top: '58%', right: '34%', animationDelay: '-3s' }} />
      <span className="shape shape-triangle" style={{ top: '70%', right: '6%', animationDelay: '-6s' }} />
      <span className="shape shape-dot" style={{ top: '14%', right: '40%', animationDelay: '-2s' }} />
    </div>
  );
}
