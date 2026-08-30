import { Link } from 'react-router';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { buttonStyles } from '@/components/buttonStyles';

/**
 * A real page with navigation intact — never a blank screen (C3, checklist B.2).
 * Also used by the project detail route when a slug does not resolve.
 */
export function NotFoundPage({
  title = 'Page not found',
  description = 'The page you were looking for does not exist, or has moved.',
}: {
  title?: string;
  description?: string;
}) {
  useDocumentMeta({ title, description });

  return (
    <div className="py-12 text-center">
      <p className="text-sm font-medium text-subtle">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text">{title}</h1>
      <p className="mx-auto mt-2 max-w-prose text-sm text-muted">{description}</p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/" className={buttonStyles('primary')}>
          Back to home
        </Link>
        <Link to="/projects" className={buttonStyles('secondary')}>
          Browse projects
        </Link>
      </div>
    </div>
  );
}
