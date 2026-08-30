import { Link } from 'react-router';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import type { Project } from '@/types/content';

const MAX_VISIBLE_SKILLS = 4;

export function ProjectCard({ project }: { project: Project }) {
  const visible = project.skills.slice(0, MAX_VISIBLE_SKILLS);
  const overflow = project.skills.length - visible.length;

  return (
    // `relative` anchors the title link's full-card overlay further down.
    <Card interactive className="relative flex w-full flex-col overflow-hidden">
      <ProjectThumbnail project={project} />

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold text-text">
          {/*
            The whole card is the target, but only the title is the link — an
            anchor wrapping a card makes the accessible name the entire contents.
          */}
          <Link to={`/projects/${project.slug}`} className="after:absolute after:inset-0">
            {project.title}
          </Link>
        </h3>

        <p className="mt-2 flex-1 text-sm text-muted">{project.shortDescription}</p>

        {project.skills.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {visible.map((skill) => (
              <li key={skill.id}>
                <Badge>{skill.name}</Badge>
              </li>
            ))}
            {overflow > 0 && (
              <li>
                <Badge>+{overflow} more</Badge>
              </li>
            )}
          </ul>
        )}
      </div>
    </Card>
  );
}

/**
 * Reserves a fixed 16:9 box before the image loads, so a list of cards does not
 * shift under the reader as assets arrive (C3, D12).
 */
function ProjectThumbnail({ project }: { project: Project }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden border-b border-border bg-surface-raised">
      {project.imageUrl ? (
        <img src={project.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full items-center justify-center text-2xl text-subtle"
          aria-hidden="true"
        >
          {project.title.charAt(0)}
        </div>
      )}
    </div>
  );
}
