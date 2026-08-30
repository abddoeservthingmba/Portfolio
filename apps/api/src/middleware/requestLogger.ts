import type { RequestHandler } from 'express';
import { logger } from '../lib/logger.js';

/**
 * Stage 3b of the chain (C2). One structured line per completed request,
 * carrying method, path, status, duration and the correlation id.
 *
 * Logged on 'finish' rather than up front, so a single line holds the whole
 * outcome and there is nothing to correlate between two half-records.
 */
export const requestLogger: RequestHandler = (req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    logger.info('request', {
      requestId: res.locals.requestId,
      method: req.method,
      // req.originalUrl carries the query string; it is never a place for secrets.
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    });
  });

  next();
};
