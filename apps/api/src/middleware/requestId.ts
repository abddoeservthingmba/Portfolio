import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

/**
 * Stage 3a of the chain (C2). Attaches a correlation id, echoes it on the
 * response header, and makes it available to the envelope helpers.
 *
 * An inbound x-request-id is honoured so a trace survives a proxy hop, but it
 * is length-capped — it ends up in log lines and a response header.
 */
export const requestId: RequestHandler = (req, res, next) => {
  const inbound = req.get('x-request-id');
  const id = inbound && inbound.length <= 200 ? inbound : randomUUID();

  res.locals.requestId = id;
  res.setHeader('x-request-id', id);
  next();
};
