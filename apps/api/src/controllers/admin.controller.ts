import type { RequestHandler } from 'express';
import { sendSuccess } from '../lib/envelope.js';
import { logger } from '../lib/logger.js';
import * as projects from '../services/admin/projects.service.js';
import * as skills from '../services/admin/skills.service.js';
import * as experience from '../services/admin/experience.service.js';
import * as certifications from '../services/admin/certifications.service.js';
import * as education from '../services/admin/education.service.js';
import * as resume from '../services/admin/resume.service.js';
import * as settings from '../services/admin/settings.service.js';
import * as content from '../services/content.service.js';

/**
 * Admin controllers. Every handler behind these routes has already passed
 * requireAuth, so `res.locals.actor` is present.
 *
 * Each mutation emits one audit line naming the actor, the entity and the
 * action. Without it the server log records that a write happened but not who
 * made it, which is the one question worth asking after an unexpected change.
 */
function audit(res: Parameters<RequestHandler>[1], entity: string, action: string, id?: string) {
  logger.info('admin mutation', {
    requestId: res.locals.requestId,
    actor: res.locals.actor?.email ?? res.locals.actor?.authUserId,
    entity,
    action,
    ...(id ? { entityId: id } : {}),
  });
}

/** Wraps a handler so every rejection reaches the one error handler. */
function handler(
  fn: (req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1]) => Promise<void>,
): RequestHandler {
  return async (req, res, next) => {
    try {
      await fn(req, res);
    } catch (error) {
      next(error);
    }
  };
}

const id = (req: Parameters<RequestHandler>[0]) => (req.params as { id: string }).id;

// --- Projects ---------------------------------------------------------------

export const listProjects = handler(async (_req, res) => {
  sendSuccess(res, await projects.list());
});

export const getProject = handler(async (req, res) => {
  sendSuccess(res, await projects.getById(id(req)));
});

export const createProject = handler(async (req, res) => {
  const created = await projects.create(req.body);
  audit(res, 'project', 'create', created.id);
  sendSuccess(res, created, 201);
});

export const updateProject = handler(async (req, res) => {
  const updated = await projects.update(id(req), req.body);
  audit(res, 'project', 'update', updated.id);
  sendSuccess(res, updated);
});

export const deleteProject = handler(async (req, res) => {
  await projects.remove(id(req));
  audit(res, 'project', 'delete', id(req));
  res.status(204).end();
});

// --- Skills -----------------------------------------------------------------

export const createSkill = handler(async (req, res) => {
  const created = await skills.create(req.body);
  audit(res, 'skill', 'create', created.id);
  sendSuccess(res, created, 201);
});

export const updateSkill = handler(async (req, res) => {
  const updated = await skills.update(id(req), req.body);
  audit(res, 'skill', 'update', updated.id);
  sendSuccess(res, updated);
});

export const deleteSkill = handler(async (req, res) => {
  await skills.remove(id(req));
  audit(res, 'skill', 'delete', id(req));
  res.status(204).end();
});

// --- Experience -------------------------------------------------------------

export const createExperience = handler(async (req, res) => {
  const created = await experience.create(req.body);
  audit(res, 'experience', 'create', created.id);
  sendSuccess(res, created, 201);
});

export const updateExperience = handler(async (req, res) => {
  const updated = await experience.update(id(req), req.body);
  audit(res, 'experience', 'update', updated.id);
  sendSuccess(res, updated);
});

export const deleteExperience = handler(async (req, res) => {
  await experience.remove(id(req));
  audit(res, 'experience', 'delete', id(req));
  res.status(204).end();
});

// --- Certifications ---------------------------------------------------------

export const createCertification = handler(async (req, res) => {
  const created = await certifications.create(req.body);
  audit(res, 'certification', 'create', created.id);
  sendSuccess(res, created, 201);
});

export const updateCertification = handler(async (req, res) => {
  const updated = await certifications.update(id(req), req.body);
  audit(res, 'certification', 'update', updated.id);
  sendSuccess(res, updated);
});

export const deleteCertification = handler(async (req, res) => {
  await certifications.remove(id(req));
  audit(res, 'certification', 'delete', id(req));
  res.status(204).end();
});

// --- Education --------------------------------------------------------------

export const createEducation = handler(async (req, res) => {
  const created = await education.create(req.body);
  audit(res, 'education', 'create', created.id);
  sendSuccess(res, created, 201);
});

export const updateEducation = handler(async (req, res) => {
  const updated = await education.update(id(req), req.body);
  audit(res, 'education', 'update', updated.id);
  sendSuccess(res, updated);
});

export const deleteEducation = handler(async (req, res) => {
  await education.remove(id(req));
  audit(res, 'education', 'delete', id(req));
  res.status(204).end();
});

// --- Resume -----------------------------------------------------------------

export const listResume = handler(async (_req, res) => {
  sendSuccess(res, await resume.list());
});

export const createResume = handler(async (req, res) => {
  const created = await resume.create(req.body);
  audit(res, 'resume', 'create', created.id);
  sendSuccess(res, created, 201);
});

export const updateResume = handler(async (req, res) => {
  const updated = await resume.update(id(req), req.body);
  audit(res, 'resume', 'update', updated.id);
  sendSuccess(res, updated);
});

export const deleteResume = handler(async (req, res) => {
  await resume.remove(id(req));
  audit(res, 'resume', 'delete', id(req));
  res.status(204).end();
});

// --- Settings ---------------------------------------------------------------

export const updateSettings = handler(async (req, res) => {
  const updated = await settings.update(req.body);
  audit(res, 'settings', 'update');
  sendSuccess(res, updated);
});

// --- Session ----------------------------------------------------------------

/**
 * Confirms the caller is a recognised administrator. The admin shell calls this
 * once on load, so a valid Supabase session belonging to a non-admin is turned
 * away by the server rather than by the client guard alone.
 */
export const getSession = handler(async (_req, res) => {
  sendSuccess(res, {
    id: res.locals.actor?.id,
    email: res.locals.actor?.email ?? null,
    role: 'admin',
  });
});

/** Everything the admin forms need to populate their skill pickers. */
export const listSkillOptions = handler(async (_req, res) => {
  sendSuccess(res, await content.listSkills());
});
