import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-hover',
  secondary: 'bg-surface text-text border border-border hover:bg-surface-raised',
  ghost: 'bg-transparent text-muted hover:bg-surface-raised hover:text-text',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
};

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-control font-medium ' +
  'transition-colors disabled:pointer-events-none disabled:opacity-50';

/**
 * The button surface as a class string, for the cases where the element must be
 * a link rather than a button — an external URL, or a router <Link>.
 *
 * Kept in its own module, apart from <Button>, so a router link and a real
 * button can never drift visually and so the component file stays
 * component-only for Fast Refresh.
 */
export function buttonStyles(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  return cn(BASE, VARIANTS[variant], SIZES[size]);
}
