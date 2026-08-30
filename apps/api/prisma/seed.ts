import { PrismaClient, ProjectStatus } from '@prisma/client';

/**
 * Seeds the portfolio content.
 *
 * Idempotent: skills and projects are upserted on their natural keys, and the
 * reference lists are replaced wholesale. Running it twice does not duplicate
 * anything.
 *
 * NOTE: this replaces experience, certifications and education entirely. Once
 * you are managing content through the admin portal, editing there is the way
 * to change it — re-running this would overwrite that work.
 */
const prisma = new PrismaClient();

// --- Skills -----------------------------------------------------------------
// Categories mirror the groupings on the resume, since that is how they read.

const SKILLS = [
  { name: 'C#', category: 'Languages', proficiency: 5 },
  { name: 'TypeScript', category: 'Languages', proficiency: 4 },
  { name: 'JavaScript', category: 'Languages', proficiency: 4 },
  { name: 'SQL', category: 'Languages', proficiency: 5 },
  { name: 'PL/SQL', category: 'Languages', proficiency: 5 },

  { name: 'Angular', category: 'Frontend', proficiency: 5 },
  { name: 'RxJS', category: 'Frontend', proficiency: 4 },
  { name: 'HTML5', category: 'Frontend', proficiency: 5 },
  { name: 'CSS3', category: 'Frontend', proficiency: 4 },
  { name: 'Bootstrap', category: 'Frontend', proficiency: 4 },

  { name: 'ASP.NET Core', category: 'Backend', proficiency: 5 },
  { name: '.NET', category: 'Backend', proficiency: 5 },
  { name: 'REST APIs', category: 'Backend', proficiency: 5 },
  { name: 'Dependency Injection', category: 'Backend', proficiency: 4 },
  { name: 'Quartz.NET', category: 'Backend', proficiency: 4 },
  { name: 'Swagger / OpenAPI', category: 'Backend', proficiency: 4 },

  { name: 'Oracle Database', category: 'Database', proficiency: 5 },
  { name: 'Dapper', category: 'Database', proficiency: 4 },
  { name: 'Query Optimisation', category: 'Database', proficiency: 4 },

  { name: 'Google Cloud Storage', category: 'Cloud & Storage', proficiency: 4 },
  { name: 'AWS S3', category: 'Cloud & Storage', proficiency: 4 },

  { name: 'GitLab', category: 'Tools & Delivery', proficiency: 4 },
  { name: 'YAML CI/CD', category: 'Tools & Delivery', proficiency: 4 },
  { name: 'SonarQube', category: 'Tools & Delivery', proficiency: 4 },
  { name: 'Postman', category: 'Tools & Delivery', proficiency: 4 },
  { name: 'IIS', category: 'Tools & Delivery', proficiency: 3 },
  { name: 'Agile / Scrum', category: 'Tools & Delivery', proficiency: 4 },
];

// --- Projects ---------------------------------------------------------------
// Drawn from the enterprise contributions on the resume. These are workplace
// deliverables, so they carry no repository or live URL — only the Portfolio
// CMS does, because it is the one that is publicly available.

