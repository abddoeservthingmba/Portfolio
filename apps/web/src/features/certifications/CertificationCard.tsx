import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { formatFullDate, toDateTimeAttribute } from '@/lib/format';
import type { Certification } from '@/types/content';

/**
 * Renders with or without an image and with or without a credential URL (FR-06).
 *
 * When a credential URL exists the whole card is the target, not just a small
 * link — the card is what people aim at, and a verify link they have to hunt
 * for is a link nobody clicks.
 */
export function CertificationCard({ certification }: { certification: Certification }) {
  const href = certification.credentialUrl;

  return (
    <Card
      interactive={Boolean(href)}
      className="group/cert relative flex h-full gap-4 p-5 transition-colors"
    >
      <CertificationThumbnail certification={certification} />

      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold tracking-tight text-text">
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              // Covers the card, so the whole surface is clickable while the
              // accessible name stays just the title.
              className="after:absolute after:inset-0"
            >
              {certification.title}
            </a>
          ) : (
            certification.title
          )}
        </h3>

        <p className="mt-0.5 text-sm text-muted">{certification.issuer}</p>

        <p className="mt-1 text-xs text-subtle">
          Issued{' '}
          <time dateTime={toDateTimeAttribute(certification.issueDate)}>
            {formatFullDate(certification.issueDate)}
          </time>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {certification.credentialId && <Badge>ID {certification.credentialId}</Badge>}

          {href ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent">
              Verify credential
              <span
                aria-hidden="true"
                className="transition-transform duration-400 [transition-timing-function:var(--ease-spring)] group-hover/cert:translate-x-1"
              >
                ↗
              </span>
            </span>
          ) : (
            <span className="text-xs text-subtle">No public credential link</span>
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
      decoding="async"
      // Fixed box reserves the space before the asset arrives.
      className="h-16 w-16 shrink-0 rounded-control border border-border object-cover"
    />
  );
}
