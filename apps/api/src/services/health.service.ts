import { env } from '../config/env.js';

export interface HealthReport {
  status: 'ok';
  uptimeSeconds: number;
  environment: string;
  /**
   * Database reachability (D10). No database exists until Phase 3, so this
   * reports 'not_configured' rather than pretending to have checked something.
   */
  database: 'ok' | 'unreachable' | 'not_configured';
}

/**
 * Deliberately cheap: this endpoint is called by the deployment smoke check and
 * used to warm a cold service, so it must not do real work.
 */
export async function getHealth(): Promise<HealthReport> {
  return {
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    environment: env.NODE_ENV,
    database: env.DATABASE_URL ? 'ok' : 'not_configured',
  };
}
