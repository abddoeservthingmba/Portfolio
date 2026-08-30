import { Link } from 'react-router';
import { useAsync } from '@/lib/useAsync';
import { useReveal } from '@/lib/useReveal';
import { getProjects, getSkills } from '@/lib/content';
import { useSiteSettings } from '@/lib/useSiteSettings';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { AsyncSection, EmptyState } from '@/components/States';
import { SkeletonCards } from '@/components/Skeleton';
import { SectionHeading } from '@/components/PageHeader';
import { Reveal } from '@/components/motion/Reveal';
import { ProjectGrid } from '@/features/projects/ProjectGrid';
import { Hero } from '@/features/home/Hero';
import { SkillMarquee } from '@/features/home/SkillMarquee';

export function HomePage() {
  // Fetched once by RootLayout; sharing it keeps the header and hero in step.
  const settings = useSiteSettings();
  const featured = useAsync(() => getProjects({ featured: true }), []);
  const skills = useAsync(() => getSkills(), []);

  // Rescan once each async section has rendered its content.
  useReveal([settings, featured.data, skills.data]);

  useDocumentMeta({
    title: 'Portfolio',
    description:
      settings?.tagline ?? 'Projects, experience, skills and certifications in one place.',
  });

  return (
    <>
      <Hero settings={settings} isLoading={settings === null} />

      {/*
        No defer-paint here: content-visibility implies paint containment,
        which would clip the marquee's full-bleed band back to the container.
        This section is above the fold and always painted regardless.
      */}
      <section className="mt-10">
        <SkillMarquee skills={skills.data ?? []} />
      </section>

      <section className="defer-paint mt-20">
        <Reveal>
          <SectionHeading
            title="Selected work"
            action={
              <Link
                to="/projects"
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-accent"
              >
                All projects
                <span
                  aria-hidden="true"
                  className="transition-transform duration-400 [transition-timing-function:var(--ease-spring)] group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            }
          />
        </Reveal>

        <AsyncSection
          isLoading={featured.isLoading}
          error={featured.error}
          data={featured.data}
          onRetry={featured.retry}
          skeleton={<SkeletonCards count={3} />}
          empty={
            <EmptyState
              title="No featured projects yet"
              description="Projects marked as featured will appear here."
            />
          }
        >
          {(projects) => <ProjectGrid projects={projects} />}
        </AsyncSection>
      </section>
    </>
  );
}
