import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/adminApi';
import { ApiError } from '@/lib/api';
import { AuthContext, type AuthState, type AuthStatus } from './AuthContext';

/**
 * Holds the admin session.
 *
 * Two separate questions, and both must be answered by the server:
 *
 *   1. Is there a valid Supabase session?  — the client can see this itself
 *   2. Does it belong to the administrator? — only the API can say
 *
 * The second is why 'not-admin' exists as a state. Someone can hold a
 * perfectly valid session for this Supabase project without being the
 * administrator, and the UI must say so rather than showing an empty portal.
 */
/**
 * Mirrors the API's ADMIN_AUTH_BYPASS, for local use without signing in.
 *
 * Vite inlines this at build time, so a production bundle cannot pick it up
 * unless someone deliberately builds with it — and even then the server
 * refuses to honour the bypass outside development, so the portal would load
 * and every save would come back 401.
 */
const BYPASS = import.meta.env.VITE_ADMIN_AUTH_BYPASS === 'true';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(BYPASS ? 'signed-in' : 'loading');
  const [email, setEmail] = useState<string | null>(BYPASS ? 'local bypass' : null);

  /** Asks the API whether the current token belongs to an administrator. */
  const confirmAdmin = useCallback(async () => {
    try {
      const session = await getSession();
      setEmail(session.email);
      setStatus('signed-in');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'FORBIDDEN') {
        setStatus('not-admin');
        return;
      }
      // An invalid or expired token, or an unreachable API. Either way there is
      // no usable session, so the login screen is the honest thing to show.
      setStatus('signed-out');
    }
  }, []);

  useEffect(() => {
    // With the bypass on there is no session to read and nothing to subscribe
    // to — the portal is already usable.
    if (BYPASS) return;

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) {
        setStatus('signed-out');
        return;
      }
      void confirmAdmin();
    });

    // Fires on sign-in, sign-out and token refresh, including in another tab.
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (!session) {
        setEmail(null);
        setStatus('signed-out');
        return;
      }

      // A refresh does not change who the person is, so do not re-check.
      if (event === 'TOKEN_REFRESHED') return;

      void confirmAdmin();
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [confirmAdmin]);

  const signIn = useCallback(
    async (emailInput: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailInput,
        password,
      });

      // Surfaced to the form, which decides how to present it.
      if (error) throw new Error(error.message);

      await confirmAdmin();
    },
    [confirmAdmin],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setEmail(null);
    setStatus('signed-out');
  }, []);

  const value = useMemo<AuthState>(
    () => ({ status, email, signIn, signOut }),
    [status, email, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
