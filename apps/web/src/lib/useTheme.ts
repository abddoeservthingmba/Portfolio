import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

function readStored(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    // Private mode or blocked site data. The system palette is a fine default.
    return 'system';
  }
}

/**
 * Light / dark / system (FR-12).
 *
 * The palette itself lives entirely in CSS custom properties, so this hook only
 * has to set one attribute — 'system' means removing it and letting
 * prefers-color-scheme decide. index.html applies the stored value before first
 * paint, so there is no flash of the wrong theme on load.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readStored);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }

    try {
      if (theme === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Preference simply will not persist across reloads. Not worth surfacing.
    }
  }, [theme]);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);

  return { theme, setTheme };
}
