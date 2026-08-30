import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'yellow';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-fg border-2 border-border-strong push sheen hover:bg-accent-hover',
  secondary: 'bg-surface text-text border-2 border-border-strong push hover:bg-surface-raised',
  yellow: 'bg-accent-2 text-accent-2-fg border-2 border-border-strong push sheen',
  // The only variant without the block treatment — for actions that should
  // recede rather than compete.
  ghost: 'bg-transparent text-muted border-2 border-transparent press hover:text-text',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm rounded-pill',
  md: 'h-11 px-5 text-sm rounded-pill',
  lg: 'h-14 px-8 text-base rounded-pill',
};

const BASE =
  'inline-flex items-center justify-center gap-2 font-semibold tracking-tight disabled:pointer-events-none disabled:opacity-45';

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