const PROJECTS = [
  {
    title: 'Employee Self-Service Platform',
    slug: 'employee-self-service-platform',
    shortDescription:
      'Business-critical modules for employee workflows, approvals and document handling, across Angular, ASP.NET Core and Oracle.',
    description:
      'An enterprise Employee Self-Service platform covering the workflows staff use directly — requests, approvals, document handling and the backend integrations underneath them.\n\nThe work spanned the full stack: Angular on the front end, ASP.NET Core services in the middle, and Oracle PL/SQL packages and Dapper-based data access for the high-volume transactional paths. Recurring processes run as scheduled Quartz.NET background jobs rather than being triggered by hand.\n\nMost of the delivery happened alongside the people who would use it — clarifying requirements with business stakeholders, translating workflows into technical designs, then carrying features through QA, UAT and production release.',
    repoUrl: null,
    liveUrl: null,
    featured: true,
    skills: ['Angular', 'ASP.NET Core', 'Oracle Database', 'Dapper', 'PL/SQL', 'Quartz.NET'],
  },
  {
    title: 'Legacy Modernisation: WCF and VB.NET to ASP.NET Core',
    slug: 'legacy-modernisation-aspnet-core',
    shortDescription:
      'Migrated legacy VB.NET and WCF services into maintainable C# and ASP.NET Core, with cleaner APIs and dependency injection.',
    description:
      'Legacy VB.NET modules and WCF-based services were increasingly difficult to support and no longer matched the enterprise architecture around them.\n\nThe modernisation moved that functionality into C# and ASP.NET Core: cleaner API surfaces, dependency injection in place of hand-wired construction, and code that could be reasoned about by anyone on the team rather than only by whoever last touched it.\n\nThe same programme included platform upgrades in step — Angular 8 through 12 to 18, and .NET 5 through 7 to 9 — so the modernisation did not simply move old code onto a stack that was itself falling behind.',
    repoUrl: null,
    liveUrl: null,
    featured: true,
    skills: ['C#', 'ASP.NET Core', '.NET', 'REST APIs', 'Dependency Injection'],
  },
  {
    title: 'Reusable Angular Component Library',
    slug: 'reusable-angular-component-library',
    shortDescription:
      'Replaced Syncfusion-dependent screens with reusable Angular components, cutting third-party dependency risk.',
    description:
      'Screens across the application depended on Syncfusion controls. That concentrated risk in a third-party library, made upgrades awkward, and left behaviour inconsistent between modules built at different times.\n\nReplacing those patterns with a set of reusable Angular components standardised the behaviour, removed repeated code, and made framework upgrades a smaller exercise — there was one implementation to check rather than a vendor control embedded in every screen.',
    repoUrl: null,
    liveUrl: null,
    featured: false,
    skills: ['Angular', 'TypeScript', 'RxJS', 'CSS3', 'Bootstrap'],
  },
  {
    title: 'Secure Cloud Storage Integration',
    slug: 'secure-cloud-storage-integration',
    shortDescription:
      'Enterprise document upload and retrieval built on Google Cloud Storage and AWS S3, with secure access patterns.',
    description:
      'Enterprise document workflows needed somewhere durable to keep files, and a way to hand them back to the right person without exposing the store itself.\n\nThe implementation covers upload, retrieval and management across Google Cloud Storage and AWS S3, using secure access patterns so that credentials stay server-side and clients never hold a key that would let them reach the bucket directly.\n\nIt sits alongside token-based SSO flows and the secure API communication patterns used for authentication, authorisation and downstream service access.',
    repoUrl: null,
    liveUrl: null,
    featured: false,
    skills: ['Google Cloud Storage', 'AWS S3', 'ASP.NET Core', 'REST APIs'],
  },
  {
    title: 'Portfolio CMS',
    slug: 'portfolio-cms',
    shortDescription:
      'This site: a public React portfolio and a private admin portal over one content layer, so updates need no redeploy.',
    description:
      'A static portfolio is cheap to build and expensive to keep truthful. Every certification, finished project and change of role means a code edit, a commit and a deploy — so the portfolio stops being updated within months of going live.\n\nThis splits the site into two surfaces over one data layer. The public site is a React and TypeScript application that reads content through a versioned REST API. The private admin portal is an authenticated CRUD interface over the same data. Content lives in PostgreSQL and object storage; presentation lives in code.\n\nThe interesting part is the boundary. Supabase supplies the database, the identity provider and the object store, while Express owns every piece of business logic, validation and authorisation — privileged keys never reach the browser, and the public surface has no code path that writes. Adding a project became a form submission rather than a release.',
    repoUrl: 'https://github.com/abddoeservthingmba/Portfolio',
    liveUrl: null,
    featured: true,
    skills: ['TypeScript', 'REST APIs', 'SQL'],
  },
];

// --- Experience -------------------------------------------------------------

const EXPERIENCE = [
  {
    company: 'Greater Than Educational Technologies Pvt Ltd',
    role: 'Associate Software Engineer',
    startDate: new Date('2023-11-01'),
    // Null end date — the current role.
    endDate: null,
    summary:
      'Develop and enhance enterprise Employee Self-Service and internal business applications using Angular, ASP.NET Core, Oracle PL/SQL, Dapper and REST APIs. Modernised legacy VB.NET and WCF services into C# and ASP.NET Core, and carried platform upgrades across Angular 8/12/18 and .NET 5/7/9.\n\nBuilt and maintained Oracle PL/SQL packages, stored procedures and Dapper data access layers for high-volume transactional workflows, and implemented scheduled background jobs with Quartz.NET. Integrated token-based SSO and secure API communication, and built document upload and retrieval on Google Cloud Storage and AWS S3.\n\nWork spans the full SDLC: clarifying requirements with business stakeholders, delivering through QA and UAT to production release, supporting production incidents through root cause analysis, and participating in GitLab merge reviews, YAML CI/CD pipelines and SonarQube quality checks. Mentors junior developers on Angular, ASP.NET Core, Oracle SQL/PL-SQL and code review practice.',
    displayOrder: 1,
  },
];

