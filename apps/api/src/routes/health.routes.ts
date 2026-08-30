import { Router } from 'express';
import * as healthController from '../controllers/health.controller.js';

/** Routes stay thin: a path, its middleware chain, and a controller reference. */
export const healthRoutes = Router();

healthRoutes.get('/health', healthController.getHealth);
