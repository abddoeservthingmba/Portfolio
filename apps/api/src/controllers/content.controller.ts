import type { RequestHandler } from 'express';
import { sendSuccess } from '../lib/envelope.js';
import * as content from '../services/content.service.js';
import type { ProjectQuery } from '../schemas/content.schemas.js';

/**
 * Controllers shape requests and responses and nothing else (D2 layering rule).
 * Each one reads already-validated input, calls a service, and hands the result
 * to the envelope. Errors go to next() and exit through the one error handler.
 */

export const listProjects: RequestHandler = async (req, res, next) => {
  try {
    // Parsed and coerced by validate(projectQuerySchema, 'query').
    const query = req.query as ProjectQuery;

    const projects = await content.listProjects({
      ...(query.featured !== undefined ? { featured: query.featured } : {}),
      ...(query.q ? { q: query.q } : {}),
      ...(query.skill ? { skill: query.skill } : {}),
    });

    sendSuccess(res, projects);
  } catch (error) {
    next(error);
  }
};

export const getProject: RequestHandler = async (req, res, next) => {
  try {
    const { slug } = req.params as { slug: string };
    sendSuccess(res, await content.getProjectBySlug(slug));
  } catch (error) {
    next(error);
  }
};

export const listSkills: RequestHandler = async (req, res, next) => {
  try {
    const { category } = req.query as { category?: string };
    sendSuccess(res, await content.listSkills(category));
  } catch (error) {
    next(error);
  }
};

export const listExperience: RequestHandler = async (_req, res, next) => {
  try {
    sendSuccess(res, await content.listExperience());
  } catch (error) {
    next(error);
  }
};

export const listCertifications: RequestHandler = async (_req, res, next) => {
  try {
    sendSuccess(res, await content.listCertifications());
  } catch (error) {
    next(error);
  }
};

export const listEducation: RequestHandler = async (_req, res, next) => {
  try {
    sendSuccess(res, await content.listEducation());
  } catch (error) {
    next(error);
  }
};

export const getResume: RequestHandler = async (_req, res, next) => {
  try {
    sendSuccess(res, await content.getActiveResume());
  } catch (error) {
    next(error);
  }
};

export const getSettings: RequestHandler = async (_req, res, next) => {
  try {
    sendSuccess(res, await content.getSettings());
  } catch (error) {
    next(error);
  }
};
