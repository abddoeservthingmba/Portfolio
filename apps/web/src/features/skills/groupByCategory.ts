import type { Skill } from '@/types/content';

/**
 * Groups a flat skill list by its category field (FR-03).
 *
 * A blank or missing category falls into 'Other' rather than disappearing, and
 * insertion order is preserved so the ordering of the source data stays
 * meaningful on the page.
 */
export function groupByCategory(skills: Skill[]): Array<[string, Skill[]]> {
  const groups = new Map<string, Skill[]>();

  for (const skill of skills) {
    const category = skill.category?.trim() || 'Other';
    const existing = groups.get(category);

    if (existing) existing.push(skill);
    else groups.set(category, [skill]);
  }

  return [...groups.entries()];
}
