import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/admin.controller.js';
import {
  createCertificationSchema,
  createEducationSchema,
  createExperienceSchema,
  createProjectSchema,
  createResumeSchema,
  createSkillSchema,
  idParamSchema,
  updateCertificationSchema,
  updateEducationSchema,
  updateExperienceSchema,
  updateProjectSchema,
  updateResumeSchema,
  updateSettingsSchema,
  updateSkillSchema,
} from '../schemas/admin.schemas.js';

/**
 * Every route on this router is behind requireAuth (applied once, below), and
 * authorisation runs before validation so an unauthorised caller cannot probe
 * the shape of a valid payload (C4).
 *
 * Applying the guard to the router rather than per-route is deliberate: a new
 * endpoint added here is protected by default. Forgetting the middleware is
 * the single most serious defect this system can have, so the safe thing is
 * what happens when someone does nothing.
 */
export const adminRoutes = Router();

adminRoutes.use(requireAuth);

const withId = validate(idParamSchema, 'params');

adminRoutes.get('/session', controller.getSession);
adminRoutes.get('/skill-options', controller.listSkillOptions);

// Projects — admin listing includes drafts and archived.
adminRoutes.get('/projects', controller.listProjects);
adminRoutes.get('/projects/:id', withId, controller.getProject);
adminRoutes.post('/projects', validate(createProjectSchema), controller.createProject);
adminRoutes.patch('/projects/:id', withId, validate(updateProjectSchema), controller.updateProject);
adminRoutes.delete('/projects/:id', withId, controller.deleteProject);

// Skills
adminRoutes.post('/skills', validate(createSkillSchema), controller.createSkill);
adminRoutes.patch('/skills/:id', withId, validate(updateSkillSchema), controller.updateSkill);
adminRoutes.delete('/skills/:id', withId, controller.deleteSkill);

// Experience
adminRoutes.post('/experience', validate(createExperienceSchema), controller.createExperience);
adminRoutes.patch(
  '/experience/:id',
  withId,
  validate(updateExperienceSchema),
  controller.updateExperience,
);
adminRoutes.delete('/experience/:id', withId, controller.deleteExperience);

// Certifications
adminRoutes.post(
  '/certifications',
  validate(createCertificationSchema),
  controller.createCertification,
);
adminRoutes.patch(
  '/certifications/:id',
  withId,
  validate(updateCertificationSchema),
  controller.updateCertification,
);
adminRoutes.delete('/certifications/:id', withId, controller.deleteCertification);

// Education
adminRoutes.post('/education', validate(createEducationSchema), controller.createEducation);
adminRoutes.patch(
  '/education/:id',
  withId,
  validate(updateEducationSchema),
  controller.updateEducation,
);
adminRoutes.delete('/education/:id', withId, controller.deleteEducation);

// Resume metadata. The file itself arrives in Phase 5.
adminRoutes.get('/resume', controller.listResume);
adminRoutes.post('/resume', validate(createResumeSchema), controller.createResume);
adminRoutes.patch('/resume/:id', withId, validate(updateResumeSchema), controller.updateResume);
adminRoutes.delete('/resume/:id', withId, controller.deleteResume);

// Settings — a singleton, so update only.
adminRoutes.patch('/settings', validate(updateSettingsSchema), controller.updateSettings);
