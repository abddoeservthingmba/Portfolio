import type { Palette } from '@/lib/usePalette';

/**
 * The palettes offered by the corner switcher.
 *
 * `swatch` is only for the control's own preview dots, which is why the values
 * are literals here rather than the usual `var(--accent)`: the switcher shows
 * all four palettes at once, and three of them are by definition not the one
 * currently applied, so their colours cannot come from the live tokens.
 *
 * The real palettes are token overrides in styles/index.css. These literals are
 * a copy of the accent trio from each, and are the one place in the project
 * where a colour is written outside the token layer — a deliberate, contained
 * exception rather than a hole in the rule.
 */
export interface PaletteOption {
  id: Palette;
  name: string;
  /** What it is, in one short phrase. Shown as the control's hint. */
  note: string;
  /** Three dots: ground, primary accent, secondary accent. */
  swatch: [string, string, string];
}

export const PALETTES: PaletteOption[] = [
  {
    id: 'ember',
    name: 'Ember',
    note: 'Coral on cream',
    swatch: ['oklch(97.5% 0.018 85)', 'oklch(66% 0.2 42)', 'oklch(93% 0.13 103)'],
  },
  {
    id: 'tide',
    name: 'Tide',
    note: 'Deep blue and teal',
    swatch: ['oklch(97.5% 0.012 240)', 'oklch(55% 0.17 245)', 'oklch(88% 0.11 195)'],
  },
  {
    id: 'moss',
    name: 'Moss',
    note: 'Forest and lichen',
    swatch: ['oklch(97.5% 0.014 130)', 'oklch(52% 0.14 150)', 'oklch(90% 0.13 110)'],
  },
  {
    id: 'plum',
    name: 'Plum',
    note: 'Violet and amber',
    swatch: ['oklch(97.5% 0.014 320)', 'oklch(55% 0.19 320)', 'oklch(90% 0.12 70)'],
  },
];
