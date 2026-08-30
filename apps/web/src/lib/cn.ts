/**
 * Joins class names, dropping anything falsy. Deliberately not clsx — this is
 * the whole of what the codebase uses it for.
 */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
