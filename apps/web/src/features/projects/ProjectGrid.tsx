import { ProjectCard } from './ProjectCard';
import type { Project } from '@/types/content';

export function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <li key={project.id} className="flex">
          <ProjectCard project={project} />
        </li>
      ))}
    </ul>
  );
}
