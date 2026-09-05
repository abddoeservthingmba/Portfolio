import { Link } from 'react-router';
import { Container } from '@/components/Container';
import { NAV_ITEMS } from './navigation';
import type { SiteSettings } from '@/types/content';

export function Footer({ settings }: { settings: SiteSettings | null }) {
  const year = new Date().getFullYear();

  return (
    <footer className="defer-paint relative mt-auto overflow-hidden border-t-2 border-border-strong bg-footer-bg">
      {/* A soft wash so the footer reads as a different surface, not a cut-off. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 h-48 opacity-40 blur-3xl"
        style={{
          background: 'radial-gradient(50% 100% at 50% 100%, var(--accent-glow), transparent 70%)',
        }}
      />

      <Container className="relative">
        <div className="flex flex-col gap-10 py-14 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <p className="text-3xl font-extrabold tracking-tight text-footer-fg">
              {settings?.siteTitle ?? 'Portfolio'}
            </p>
            {settings?.tagline && (
              <p className="mt-2 text-sm font-medium text-footer-muted">{settings.tagline}</p>
            )}

            {settings?.emailPublic && (
              <a
                href={`mailto:${settings.emailPublic}`}
                className="group mt-5 inline-flex items-center gap-1.5 text-base font-bold text-footer-fg link-draw"
              >
                {settings.emailPublic}
                <span
                  aria-hidden="true"
                  className="transition-transform duration-400 [transition-timing-function:var(--ease-spring)] group-hover:translate-x-1"
                >
                  →
                </span>
              </a>
            )}

            {settings && settings.socialLinks.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2">
                {settings.socialLinks.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="push inline-flex rounded-pill border-2 border-border-strong bg-surface px-4 py-2 text-sm font-semibold text-text"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <nav aria-label="Footer">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-footer-muted">
              Explore
            </p>
            <ul className="grid grid-cols-2 gap-x-10 gap-y-2.5">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="link-draw text-sm font-medium text-footer-fg">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/*
          The extra bottom padding clears the palette switcher, which is fixed
          to the bottom-right corner and would otherwise sit on top of this row
          once the page is scrolled to the end.
        */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-border-strong/20 pb-20 pt-6">
          <p className="text-xs font-medium text-footer-muted">
            © {year} {settings?.siteTitle ?? 'Portfolio'}
          </p>
          <p className="text-xs font-medium text-footer-muted">
            React · TypeScript · Express · PostgreSQL
          </p>
        </div>
      </Container>
    </footer>
  );
}
