import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { Container } from '@/components/Container';
import { ThemeToggle } from './ThemeToggle';
import { NAV_ITEMS } from './navigation';
import { cn } from '@/lib/cn';

export function Header({ siteTitle }: { siteTitle: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // A navigation is the one thing that should always close the mobile menu.
  useEffect(() => setMenuOpen(false), [location.pathname]);

  /**
   * The header condenses once the page moves. Passive listener, and the only
   * work it does is compare a boolean — nothing is written unless the state
   * actually flips.
   */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-500',
        scrolled
          ? 'border-b-2 border-border-strong bg-bg/85 backdrop-blur-xl'
          : 'border-b-2 border-transparent bg-transparent',
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          to="/"
          className="group flex items-center gap-2.5 text-sm font-semibold tracking-tight text-text"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl border-2 border-border-strong bg-accent text-sm font-extrabold text-accent-fg shadow-[var(--shadow-sm)] transition-transform duration-400 [transition-timing-function:var(--ease-spring)] group-hover:rotate-12 group-hover:scale-110">
            {siteTitle.charAt(0)}
          </span>
          {/* Truncated rather than wrapped — a long name must not grow the bar. */}
          <span className="hidden max-w-[10rem] truncate whitespace-nowrap sm:inline xl:max-w-none">
            {siteTitle}
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-0.5 rounded-pill border-2 border-border-strong bg-surface p-1 shadow-[var(--shadow-sm)]">
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
            className="push flex h-10 items-center rounded-pill border-2 border-border-strong bg-surface px-4 text-sm font-semibold text-text lg:hidden"
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </Container>

      {menuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Primary"
          className="border-t-2 border-border-strong bg-bg lg:hidden"
        >
          <Container className="py-2">
            <ul className="flex flex-col">
              {NAV_ITEMS.map((item, index) => (
                <li
                  key={item.to}
                  className="reveal"
                  data-revealed=""
                  style={{ '--i': index } as React.CSSProperties}
                >
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
          'relative rounded-pill px-3.5 py-1.5 text-sm transition-colors duration-300',
          block ? 'block px-3 py-2.5' : 'inline-block',
          isActive ? 'bg-accent text-accent-fg font-semibold' : 'text-muted hover:text-text',
        )
      }
    >
      {label}
    </NavLink>
  );
}
