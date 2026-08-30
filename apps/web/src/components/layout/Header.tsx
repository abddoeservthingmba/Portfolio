import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { Container } from '@/components/Container';
import { ThemeToggle } from './ThemeToggle';
import { NAV_ITEMS } from './navigation';
import { cn } from '@/lib/cn';

export function Header({ siteTitle }: { siteTitle: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // A navigation is the one thing that should always close the mobile menu.
  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link to="/" className="text-sm font-semibold tracking-tight text-text">
          {siteTitle}
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavItem to={item.to} label={item.label} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-8 items-center rounded-control border border-border px-3 text-sm text-muted lg:hidden"
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </Container>

      {menuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Primary"
          className="border-t border-border lg:hidden"
        >
          <Container className="py-2">
            <ul className="flex flex-col">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavItem to={item.to} label={item.label} block />
                </li>
              ))}
            </ul>
          </Container>
        </nav>
      )}
    </header>
  );
}

function NavItem({ to, label, block = false }: { to: string; label: string; block?: boolean }) {
  return (
    <NavLink
      to={to}
      // 'end' keeps '/' from matching every route as the active one.
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'rounded-control px-3 py-2 text-sm transition-colors',
          block ? 'block' : 'inline-block',
          isActive ? 'bg-accent-subtle font-medium text-accent' : 'text-muted hover:text-text',
        )
      }
    >
      {label}
    </NavLink>
  );
}
