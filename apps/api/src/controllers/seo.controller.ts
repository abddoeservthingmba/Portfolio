import type { RequestHandler } from 'express';
import { buildRobots, buildSitemap } from '../services/sitemap.service.js';

/**
 * These two return XML and plain text rather than the standard JSON envelope.
 * Crawlers expect exactly the documented format, so the envelope — which every
 * other route uses without exception — does not apply here.
 */

export const sitemap: RequestHandler = async (_req, res, next) => {
  try {
    res.type('application/xml').send(await buildSitemap());
  } catch (error) {
    next(error);
  }
};

export const robots: RequestHandler = (_req, res) => {
  res.type('text/plain').send(buildRobots());
};
