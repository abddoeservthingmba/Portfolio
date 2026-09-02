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
const configuredKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * The `role` claim of a Supabase key, or null if it is not a readable JWT.
 *
 * Supabase's anon and service-role keys are the same shape and differ only in
 * this claim, so pasting the wrong one into a `VITE_` variable is a silent,
 * one-character-invisible mistake — and Vite compiles it straight into the
 * bundle. Reading the claim is a few lines; not reading it once cost this
 * project a service-role key in a local web env.
 *
 * Decoding is not verification. The signature is deliberately ignored: this
 * asks "which key did the build ship?", not "is this token genuine?" — a
 * question only the server can answer, and does, on every request.
 */
function roleClaimOf(key: string): string | null {
  try {
    const payload = key.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const role: unknown = JSON.parse(json).role;
    return typeof role === 'string' ? role : null;
  } catch {
    // Not a JWT — the newer `sb_publishable_…` keys, for instance. Unreadable
    // is not the same as privileged, so this is not treated as a failure.
    return null;
  }
}

const role = configuredKey ? roleClaimOf(configuredKey) : null;

/**
 * Anything other than `anon` is a privileged key that must never have reached a
 * browser. The build is refused rather than downgraded: the sign-in form
 * reports itself unconfigured, and the client below is constructed with a dud
 * key so no code path can use the real one.
 */
const isPrivilegedKey = role !== null && role !== 'anon';

if (isPrivilegedKey) {
  // Loud, and safe to log — it names the claim, never the key.
  console.error(
    `Refusing to use VITE_SUPABASE_ANON_KEY: it carries role "${role}", not "anon". ` +
      `A privileged key has been compiled into this bundle. Replace it with the anon key ` +
      `and rotate the leaked one in the Supabase dashboard.`,
  );
}

const anonKey = isPrivilegedKey ? undefined : configuredKey;

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
