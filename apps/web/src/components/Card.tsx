import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Adds a hover lift. Only for cards that are themselves a link target. */
  interactive?: boolean;
}

/**
 * A surface with a border and padding. It does not know what it contains —
 * headings, media and actions are composed by the caller.
 */
export function Card({ children, interactive = false, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface shadow-card',
        interactive && 'transition-shadow hover:border-border-strong hover:shadow-raised',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
