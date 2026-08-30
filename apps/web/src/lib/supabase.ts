import { createClient } from '@supabase/supabase-js';

/**
 * The Supabase browser client, used for exactly one thing: signing the
 * administrator in and holding the resulting session.
 *
 * It never reads or writes content. Every piece of data on this site comes
 * through the Express API, which owns validation, authorisation and every
 * privileged key. The moment the browser starts querying Supabase directly for
 * data the API already serves, the boundary rule has been broken.
 *
 * The anon key is public by design — it is compiled into this bundle and grants
 * nothing beyond attempting a sign-in.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isAuthConfigured = Boolean(url && anonKey);

export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'missing-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // The admin portal is not linked publicly and has no OAuth callback route.
    detectSessionInUrl: false,
  },
});

/**
 * The current access token, refreshed if it is close to expiring.
 *
 * Every admin request calls this rather than caching a token, so a long editing
 * session does not end in a surprise 401 halfway through saving a form.
 */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
