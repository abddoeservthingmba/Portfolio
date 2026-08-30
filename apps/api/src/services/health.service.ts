import { env } from '../config/env.js';
import { checkDatabase } from '../lib/prisma.js';

export interface HealthReport {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  environment: string;
  database: 'ok' | 'unreachable' | 'not_configured';
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
  };
}
