import { useCallback, useEffect, useRef, useState } from 'react';
import { animateThemeChange } from './themeTransition';

/**
 * The three visual themes. Each one is a complete token set plus its own
 * type pairing, selected by a `data-style` attribute on <html>.
 *
 * Light/dark is a separate axis (useTheme): every style is defined for both
 * modes, so switching style never drags someone out of dark mode.
 */
export type StyleId = 'glass' | 'minimal' | 'geometric';

export const DEFAULT_STYLE: StyleId = 'geometric';

const STORAGE_KEY = 'style';
const VALID: readonly StyleId[] = ['glass', 'minimal', 'geometric'];

function isStyle(value: unknown): value is StyleId {
  return typeof value === 'string' && (VALID as readonly string[]).includes(value);
}

function readStored(): StyleId {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isStyle(value) ? value : DEFAULT_STYLE;
  } catch {
    // Private mode or blocked site data. The default style is a fine answer.
    return DEFAULT_STYLE;
  }
}

/**
 * Sets `data-style` on <html>. The style blocks in index.css do the rest.
 *
 * The default is written explicitly rather than as the absence of the
 * attribute: the three styles are peers, so none of them should be the one
 * that is "really" the base.
 */
export function useStyle() {
  const [style, setStyleState] = useState<StyleId>(readStored);
  // The style last applied. Lets the effect tell a real change from the second
  // run React makes under StrictMode, so the cross-fade never plays on load.
  const applied = useRef<StyleId | null>(null);

  useEffect(() => {
    if (applied.current !== null && applied.current !== style) animateThemeChange();
    applied.current = style;
    document.documentElement.setAttribute('data-style', style);

    try {
      localStorage.setItem(STORAGE_KEY, style);
    } catch {
      // The choice simply will not survive a reload. Not worth surfacing.
    }
  }, [style]);

  const setStyle = useCallback((next: StyleId) => setStyleState(next), []);

  return { style, setStyle };
}
