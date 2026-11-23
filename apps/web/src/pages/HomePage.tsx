import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useAsync } from '@/lib/useAsync';
import { useReveal } from '@/lib/useReveal';
import {
  getCertifications,
  getExperience,
  getProjects,
  getResume,
  getSkills,
} from '@/lib/content';
import { useSiteSettings } from '@/lib/useSiteSettings';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { AsyncSection, EmptyState } from '@/components/States';
import { SkeletonCards } from '@/components/Skeleton';
import { SectionHeading } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { Reveal } from '@/components/motion/Reveal';
import { ProjectGrid } from '@/features/projects/ProjectGrid';
import { ExperienceTimeline } from '@/features/experience/ExperienceTimeline';
import { SkillCategory } from '@/features/skills/SkillCategory';
import { groupByCategory } from '@/features/skills/groupByCategory';
import { ContactForm } from '@/features/contact/ContactForm';
import { Hero, type HeroStats } from '@/features/home/Hero';
import type { Experience } from '@/types/content';

/**
 * The homepage: a short professional summary, then the evidence behind it.
 *
 * Order matters for a reader who gives the page under a minute. The summary and
 * the at-a-glance facts come first, then selected work, the employment record,
 * the skills, and finally a way to get in touch. Every section links to the
 * full page it summarises, so nothing is reachable only from here.
 */

/** Whole years between the earliest role and today. Null when no roles exist. */
function yearsSince(entries: Experience[]): number | null {
  if (entries.length === 0) return null;
  const earliest = Math.min(...entries.map((entry) => Date.parse(entry.startDate)));
  if (Number.isNaN(earliest)) return null;
  const years = (Date.now() - earliest) / (365.25 * 24 * 60 * 60 * 1000);
  return Math.max(0, Math.floor(years));
}

export function HomePage() {
  // Fetched once by RootLayout; sharing it keeps the header and hero in step.
  const settings = useSiteSettings();
  const projects = useAsync(() => getProjects(), []);
  const skills = useAsync(() => getSkills(), []);
  const experience = useAsync(() => getExperience(), []);
  const certifications = useAsync(() => getCertifications(), []);
  const resume = useAsync(() => getResume(), []);

  // Rescan once each async section has rendered its content.
  useReveal([
    settings,
    projects.data,
    skills.data,
    experience.data,
    certifications.data,
    resume.data,
  ]);

  useDocumentMeta({
    title: 'Portfolio',
    description:
      settings?.tagline ?? 'Projects, experience, skills and certifications in one place.',
  });

  const featured = projects.data?.filter((project) => project.featured) ?? null;

  const stats: HeroStats = {
    years: experience.data ? yearsSince(experience.data) : null,
    projects: projects.data?.length ?? 0,
    skills: skills.data?.length ?? 0,
    certifications: certifications.data?.length ?? 0,
  };

  return (
    <>
      <Hero
        settings={settings}
        resume={resume.data ?? null}
        stats={stats}
        isLoading={settings === null}
      />

      <Section
        id="work"
        eyebrow="Selected work"
        title="Projects"
        action={
          <Link to="/projects" className="text-sm font-medium text-accent underline-offset-4 hover:underline">
            All projects
          </Link>
        }
      >
        <AsyncSection
          isLoading={projects.isLoading}
          error={projects.error}
          data={featured}
          onRetry={projects.retry}
          skeleton={<SkeletonCards count={3} />}
          empty={
            <EmptyState
              title="No featured projects yet"
              description="Projects marked as featured will appear here."
            />
          }
        >
          {(list) => <ProjectGrid projects={list} />}
        </AsyncSection>
      </Section>

      <Section
        id="experience"
        eyebrow="Experience"
        title="Employment"
        action={
          <Link to="/experience" className="text-sm font-medium text-accent underline-offset-4 hover:underline">
            Full history
          </Link>
        }
      >
        <AsyncSection
          isLoading={experience.isLoading}
          error={experience.error}
          data={experience.data}
          onRetry={experience.retry}
          skeleton={<SkeletonCards count={2} />}
          empty={<EmptyState title="No experience listed yet" description="" />}
        >
          {(entries) => (
            <Reveal>
              {/* The three most recent. The full list has its own route. */}
              <ExperienceTimeline entries={entries.slice(0, 3)} />
            </Reveal>
          )}
        </AsyncSection>
      </Section>

      <Section id="skills" eyebrow="Skills" title="Technical skills">
        <AsyncSection
          isLoading={skills.isLoading}
          error={skills.error}
          data={skills.data}
          onRetry={skills.retry}
          skeleton={<SkeletonCards count={3} />}
          empty={<EmptyState title="No skills listed yet" description="" />}
        >
          {(list) => (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {groupByCategory(list).map(([category, categorySkills], index) => (
                <Reveal key={category} index={index} variant="scale">
                  <SkillCategory category={category} skills={categorySkills} />
                </Reveal>
              ))}
            </div>
          )}
        </AsyncSection>
      </Section>

      <Section id="contact" eyebrow="Contact" title="Get in touch">
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <Reveal>
            <Card className="p-5 sm:p-7">
              <p className="max-w-prose text-muted">
                Reach out about a role, a project, or a question about the work above.
              </p>

              <div className="mt-7">
                <ContactForm />
              </div>
            </Card>
          </Reveal>

          {settings && (
            <Reveal index={1} as="aside" className="space-y-4">
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-text">Direct contact</h3>

                <dl className="mt-3 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-subtle">Email</dt>
                    <dd className="mt-0.5">
                      <a
                        href={`mailto:${settings.emailPublic}`}
                        className="text-accent underline-offset-4 hover:underline"
                      >
                        {settings.emailPublic}
                      </a>
                    </dd>
                  </div>

                  {settings.location && (
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-subtle">Location</dt>
                      <dd className="mt-0.5 text-muted">{settings.location}</dd>
                    </div>
                  )}
                </dl>

                {settings.socialLinks.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-3 border-t border-border pt-4">
                    {settings.socialLinks.map((link) => (
                      <li key={link.url}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-sm text-muted underline-offset-4 hover:text-text hover:underline"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </Reveal>
          )}
        </div>
      </Section>
    </>
  );
}

/**
 * A titled page section. The eyebrow names the topic in small caps; the title
 * carries the substance. Kept as one component so every section shares spacing
 * and the same rule above it.
 */
function Section({
  id,
  eyebrow,
  title,
  action,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-border py-14 sm:py-20">
      <Reveal>
        <p className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {/* Draws itself in when the section reveals. Decorative only. */}
          <span aria-hidden="true" className="grow-line h-0.5 w-10 bg-accent" />
          {eyebrow}
        </p>
      </Reveal>
      <Reveal>
        <SectionHeading title={title} action={action} />
      </Reveal>
      {children}
    </section>
  );
}
