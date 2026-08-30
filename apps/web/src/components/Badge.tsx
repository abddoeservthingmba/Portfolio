import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'accent';

const TONES: Record<Tone, string> = {
  neutral: 'border-border bg-surface-raised text-muted',
  accent: 'border-transparent bg-accent-subtle text-accent',
};

/** A small inline label — skill tags, project status, credential ids. */
export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
