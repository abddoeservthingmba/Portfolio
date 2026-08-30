import { apiRequest, type RequestOptions } from './api';
import { getAccessToken } from './supabase';
import type {
  Certification,
  Education,
  Experience,
  Project,
  ResumeVersion,
  SiteSettings,
  Skill,
} from '@/types/content';

/**
 * Every admin call, one function per route.
 *
 * The token is fetched per request rather than held, so the Supabase client can
 * refresh it underneath a long editing session. Nothing here decides whether
 * the caller is allowed to do something — the server does, and a guard in the
 * browser is a convenience, never a control.
 */
async function adminRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = await getAccessToken();
  return apiRequest<T>(`/admin${path}`, { ...options, token });
}

export interface AdminSession {
  id: string;
  email: string | null;
  role: 'admin';
}

/** Confirms with the server that this session belongs to the administrator. */
export const getSession = () => adminRequest<AdminSession>('/session');

export const getSkillOptions = () => adminRequest<Skill[]>('/skill-options');

// --- Projects ---------------------------------------------------------------

/** Admin listing includes drafts and archived, unlike the public read. */
export const listProjects = () => adminRequest<Project[]>('/projects');
export const getProject = (id: string) => adminRequest<Project>(`/projects/${id}`);

export const createProject = (body: unknown) =>
  adminRequest<Project>('/projects', { method: 'POST', body });

export const updateProject = (id: string, body: unknown) =>
  adminRequest<Project>(`/projects/${id}`, { method: 'PATCH', body });

export const deleteProject = (id: string) =>
  adminRequest<void>(`/projects/${id}`, { method: 'DELETE' });

// --- Skills -----------------------------------------------------------------

export const createSkill = (body: unknown) =>
  adminRequest<Skill>('/skills', { method: 'POST', body });

export const updateSkill = (id: string, body: unknown) =>
  adminRequest<Skill>(`/skills/${id}`, { method: 'PATCH', body });

export const deleteSkill = (id: string) =>
  adminRequest<void>(`/skills/${id}`, { method: 'DELETE' });

// --- Experience -------------------------------------------------------------

export const createExperience = (body: unknown) =>
  adminRequest<Experience>('/experience', { method: 'POST', body });

export const updateExperience = (id: string, body: unknown) =>
  adminRequest<Experience>(`/experience/${id}`, { method: 'PATCH', body });

export const deleteExperience = (id: string) =>
  adminRequest<void>(`/experience/${id}`, { method: 'DELETE' });

// --- Certifications ---------------------------------------------------------

export const createCertification = (body: unknown) =>
  adminRequest<Certification>('/certifications', { method: 'POST', body });

export const updateCertification = (id: string, body: unknown) =>
  adminRequest<Certification>(`/certifications/${id}`, { method: 'PATCH', body });

export const deleteCertification = (id: string) =>
  adminRequest<void>(`/certifications/${id}`, { method: 'DELETE' });

// --- Education --------------------------------------------------------------

export const createEducation = (body: unknown) =>
  adminRequest<Education>('/education', { method: 'POST', body });

export const updateEducation = (id: string, body: unknown) =>
  adminRequest<Education>(`/education/${id}`, { method: 'PATCH', body });

export const deleteEducation = (id: string) =>
  adminRequest<void>(`/education/${id}`, { method: 'DELETE' });

// --- Resume -----------------------------------------------------------------

export const listResume = () => adminRequest<ResumeVersion[]>('/resume');

export const createResume = (body: unknown) =>
  adminRequest<ResumeVersion>('/resume', { method: 'POST', body });

export const updateResume = (id: string, body: unknown) =>
  adminRequest<ResumeVersion>(`/resume/${id}`, { method: 'PATCH', body });

export const deleteResume = (id: string) =>
  adminRequest<void>(`/resume/${id}`, { method: 'DELETE' });

// --- Settings ---------------------------------------------------------------

export const updateSettings = (body: unknown) =>
  adminRequest<SiteSettings>('/settings', { method: 'PATCH', body });
