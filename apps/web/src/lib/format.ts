/**
 * Date formatting for the public site. All inputs are ISO date strings, as
 * carried by JSON — nothing here accepts a Date object.
 */

const MONTH_YEAR = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' });
const FULL_DATE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function parse(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** 'Mar 2024'. Returns the raw input if it will not parse, never 'Invalid Date'. */
export function formatMonthYear(iso: string): string {
  const date = parse(iso);
  return date ? MONTH_YEAR.format(date) : iso;
}

/** '14 March 2025'. */
export function formatFullDate(iso: string): string {
  const date = parse(iso);
  return date ? FULL_DATE.format(date) : iso;
}

/**
 * 'Jun 2024 — Present' for a null end date, which is how a current role is
 * denoted in the data model (D3.1).
 */
export function formatDateRange(startIso: string, endIso: string | null): string {
  const start = formatMonthYear(startIso);
  return endIso ? `${start} — ${formatMonthYear(endIso)}` : `${start} — Present`;
}

/** Machine-readable value for a <time dateTime> attribute. */
export function toDateTimeAttribute(iso: string): string {
  return parse(iso) ? iso.slice(0, 10) : '';
}
