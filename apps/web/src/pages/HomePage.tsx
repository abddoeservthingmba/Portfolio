import { Link } from 'react-router';
import { useAsync } from '@/lib/useAsync';
import { useReveal } from '@/lib/useReveal';
import { useScrollStage } from '@/lib/useScrollStage';
import { getExperience, getProjects, getSkills } from '@/lib/content';
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
import { Hero } from '@/features/home/Hero';
import { SkillMarquee } from '@/features/home/SkillMarquee';
import { Stage, StageLabel } from '@/features/home/Stage';
import { StageHUD } from '@/features/home/StageHUD';
import { SceneLayer } from '@/features/home/scene/SceneLayer';

/**
 * The homepage as a journey: five stages travelled in order, ending at the
 * contact form rather than at a link to it.
 *
 * Every stage renders a component that already existed and is already tested.
 * The new work is the frame — the stage sequence, the progress rail and the
 * WebGL field behind it — not a reimplementation of the content.
 *
 * The other routes are untouched and the header still links to all of them, so
 * nothing on this site is reachable only by scrolling to the bottom.
 */

const STAGES = [
  { id: 'start', label: 'Start' },
  { id: 'work', label: 'Work' },
  { id: 'skills', label: 'Skills' },
  { id: 'path', label: 'Path' },
  { id: 'contact', label: 'Contact' },
];

export function HomePage() {
  // Fetched once by RootLayout; sharing it keeps the header and hero in step.
  const settings = useSiteSettings();
  const featured = useAsync(() => getProjects({ featured: true }), []);
  const skills = useAsync(() => getSkills(), []);
  const experience = useAsync(() => getExperience(), []);

  // Rescan once each async section has rendered its content.
  useReveal([settings, featured.data, skills.data, experience.data]);
  const activeStage = useScrollStage(STAGES.length);

  useDocumentMeta({
    title: 'Portfolio',
    description:
      settings?.tagline ?? 'Projects, experience, skills and certifications in one place.',
  });

  return (
    <>
      {/*
        Fixed, behind everything, pointer-events: none. It renders nothing until
        the browser is idle and the device qualifies, so most visitors never
        load it — which is why every stage below is designed to look finished
        without it.
      */}
      <SceneLayer />
      <StageHUD stages={STAGES} active={activeStage} />

      <Stage index={0} id="start" className="pt-0">
        <Hero settings={settings} isLoading={settings === null} />
      </Stage>

      {/*
        No defer-paint on the marquee stage: content-visibility implies paint
        containment, which would clip the marquee's full-bleed band back to the
        container.
      */}
      <Stage index={1} id="work">
        <StageLabel index={1} label="Selected work" />

        <Reveal>
          <SectionHeading
            title="Things I have built"
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
      </Stage>

      <Stage index={2} id="skills">
        <StageLabel index={2} label="What I work with" />

        <div className="mb-12">
          <SkillMarquee skills={skills.data ?? []} />
        </div>

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
      </Stage>

      <Stage index={3} id="path">
        <StageLabel index={3} label="How I got here" />

        <Reveal>
          <SectionHeading
            title="The path so far"
            action={
              <Link to="/experience" className="text-sm font-medium text-accent">
                Full history
              </Link>
            }
          />
        </Reveal>

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
      </Stage>

      {/*
        The end screen. The same ContactForm the /contact route renders — one
        form, two places it can be reached from, no duplicated validation.
      */}
      <Stage index={4} id="contact" className="pb-8">
        <StageLabel index={4} label="The end — say hello" />

        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <Reveal>
            <Card className="p-5 sm:p-7">
              <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-tight tracking-[-0.035em] text-text">
                You made it to the bottom.
              </h2>
              <p className="mt-3 max-w-prose text-muted">
                That is further than most people scroll. Since you are here — what are you building?
              </p>

              <div className="mt-7">
                <ContactForm />
              </div>
            </Card>
          </Reveal>

          {settings && (
            <Reveal index={1} as="aside" className="space-y-4">
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-text">Or reach out directly</h3>

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
      </Stage>
    </>
  );
}
