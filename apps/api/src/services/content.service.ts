import { ProjectStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';
import {
  toCertification,
  toEducation,
  toExperience,
  toProject,
  toResume,
  toSettings,
  toSkill,
  type CertificationResponse,
  type EducationResponse,
  type ExperienceResponse,
  type ProjectResponse,
  type ResumeResponse,
  type SettingsResponse,
  type SkillResponse,
} from './serializers.js';

/**
 * Public read operations. The only layer that touches Prisma (D2 layering rule).
 *
 * Every query here is scoped to PUBLISHED content. There is no parameter that
 * widens it — an anonymous caller has no code path to a draft, which is a
 * property of this module rather than of the routes above it.
 */

/** Include clause shared by every project read, so list and detail agree. */
const withSkills = {
  skills: {
    include: { skill: true },
    orderBy: { skill: { name: 'asc' } },
  },
} as const;

export interface ProjectFilters {
  featured?: boolean;
  q?: string;
  skill?: string;
}

/** GET /projects */
export async function listProjects(filters: ProjectFilters = {}): Promise<ProjectResponse[]> {
  const projects = await prisma.project.findMany({
    where: {
      status: ProjectStatus.PUBLISHED,
      ...(filters.featured ? { featured: true } : {}),
      ...(filters.skill ? { skills: { some: { skillId: filters.skill } } } : {}),
      ...(filters.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: 'insensitive' } },
              { shortDescription: { contains: filters.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: withSkills,
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
  });

  return projects.map(toProject);
}

/** GET /projects/:slug — resolves by slug, never by internal id (C3). */
export async function getProjectBySlug(slug: string): Promise<ProjectResponse> {
  const project = await prisma.project.findFirst({
    where: { slug, status: ProjectStatus.PUBLISHED },
    include: withSkills,
  });

  if (!project) {
    throw notFound('No project exists at that address.');
  }

  return toProject(project);
}

/** GET /skills */
export async function listSkills(category?: string): Promise<SkillResponse[]> {
  const skills = await prisma.skill.findMany({
    ...(category ? { where: { category } } : {}),
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

  return skills.map(toSkill);
}

/** GET /experience — display order overrides date sorting (D3.1). */
export async function listExperience(): Promise<ExperienceResponse[]> {
  const entries = await prisma.experience.findMany({
    orderBy: [{ displayOrder: 'asc' }, { startDate: 'desc' }],
  });

  return entries.map(toExperience);
}

/** GET /certifications — reverse-chronological by issue date. */
export async function listCertifications(): Promise<CertificationResponse[]> {
  const certifications = await prisma.certification.findMany({
    orderBy: { issueDate: 'desc' },
  });

  return certifications.map(toCertification);
}

/** GET /education — reverse-chronological (FR-07). */
export async function listEducation(): Promise<EducationResponse[]> {
  const records = await prisma.education.findMany({
    orderBy: { startDate: 'desc' },
  });

  return records.map(toEducation);
}

/**
 * GET /resume — the active version (FR-08).
 *
 * Returns null rather than throwing: no published resume is an ordinary state
 * the page renders an empty view for, not an error.
 */
export async function getActiveResume(): Promise<ResumeResponse | null> {
  const version = await prisma.resumeVersion.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  return version ? toResume(version) : null;
}

/**
 * GET /settings — the singleton row.
 *
 * Falls back to a usable default rather than 404ing. The header and footer read
 * this on every page, and an unseeded database should not take the whole site
 * down with it.
 */
export async function getSettings(): Promise<SettingsResponse> {
  const settings = await prisma.siteSettings.findFirst();

  if (!settings) {
    return {
      siteTitle: 'Portfolio',
      tagline: '',
      bio: '',
      emailPublic: '',
      location: '',
      socialLinks: [],
    };
  }

  return toSettings(settings);
}
