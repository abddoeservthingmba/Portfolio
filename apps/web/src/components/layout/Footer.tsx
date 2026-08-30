import { Link } from 'react-router';
import { Container } from '@/components/Container';
import { NAV_ITEMS } from './navigation';
import type { SiteSettings } from '@/types/content';

export function Footer({ settings }: { settings: SiteSettings | null }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <Container className="flex flex-col gap-8 py-10 sm:flex-row sm:justify-between">
        <div className="max-w-sm">
          <p className="text-sm font-semibold text-text">{settings?.siteTitle ?? 'Portfolio'}</p>
          {settings?.tagline && <p className="mt-1 text-sm text-muted">{settings.tagline}</p>}

          {settings && settings.socialLinks.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-4">
              {settings.socialLinks.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-sm text-muted underline-offset-4 transition-colors hover:text-text hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="text-sm text-muted underline-offset-4 transition-colors hover:text-text hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>

      <Container className="border-t border-border py-5">
        <p className="text-xs text-subtle">
          © {year} {settings?.siteTitle ?? 'Portfolio'}. Built with React, Express and PostgreSQL.
        </p>
      </Container>
    </footer>
  );
}
