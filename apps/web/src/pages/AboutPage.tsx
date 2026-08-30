import { useAsync } from '@/lib/useAsync';
import { useReveal } from '@/lib/useReveal';
import { getExperience } from '@/lib/content';
import { useSiteSettings } from '@/lib/useSiteSettings';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { PageHeader, SectionHeading } from '@/components/PageHeader';
import { AsyncSection, EmptyState } from '@/components/States';
import { Skeleton, SkeletonRows } from '@/components/Skeleton';
import { ExperienceTimeline } from '@/features/experience/ExperienceTimeline';

export function AboutPage() {
  const settings = useSiteSettings();
  const experience = useAsync(() => getExperience(), []);

  // Rescan for reveal targets once the async content has rendered.
  useReveal([settings, experience.data]);

  useDocumentMeta({
    title: 'About',
    description: 'Background, focus and a professional timeline.',
  });

  return (
    <>
      <PageHeader title="About" description={settings?.tagline} />

      <section className="max-w-prose">
        {settings === null ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          settings?.bio.split('\n\n').map((paragraph, index) => (
            <p key={index} className="mb-4 text-sm leading-relaxed text-muted">
              {paragraph}
            </p>
          ))
        )}

        {settings && (
          <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="font-medium text-text">Location</dt>
            <dd className="text-muted">{settings.location}</dd>

            <dt className="font-medium text-text">Email</dt>
            <dd>
              <a
                href={`mailto:${settings.emailPublic}`}
                className="text-accent underline-offset-4 hover:underline"
              >
                {settings.emailPublic}
              </a>
            </dd>
          </dl>
        )}
      </section>

      <section className="mt-14">
        <SectionHeading title="Professional timeline" />

        <AsyncSection
          isLoading={experience.isLoading}
          error={experience.error}
          data={experience.data}
          onRetry={experience.retry}
          skeleton={<SkeletonRows count={3} />}
          empty={
            <EmptyState
              title="No experience recorded yet"
              description="Roles added through the admin portal will appear here."
            />
          }
        >
          {(entries) => <ExperienceTimeline entries={entries} />}
        </AsyncSection>
      </section>
    </>
  );
}
