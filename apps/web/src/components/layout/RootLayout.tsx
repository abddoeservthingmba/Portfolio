import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Header } from './Header';
import { Footer } from './Footer';
import { Container } from '@/components/Container';
import { useAsync } from '@/lib/useAsync';
import { getSettings } from '@/lib/content';

/**
 * The shell every public route renders inside. It fetches site settings once
 * and holds them for the whole session, so the header and footer are not
 * refetching the same row on every navigation.
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
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only rounded-control bg-accent px-4 py-2 text-sm text-accent-fg focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to content
      </a>

      <Header siteTitle={settings?.siteTitle ?? 'Portfolio'} />

      <main id="main" className="flex-1 py-10 sm:py-14">
        <Container>
          <Outlet context={settings} />
        </Container>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
