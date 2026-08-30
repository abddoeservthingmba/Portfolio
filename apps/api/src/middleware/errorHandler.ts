import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError, ErrorCode } from '../lib/errors.js';
import { sendError } from '../lib/envelope.js';
import { logger } from '../lib/logger.js';

/** Terminal 404 for a path no route matched. Registered after every route. */
export const notFoundHandler: RequestHandler = (_req, res) => {
  sendError(res, 404, ErrorCode.NOT_FOUND, 'No route matches this path.');
};

/**
 * The single exit for every failure in the chain (C2). Nothing else in the
 * codebase builds an error body.
 *
 * Full detail — stack, context — goes to the log, correlated by the same
 * request id the client received. None of it crosses into the response.
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const requestId = res.locals.requestId;

  if (error instanceof AppError) {
    logger.warn('request failed', {
      requestId,
      code: error.code,
      status: error.status,
      message: error.message,
    });
    sendError(res, error.status, error.code, error.message, error.fields);
    return;
  }

  // cors() rejects a disallowed origin by passing a plain Error to next().
  if (error instanceof Error && error.message.startsWith('Origin not allowed')) {
    logger.warn('origin rejected', { requestId, message: error.message });
    sendError(res, 403, ErrorCode.FORBIDDEN, 'This origin is not permitted.');
    return;
  }

  // express.json() rejects an oversized body with a `type` of entity.too.large.
  if (isBodyParserError(error, 'entity.too.large')) {
    sendError(res, 413, ErrorCode.PAYLOAD_TOO_LARGE, 'Request body is too large.');
    return;
  }

  if (isBodyParserError(error, 'entity.parse.failed')) {
    sendError(res, 400, ErrorCode.BAD_REQUEST, 'Request body is not valid JSON.');
    return;
  }

  // Anything reaching here is unhandled. Log it fully, tell the client nothing.
  logger.error('unhandled error', {
    requestId,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  sendError(res, 500, ErrorCode.INTERNAL_ERROR, 'Something went wrong on our side.');
};

function isBodyParserError(error: unknown, type: string): boolean {
  return typeof error === 'object' && error !== null && 'type' in error && error.type === type;
}
