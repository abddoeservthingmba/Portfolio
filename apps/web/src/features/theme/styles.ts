import type { StyleId } from '@/lib/useStyle';

/**
 * The themes offered by the corner switcher.
 *
 * `swatch` is only for the control's own preview dots, which is why the values
 * are literals here rather than the usual `var(--accent)`: the switcher shows
 * all three themes at once, and two of them are by definition not the one
 * currently applied. These are a copy of the accent trio from each style block
 * in styles/index.css, and are the one place outside the token layer where a
 * colour is written down.
 */
export interface StyleOption {
  id: StyleId;
  name: string;
  /** What it is, in one short phrase. Shown as the control's hint. */
  note: string;
  /** Three dots: ground, primary accent, secondary accent. */
  swatch: [string, string, string];
}

export const STYLES: StyleOption[] = [
  {
    id: 'glass',
    name: 'Glass',
    note: 'Frosted panels over soft light',
    swatch: ['oklch(94% 0.02 270)', 'oklch(60% 0.22 275)', 'oklch(82% 0.12 215)'],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    note: 'Ink, hairlines, lots of air',
    swatch: ['oklch(99% 0 0)', 'oklch(22% 0 0)', 'oklch(90% 0 0)'],
  },
  {
    id: 'geometric',
    name: 'Geometric',
    note: 'Blocks, circles and primaries',
    swatch: ['oklch(96% 0.01 95)', 'oklch(62% 0.24 27)', 'oklch(88% 0.17 95)'],
  },
];
