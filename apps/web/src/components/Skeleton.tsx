import { cn } from '@/lib/cn';

/**
 * A placeholder block. Reserving the space an asset or line of text will occupy
 * is what keeps the page from shifting as content arrives (C3, D12).
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('rounded-control bg-surface-raised', className)}
      style={{
        // A sweep reads as loading; a pulse reads as a broken element.
        backgroundImage:
          'linear-gradient(90deg, transparent, oklch(from var(--text) l c h / 0.06), transparent)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.8s var(--ease-smooth) infinite',
      }}
    />
  );
}

/** The shape of a card list while it loads. Matches CardGrid's columns. */
export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="space-y-3 edge-light rounded-card border border-border bg-surface p-5"
        >
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** The shape of a stacked list — timeline entries, education records. */
export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="space-y-3 edge-light rounded-card border border-border bg-surface p-5"
        >
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}
