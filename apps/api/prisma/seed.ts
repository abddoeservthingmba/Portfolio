import { PrismaClient, ProjectStatus } from '@prisma/client';

/**
 * Seeds the portfolio content.
 *
 * The content here tracks the published resume — currently the 10 September
 * 2026 version committed at `apps/api/assets/resume/`. When the resume changes,
 * this file changes with it, so the site and the PDF a recruiter downloads
 * never disagree about where someone worked or what a project contains.
 *
 * Idempotent: skills and projects are upserted on their natural keys, and the
 * reference lists are replaced wholesale. Running it twice does not duplicate
 * anything.
 *
 * NOTE: this replaces experience, certifications and education entirely, and
 * overwrites every field of a project it names. Content added through the admin
 * portal — a project with a slug not listed here, a skill not listed here —
 * survives, because nothing is deleted by slug or by name. Editing through the
 * portal is still the normal path; this is for changes large enough to want in
 * version control.
 *
 * Project cover images are the one exception: `imagePath` is set here, but the
 * bytes are uploaded by `scripts/publish-project-images.ts`. Run that first, or
 * the columns point at objects that do not exist yet.
 */
const prisma = new PrismaClient();

// --- Skills -----------------------------------------------------------------
// Categories mirror the groupings on the resume, since that is how they read.
// A few entries are not on the resume at all — Prisma, Vite, Vitest, Three.js —
// because they are what this site is built from, and a portfolio that hides its
// own stack is an odd thing.

const SKILLS = [
  { name: 'C#', category: 'Languages', proficiency: 5 },
  { name: 'TypeScript', category: 'Languages', proficiency: 5 },
  { name: 'JavaScript', category: 'Languages', proficiency: 4 },
  { name: 'SQL', category: 'Languages', proficiency: 5 },
  { name: 'PL/SQL', category: 'Languages', proficiency: 5 },
  { name: 'Python', category: 'Languages', proficiency: 3 },

  { name: 'Angular', category: 'Frontend', proficiency: 5 },
  { name: 'React', category: 'Frontend', proficiency: 4 },
  { name: 'Next.js', category: 'Frontend', proficiency: 4 },
  { name: 'React Native', category: 'Frontend', proficiency: 4 },
  { name: 'Expo', category: 'Frontend', proficiency: 4 },
  { name: 'Redux', category: 'Frontend', proficiency: 4 },
  { name: 'TanStack Query', category: 'Frontend', proficiency: 4 },
  { name: 'Zustand', category: 'Frontend', proficiency: 4 },
  { name: 'RxJS', category: 'Frontend', proficiency: 4 },
  { name: 'HTML5', category: 'Frontend', proficiency: 5 },
  { name: 'CSS3', category: 'Frontend', proficiency: 4 },
  { name: 'Tailwind CSS', category: 'Frontend', proficiency: 4 },
  { name: 'Bootstrap', category: 'Frontend', proficiency: 4 },
  { name: 'Three.js', category: 'Frontend', proficiency: 3 },

  { name: 'ASP.NET Core', category: 'Backend', proficiency: 5 },
  { name: '.NET', category: 'Backend', proficiency: 5 },
  { name: 'REST APIs', category: 'Backend', proficiency: 5 },
  { name: 'Dependency Injection', category: 'Backend', proficiency: 4 },
  { name: 'Quartz.NET', category: 'Backend', proficiency: 4 },
  { name: 'Swagger / OpenAPI', category: 'Backend', proficiency: 4 },
  { name: 'Node.js', category: 'Backend', proficiency: 4 },
  { name: 'Express', category: 'Backend', proficiency: 4 },
  { name: 'Fastify', category: 'Backend', proficiency: 4 },
  { name: 'Zod', category: 'Backend', proficiency: 4 },
  { name: 'JWT', category: 'Backend', proficiency: 4 },
  { name: 'argon2id', category: 'Backend', proficiency: 4 },

  { name: 'Oracle Database', category: 'Database', proficiency: 5 },
  { name: 'Dapper', category: 'Database', proficiency: 4 },
  { name: 'Query Optimisation', category: 'Database', proficiency: 4 },
  { name: 'PostgreSQL', category: 'Database', proficiency: 4 },
  { name: 'Prisma', category: 'Database', proficiency: 4 },
  { name: 'Drizzle ORM', category: 'Database', proficiency: 4 },
  { name: 'MongoDB', category: 'Database', proficiency: 3 },

  { name: 'Google Cloud Storage', category: 'Cloud & Storage', proficiency: 4 },
  { name: 'AWS S3', category: 'Cloud & Storage', proficiency: 4 },
  { name: 'Cloudflare R2', category: 'Cloud & Storage', proficiency: 3 },
  { name: 'Supabase', category: 'Cloud & Storage', proficiency: 4 },
  { name: 'Vercel', category: 'Cloud & Storage', proficiency: 4 },
  { name: 'Render', category: 'Cloud & Storage', proficiency: 4 },
  { name: 'Netlify', category: 'Cloud & Storage', proficiency: 4 },

  { name: 'Git', category: 'Tools & Delivery', proficiency: 5 },
  { name: 'GitLab', category: 'Tools & Delivery', proficiency: 4 },
  { name: 'GitHub Actions', category: 'Tools & Delivery', proficiency: 4 },
  { name: 'YAML CI/CD', category: 'Tools & Delivery', proficiency: 4 },
  { name: 'SonarQube', category: 'Tools & Delivery', proficiency: 4 },
  { name: 'Postman', category: 'Tools & Delivery', proficiency: 4 },
  { name: 'Capacitor', category: 'Tools & Delivery', proficiency: 3 },
  { name: 'Vite', category: 'Tools & Delivery', proficiency: 4 },
  { name: 'Vitest', category: 'Tools & Delivery', proficiency: 4 },
  { name: 'IIS', category: 'Tools & Delivery', proficiency: 3 },
  { name: 'Agile / Scrum', category: 'Tools & Delivery', proficiency: 4 },
];

