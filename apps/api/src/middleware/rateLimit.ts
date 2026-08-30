import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { ErrorCode } from '../lib/errors.js';
import { sendError } from '../lib/envelope.js';

/**
 * Stage 5 of the chain (C2). Applied only to public write routes — principally
 * the contact endpoint, which is the one place an anonymous visitor causes a
 * write. Throttled callers get the standard envelope plus a retry-after header.
 */
export const publicWriteRateLimit: RequestHandler = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Tests would otherwise trip over state carried between cases.
  skip: () => env.isTest,
  handler: (_req, res) => {
    const retryAfterSeconds = Math.ceil(env.RATE_LIMIT_WINDOW / 1000);
    res.setHeader('Retry-After', retryAfterSeconds);
    sendError(res, 429, ErrorCode.RATE_LIMITED, 'Too many requests. Please try again later.');
  },
});
