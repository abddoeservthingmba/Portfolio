import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Adds a hover lift. Only for cards that are themselves a link target. */
  interactive?: boolean;
  /** Sits the card on the page rather than floating it. */
  flat?: boolean;
}

/**
 * A surface with a border and depth. It does not know what it contains —
 * headings, media and actions are composed by the caller.
 *
 * `edge-light` draws a hairline gradient along the top edge, which is what
 * separates a card from its background in dark mode where a drop shadow does
 * almost nothing.
 */
export function Card({
  children,
  interactive = false,
  flat = false,
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        'edge-light rounded-card border border-border bg-surface',
        !flat && 'shadow-[var(--shadow-md)]',
        interactive && 'lift hover:border-border-strong',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
