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
 * A hard two-pixel border and an offset shadow rather than a soft blur — the
 * displaced edge is what gives the surface its tactile, printed quality, and
 * it survives dark mode where a drop shadow does almost nothing.
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
        'rounded-card border-2 border-border-strong bg-surface',
        !flat && 'shadow-[var(--shadow-md)]',
        interactive && 'lift',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
