import type {
  Certification,
  ContactSubmission,
  Education,
  Experience,
  Project,
  ResumeVersion,
  SiteSettings,
  Skill,
} from '@/types/content';
import { apiRequest, ApiError } from './api';

/**
 * Every read the public site performs, one function per route in the D4
 * contract. Pages call these and never touch the API client directly, so a
 * change to the contract lands in exactly one file.
 *
 * Phase 3 replaced the mock bodies here with real requests; `src/mocks/` is
 * gone. The signatures did not change, so no page or component was touched.
 */

export interface ProjectQuery {
  featured?: boolean;
  /** Case-insensitive match on title and short description (FR-11). */
  q?: string;
  /** Skill id, filtering through the join table (FR-11). */
  skill?: string;
}

/** GET /projects */
export async function getProjects(query: ProjectQuery = {}): Promise<Project[]> {
  return apiRequest<Project[]>('/projects', {
    query: {
      ...(query.featured ? { featured: 'true' } : {}),
      ...(query.q ? { q: query.q } : {}),
      ...(query.skill ? { skill: query.skill } : {}),
    },
  });
}

/**
 * GET /projects/:slug.
 *
 * A 404 is an ordinary outcome here, not a failure — the page renders a
 * not-found view for it — so it resolves to null rather than throwing. Every
 * other error propagates and becomes an error state.
 */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    return await apiRequest<Project>(`/projects/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.code === 'NOT_FOUND') return null;
    throw error;
  }
}

/** GET /skills */
export async function getSkills(): Promise<Skill[]> {
  return apiRequest<Skill[]>('/skills');
}

/** GET /experience */
export async function getExperience(): Promise<Experience[]> {
  return apiRequest<Experience[]>('/experience');
}

/** GET /certifications */
export async function getCertifications(): Promise<Certification[]> {
  return apiRequest<Certification[]>('/certifications');
}

/** GET /education */
export async function getEducation(): Promise<Education[]> {
  return apiRequest<Education[]>('/education');
}

/** GET /resume — null when no version is active (FR-08). */
export async function getResume(): Promise<ResumeVersion | null> {
  return apiRequest<ResumeVersion | null>('/resume');
}

/** GET /settings */
export async function getSettings(): Promise<SiteSettings> {
  return apiRequest<SiteSettings>('/settings');
}

/**
 * POST /contact.
 *
 * The honeypot and dwell time are sent for the server to judge — the client
 * does not decide whether a submission is automated. Both heuristics fail
 * silently there, so this resolves either way (C6).
 */
export async function submitContact(
  submission: ContactSubmission & { company?: string; dwellMs?: number },
): Promise<void> {
  await apiRequest<{ received: boolean }>('/contact', {
    method: 'POST',
    body: submission,
  });
}
