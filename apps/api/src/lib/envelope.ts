import type { Response } from 'express';
import type { ErrorCodeName, FieldErrors } from './errors.js';

/**
 * The one response shape used by every route (C2). Handlers never build a body
 * by hand — they call these, so a client can always find the payload in the
 * same place and an error never leaks internals.
 */

export interface SuccessEnvelope<T> {
  data: T;
  meta: { requestId: string };
}

export interface ErrorEnvelope {
  error: {
    code: ErrorCodeName;
    message: string;
    fields?: FieldErrors;
  };
  meta: { requestId: string };
}

export function sendSuccess<T>(res: Response, data: T, status = 200): void {
  const body: SuccessEnvelope<T> = { data, meta: { requestId: res.locals.requestId } };
  res.status(status).json(body);
}

export function sendError(
  res: Response,
  status: number,
  code: ErrorCodeName,
  message: string,
  fields?: FieldErrors,
): void {
  const body: ErrorEnvelope = {
    error: { code, message, ...(fields ? { fields } : {}) },
    meta: { requestId: res.locals.requestId },
  };
  res.status(status).json(body);
}
