import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Wraps content that should animate in on scroll.
 *
 * It only sets a class and a CSS custom property — the observer in useReveal
 * flips the attribute that triggers the transition. No state, no re-render,
 * no per-element timer.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  /** Stagger position among siblings. Each step adds 60ms. */
  index = 0,
  variant = 'up',
  className,
}: {
  /** Optional, so Reveal can also be used as a decorative rule or divider. */
  children?: ReactNode;
  as?: ElementType;
  index?: number;
  variant?: 'up' | 'scale';
  className?: string;
}) {
  return (
    <Tag
      className={cn(variant === 'scale' ? 'reveal-scale' : 'reveal', className)}
      style={{ '--i': index } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