// --- Projects ---------------------------------------------------------------
// Two kinds sit in one list. The enterprise contributions carry no repository
// or live URL, because the work belongs to an employer and there is nothing
// public to link at. The side projects carry both, and a cover screenshot.
//
// `imagePath` names an object in the `images` bucket, uploaded by
// scripts/publish-project-images.ts. A project without one gets generated cover
// art instead — see apps/web/src/features/projects/coverArt.ts.

const PROJECTS = [
  {
    title: 'Ascension',
    slug: 'ascension-training-log',
    shortDescription:
      'A gamified cross-platform training log — Fastify and PostgreSQL behind an Expo client, with every calculation isolated in a pure, fully covered domain package.',
    description:
      'A training log that runs on Android and the web from one Expo codebase, built as a pnpm monorepo. An Expo client sits in front of a Fastify API over PostgreSQL, and the two are separated by a rule the whole design rests on: every piece of business arithmetic — volume, progression, streaks, quest completion — lives in a pure domain package that imports neither the database nor the framework.\n\nThat isolation is what makes the numbers trustworthy. 21 pure modules, 562 tests and 100% branch coverage enforced as a CI gate, all of it in fixed-point integers rather than floats, because a training total that drifts by a rounding error is a bug nobody reports and everybody notices. Because the package depends on nothing, its tests run in milliseconds and cannot be made to pass by a mock that quietly disagrees with production. The API and the client both consume it, so a figure shown on a phone and the same figure computed on the server come from one implementation rather than two that drift.\n\nThe surface is deliberately large for a single-operator product: 29 screens, 76 endpoints and a 27-table PostgreSQL schema over 13 forward-only migrations, covering the exercise catalogue, workouts and sets, routines, history, progress and insights, nutrition and health, and a progression layer of quests and status. Zod schemas are shared as the API contract, so the client and the server cannot disagree about a payload shape without the build saying so. Writes are optimistic on the client and reconciled against the server, so logging a set during a session never waits on a network round trip. Exercises and routines are archived rather than hard-deleted, because a training history that silently loses its own past is worse than useless.\n\nThe account layer is built to the same standard as the arithmetic: argon2id password hashing, 15-minute access tokens, rotating refresh tokens with family revoke on reuse, and 404-over-403 responses so a stranger cannot enumerate which ids exist. The Android build asks for 11 permissions rather than the 28 the toolchain defaults to. Delivery is five GitHub Actions jobs, migrations that run before Render admits traffic, and a hash-pinned Content-Security-Policy verified on every web deploy.',
    repoUrl: 'https://github.com/abddoeservthingmba/FitnelliSense',
    liveUrl: 'https://ascensionandbeyond.netlify.app',
    imagePath: 'projects/ascension.webp',
    featured: true,
    skills: [
      'React Native',
      'Expo',
      'Fastify',
      'PostgreSQL',
      'Drizzle ORM',
      'TypeScript',
      'Zod',
      'argon2id',
      'JWT',
      'REST APIs',
      'GitHub Actions',
    ],
  },
  {
    title: 'Audiophilic',
    slug: 'audiophilic',
    shortDescription:
      'A music player on Next.js 16 and React 19 — Howler.js playback, Spotify Web Playback SDK, and a theme derived from whatever album is on screen.',
    description:
      'A music player built as one TypeScript codebase that ships to the web and to Android. Playback runs on Howler.js for local and streamed audio and on the Spotify Web Playback SDK for a connected account; Zustand holds the player state, which is the part of a music app most likely to become a tangle of effects if it lives in component state.\n\nThe interface takes its colour from the music rather than from a fixed palette. The theme is derived from the current album artwork, so the surface shifts as the queue moves — a small idea that only works if the extraction is cheap enough to run on every track change and constrained enough that the result is still readable.\n\nThe Android build comes out of the same source through Capacitor, so there is no second implementation to keep in step. Delivery is GitHub Actions into Vercel, with ESLint and Tailwind CSS 4 in the pipeline.',
    repoUrl: 'https://github.com/abddoeservthingmba/Audiophilic',
    liveUrl: 'https://audiophilic-gules.vercel.app',
    imagePath: 'projects/audiophilic.webp',
    featured: true,
    skills: [
      'Next.js',
      'React',
      'TypeScript',
      'Zustand',
      'Capacitor',
      'Tailwind CSS',
      'GitHub Actions',
      'Vercel',
    ],
  },
  {
    title: 'Portfolio CMS',
    slug: 'portfolio-cms',
    shortDescription:
      'This site: a public React portfolio and a private admin portal over one content layer, so updates need no redeploy.',
    description:
      'A static portfolio is cheap to build and expensive to keep truthful. Every certification, finished project and change of role means a code edit, a commit and a deploy — so the portfolio stops being updated within months of going live.\n\nThis splits the site into two surfaces over one data layer. The public site is a React and TypeScript application that reads content through a versioned REST API. The private admin portal is an authenticated CRUD interface over the same data. Content lives in PostgreSQL and object storage; presentation lives in code.\n\nThe interesting part is the boundary. Supabase supplies the database, the identity provider and the object store, while Express owns every piece of business logic, validation and authorisation — privileged keys never reach the browser, and the public surface has no code path that writes. Row level security is enabled on every table with no policies at all, which closes Supabase’s auto-generated REST API to the anon key compiled into the bundle, leaving the Express API as the only route to the data.\n\nAdding a project became a form submission rather than a release.',
    repoUrl: 'https://github.com/abddoeservthingmba/Portfolio',
    liveUrl: 'https://sulthanabdullah.com',
    imagePath: 'projects/portfolio-cms.webp',
    featured: true,
    skills: [
      'TypeScript',
      'React',
      'Tailwind CSS',
      'Three.js',
      'Node.js',
      'Express',
      'Prisma',
      'PostgreSQL',
      'Supabase',
      'REST APIs',
      'SQL',
      'Netlify',
      'Render',
      'Vite',
      'Vitest',
      'GitHub Actions',
    ],
  },
  {
    title: 'Employee Self-Service Platform',
    slug: 'employee-self-service-platform',
    shortDescription:
      'Business-critical modules for employee workflows, approvals and document handling, across Angular, ASP.NET Core and Oracle.',
    description:
      'An enterprise Employee Self-Service platform covering the workflows staff use directly — requests, approvals, document handling and the backend integrations underneath them. Six modules, and 342 delivered work items across them: 254 tasks, 28 stories and 60 defects, each one owned end to end from schema through API to screen.\n\nThe centrepiece is a multi-stage approval engine. Stages can be inserted into a live route rather than being fixed at design time, routing spans five approver levels, and the history is append-only — an approval trail that can be edited is not a trail. Record lifecycles run on Quartz.NET schedulers: timed transitions, escalation when a stage goes unanswered, reminders, and auto-extension with a bound on it so nothing extends forever without a human deciding.\n\nThe rest is the unglamorous middle. Claim amounts are computed server-side from geospatial coordinates, tiered rate tables and grade eligibility rules, because a figure calculated in a browser is a figure a browser can change. Bulk spreadsheet ingestion validates row by row and reports a status per record, replacing a batch result that told you only that something, somewhere, had failed.\n\nMost of the delivery happened alongside the people who would use it — clarifying requirements with business stakeholders, translating workflows into technical designs, then carrying features through QA, UAT and release sign-off across six module rollouts.',
    repoUrl: null,
    liveUrl: null,
    imagePath: null,
    featured: false,
    skills: [
      'Angular',
      'ASP.NET Core',
      'Oracle Database',
      'Dapper',
      'PL/SQL',
      'Quartz.NET',
      'REST APIs',
    ],
  },
  {
    title: 'Legacy Modernisation: WCF and VB.NET to ASP.NET Core',
    slug: 'legacy-modernisation-aspnet-core',
    shortDescription:
      'Migrated legacy VB.NET and WCF services into maintainable C# and ASP.NET Core, with cleaner APIs and dependency injection.',
    description:
      'Legacy VB.NET modules and WCF-based services were increasingly difficult to support and no longer matched the enterprise architecture around them.\n\nThe modernisation moved that functionality into C# and ASP.NET Core: cleaner contracts, constructor injection in place of hand-wired construction, and code that could be reasoned about by anyone on the team rather than only by whoever last touched it.\n\nThe same programme included platform upgrades in step — three Angular majors, 8 through 12 to 18, and three .NET versions, 5 through 7 to 9 — clearing RxJS, routing and build breakages at each hop. Without that, the modernisation would have moved old code onto a stack that was itself falling behind.\n\nAlongside it, nine production incidents were traced through execution plan analysis and closed with covering indexes on the high-cardinality query paths that were causing them.',
    repoUrl: null,
    liveUrl: null,
    imagePath: null,
    featured: false,
    skills: ['C#', 'ASP.NET Core', '.NET', 'REST APIs', 'Dependency Injection', 'Angular'],
  },
  {
    title: 'Reusable Angular Component Library',
    slug: 'reusable-angular-component-library',
    shortDescription:
      'Replaced licensed vendor controls with reusable Angular components, dropping a commercial UI licence and the dependency risk with it.',
    description:
      'Grid and form screens across the application depended on a commercial control suite. That concentrated risk in a third-party library, made upgrades awkward, cost a licence every year, and left behaviour inconsistent between modules built at different times.\n\nRebuilding those patterns as reusable Angular components standardised the behaviour, removed repeated code, and let the licence be dropped altogether. Framework upgrades became a smaller exercise too — there is one implementation to check rather than a vendor control embedded in every screen.',
    repoUrl: null,
    liveUrl: null,
    imagePath: null,
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
    imagePath: null,
    featured: false,
    skills: ['Google Cloud Storage', 'AWS S3', 'ASP.NET Core', 'REST APIs'],
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
      'Deliver enterprise Employee Self-Service and internal business applications end to end — schema, stored procedures, REST APIs and front end — on Angular, ASP.NET Core and Oracle PL/SQL. 342 work items across six modules: 254 tasks, 28 stories and 60 defects.\n\nArchitected a multi-stage approval engine with insertable stages, routing across five approver levels and append-only audit history, and automated record lifecycles with Quartz.NET schedulers — timed transitions, escalation, reminders and bounded auto-extension. Computed claim amounts server-side from geospatial coordinates, tiered rate tables and grade eligibility rules, and replaced an opaque batch importer with bulk spreadsheet ingestion that validates row by row and reports a status per record.\n\nModernised VB.NET and WCF services into C# and ASP.NET Core with clean contracts and constructor injection, migrated three Angular majors (8 to 18) and three .NET versions (5 to 9), and dropped a commercial UI licence by rebuilding grid and form screens as reusable Angular components. Resolved nine production incidents through execution plan analysis, adding covering indexes on the query paths responsible.\n\nRuns merge request reviews, YAML CI/CD pipelines and SonarQube quality gates, and partners with business stakeholders and QA through requirement analysis, UAT and release sign-off across six module rollouts.',
    displayOrder: 1,
  },
  {
    company: 'Zentek Infosoft Consulting Pvt Ltd',
    role: 'Software Development Intern',
    startDate: new Date('2023-06-01'),
    endDate: new Date('2023-10-31'),
    summary:
      'Shipped four projects in five months across React.js, Redux and the MERN stack.\n\nBuilt iNotebook, a MERN note-taking application with multi-user accounts, credential authentication and per-user CRUD — the first time the whole path from login to owned data was mine to design rather than to consume.\n\nWired a banking interface to Redux, and built a 3D client site UI in JavaScript, HTML and CSS.',
    displayOrder: 2,
  },
];

