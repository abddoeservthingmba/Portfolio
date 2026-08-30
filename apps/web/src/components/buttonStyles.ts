import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  // The glow is what makes the primary action feel lit rather than painted.
  primary:
    'bg-accent text-accent-fg shadow-[0_4px_20px_-4px_var(--accent-glow)] ' +
    'hover:bg-accent-hover hover:shadow-[0_8px_28px_-4px_var(--accent-glow)] sheen',
  secondary:
    'bg-surface text-text border border-border hover:border-border-strong ' +
    'hover:bg-surface-raised shadow-[var(--shadow-sm)]',
  ghost: 'bg-transparent text-muted hover:bg-surface-raised hover:text-text',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3.5 text-sm rounded-control',
  md: 'h-11 px-5 text-sm rounded-control',
  lg: 'h-13 px-7 text-base rounded-pill',
};

const BASE =
  'inline-flex items-center justify-center gap-2 font-medium tracking-tight ' +
  'transition-[background-color,border-color,box-shadow,transform] duration-300 ' +
  '[transition-timing-function:var(--ease-out-expo)] press ' +
  'disabled:pointer-events-none disabled:opacity-45';

/**
 * The button surface as a class string, for the cases where the element must
 * be a link rather than a button — an external URL, or a router <Link>.
 *
 * Kept apart from <Button> so a router link and a real button can never drift
 * visually, and so the component file stays component-only for Fast Refresh.
 */
export function buttonStyles(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  return cn(BASE, VARIANTS[variant], SIZES[size]);
}
