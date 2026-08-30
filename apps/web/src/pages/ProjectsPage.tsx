import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAsync } from '@/lib/useAsync';
import { getProjects, getSkills } from '@/lib/content';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { PageHeader } from '@/components/PageHeader';
import { AsyncSection, EmptyState } from '@/components/States';
import { SkeletonCards } from '@/components/Skeleton';
import { ProjectGrid } from '@/features/projects/ProjectGrid';
import { ProjectFilters } from '@/features/projects/ProjectFilters';

/** Long enough that typing does not fire a request per keystroke. */
const SEARCH_DEBOUNCE_MS = 250;

export function ProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // The URL is the source of truth, so a filtered view can be shared or reloaded.
  const query = searchParams.get('q') ?? '';
  const skillId = searchParams.get('skill');

  // Typing updates the input immediately and the URL only once it settles.
  const [searchInput, setSearchInput] = useState(query);
  const debouncedSearch = useDebounced(searchInput, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (debouncedSearch) next.set('q', debouncedSearch);
        else next.delete('q');
        return next;
      },
      { replace: true },
    );
  }, [debouncedSearch, setSearchParams]);

  const skills = useAsync(() => getSkills(), []);
  const projects = useAsync(
    () =>
      getProjects({
        ...(debouncedSearch ? { q: debouncedSearch } : {}),
        ...(skillId ? { skill: skillId } : {}),
      }),
    [debouncedSearch, skillId],
  );

  useDocumentMeta({
    title: 'Projects',
    description: 'Things I have built, what problem each solved and what it was built with.',
  });

  const isFiltered = Boolean(debouncedSearch || skillId);

  const setSkill = (nextSkillId: string | null) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextSkillId) next.set('skill', nextSkillId);
      else next.delete('skill');
      return next;
    });
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  return (
    <>
      <PageHeader
        title="Projects"
        description="What each one solved, and what it was built with."
      />

      <ProjectFilters
        search={searchInput}
        onSearchChange={setSearchInput}
        skills={skills.data ?? []}
        activeSkillId={skillId}
        onSkillChange={setSkill}
        onClear={clearFilters}
        isFiltered={isFiltered}
      />

      <AsyncSection
        isLoading={projects.isLoading}
        error={projects.error}
        data={projects.data}
        onRetry={projects.retry}
        skeleton={<SkeletonCards count={6} />}
        empty={
          isFiltered ? (
            <EmptyState
              title="No projects match these filters"
              description="Try a different search term, or clear the filters to see everything."
            />
          ) : (
            <EmptyState
              title="No projects published yet"
              description="Projects added through the admin portal will appear here."
            />
          )
        }
      >
        {(list) => (
          <>
            <p className="sr-only" role="status">
              {list.length} {list.length === 1 ? 'project' : 'projects'} found
            </p>
            <ProjectGrid projects={list} />
          </>
        )}
      </AsyncSection>
    </>
  );
}

/** Delays a rapidly changing value until it has been still for `delayMs`. */
function useDebounced<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return settled;
}
