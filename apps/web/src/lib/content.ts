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
import { mockProjects } from '@/mocks/projects';
import { mockSkills } from '@/mocks/skills';
import {
  mockCertifications,
  mockEducation,
  mockExperience,
  mockResume,
  mockSettings,
} from '@/mocks/profile';

/**
 * THE PHASE 2 / PHASE 3 SEAM.
 *
 * Every function here mirrors a route in the D4 contract and returns what that
 * route's envelope will carry. Pages consume these, never the mock modules
 * directly — so Phase 3 replaces the bodies with typed fetch calls and deletes
 * `src/mocks/`, and no page or component changes.
 *
 * The functions are async and artificially latent on purpose: it makes the
 * loading and error states real work during Phase 2 rather than something
 * discovered when the API arrives.
 */

/** Stands in for network time so skeletons are exercised in development. */
const LATENCY_MS = 220;

function resolve<T>(value: T): Promise<T> {
  return new Promise((done) => {
    setTimeout(() => done(structuredClone(value)), LATENCY_MS);
  });
}

/** Public callers see published projects only (D4.2). */
function published(projects: Project[]): Project[] {
  return projects.filter((project) => project.status === 'PUBLISHED');
}

export interface ProjectQuery {
  featured?: boolean;
  /** Case-insensitive match on title and short description (FR-11). */
  q?: string;
  /** Skill id, filtering through the join table (FR-11). */
  skill?: string;
}

/** GET /projects */
export async function getProjects(query: ProjectQuery = {}): Promise<Project[]> {
  let results = published(mockProjects);

  if (query.featured) {
    results = results.filter((project) => project.featured);
  }

  if (query.skill) {
    results = results.filter((project) => project.skills.some((skill) => skill.id === query.skill));
  }

  if (query.q) {
    const term = query.q.trim().toLowerCase();
    results = results.filter(
      (project) =>
        project.title.toLowerCase().includes(term) ||
        project.shortDescription.toLowerCase().includes(term),
    );
  }

  return resolve(results);
}

/** GET /projects/:slug — resolves by slug, never by internal id (C3). */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const match = published(mockProjects).find((project) => project.slug === slug);
  return resolve(match ?? null);
}

/** GET /skills */
export async function getSkills(): Promise<Skill[]> {
  return resolve(mockSkills);
}

/** GET /experience — newest first, with displayOrder overriding date sorting. */
export async function getExperience(): Promise<Experience[]> {
  const sorted = [...mockExperience].sort((a, b) => a.displayOrder - b.displayOrder);
  return resolve(sorted);
}

/** GET /certifications — reverse-chronological by issue date (D3.1). */
export async function getCertifications(): Promise<Certification[]> {
  const sorted = [...mockCertifications].sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  return resolve(sorted);
}

/** GET /education — reverse-chronological (FR-07). */
export async function getEducation(): Promise<Education[]> {
  const sorted = [...mockEducation].sort((a, b) => b.startDate.localeCompare(a.startDate));
  return resolve(sorted);
}

/** GET /resume — the active version (FR-08). */
export async function getResume(): Promise<ResumeVersion | null> {
  return resolve(mockResume.isActive ? mockResume : null);
}

/** GET /settings */
export async function getSettings(): Promise<SiteSettings> {
  return resolve(mockSettings);
}

/**
 * POST /contact.
 *
 * Phase 2 has nowhere to persist a message, so this acknowledges without
 * storing. The form around it is complete — validation, states, honeypot — so
 * Phase 5 changes this body alone.
 */
export async function submitContact(_submission: ContactSubmission): Promise<void> {
  await resolve(null);
}
