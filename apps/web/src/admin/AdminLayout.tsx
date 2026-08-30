import { Link, NavLink, Outlet } from 'react-router';
import { Container } from '@/components/Container';
import { Button } from '@/components/Button';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useAuth } from './auth/AuthContext';
import { cn } from '@/lib/cn';

/**
 * The admin shell: a sidebar of managed entities and an outlet.
 *
 * Deliberately plainer than the public site. If the CMS becomes more complex
 * than the portfolio it manages, the scope has drifted — forms, a table and a
 * toast are sufficient (D12).
 */
const SECTIONS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/projects', label: 'Projects' },
  { to: '/admin/skills', label: 'Skills' },
  { to: '/admin/experience', label: 'Experience' },
  { to: '/admin/certifications', label: 'Certifications' },
  { to: '/admin/education', label: 'Education' },
  { to: '/admin/resume', label: 'Resume' },
  { to: '/admin/messages', label: 'Messages' },
  { to: '/admin/settings', label: 'Settings' },
];

export function AdminLayout() {
  const { email, signOut } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="border-b border-border bg-surface">
        <Container className="flex h-14 items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="text-sm font-semibold text-text">Admin</span>
            <Link to="/" className="text-xs text-muted underline-offset-4 hover:underline">
              View site
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {email && <span className="hidden text-xs text-subtle sm:inline">{email}</span>}
            <ThemeToggle />
            <Button variant="secondary" size="sm" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        </Container>
      </header>

      <Container className="flex flex-1 flex-col gap-8 py-8 lg:flex-row">
        <nav aria-label="Admin sections" className="lg:w-52 lg:shrink-0">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {SECTIONS.map((section) => (
              <li key={section.to}>
                <NavLink
                  to={section.to}
                  end={section.end ?? false}
                  className={({ isActive }) =>
                    cn(
                      'block whitespace-nowrap rounded-control px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-accent-subtle font-medium text-accent'
                        : 'text-muted hover:text-text',
                    )
                  }
                >
                  {section.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </Container>
    </div>
  );
}