// --- Certifications ---------------------------------------------------------

const CERTIFICATIONS = [
  {
    title: 'Career Essentials in Generative AI',
    issuer: 'Microsoft & LinkedIn',
    // No month given on the resume; recorded as the year it was completed.
    issueDate: new Date('2024-01-01'),
    credentialUrl:
      'https://www.linkedin.com/learning/certificates/9f5622dafa9c2931bf36a0f27ed7cdda776d9cee6653b2babd247591394dba5b',
    credentialId: null,
  },
  {
    title: 'Foundational C# with Microsoft',
    issuer: 'FreeCodeCamp',
    issueDate: new Date('2023-01-01'),
    credentialUrl:
      'https://freecodecamp.org/certification/SulthanAbdullahkhan/foundational-c-sharp-with-microsoft',
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
  tagline: 'Full stack engineer — Angular, ASP.NET Core and Oracle PL/SQL',
  bio: 'Full-stack software engineer with three years building, modernising and supporting enterprise web applications — Angular and ASP.NET Core on top of Oracle, delivered through the whole cycle from requirement analysis to production support.\n\nMost of my work has been the unglamorous middle of an application: the approval engine, the scheduled job, the data access layer, the legacy module that has to become maintainable without anyone noticing an outage. I have architected a multi-stage approval workflow with append-only audit history, automated record lifecycles on Quartz.NET, modernised VB.NET and WCF services into C# and ASP.NET Core, and carried three Angular majors and three .NET versions forward without stalling delivery.\n\nOutside that, I ship side projects to production rather than to a repository — a cross-platform training log on Fastify, PostgreSQL and Expo whose arithmetic lives in a pure, fully covered domain package, and this site, which is a CMS rather than a static page so it stays true without a redeploy.\n\nI care more about a system someone else can maintain than about the length of the stack list behind it.',
  emailPublic: 'ashishkhan19062001@gmail.com',
  location: 'Hyderabad, India',
  socialLinks: [
    { label: 'GitHub', url: 'https://github.com/abddoeservthingmba' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/abdullah-khan-425b16230' },
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
