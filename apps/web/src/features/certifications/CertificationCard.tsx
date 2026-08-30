import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { formatFullDate, toDateTimeAttribute } from '@/lib/format';
import type { Certification } from '@/types/content';

/** Renders with or without an image and with or without a credential URL (FR-06). */
export function CertificationCard({ certification }: { certification: Certification }) {
  return (
    <Card className="flex h-full gap-4 p-5">
      <CertificationThumbnail certification={certification} />

      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold text-text">{certification.title}</h3>
        <p className="mt-0.5 text-sm text-muted">{certification.issuer}</p>

        <p className="mt-1 text-xs text-subtle">
          Issued{' '}
          <time dateTime={toDateTimeAttribute(certification.issueDate)}>
            {formatFullDate(certification.issueDate)}
          </time>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {certification.credentialId && <Badge>ID {certification.credentialId}</Badge>}

          {certification.credentialUrl && (
            <a
              href={certification.credentialUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-xs font-medium text-accent underline-offset-4 hover:underline"
            >
              Verify credential
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}

function CertificationThumbnail({ certification }: { certification: Certification }) {
  if (!certification.imageUrl) return null;

  return (
    <img
      src={certification.imageUrl}
      alt={`${certification.title} certificate`}
      loading="lazy"
      // Fixed box reserves the space before the asset arrives.
      className="h-16 w-16 shrink-0 rounded-control border border-border object-cover"
    />
  );
}
