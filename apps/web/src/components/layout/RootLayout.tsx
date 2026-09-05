import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Header } from './Header';
import { Footer } from './Footer';
import { Container } from '@/components/Container';
import { ScrollProgress } from '@/components/motion/ScrollProgress';
import { PaletteSwitcher } from '@/features/theme/PaletteSwitcher';
import { useAsync } from '@/lib/useAsync';
import { getSettings } from '@/lib/content';

/**
 * The shell every public route renders inside. It fetches site settings once
 * and holds them for the session, so the header and footer are not refetching
 * the same row on every navigation.
 *
 * The shell renders immediately and never waits on that request — a cold
 * backend must show structure rather than an empty screen (C3).
 */
export function RootLayout() {
  const { data: settings } = useAsync(() => getSettings(), []);
  const location = useLocation();

  // A single-page app does not reset scroll on navigation the way a document does.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-dvh flex-col">
      <ScrollProgress />

      <a
        href="#main"
        className="sr-only rounded-control bg-accent px-4 py-2 text-sm font-medium text-accent-fg focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to content
      </a>

      <Header siteTitle={settings?.siteTitle ?? 'Portfolio'} />

      <main id="main" className="flex-1 pb-24 pt-8 sm:pt-12">
        {/*
          Keyed on the path so React remounts on navigation and the entrance
          animation replays. Without the key the DOM is reused and the new page
          simply appears, which reads as a flicker rather than a transition.
        */}
        <Container key={location.pathname} className="animate-[page-in_0.5s_var(--ease-out-expo)]">
          <Outlet context={settings} />
        </Container>
      </main>

      <Footer settings={settings} />

      {/*
        Fixed to the bottom-right corner, so it is reachable from any scroll
        position without spending permanent layout on itself. Rendered last:
        it is the topmost thing in the shell and should not sit inside the
        footer's stacking context.
      */}
      <PaletteSwitcher />
    </div>
  );
}
