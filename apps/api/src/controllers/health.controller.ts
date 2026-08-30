import type { RequestHandler } from 'express';
import { sendSuccess } from '../lib/envelope.js';
import * as healthService from '../services/health.service.js';

/**
 * Controllers shape requests and responses and nothing else (D2 layering rule).
 * The service holds the logic; a controller that reaches past it is the first
 * sign the layering has collapsed.
 */
export const getHealth: RequestHandler = async (_req, res, next) => {
  try {
    const report = await healthService.getHealth();
    sendSuccess(res, report);
  } catch (error) {
    next(error);
  }
};
