import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { publicWriteRateLimit } from '../middleware/rateLimit.js';
import * as controller from '../controllers/content.controller.js';
import * as contactController from '../controllers/contact.controller.js';
import { contactSchema } from '../schemas/contact.schemas.js';
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

/**
 * The one exception to "every public route is a GET": the contact endpoint,
 * where an anonymous visitor causes a write (C6).
 *
 * It is therefore the only public route carrying a rate limit, and it accepts
 * the narrowest payload in the system.
 */
contentRoutes.post(
  '/contact',
  publicWriteRateLimit,
  validate(contactSchema),
  contactController.submit,
);
