import type {
  Certification,
  Education,
  Experience,
  Project,
  ProjectSkill,
  ResumeVersion,
  SiteSettings,
  Skill,
} from '@prisma/client';
import { BUCKET, resolveAssetUrl } from '../lib/storage.js';

/**
 * Maps database rows to the shapes the API promises.
 *
 * This layer exists so a column rename is not automatically a breaking API
 * change, and so storage paths become URLs exactly once, at response time (C3).
 * Internal fields — timestamps, storage paths, foreign keys — stop here.
 *
 * Dates are emitted as plain ISO dates (YYYY-MM-DD), not timestamps: these are
 * calendar dates, and a timezone on them is a source of off-by-one-day bugs.
 */

function toIsoDate(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

export interface SkillResponse {
  id: string;
  name: string;
  category: string;
  icon: string | null;
  proficiency: number | null;
}

export function toSkill(skill: Skill): SkillResponse {
  return {
    id: skill.id,
    name: skill.name,
    category: skill.category,
    icon: skill.icon,
    proficiency: skill.proficiency,
  };
}

export interface ProjectResponse {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  status: string;
  repoUrl: string | null;
  liveUrl: string | null;
  imageUrl: string | null;
  featured: boolean;
  skills: SkillResponse[];
}

type ProjectWithSkills = Project & { skills: Array<ProjectSkill & { skill: Skill }> };

export function toProject(project: ProjectWithSkills): ProjectResponse {
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    // Nullable in the database, but the UI always renders a string.
    shortDescription: project.shortDescription ?? '',
    description: project.description ?? '',
    status: project.status,
    repoUrl: project.repoUrl,
    liveUrl: project.liveUrl,
    imageUrl: resolveAssetUrl(BUCKET.images, project.imagePath),
    featured: project.featured,
    skills: project.skills.map((join) => toSkill(join.skill)),
  };
}

export interface ExperienceResponse {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string | null;
  summary: string;
  displayOrder: number;
}

export function toExperience(entry: Experience): ExperienceResponse {
  return {
    id: entry.id,
    company: entry.company,
    role: entry.role,
    startDate: toIsoDate(entry.startDate) ?? '',
    endDate: toIsoDate(entry.endDate),
    summary: entry.summary ?? '',
    displayOrder: entry.displayOrder,
  };
}

export interface CertificationResponse {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  credentialUrl: string | null;
  credentialId: string | null;
  imageUrl: string | null;
}

export function toCertification(certification: Certification): CertificationResponse {
  return {
    id: certification.id,
    title: certification.title,
    issuer: certification.issuer,
    issueDate: toIsoDate(certification.issueDate) ?? '',
    credentialUrl: certification.credentialUrl,
    credentialId: certification.credentialId,
    imageUrl: resolveAssetUrl(BUCKET.certificates, certification.imagePath),
  };
}

export interface EducationResponse {
  id: string;
  institution: string;
  qualification: string;
  field: string;
  startDate: string;
  endDate: string | null;
  summary: string;
}

export function toEducation(record: Education): EducationResponse {
  return {
    id: record.id,
    institution: record.institution,
    qualification: record.qualification,
    field: record.field,
    startDate: toIsoDate(record.startDate) ?? '',
    endDate: toIsoDate(record.endDate),
    summary: record.summary ?? '',
  };
}

export interface ResumeResponse {
  id: string;
  title: string;
  fileUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export function toResume(version: ResumeVersion): ResumeResponse {
  return {
    id: version.id,
    title: version.title,
    fileUrl: resolveAssetUrl(BUCKET.resume, version.storagePath),
    isActive: version.isActive,
    createdAt: toIsoDate(version.createdAt) ?? '',
  };
}

export interface SocialLink {
  label: string;
  url: string;
}

export interface SettingsResponse {
  siteTitle: string;
  tagline: string;
  bio: string;
  emailPublic: string;
  location: string;
  socialLinks: SocialLink[];
}

export function toSettings(settings: SiteSettings): SettingsResponse {
  return {
    siteTitle: settings.siteTitle,
    tagline: settings.tagline ?? '',
    bio: settings.bio ?? '',
    emailPublic: settings.emailPublic ?? '',
    location: settings.location ?? '',
    socialLinks: parseSocialLinks(settings.socialLinks),
  };
}

/**
 * socialLinks is a JSON column, so its contents are whatever was written there.
 * Anything not matching { label, url } is dropped rather than trusted into the
 * response — a malformed row should not break the whole settings request.
 */
function parseSocialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (entry): entry is SocialLink =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as SocialLink).label === 'string' &&
      typeof (entry as SocialLink).url === 'string',
  );
}
