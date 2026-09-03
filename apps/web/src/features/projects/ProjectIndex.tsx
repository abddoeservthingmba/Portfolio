import { useState } from 'react';
import { Link } from 'react-router';
import { Badge } from '@/components/Badge';
import { cn } from '@/lib/cn';
import { ProjectArt, artFor } from './ProjectArt';
import type { Project } from '@/types/content';

/**
 * An editorial index: numbered rows, with the hovered project previewed in a
 * panel that follows the cursor.
 *
 * This reads as a contents page rather than a card wall, which suits a list
 * where the titles carry the information. The preview is what makes scanning
 * feel like browsing — you discover each project by moving through the list
 * rather than by clicking into it.
 *
 * The preview is pointer-only and decorative. Everything it shows is already
 * in the row, so touch and keyboard users lose nothing.
 */
export function ProjectIndex({ projects }: { projects: Project[] }) {
  const [hovered, setHovered] = useState<Project | null>(null);
  const [point, setPoint] = useState({ x: 0, y: 0 });

  return (
    <div
      className="relative"
      onPointerLeave={() => setHovered(null)}
      onPointerMove={(event) => {
        if (event.pointerType !== 'mouse') return;
        setPoint({ x: event.clientX, y: event.clientY });
      }}
    >
      <ol className="border-t-2 border-border-strong">
        {projects.map((project, index) => (
          <li key={project.id}>
            <ProjectRow project={project} index={index} onEnter={() => setHovered(project)} />
          </li>
        ))}
      </ol>

      <HoverPreview project={hovered} point={point} />
    </div>
  );
}

function ProjectRow({
  project,
  index,
  onEnter,
}: {
  project: Project;
  index: number;
  onEnter: () => void;
}) {
  const art = artFor(project.slug);

  return (
    <div
      onPointerEnter={onEnter}
      className="group/row relative flex items-baseline gap-5 border-b-2 border-border-strong py-8 pl-4 transition-colors duration-500 sm:gap-8 sm:pl-6"
      style={{ '--row-tint': art.base } as React.CSSProperties}
    >
      {/*
        A rule in the project's own colour, so the index carries per-project
        identity without becoming a card wall — the editorial reading this list
        was designed for survives, but the rows stop being uniform grey text.
      */}
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-0 top-0 w-[3px] origin-bottom scale-y-0 transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] group-hover/row:scale-y-100"
        style={{ backgroundColor: art.ink }}
      />

      {/*
        The number, boxed. Bare letterspaced mono was the one element on this
        page not speaking the site's border-and-offset language.
      */}
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.5rem] border-2 border-border-strong font-mono text-xs font-bold text-subtle transition-colors duration-300 group-hover/row:border-accent group-hover/row:text-accent">
        {String(index + 1).padStart(2, '0')}
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="text-xl font-semibold tracking-tight text-text sm:text-2xl">
          <Link
            to={`/projects/${project.slug}`}
            className="after:absolute after:inset-0 [transition:transform_0.5s_var(--ease-out-expo)] group-hover/row:inline-block group-hover/row:translate-x-2"
          >
            {project.title}
          </Link>
        </h3>

        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          {project.shortDescription}
        </p>

        {project.skills.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {project.skills.slice(0, 4).map((skill) => (
              <li key={skill.id}>
                <Badge>{skill.name}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <span
        aria-hidden="true"
        className="shrink-0 text-xl text-subtle opacity-0 transition-all duration-500 [transition-timing-function:var(--ease-spring)] group-hover/row:translate-x-0 group-hover/row:text-accent group-hover/row:opacity-100 sm:-translate-x-3"
      >
        →
      </span>
    </div>
  );
}

/**
 * A card pinned to the cursor showing the hovered project's art.
 *
 * Fixed-positioned and translated, so it never affects the document — moving
 * it is a compositor-only change.
 */
function HoverPreview({
  project,
  point,
}: {
  project: Project | null;
  point: { x: number; y: number };
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed left-0 top-0 z-30 hidden lg:block',
        'transition-opacity duration-300',
        project ? 'opacity-100' : 'opacity-0',
      )}
      style={{
        transform: `translate3d(${point.x + 28}px, ${point.y - 110}px, 0)`,
        transition: 'transform 0.45s var(--ease-out-expo), opacity 0.3s linear',
      }}
    >
      {project && (
        <div className="h-[13.5rem] w-80 overflow-hidden rounded-card border-2 border-border-strong bg-surface shadow-[var(--shadow-lg)]">
          <ProjectArt project={project} />
        </div>
      )}
    </div>
  );
}
