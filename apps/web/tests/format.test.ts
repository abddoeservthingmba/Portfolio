import { describe, expect, it } from 'vitest';
import { formatDateRange, formatMonthYear, toDateTimeAttribute } from '@/lib/format';
import { groupByCategory } from '@/features/skills/groupByCategory';
import type { Skill } from '@/types/content';

describe('formatDateRange', () => {
  it('renders a null end date as a current role', () => {
    expect(formatDateRange('2024-06-01', null)).toBe('Jun 2024 — Present');
  });

  it('renders a closed range', () => {
    expect(formatDateRange('2023-01-01', '2024-05-31')).toBe('Jan 2023 — May 2024');
  });
});

describe('formatMonthYear', () => {
  it('returns the raw input rather than "Invalid Date" when it will not parse', () => {
    expect(formatMonthYear('not-a-date')).toBe('not-a-date');
  });
});

describe('toDateTimeAttribute', () => {
  it('yields an empty attribute for an unparseable value', () => {
    expect(toDateTimeAttribute('nonsense')).toBe('');
  });

  it('trims a full timestamp to a date', () => {
    expect(toDateTimeAttribute('2025-03-14T10:00:00Z')).toBe('2025-03-14');
  });
});

describe('groupByCategory', () => {
  const skill = (id: string, category: string): Skill => ({
    id,
    name: id,
    category,
    icon: null,
    proficiency: null,
  });

  it('groups by category and preserves source order', () => {
    const groups = groupByCategory([
      skill('a', 'Frontend'),
      skill('b', 'Backend'),
      skill('c', 'Frontend'),
    ]);

    expect(groups.map(([category]) => category)).toEqual(['Frontend', 'Backend']);
    expect(groups[0]?.[1]).toHaveLength(2);
  });

  it('does not drop a skill with a blank category', () => {
    const groups = groupByCategory([skill('a', '  ')]);

    expect(groups).toEqual([['Other', [expect.objectContaining({ id: 'a' })]]]);
  });
});
