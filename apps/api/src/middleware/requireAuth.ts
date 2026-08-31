import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { readBearerToken, verifyAccessToken, TokenError } from '../lib/auth.js';
import { forbidden, unauthenticated } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

/**
 * Stage 6 of the chain (C2). Guards every mutation route without exception.
 *
 * Two checks, kept deliberately separate (C4):
 *
 *   1. Authentication — is this a valid token from our identity provider?
 *   2. Authorisation  — is that verified person the administrator?
 *
 * Separating them keeps the distinction explicit in logs and in tests, and
 * makes 401 and 403 mean what they say. Collapsing them into one boolean is
 * how a system ends up unable to answer "who tried, and were they known?".
 *
 * This runs BEFORE validation, so an unauthorised caller learns nothing about
 * the shape of a valid payload.
 */
export const requireAuth: RequestHandler = async (req, res, next) => {
  if (isBypassActive()) {
    res.locals.actor = { id: 'local-bypass', authUserId: 'local-bypass', email: 'local@bypass' };
    next();
    return;
  }

  const token = readBearerToken(req.get('authorization'));

  if (!token) {
    next(unauthenticated('This action requires you to be signed in.'));
    return;
  }

  try {
    const claims = await verifyAccessToken(token);

    // Authorisation. The identity provider says who they are; this table says
    // what they may do. A valid token for someone with no row here is a
    // legitimate user of the Supabase project who is not the administrator.
    const actor = await prisma.user.findUnique({
      where: { authUserId: claims.userId },
      select: { id: true, role: true },
    });

    if (!actor || actor.role !== 'admin') {
      logger.warn('non-admin mutation attempt', {
        requestId: res.locals.requestId,
        authUserId: claims.userId,
        path: req.originalUrl,
      });
      next(forbidden('This account does not have administrator access.'));
      return;
    }

    res.locals.actor = { id: actor.id, authUserId: claims.userId, email: claims.email };
    next();
  } catch (error) {
    if (error instanceof TokenError) {
      logger.warn('token rejected', {
        requestId: res.locals.requestId,
        path: req.originalUrl,
        reason: error.message,
      });
      // The reason stays in the log. The caller learns only that it failed.
      next(unauthenticated('Your session is not valid. Please sign in again.'));
      return;
    }

    next(error);
  }
};

/**
 * Whether the admin auth check is being skipped.
 *
 * Two conditions, and production overrides the flag rather than obeying it.
 * The deployed API is reachable by anyone, so an unauthenticated mutation
 * route there means a stranger can delete every project, empty the contact
 * inbox and write to the storage buckets. No configuration value should be
 * able to arrange that by accident, so this fails closed.
 *
 * A production process that has the flag set is misconfigured, and says so
 * loudly on every guarded request rather than failing silently.
 */
function isBypassActive(): boolean {
  if (!env.ADMIN_AUTH_BYPASS) return false;

  // Allow-listed to development, rather than merely excluding production.
  // Under `test` the suite must exercise the real guard: with the bypass on,
  // the 43 tests asserting that mutation routes reject an unauthenticated
  // caller would all pass while proving nothing.
  if (env.NODE_ENV !== 'development') {
    logger.error(`ADMIN_AUTH_BYPASS is set under NODE_ENV=${env.NODE_ENV} and is being ignored`, {
      action: 'The bypass is honoured in development only. Remove this variable.',
    });
    return false;
  }

  return true;
}
