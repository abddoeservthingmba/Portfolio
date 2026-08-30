import { Link } from 'react-router';
import { useAsync } from '@/lib/useAsync';
import { getProjects, getSettings } from '@/lib/content';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { AsyncSection, EmptyState } from '@/components/States';
import { SkeletonCards, Skeleton } from '@/components/Skeleton';
import { SectionHeading } from '@/components/PageHeader';
import { buttonStyles } from '@/components/buttonStyles';
import { ProjectGrid } from '@/features/projects/ProjectGrid';
import type { SiteSettings } from '@/types/content';

export function HomePage() {
  const settings = useAsync(() => getSettings(), []);
  const featured = useAsync(() => getProjects({ featured: true }), []);

  useDocumentMeta({
    title: 'Portfolio',
    description:
      settings.data?.tagline ?? 'Projects, experience, skills and certifications in one place.',
  });

  return (
    <>
      <Hero settings={settings.data} isLoading={settings.isLoading} />

      <section className="mt-14">
        <SectionHeading
          title="Featured projects"
          action={
            <Link to="/projects" className="text-sm text-accent underline-offset-4 hover:underline">
              All projects
            </Link>
          }
        />

        <AsyncSection
          isLoading={featured.isLoading}
          error={featured.error}
          data={featured.data}
          onRetry={featured.retry}
          skeleton={<SkeletonCards count={3} />}
          empty={
            <EmptyState
              title="No featured projects yet"
              description="Projects marked as featured will appear here."
            />
          }
        >
          {(projects) => <ProjectGrid projects={projects} />}
        </AsyncSection>
      </section>
    </>
  );
}

/**
 * The hero renders its own structure immediately and fills in text as settings
 * arrive, rather than blocking the whole page on one request (C3 cold start).
 */
function Hero({ settings, isLoading }: { settings: SiteSettings | null; isLoading: boolean }) {
  if (isLoading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-20 w-full max-w-prose" />
      </section>
    );
  }

  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">
        {settings?.siteTitle ?? 'Portfolio'}
      </h1>

      {settings?.tagline && <p className="mt-3 text-lg text-muted">{settings.tagline}</p>}

      {settings?.bio && (
        <p className="mt-5 max-w-prose text-sm leading-relaxed text-muted">
          {settings.bio.split('\n\n')[0]}
        </p>
      )}

      <div className="mt-7 flex flex-wrap gap-3">
        <Link to="/projects" className={buttonStyles('primary')}>
          View projects
        </Link>
        <Link to="/contact" className={buttonStyles('secondary')}>
          Get in touch
        </Link>
      </div>
    </section>
  );
}
