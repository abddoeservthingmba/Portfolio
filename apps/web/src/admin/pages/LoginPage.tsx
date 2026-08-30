import { useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { InputField } from '@/components/Field';
import { Container } from '@/components/Container';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { isAuthConfigured } from '@/lib/supabase';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { status, signIn } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useDocumentMeta({ title: 'Sign in', description: 'Administrator sign-in.' });

  if (status === 'signed-in') {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? '/admin'} replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signIn(email.trim(), password);
    } catch {
      // Deliberately one message for every failure. Distinguishing "no such
      // account" from "wrong password" tells an attacker which addresses exist.
      setError('Those details were not accepted. Check the email address and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="py-16">
      <Card className="mx-auto max-w-sm p-6">
        <h1 className="text-lg font-semibold text-text">Administrator sign-in</h1>
        <p className="mt-1 text-sm text-muted">This portal manages the portfolio content.</p>

        {!isAuthConfigured && (
          <p className="mt-4 rounded-control border border-danger/40 bg-danger-subtle px-3 py-2 text-xs text-text">
            Sign-in is not configured: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing from
            this build.
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <InputField
            label="Email"
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <InputField
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting || !isAuthConfigured}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </Container>
  );
}
