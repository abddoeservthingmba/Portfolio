import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info('api listening', {
    port: env.PORT,
    environment: env.NODE_ENV,
    allowedOrigins: env.allowedOrigins,
  });
});

/**
 * Render restarts the service on deploy, so in-flight requests need a chance to
 * finish rather than being cut off mid-response.
 */
function shutdown(signal: string) {
  logger.info('shutting down', { signal });

  server.close((error) => {
    if (error) {
      logger.error('shutdown failed', { message: error.message });
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
