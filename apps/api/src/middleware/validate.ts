import type { RequestHandler } from 'express';
import { z } from 'zod';
import { validationFailed, type FieldErrors } from '../lib/errors.js';

type Target = 'body' | 'query' | 'params';

/**
 * Stage 7 of the chain (C2). This parse is the authority, regardless of what
 * the client checked first. It runs AFTER requireAuth on mutation routes so an
 * unauthorised caller cannot probe the shape of a valid payload.
 *
 * The parsed value replaces the raw one, so handlers receive coerced, typed
 * data and never re-read `req.body` directly.
 */
export function validate(schema: z.ZodType, target: Target = 'body'): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      next(validationFailed(toFieldErrors(result.error)));
      return;
    }

    // Express 5 makes req.query a getter, so assignment needs defineProperty.
    if (target === 'query') {
      Object.defineProperty(req, 'query', { value: result.data, writable: true });
    } else {
      req[target] = result.data as never;
    }

    next();
  };
}

/** Collapses a Zod error into the flat `field -> message` map the envelope carries. */
function toFieldErrors(error: z.ZodError): FieldErrors {
  const fields: FieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    // First message per field wins — a form shows one error per input.
    fields[key] ??= issue.message;
  }

  return fields;
}
