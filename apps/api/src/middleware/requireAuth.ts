import type { RequestHandler } from 'express';
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
