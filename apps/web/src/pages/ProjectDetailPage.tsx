import { Link, useParams } from 'react-router';
import { useAsync } from '@/lib/useAsync';
import { getProjectBySlug } from '@/lib/content';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { Badge } from '@/components/Badge';
import { buttonStyles } from '@/components/buttonStyles';
import { ErrorState } from '@/components/States';
import { Skeleton } from '@/components/Skeleton';
import { NotFoundPage } from './NotFoundPage';

export function ProjectDetailPage() {
  // Public detail routes resolve by slug, never by internal id (C3).
  const { slug } = useParams<{ slug: string }>();
  const {
    data: project,
    isLoading,
    error,
    retry,
  } = useAsync(() => getProjectBySlug(slug ?? ''), [slug]);

  useDocumentMeta({
    title: project?.title ?? 'Project',
    description: project?.shortDescription ?? 'Project detail.',
    image: project?.imageUrl,
  });

  if (isLoading) return <DetailSkeleton />;
  if (error) return <ErrorState onRetry={retry} />;

  // A missing slug is a real not-found page with navigation intact, not a blank.
  if (!project) {
    return (
      <NotFoundPage
        title="Project not found"
        description="This project may have been unpublished, or the link may be out of date."
      />
    );
  }

  return (
    <article>
      <Link to="/projects" className="text-sm text-accent underline-offset-4 hover:underline">
        ← All projects
      </Link>

      <header className="mt-4 border-b border-border pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          {project.title}
        </h1>
        <p className="mt-2 max-w-prose text-sm text-muted">{project.shortDescription}</p>

        {project.skills.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {project.skills.map((skill) => (
              <li key={skill.id}>
                <Badge>{skill.name}</Badge>
              </li>
            ))}
          </ul>
        )}

        {(project.liveUrl || project.repoUrl) && (
          <div className="mt-5 flex flex-wrap gap-3">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer noopener"
                className={buttonStyles('primary')}
              >
                Visit live site
              </a>
            )}
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer noopener"
                className={buttonStyles('secondary')}
              >
                View source
              </a>
            )}
          </div>
        )}
      </header>

      {project.imageUrl && (
        <img
          src={project.imageUrl}
          alt=""
          className="mt-8 aspect-video w-full rounded-card border border-border object-cover"
        />
      )}

      <div className="mt-8 max-w-prose">
        {project.description.split('\n\n').map((paragraph, index) => (
          <p key={index} className="mb-4 text-sm leading-relaxed text-muted">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-4 w-full max-w-prose" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-6 aspect-video w-full" />
    </div>
  );
}
