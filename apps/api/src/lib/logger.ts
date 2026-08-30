import { env } from '../config/env.js';

type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL: Level = env.isProduction ? 'info' : 'debug';

/**
 * One structured JSON line per event (D10). Deliberately dependency-free: the
 * requirement is a parseable line with a correlation id, and that is thirty
 * lines of code rather than a logging framework to configure.
 *
 * Never pass a secret, token or connection string in `context`.
 */
function write(level: Level, message: string, context?: Record<string, unknown>) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[MIN_LEVEL]) return;

  const line = JSON.stringify({
    level,
    time: new Date().toISOString(),
    message,
    ...context,
  });

  if (level === 'error') process.stderr.write(`${line}\n`);
  else process.stdout.write(`${line}\n`);
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => write('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => write('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => write('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => write('error', message, context),
};

export type Logger = typeof logger;
