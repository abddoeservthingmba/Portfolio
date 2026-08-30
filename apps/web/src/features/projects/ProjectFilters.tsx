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
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-text">Filter by skill</legend>
          <ul className="flex flex-wrap gap-2">
            {skills.map((skill) => {
              const isActive = skill.id === activeSkillId;

              return (
                <li key={skill.id}>
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => onSkillChange(isActive ? null : skill.id)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      isActive
                        ? 'border-transparent bg-accent text-accent-fg'
                        : 'border-border bg-surface text-muted hover:text-text',
                    )}
                  >
                    {skill.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}
    </div>
  );
}
