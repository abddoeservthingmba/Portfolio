import cors from 'cors';
import type { RequestHandler } from 'express';
import { env } from '../config/env.js';

/**
 * Stage 2 of the chain (C2). Strict allow-list, no wildcard at any point (D5).
 *
 * Requests with no Origin header (curl, health probes, server-to-server) are
 * allowed through: the header is a browser mechanism, and rejecting its absence
 * would break the deployment smoke check without adding any protection.
 */
export const corsMiddleware: RequestHandler = cors({
  origin(origin, callback) {
    if (!origin || env.allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin not allowed: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
});
