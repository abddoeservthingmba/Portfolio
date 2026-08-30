import { Card } from '@/components/Card';
import { formatDateRange, toDateTimeAttribute } from '@/lib/format';
import type { Education } from '@/types/content';

export function EducationCard({ record }: { record: Education }) {
  return (
    <Card className="p-5">
      <h3 className="text-base font-semibold text-text">{record.qualification}</h3>
      <p className="mt-0.5 text-sm font-medium text-muted">{record.field}</p>
      <p className="mt-1 text-sm text-muted">{record.institution}</p>

      <p className="mt-1 text-xs text-subtle">
        <time dateTime={toDateTimeAttribute(record.startDate)}>
          {formatDateRange(record.startDate, record.endDate)}
        </time>
      </p>

      {record.summary && <p className="mt-3 max-w-prose text-sm text-muted">{record.summary}</p>}
    </Card>
  );
}
