import { useAsync } from '@/lib/useAsync';
import { useReveal } from '@/lib/useReveal';
import { getSkills } from '@/lib/content';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { PageHeader } from '@/components/PageHeader';
import { AsyncSection, EmptyState } from '@/components/States';
import { SkeletonCards } from '@/components/Skeleton';
import { SkillCategory } from '@/features/skills/SkillCategory';
import { groupByCategory } from '@/features/skills/groupByCategory';

export function SkillsPage() {
  const skills = useAsync(() => getSkills(), []);

  // Rescan for reveal targets once the async content has rendered.
  useReveal([skills.data]);

  useDocumentMeta({
    title: 'Skills',
    description: 'Languages, frameworks and tools, grouped by category.',
  });

  return (
    <>
      <PageHeader
        title="Skills"
        description="Languages, frameworks and tools, grouped by the area they belong to."
      />

      <AsyncSection
        isLoading={skills.isLoading}
        error={skills.error}
        data={skills.data}
        onRetry={skills.retry}
        skeleton={<SkeletonCards count={4} />}
        empty={
          <EmptyState
            title="No skills recorded yet"
            description="Skills added through the admin portal will appear here, grouped by category."
          />
        }
      >
        {(list) => (
          <div className="grid gap-6 sm:grid-cols-2">
            {groupByCategory(list).map(([category, categorySkills]) => (
              <SkillCategory key={category} category={category} skills={categorySkills} />
            ))}
          </div>
        )}
      </AsyncSection>
    </>
  );
}
