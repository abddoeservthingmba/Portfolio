import { formatDateRange, toDateTimeAttribute } from '@/lib/format';
import { Badge } from '@/components/Badge';
import type { Experience } from '@/types/content';

export function ExperienceTimeline({ entries }: { entries: Experience[] }) {
  return (
    <ol className="relative space-y-8 border-l border-border pl-6">
      {entries.map((entry) => (
        <TimelineEntry key={entry.id} entry={entry} />
      ))}
    </ol>
  );
}

function TimelineEntry({ entry }: { entry: Experience }) {
  const isCurrent = entry.endDate === null;

  return (
    <li className="relative">
      <span
        aria-hidden="true"
        className="absolute -left-[1.8125rem] top-1.5 h-3 w-3 rounded-full border-2 border-bg bg-accent"
      />

      <div className="flex flex-wrap items-baseline gap-x-2">
        <h3 className="text-base font-semibold text-text">{entry.role}</h3>
        {isCurrent && <Badge tone="accent">Current</Badge>}
      </div>

      <p className="mt-0.5 text-sm font-medium text-muted">{entry.company}</p>

      <p className="mt-1 text-xs text-subtle">
        <time dateTime={toDateTimeAttribute(entry.startDate)}>
          {formatDateRange(entry.startDate, entry.endDate)}
        </time>
      </p>

      <p className="mt-3 max-w-prose text-sm text-muted">{entry.summary}</p>
    </li>
  );
}
