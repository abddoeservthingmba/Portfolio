import { Link } from 'react-router';
import { Badge } from '@/components/Badge';
import { TiltCard } from '@/components/motion/TiltCard';
import type { Project } from '@/types/content';

const MAX_VISIBLE_SKILLS = 4;

export function ProjectCard({ project }: { project: Project }) {
  const visible = project.skills.slice(0, MAX_VISIBLE_SKILLS);
  const overflow = project.skills.length - visible.length;

  return (
    <TiltCard className="h-full">
      <article className="group/card relative flex h-full flex-col overflow-hidden rounded-card border-2 border-border-strong bg-surface shadow-[var(--shadow-md)] transition-[box-shadow,transform] duration-500 hover:shadow-[var(--shadow-lg)]">
        <ProjectThumbnail project={project} />

        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-lg font-semibold tracking-tight text-text">
            {/*
              The whole card is the target, but only the title is the link — an
              anchor wrapping a card makes its accessible name the entire
              contents, which is unusable in a list.
            */}
            <Link to={`/projects/${project.slug}`} className="after:absolute after:inset-0">
              {project.title}
            </Link>
          </h3>

          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
            {project.shortDescription}
          </p>

          {project.skills.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {visible.map((skill) => (
                <li key={skill.id}>
                  <Badge>{skill.name}</Badge>
                </li>
              ))}
              {overflow > 0 && (
                <li>
                  <Badge>+{overflow}</Badge>
                </li>
              )}
            </ul>
          )}

          <span className="mt-5 flex items-center gap-1.5 text-sm font-medium text-accent">
            Read more
            <span
              aria-hidden="true"
              className="transition-transform duration-400 [transition-timing-function:var(--ease-spring)] group-hover/card:translate-x-1.5"
            >
              →
            </span>
          </span>
        </div>
      </article>
    </TiltCard>
  );
}

/**
 * Reserves a fixed 16:9 box before the image loads, so a list of cards does not
 * shift under the reader as assets arrive (C3, D12).
 */
/**
 * Fallback tints, cycled per project.
 *
 * A row of cards all sharing one colour reads as a single block. Deriving the
 * tint from the slug rather than the render index keeps a given project the
 * same colour wherever it appears — filtering a list must not repaint it.
 */
const TINTS = [
  'oklch(93% 0.13 103)', // butter
  'oklch(90% 0.09 42)', // peach
  'oklch(90% 0.08 200)', // sky
  'oklch(91% 0.09 150)', // mint
  'oklch(90% 0.08 320)', // lilac
];

function tintFor(slug: string): string {
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) % 9973;

  return TINTS[hash % TINTS.length]!;
}

function ProjectThumbnail({ project }: { project: Project }) {
  return (
    <div
      className="relative aspect-video w-full overflow-hidden border-b-2 border-border-strong"
      style={{ backgroundColor: tintFor(project.slug) }}
    >
      {project.imageUrl ? (
        <img
          src={project.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 [transition-timing-function:var(--ease-out-expo)] group-hover/card:scale-[1.04]"
        />
      ) : (
        <InitialMark title={project.title} />
      )}
    </div>
  );
}

/** Fallback art for a project with no image: its initial over a soft wash. */
function InitialMark({ title }: { title: string }) {
  return (
    <div className="relative flex h-full items-center justify-center" aria-hidden="true">
      <span className="relative text-7xl font-extrabold tracking-tight text-border-strong/25">
        {title.charAt(0)}
      </span>
    </div>
  );
}
