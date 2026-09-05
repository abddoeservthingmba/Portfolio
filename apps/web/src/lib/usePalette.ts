import { useCallback, useEffect, useState } from 'react';

export type Palette = 'ember' | 'tide' | 'moss' | 'plum';

export const DEFAULT_PALETTE: Palette = 'ember';

const STORAGE_KEY = 'palette';
const VALID: readonly Palette[] = ['ember', 'tide', 'moss', 'plum'];

function isPalette(value: unknown): value is Palette {
  return typeof value === 'string' && (VALID as readonly string[]).includes(value);
}

function readStored(): Palette {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isPalette(value) ? value : DEFAULT_PALETTE;
  } catch {
    // Private mode or blocked site data. The default palette is a fine answer.
    return DEFAULT_PALETTE;
  }
}

/**
 * The colour palette, as a second axis alongside light/dark (see useTheme).
 *
 * The two are deliberately independent. Light/dark answers "how bright should
 * this be", the palette answers "which hue family", and every palette below is
 * defined for both modes — so choosing Tide does not silently drag someone out
 * of dark mode, and switching to dark does not discard their palette.
 *
 * Like useTheme, this only sets an attribute: the palettes themselves are
 * token overrides in index.css. The default is expressed as the *absence* of
 * the attribute rather than `data-palette="ember"`, so the base token block
 * stays the single definition of the default and cannot drift from a copy.
 */
export function usePalette() {
  const [palette, setPaletteState] = useState<Palette>(readStored);

  useEffect(() => {
    const root = document.documentElement;

    if (palette === DEFAULT_PALETTE) {
      root.removeAttribute('data-palette');
    } else {
      root.setAttribute('data-palette', palette);
    }

    try {
      if (palette === DEFAULT_PALETTE) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, palette);
    } catch {
      // The choice simply will not survive a reload. Not worth surfacing.
    }
  }, [palette]);

  const setPalette = useCallback((next: Palette) => setPaletteState(next), []);

  return { palette, setPalette };
}
