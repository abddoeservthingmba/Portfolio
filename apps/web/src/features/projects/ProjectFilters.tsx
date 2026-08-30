import { useState } from 'react';
import { Button } from '@/components/Button';
import { cn } from '@/lib/cn';
import type { Skill } from '@/types/content';

/**
 * Search and skill filtering for the projects list (FR-11).
 *
 * Fully controlled — the page owns the filter state because it also owns the
 * URL query parameters those values are mirrored into.
 */
export function ProjectFilters({
  search,
  onSearchChange,
  skills,
  activeSkillId,
  onSkillChange,
  onClear,
  isFiltered,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  skills: Skill[];
  activeSkillId: string | null;
  onSkillChange: (skillId: string | null) => void;
  onClear: () => void;
  isFiltered: boolean;
}) {
  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor="project-search" className="block text-sm font-medium text-text">
            Search projects
          </label>
          <input
            id="project-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by title or description"
            className="mt-1.5 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-subtle"
          />
        </div>

        {isFiltered && (
          <Button variant="secondary" onClick={onClear}>
            Clear filters
          </Button>
        )}
      </div>

      {skills.length > 0 && (
        <SkillFilters skills={skills} activeSkillId={activeSkillId} onSkillChange={onSkillChange} />
      )}
    </div>
  );
}

/** Below this the list is short enough to show whole. */
const COLLAPSED_COUNT = 10;

/**
 * The skill filters, collapsed by default.
 *
 * A full list of every skill pushes the projects themselves below the fold,
 * which inverts the page: the filters become the content. Showing the first
 * ten keeps the control available without it dominating.
 *
 * An active filter outside the collapsed set forces the list open, so the
 * control that is currently doing something is never hidden.
 */
function SkillFilters({
  skills,
  activeSkillId,
  onSkillChange,
}: {
  skills: Skill[];
  activeSkillId: string | null;
  onSkillChange: (skillId: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const activeIsHidden =
    activeSkillId !== null && skills.findIndex((s) => s.id === activeSkillId) >= COLLAPSED_COUNT;

  const showAll = expanded || activeIsHidden;
  const visible = showAll ? skills : skills.slice(0, COLLAPSED_COUNT);
  const hiddenCount = skills.length - visible.length;

  return (
    <fieldset>
      <legend className="mb-2.5 text-sm font-medium text-text">Filter by skill</legend>

      <ul className="flex flex-wrap gap-2">
        {visible.map((skill) => {
          const isActive = skill.id === activeSkillId;

          return (
            <li key={skill.id}>
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() => onSkillChange(isActive ? null : skill.id)}
                className={cn(
                  'press rounded-pill border px-3 py-1.5 text-xs font-medium transition-colors duration-300',
                  isActive
                    ? 'border-transparent bg-accent text-accent-fg'
                    : 'border-border bg-surface text-muted hover:border-border-strong hover:text-text',
                )}
              >
                {skill.name}
              </button>
            </li>
          );
        })}

        {hiddenCount > 0 && (
          <li>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="press rounded-pill border border-dashed border-border px-3 py-1.5 text-xs font-medium text-subtle transition-colors duration-300 hover:text-text"
            >
              +{hiddenCount} more
            </button>
          </li>
        )}

        {showAll && !activeIsHidden && skills.length > COLLAPSED_COUNT && (
          <li>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="press rounded-pill border border-dashed border-border px-3 py-1.5 text-xs font-medium text-subtle transition-colors duration-300 hover:text-text"
            >
              Show fewer
            </button>
          </li>
        )}
      </ul>
    </fieldset>
  );
}