// --- Certifications ---------------------------------------------------------

const CERTIFICATIONS = [
  {
    title: 'Career Essentials in Generative AI',
    issuer: 'Microsoft & LinkedIn',
    // No month given on the resume; recorded as the year it was completed.
    issueDate: new Date('2024-01-01'),
    credentialUrl: null,
    credentialId: null,
  },
  {
    title: 'Foundational C# with Microsoft',
    issuer: 'FreeCodeCamp',
    issueDate: new Date('2023-01-01'),
    credentialUrl: null,
    credentialId: null,
  },
];

// --- Education --------------------------------------------------------------

const EDUCATION = [
  {
    institution: 'The ICFAI Foundation for Higher Education, Hyderabad',
    qualification: 'Master of Business Administration',
    field: 'Finance',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2026-12-31'),
    summary: 'CGPA 6.45.',
  },
  {
    institution: 'JNTU Hyderabad, Telangana',
    qualification: 'Integrated M.Sc. Aviation',
    field: 'Global Distribution Systems',
    startDate: new Date('2018-01-01'),
    endDate: new Date('2023-12-31'),
    summary: '72%.',
  },
];

// --- Site settings ----------------------------------------------------------

const SETTINGS = {
  siteTitle: 'Sulthan Abdullah Khan',
  tagline: 'Associate Software Engineer — Angular, ASP.NET Core, Oracle and REST APIs',
  bio: 'Full-stack software engineer with three years building, modernising and supporting enterprise web applications — Angular and ASP.NET Core on top of Oracle, delivered through the whole cycle from requirement analysis to production support.\n\nMost of my work has been the unglamorous middle of an application: the data access layer, the API surface, the background jobs, and the legacy modules that need to become maintainable without anyone noticing an outage. I have modernised VB.NET and WCF services into C# and ASP.NET Core, replaced vendor UI controls with reusable components, and built secure document workflows on Google Cloud Storage and AWS S3.\n\nI care more about a system someone else can maintain than about the length of the stack list behind it.',
  emailPublic: 'ashishkhan19062001@gmail.com',
  location: 'Hyderabad, India',
  socialLinks: [
    { label: 'GitHub', url: 'https://github.com/abddoeservthingmba' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/sulthan-abdullah-khan' },
  ],
};

async function main() {
  console.log('Seeding…');

  for (const skill of SKILLS) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: { category: skill.category, proficiency: skill.proficiency },
      create: skill,
    });
  }
  console.log(`  skills: ${SKILLS.length}`);

  const skillIdByName = new Map(
    (await prisma.skill.findMany({ select: { id: true, name: true } })).map((s) => [s.name, s.id]),
  );

  const idFor = (name: string): string => {
    const id = skillIdByName.get(name);
    if (!id) throw new Error(`Seed references an unknown skill: ${name}`);
    return id;
  };

  for (const { skills, ...project } of PROJECTS) {
    const saved = await prisma.project.upsert({
      where: { slug: project.slug },
      update: { ...project, status: ProjectStatus.PUBLISHED },
      create: { ...project, status: ProjectStatus.PUBLISHED },
    });

    // Reconcile tags rather than appending, so re-running does not accumulate.
    await prisma.projectSkill.deleteMany({ where: { projectId: saved.id } });
    await prisma.projectSkill.createMany({
      data: skills.map((name) => ({ projectId: saved.id, skillId: idFor(name) })),
    });
  }
  console.log(`  projects: ${PROJECTS.length}`);

  await prisma.experience.deleteMany();
  await prisma.experience.createMany({ data: EXPERIENCE });
  console.log(`  experience: ${EXPERIENCE.length}`);

  await prisma.certification.deleteMany();
  await prisma.certification.createMany({ data: CERTIFICATIONS });
  console.log(`  certifications: ${CERTIFICATIONS.length}`);

  await prisma.education.deleteMany();
  await prisma.education.createMany({ data: EDUCATION });
  console.log(`  education: ${EDUCATION.length}`);

  const existingSettings = await prisma.siteSettings.findFirst();
  if (existingSettings) {
    await prisma.siteSettings.update({ where: { id: existingSettings.id }, data: SETTINGS });
  } else {
    await prisma.siteSettings.create({ data: SETTINGS });
  }
  console.log('  site settings: 1');

  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
