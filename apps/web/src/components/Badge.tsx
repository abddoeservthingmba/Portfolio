import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'accent';

const TONES: Record<Tone, string> = {
  neutral: 'border-border-strong bg-surface-raised text-text',
  accent: 'border-border-strong bg-accent-2 text-accent-2-fg',
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
        'inline-flex items-center rounded-pill border-[1.5px] px-2.5 py-1 text-xs font-semibold',
        'transition-colors duration-300',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
