import { env } from '../config/env.js';
import { checkDatabase } from '../lib/prisma.js';

export interface HealthReport {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  environment: string;
  database: 'ok' | 'unreachable' | 'not_configured';

  /**
   * What the process was actually configured with.
   *
   * Deliberately included: diagnosing a deployment otherwise means guessing
   * which variables reached the service, and a wrong guess costs a redeploy
   * each time. None of this is secret — the origins are echoed in CORS headers
   * anyway, and the rest are presence booleans, never values.
   */
  config: {
    allowedOrigins: string[];
    publicSiteUrl: string;
    databaseUrlSet: boolean;
    supabaseUrlSet: boolean;
    serviceRoleKeySet: boolean;
    adminAuthBypassActive: boolean;
  };
}

/**
 * Deliberately cheap: this endpoint is called by the deployment smoke check and
 * used to warm a cold service, so it must not do real work. The database probe
 * is a single `SELECT 1`.
 *
 * A database that does not answer makes the service 'degraded' rather than
 * throwing — the caller needs a report, and a health endpoint that 500s tells
 * a monitor less than one that says precisely which dependency is down.
 */
export async function getHealth(): Promise<HealthReport> {
  const database = !env.DATABASE_URL
    ? 'not_configured'
    : (await checkDatabase())
      ? 'ok'
      : 'unreachable';

  return {
    status: database === 'unreachable' ? 'degraded' : 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    environment: env.NODE_ENV,
    database,
    config: {
      allowedOrigins: env.allowedOrigins,
      publicSiteUrl: env.PUBLIC_SITE_URL,
      databaseUrlSet: Boolean(env.DATABASE_URL),
      supabaseUrlSet: Boolean(env.SUPABASE_URL),
      serviceRoleKeySet: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
      // Reported so a bypass that slipped into a deploy is visible, not silent.
      adminAuthBypassActive: env.ADMIN_AUTH_BYPASS && env.NODE_ENV === 'development',
    },
  };
}
