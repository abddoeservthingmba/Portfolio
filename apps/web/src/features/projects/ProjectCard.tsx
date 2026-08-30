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
      <article className="edge-light group/card relative flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface shadow-[var(--shadow-md)] transition-[border-color,box-shadow] duration-500 hover:border-border-strong hover:shadow-[var(--shadow-lg)]">
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
function ProjectThumbnail({ project }: { project: Project }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden border-b border-border bg-surface-sunken">
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
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(60% 80% at 30% 20%, var(--accent-subtle), transparent 70%), radial-gradient(50% 70% at 80% 80%, oklch(from var(--accent-2) l c h / 0.14), transparent 70%)',
        }}
      />
      <span className="relative text-5xl font-semibold tracking-tight text-subtle/70">
        {title.charAt(0)}
      </span>
    </div>
  );
}
