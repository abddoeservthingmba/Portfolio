import { ProjectCard } from './ProjectCard';
import { Reveal } from '@/components/motion/Reveal';
import type { Project } from '@/types/content';

export function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project, index) => (
        // Capped so a long list does not end up waiting a second to appear.
        <Reveal key={project.id} as="li" variant="scale" index={Math.min(index, 5)}>
          <ProjectCard project={project} />
        </Reveal>
      ))}
    </ul>
  );
}
