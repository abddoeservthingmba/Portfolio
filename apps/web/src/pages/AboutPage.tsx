import { useAsync } from '@/lib/useAsync';
import { getExperience, getSettings } from '@/lib/content';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { PageHeader, SectionHeading } from '@/components/PageHeader';
import { AsyncSection, EmptyState } from '@/components/States';
import { Skeleton, SkeletonRows } from '@/components/Skeleton';
import { ExperienceTimeline } from '@/features/experience/ExperienceTimeline';

export function AboutPage() {
  const settings = useAsync(() => getSettings(), []);
  const experience = useAsync(() => getExperience(), []);

  useDocumentMeta({
    title: 'About',
    description: 'Background, focus and a professional timeline.',
  });

  return (
    <>
      <PageHeader title="About" description={settings.data?.tagline} />

      <section className="max-w-prose">
        {settings.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          settings.data?.bio.split('\n\n').map((paragraph, index) => (
            <p key={index} className="mb-4 text-sm leading-relaxed text-muted">
              {paragraph}
            </p>
          ))
        )}

        {settings.data && (
          <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="font-medium text-text">Location</dt>
            <dd className="text-muted">{settings.data.location}</dd>

            <dt className="font-medium text-text">Email</dt>
            <dd>
              <a
                href={`mailto:${settings.data.emailPublic}`}
                className="text-accent underline-offset-4 hover:underline"
              >
                {settings.data.emailPublic}
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
