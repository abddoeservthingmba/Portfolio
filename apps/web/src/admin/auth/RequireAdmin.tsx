import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './AuthContext';
import { Container } from '@/components/Container';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Skeleton } from '@/components/Skeleton';

/**
 * The client-side route guard (FR-21).
 *
 * This is a convenience, not a control. It stops the admin UI flashing on
 * screen for someone who cannot use it — but every request the portal makes is
 * independently checked by requireAuth on the server, and that is the check
 * that actually protects the data. Removing this guard would leak no content;
 * it would only make the experience worse.
 */
export function RequireAdmin() {
  const { status, email, signOut } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-md space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </Container>
    );
  }

  if (status === 'signed-out') {
    // `state` lets the login page send them back where they were headed.
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (status === 'not-admin') {
    return (
      <Container className="py-16">
        <Card className="mx-auto max-w-md p-6 text-center">
          <h1 className="text-lg font-semibold text-text">Not an administrator</h1>
          <p className="mt-2 text-sm text-muted">
            You are signed in as {email ?? 'this account'}, but it does not have administrator
            access to this portfolio.
          </p>
          <Button variant="secondary" className="mt-5" onClick={() => void signOut()}>
            Sign out
          </Button>
        </Card>
      </Container>
    );
  }

  return <Outlet />;
}
