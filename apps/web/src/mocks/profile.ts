import type {
  Certification,
  Education,
  Experience,
  ResumeVersion,
  SiteSettings,
} from '@/types/content';

/** PHASE 2 MOCK DATA — deleted at the Phase 3 exit gate (M3). */

export const mockExperience: Experience[] = [
  {
    id: 'ex-1',
    company: 'Narayana Group',
    role: 'Software Engineer',
    startDate: '2024-06-01',
    // Null end date — the current role. The timeline must render this correctly.
    endDate: null,
    summary:
      'Building and maintaining internal web applications across the front end and the API layer. Responsible for the delivery pipeline, environment separation and the review practices that keep changes reversible.',
    displayOrder: 1,
  },
  {
    id: 'ex-2',
    company: 'Independent',
    role: 'Full-Stack Developer',
    startDate: '2023-01-01',
    endDate: '2024-05-31',
    summary:
      'Designed and shipped small full-stack products end to end — relational modelling, REST API design, authentication and deployment — for clients who needed one person to own the whole path.',
    displayOrder: 2,
  },
  {
    id: 'ex-3',
    company: 'Freelance',
    role: 'Frontend Developer',
    startDate: '2022-03-01',
    endDate: '2022-12-31',
    summary:
      'Built responsive, accessible marketing sites and dashboards against existing design systems, with an emphasis on performance on mid-tier mobile connections.',
    displayOrder: 3,
  },
];

export const mockCertifications: Certification[] = [
  {
    id: 'ce-1',
    title: 'AWS Certified Cloud Practitioner',
    issuer: 'Amazon Web Services',
    issueDate: '2025-03-14',
    credentialUrl: 'https://example.com/credential/aws-ccp',
    credentialId: 'AWS-CCP-0001',
    imageUrl: null,
  },
  {
    id: 'ce-2',
    title: 'Meta Front-End Developer',
    issuer: 'Meta',
    issueDate: '2024-09-02',
    credentialUrl: 'https://example.com/credential/meta-fe',
    credentialId: 'META-FE-0002',
    imageUrl: null,
  },
  {
    // No credential URL and no image — both public pages must handle the gaps.
    id: 'ce-3',
    title: 'Relational Database Design',
    issuer: 'University Extension Programme',
    issueDate: '2023-11-20',
    credentialUrl: null,
    credentialId: null,
    imageUrl: null,
  },
];

export const mockEducation: Education[] = [
  {
    id: 'ed-1',
    institution: 'Osmania University',
    qualification: 'Bachelor of Technology',
    field: 'Computer Science and Engineering',
    startDate: '2018-08-01',
    endDate: '2022-05-31',
    summary:
      'Coursework across data structures, database systems, operating systems and software engineering. Final-year project on relational schema design for multi-tenant applications.',
  },
  {
    id: 'ed-2',
    institution: 'Narayana Junior College',
    qualification: 'Intermediate',
    field: 'Mathematics, Physics and Chemistry',
    startDate: '2016-06-01',
    endDate: '2018-04-30',
    summary: 'Pre-university programme with a mathematics and physical sciences specialisation.',
  },
];

export const mockResume: ResumeVersion = {
  id: 're-1',
  title: 'Resume — 2026',
  // Phase 5 replaces this with a signed Supabase Storage URL.
  fileUrl: '#',
  isActive: true,
  createdAt: '2026-01-15',
};

export const mockSettings: SiteSettings = {
  siteTitle: 'Abdullah Khan',
  tagline: 'Full-stack engineer — React, TypeScript, Node and PostgreSQL',
  bio: 'I build systems where the boundaries are deliberate: a public surface that only reads, an API that owns every rule, and a delivery pipeline that makes a bad release reversible in one action.\n\nMost of my work is the unglamorous middle of an application — the data model, the request lifecycle, the authorisation boundary and the tests that prove it holds. I care more about a system someone else can maintain than about the length of the stack list behind it.',
  emailPublic: 'hello@example.com',
  location: 'Hyderabad, India',
  socialLinks: [
    { label: 'GitHub', url: 'https://github.com/example' },
    { label: 'LinkedIn', url: 'https://linkedin.com/in/example' },
  ],
};
