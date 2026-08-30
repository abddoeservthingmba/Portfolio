import { createContext, useContext } from 'react';

export type AuthStatus = 'loading' | 'signed-out' | 'signed-in' | 'not-admin';

export interface AuthState {
  status: AuthStatus;
  email: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Split from the provider so this module exports only a context and a hook —
 * a component file that also exports non-components breaks Fast Refresh.
 */
export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const state = useContext(AuthContext);
  if (!state) throw new Error('useAuth must be used inside <AuthProvider>');

  return state;
}
