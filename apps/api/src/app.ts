import express, { type Express } from 'express';
import helmet from 'helmet';
import { corsMiddleware } from './middleware/cors.js';
import { requestId } from './middleware/requestId.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';

export const API_PREFIX = '/api/v1';

/**
 * The ordered middleware chain from C2. The order is the security model, not a
 * style choice:
 *
 *   1. requestId   — correlation id, needed by the logger and every envelope
 *   2. helmet      — security headers on everything, including error responses
 *   3. cors        — reject a disallowed origin before any body is read
 *   4. logger      — one structured line per completed request
 *   5. body parser — size-capped, so an oversized body dies before processing
 *
 * requestId runs ahead of cors, one step earlier than the C2 diagram shows.
 * A rejected origin is otherwise the one failure with no id to trace it by,
 * and the stage reads no request body, so the ordering rationale still holds.
 *
 * Rate limiting, authorisation and validation apply selectively and are
 * declared on the routes that need them. Every failure exits through the one
 * error handler registered last.
 *
 * Exported as a factory so tests get a fresh app with no shared state.
 */
export function createApp(): Express {
  const app = express();

  // Behind Render's proxy, so the client address the rate limiter sees is real.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(requestId);
  app.use(helmet());
  app.use(corsMiddleware);
  app.use(requestLogger);
  app.use(express.json({ limit: '1mb' }));

  app.use(API_PREFIX, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
