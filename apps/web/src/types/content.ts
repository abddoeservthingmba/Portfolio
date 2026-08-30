/**
 * The shapes the public site renders. These mirror the D3 entity definitions,
 * so when Phase 3 replaces the mock source with real API responses the
 * components consuming them do not change.
 *
 * Dates arrive as ISO date strings, not Date objects — that is what JSON
 * carries, and parsing belongs at the point of formatting.
 */

export type ProjectStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Skill {
  id: string;
  name: string;
  category: string;
  icon: string | null;
  proficiency: number | null;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  status: ProjectStatus;
  repoUrl: string | null;
  liveUrl: string | null;
  imageUrl: string | null;
  featured: boolean;
  skills: Skill[];
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  /** Null denotes a current role (D3.1). */
  endDate: string | null;
  summary: string;
  displayOrder: number;
}

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  credentialUrl: string | null;
  credentialId: string | null;
  imageUrl: string | null;
}

export interface Education {
  id: string;
  institution: string;
  qualification: string;
  field: string;
  startDate: string;
  endDate: string | null;
  summary: string;
}

export interface ResumeVersion {
  id: string;
  title: string;
  fileUrl: string;
  isActive: boolean;
  createdAt: string;
}

export interface SocialLink {
  label: string;
  url: string;
}

export interface SiteSettings {
  siteTitle: string;
  tagline: string;
  bio: string;
  emailPublic: string;
  location: string;
  socialLinks: SocialLink[];
}

/** What the contact form submits (D4 POST /contact). */
export interface ContactSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;
}
