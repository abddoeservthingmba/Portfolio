import { useAsync } from '@/lib/useAsync';
import { getExperience } from '@/lib/content';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { PageHeader } from '@/components/PageHeader';
import { AsyncSection, EmptyState } from '@/components/States';
import { SkeletonRows } from '@/components/Skeleton';
import { ExperienceTimeline } from '@/features/experience/ExperienceTimeline';

export function ExperiencePage() {
  const experience = useAsync(() => getExperience(), []);

  useDocumentMeta({
    title: 'Experience',
    description: 'Roles, companies, dates and what each involved.',
  });

  return (
    <>
      <PageHeader
        title="Experience"
        description="Roles in reverse-chronological order, with what each one actually involved."
      />

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
    </>
  );
}
