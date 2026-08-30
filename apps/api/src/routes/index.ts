import { Router } from 'express';
import { healthRoutes } from './health.routes.js';
import { contentRoutes } from './content.routes.js';
import { adminRoutes } from './admin.routes.js';

/**
 * Everything the API serves sits under one versioned prefix (D4). Entity
 * routers are mounted here as each phase adds them.
 */
export const apiRouter = Router();

apiRouter.use(healthRoutes);
apiRouter.use(contentRoutes);
apiRouter.use('/admin', adminRoutes);
