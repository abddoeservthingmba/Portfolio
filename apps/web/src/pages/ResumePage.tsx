import { useAsync } from '@/lib/useAsync';
import { useReveal } from '@/lib/useReveal';
import { getResume } from '@/lib/content';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { PageHeader } from '@/components/PageHeader';
import { AsyncSection, EmptyState } from '@/components/States';
import { SkeletonRows } from '@/components/Skeleton';
import { Card } from '@/components/Card';
import { buttonStyles } from '@/components/buttonStyles';
import { formatFullDate, toDateTimeAttribute } from '@/lib/format';

export function ResumePage() {
  const resume = useAsync(() => getResume(), []);

  // Rescan for reveal targets once the async content has rendered.
  useReveal([resume.data]);

  useDocumentMeta({
    title: 'Resume',
    description: 'Download or view the current resume.',
  });

  return (
    <>
      <PageHeader
        eyebrow="One page, downloadable"
        title="Resume"
        description="One version is active at a time. This is always the current one."
      />

      <AsyncSection
        isLoading={resume.isLoading}
        error={resume.error}
        data={resume.data}
        onRetry={resume.retry}
        skeleton={<SkeletonRows count={1} />}
        empty={
          <EmptyState
            title="No resume published yet"
            description="Once a resume is uploaded and marked active in the admin portal, it will be available here."
          />
        }
      >
        {(version) => (
          <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <h2 className="text-base font-semibold text-text">{version.title}</h2>
              <p className="mt-1 text-xs text-subtle">
                Updated{' '}
                <time dateTime={toDateTimeAttribute(version.createdAt)}>
                  {formatFullDate(version.createdAt)}
                </time>
              </p>
            </div>

            <a
              href={version.fileUrl}
              target="_blank"
              rel="noreferrer noopener"
              className={buttonStyles('primary')}
            >
              Open resume
            </a>
          </Card>
        )}
      </AsyncSection>
    </>
  );
}
