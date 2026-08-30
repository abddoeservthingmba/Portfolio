import { validationFailed } from '../../lib/errors.js';

/**
 * Schemas hand over ISO date strings; Prisma's @db.Date columns want Date
 * objects. Parsed as UTC midnight so a date never shifts a day under the
 * server's timezone.
 */
export function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function toDateOrNull(iso: string | null | undefined): Date | null {
  return iso ? toDate(iso) : null;
}

/**
 * Re-checks the date order against what is actually stored.
 *
 * A PATCH may carry only an end date, so the schema alone cannot tell whether
 * the resulting pair makes sense — it only sees half of it. This closes that
 * gap by comparing the incoming value against the row it will land on.
 */
export function assertDateOrder(
  incoming: { startDate?: string | undefined; endDate?: string | null | undefined },
  stored: { startDate: Date; endDate: Date | null },
): void {
  const start = incoming.startDate ?? stored.startDate.toISOString().slice(0, 10);

  const end =
    incoming.endDate === undefined
      ? (stored.endDate?.toISOString().slice(0, 10) ?? null)
      : incoming.endDate;

  if (end && end < start) {
    throw validationFailed({ endDate: 'The end date cannot be before the start date.' });
  }
}
