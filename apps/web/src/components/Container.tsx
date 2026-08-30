import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** The single place the site's maximum line length and gutters are decided. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-5xl px-4 sm:px-6', className)}>{children}</div>;
}
