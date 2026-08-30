import { useOutletContext } from 'react-router';
import type { SiteSettings } from '@/types/content';

/**
 * Site settings, fetched once by RootLayout and handed down through the outlet.
 *
 * Pages must read them from here rather than calling getSettings themselves.
 * Two independent fetches of the same singleton row means two requests, and —
 * worse — two sources of truth that disagree for a second on load, which is
 * how the header ends up saying "Portfolio" while the hero says a real name.
 */
export function useSiteSettings(): SiteSettings | null {
  return useOutletContext<SiteSettings | null>();
}
