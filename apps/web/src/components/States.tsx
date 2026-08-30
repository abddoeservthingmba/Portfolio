import type { ReactNode } from 'react';
import { Button } from './Button';

/**
 * The empty state — the one most often forgotten (D12), and the reason every
 * public route must render correctly against an empty dataset (checklist B.2).
 */
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-card border border-dashed border-border bg-surface px-6 py-12 text-center">
      <p className="text-sm font-medium text-text">{title}</p>
      <p className="mx-auto mt-1 max-w-prose text-sm text-muted">{description}</p>
    </div>
  );
}

/**
 * The error state. A failed read must degrade visibly with navigation intact —
 * never a blank page (C3, checklist B.2) — and must offer a way forward, since
 * the most common cause here is a cold backend that will answer on retry.
 */
export function ErrorState({
  title = 'This section could not be loaded',
  description = 'The request did not complete. This is often temporary — trying again usually works.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-card border border-danger/40 bg-danger-subtle px-6 py-10 text-center"
    >
      <p className="text-sm font-medium text-text">{title}</p>
      <p className="mx-auto mt-1 max-w-prose text-sm text-muted">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/**
 * Resolves the loading / error / empty / success states in one place, so no
 * page has to remember all four. `children` runs only on a non-empty success.
 */
export function AsyncSection<T>({
  isLoading,
  error,
  data,
  onRetry,
  skeleton,
  empty,
  children,
}: {
  isLoading: boolean;
  error: Error | null;
  data: T | null;
  onRetry?: () => void;
  skeleton: ReactNode;
  empty: ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (isLoading) return <>{skeleton}</>;
  if (error) return <ErrorState {...(onRetry ? { onRetry } : {})} />;
  if (data === null || (Array.isArray(data) && data.length === 0)) return <>{empty}</>;

  return <>{children(data)}</>;
}
