import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

/**
 * Loads apps/api/.env into process.env when the file exists.
 *
 * Node's built-in loader, so there is no dotenv dependency. Values already in
 * the environment win, which is what makes the hosted case work untouched:
 * Render and CI inject real variables and ship no .env file at all.
 */
function loadEnvFile() {
  const envPath = fileURLToPath(new URL('../../.env', import.meta.url));

  if (existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
}

loadEnvFile();

/**
 * Environment is parsed once, at startup, and the process refuses to boot on a
 * bad value. A missing variable should be a loud failure here rather than an
 * undefined that surfaces as a confusing 500 an hour later.
 *
 * Supabase variables are declared optional for now: Phase 2 runs on mock data
 * and has no database. They become required in Phase 3.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  /**
   * Comma-separated CORS allow-list. Still an allow-list — no wildcard is
   * accepted at any point (D5).
   *
   * The deployed site is in the default because it is a fixed, public fact
   * about this deployment, not a secret or a per-environment choice. Relying
   * on the variable alone meant the API rejected its own front end whenever
   * the variable was missing, which is a confusing way to fail. Setting
   * ALLOWED_ORIGINS still overrides this entirely.
   */
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173,https://abdsportfoilo.netlify.app'),

  // The public site's own origin, used to build absolute URLs in the sitemap.
  // Not the API's origin — crawlers must be sent to the site, not here.
  PUBLIC_SITE_URL: z.string().default('https://abdsportfoilo.netlify.app'),

  // Public write routes (the contact endpoint) — window in ms, ceiling per window.
  RATE_LIMIT_WINDOW: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),

  MAX_UPLOAD_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(5 * 1024 * 1024),

  /**
   * Skips the admin auth check so the portal can be used without signing in.
   *
   * Honoured ONLY outside production — see requireAuth. The deployed API is
   * reachable by anyone on the internet, so an unauthenticated mutation route
   * there is not a convenience: it is a way for a stranger to delete the
   * portfolio, read the contact inbox and write to the storage buckets. This
   * flag is deliberately incapable of doing that.
   */
  ADMIN_AUTH_BYPASS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),

  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // Print the offending variable NAMES only. Values may be secrets (D5).
    const names = Object.keys(z.flattenError(parsed.error).fieldErrors).join(', ');
    throw new Error(`Invalid environment configuration. Check these variables: ${names}`);
  }

  return parsed.data;
}

const raw = loadEnv();

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  allowedOrigins: raw.ALLOWED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
} as const;

export type Env = typeof env;
