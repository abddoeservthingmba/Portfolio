import { useAsync } from '@/lib/useAsync';
import { getCertifications } from '@/lib/content';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { PageHeader } from '@/components/PageHeader';
import { AsyncSection, EmptyState } from '@/components/States';
import { SkeletonRows } from '@/components/Skeleton';
import { CertificationCard } from '@/features/certifications/CertificationCard';

export function CertificationsPage() {
  const certifications = useAsync(() => getCertifications(), []);

  useDocumentMeta({
    title: 'Certifications',
    description: 'Certifications with issuer, date and verifiable credentials.',
  });

  return (
    <>
      <PageHeader
        title="Certifications"
        description="Most recent first. Where a credential can be verified, the link goes to the issuer."
      />

      <AsyncSection
        isLoading={certifications.isLoading}
        error={certifications.error}
        data={certifications.data}
        onRetry={certifications.retry}
        skeleton={<SkeletonRows count={3} />}
        empty={
          <EmptyState
            title="No certifications recorded yet"
            description="Certifications added through the admin portal will appear here."
          />
        }
      >
        {(list) => (
          <ul className="grid gap-4 sm:grid-cols-2">
            {list.map((certification) => (
              <li key={certification.id}>
                <CertificationCard certification={certification} />
              </li>
            ))}
          </ul>
        )}
      </AsyncSection>
    </>
  );
}
