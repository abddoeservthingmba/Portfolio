import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/content.controller.js';
import {
  projectQuerySchema,
  projectSlugSchema,
  skillQuerySchema,
} from '../schemas/content.schemas.js';

/**
 * The public read surface (D4.1). Every route here is a GET — there is no code
 * path from an unauthenticated request to a write (C3).
 *
 * Mutation routes arrive in Phase 4 and carry requireAuth before validate.
 */
export const contentRoutes = Router();

contentRoutes.get('/projects', validate(projectQuerySchema, 'query'), controller.listProjects);
contentRoutes.get('/projects/:slug', validate(projectSlugSchema, 'params'), controller.getProject);

contentRoutes.get('/skills', validate(skillQuerySchema, 'query'), controller.listSkills);
contentRoutes.get('/experience', controller.listExperience);
contentRoutes.get('/certifications', controller.listCertifications);
contentRoutes.get('/education', controller.listEducation);
contentRoutes.get('/resume', controller.getResume);
contentRoutes.get('/settings', controller.getSettings);
