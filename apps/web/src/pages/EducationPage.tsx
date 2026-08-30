import { useAsync } from '@/lib/useAsync';
import { getEducation } from '@/lib/content';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { PageHeader } from '@/components/PageHeader';
import { AsyncSection, EmptyState } from '@/components/States';
import { SkeletonRows } from '@/components/Skeleton';
import { EducationCard } from '@/features/education/EducationCard';

export function EducationPage() {
  const education = useAsync(() => getEducation(), []);

  useDocumentMeta({
    title: 'Education',
    description: 'Qualifications, institutions and fields of study.',
  });

  return (
    <>
      <PageHeader title="Education" description="Qualifications in reverse-chronological order." />

      <AsyncSection
        isLoading={education.isLoading}
        error={education.error}
        data={education.data}
        onRetry={education.retry}
        skeleton={<SkeletonRows count={2} />}
        empty={
          <EmptyState
            title="No education records yet"
            description="Records added through the admin portal will appear here."
          />
        }
      >
        {(records) => (
          <ul className="space-y-4">
            {records.map((record) => (
              <li key={record.id}>
                <EducationCard record={record} />
              </li>
            ))}
          </ul>
        )}
      </AsyncSection>
    </>
  );
}
