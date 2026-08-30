import { PrismaClient, ProjectStatus } from '@prisma/client';

/**
 * Seeds representative content so the public pages have something realistic to
 * render (Phase 3, step 5).
 *
 * Idempotent: every write is an upsert on a natural key, so running it twice
 * does not duplicate rows and re-running after a schema change is safe.
 */
const prisma = new PrismaClient();

const SKILLS = [
  { name: 'TypeScript', category: 'Languages', proficiency: 5 },
  { name: 'JavaScript', category: 'Languages', proficiency: 5 },
  { name: 'SQL', category: 'Languages', proficiency: 4 },
  { name: 'Python', category: 'Languages', proficiency: 3 },

  { name: 'React', category: 'Frontend', proficiency: 5 },
  { name: 'Vite', category: 'Frontend', proficiency: 4 },
  { name: 'Tailwind CSS', category: 'Frontend', proficiency: 4 },
  { name: 'React Router', category: 'Frontend', proficiency: 4 },

  { name: 'Node.js', category: 'Backend', proficiency: 5 },
  { name: 'Express', category: 'Backend', proficiency: 4 },
  { name: 'Prisma', category: 'Backend', proficiency: 4 },
  { name: 'Zod', category: 'Backend', proficiency: 4 },

  { name: 'PostgreSQL', category: 'Data', proficiency: 4 },
  { name: 'Supabase', category: 'Data', proficiency: 3 },

  { name: 'GitHub Actions', category: 'Delivery', proficiency: 4 },
  { name: 'Netlify', category: 'Delivery', proficiency: 3 },
  { name: 'Render', category: 'Delivery', proficiency: 3 },
  { name: 'Vitest', category: 'Delivery', proficiency: 4 },
  // Deliberately null — the public page must handle a missing proficiency.
  { name: 'Docker', category: 'Delivery', proficiency: null },
];

const PROJECTS = [
  {
    title: 'Portfolio CMS',
    slug: 'portfolio-cms',
    shortDescription:
      'A two-surface portfolio platform: a public React site and a private admin portal over one content layer.',
    description:
      'A static portfolio is cheap to build and expensive to keep truthful. Every certification, finished project and change of role means a code edit, a commit and a deploy — so the portfolio stops being updated within months.\n\nPortfolio CMS splits the site into two surfaces over one data layer. The public site is a fast, SEO-friendly React application that reads content through a versioned REST API. The private admin portal is an authenticated CRUD interface over the same data. Content lives in PostgreSQL and object storage; presentation lives in code.\n\nThe interesting parts are the boundaries: Supabase supplies the database, identity and object store, while Express owns every piece of business logic, validation and authorisation. Privileged keys never reach the browser. Adding a project became a form submission rather than a release.',
    repoUrl: 'https://github.com/abddoeservthingmba/Portfolio',
    liveUrl: null,
    featured: true,
    skills: ['TypeScript', 'React', 'Node.js', 'Express', 'Prisma', 'PostgreSQL'],
  },
  {
    title: 'Release Health Dashboard',
    slug: 'release-health-dashboard',
    shortDescription:
      'A single screen showing whether the last deploy is healthy, built for people who do not read logs.',
    description:
      'Deployment failures were being discovered by users rather than by the team. The pipeline reported success as soon as the build finished, which said nothing about whether the running service actually worked.\n\nThis dashboard polls health endpoints across environments and renders one unambiguous state per service, with the last five deploys and their outcomes underneath. The design constraint was that it had to be readable from across a room, which ruled out most of the chart types that felt natural at first.',
    repoUrl: 'https://github.com/example/release-health',
    liveUrl: 'https://example.com/release-health',
    featured: true,
    skills: ['TypeScript', 'React', 'Node.js', 'GitHub Actions'],
  },
  {
    title: 'Schema Diff Tool',
    slug: 'schema-diff-tool',
    shortDescription:
      'Compares a Prisma schema against a live database and reports the drift as a readable summary.',
    description:
      'Schema drift between environments is usually discovered during an incident. This tool introspects a live database, compares it against the committed schema, and prints the difference in the order a reviewer would want it: destructive changes first, additive ones last.\n\nIt deliberately does not fix anything. Generating a corrective migration automatically is how a tool ends up dropping a column at three in the morning.',
    repoUrl: 'https://github.com/example/schema-diff',
    liveUrl: null,
    featured: false,
    skills: ['TypeScript', 'Prisma', 'PostgreSQL', 'SQL'],
  },
  {
    title: 'Contact Abuse Filter',
    slug: 'contact-abuse-filter',
    shortDescription:
      'Honeypot, dwell-time and rate-limit heuristics for public contact forms, with no third-party service.',
    description:
      'Public contact forms attract scripted submissions. The usual answer is a third-party CAPTCHA, which adds a credential, a privacy question and a dependency on someone else being available.\n\nThis is the cheap alternative: a hidden field a human never fills, a dwell-time check, and a per-address rate limit. Bot heuristics fail silently — a scripted submitter is never told why it was rejected — while genuine validation failures return actionable field errors. It does not stop a determined attacker, and it was never meant to.',
    repoUrl: 'https://github.com/example/contact-filter',
    liveUrl: null,
    featured: false,
    skills: ['Node.js', 'Express', 'Zod'],
  },
  {
    title: 'Design Token Pipeline',
    slug: 'design-token-pipeline',
    shortDescription:
      'One token source compiled into CSS custom properties and a typed TypeScript module.',
    description:
      'Spacing, colour and radius values were being redefined per component, so a visual change meant a search-and-replace across the codebase and a guaranteed miss somewhere.\n\nThis pipeline takes one token definition and emits both CSS custom properties and a typed module, so a component cannot reference a value that does not exist and a redesign is a single edit.',
    repoUrl: 'https://github.com/example/token-pipeline',
    liveUrl: null,
    featured: false,
    skills: ['TypeScript', 'Tailwind CSS', 'React'],
  },
];

async function main() {
  console.log('Seeding…');

  // --- Skills -------------------------------------------------------------
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

  // --- Projects -----------------------------------------------------------
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

  // --- Experience ---------------------------------------------------------
  const experience = [
    {
      company: 'Narayana Group',
      role: 'Software Engineer',
      startDate: new Date('2024-06-01'),
      // Null end date — the current role.
      endDate: null,
      summary:
        'Building and maintaining internal web applications across the front end and the API layer. Responsible for the delivery pipeline, environment separation and the review practices that keep changes reversible.',
      displayOrder: 1,
    },
    {
      company: 'Independent',
      role: 'Full-Stack Developer',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2024-05-31'),
      summary:
        'Designed and shipped small full-stack products end to end — relational modelling, REST API design, authentication and deployment — for clients who needed one person to own the whole path.',
      displayOrder: 2,
    },
    {
      company: 'Freelance',
      role: 'Frontend Developer',
      startDate: new Date('2022-03-01'),
      endDate: new Date('2022-12-31'),
      summary:
        'Built responsive, accessible marketing sites and dashboards against existing design systems, with an emphasis on performance on mid-tier mobile connections.',
      displayOrder: 3,
    },
  ];

  await prisma.experience.deleteMany();
  await prisma.experience.createMany({ data: experience });
  console.log(`  experience: ${experience.length}`);

  // --- Certifications -----------------------------------------------------
  const certifications = [
    {
      title: 'AWS Certified Cloud Practitioner',
      issuer: 'Amazon Web Services',
      issueDate: new Date('2025-03-14'),
      credentialUrl: 'https://example.com/credential/aws-ccp',
      credentialId: 'AWS-CCP-0001',
    },
    {
      title: 'Meta Front-End Developer',
      issuer: 'Meta',
      issueDate: new Date('2024-09-02'),
      credentialUrl: 'https://example.com/credential/meta-fe',
      credentialId: 'META-FE-0002',
    },
    {
      // No credential URL and no image — both public pages must handle the gaps.
      title: 'Relational Database Design',
      issuer: 'University Extension Programme',
      issueDate: new Date('2023-11-20'),
      credentialUrl: null,
      credentialId: null,
    },
  ];

  await prisma.certification.deleteMany();
  await prisma.certification.createMany({ data: certifications });
  console.log(`  certifications: ${certifications.length}`);

  // --- Education ----------------------------------------------------------
  const education = [
    {
      institution: 'Osmania University',
      qualification: 'Bachelor of Technology',
      field: 'Computer Science and Engineering',
      startDate: new Date('2018-08-01'),
      endDate: new Date('2022-05-31'),
      summary:
        'Coursework across data structures, database systems, operating systems and software engineering. Final-year project on relational schema design for multi-tenant applications.',
    },
    {
      institution: 'Narayana Junior College',
      qualification: 'Intermediate',
      field: 'Mathematics, Physics and Chemistry',
      startDate: new Date('2016-06-01'),
      endDate: new Date('2018-04-30'),
      summary: 'Pre-university programme with a mathematics and physical sciences specialisation.',
    },
  ];

  await prisma.education.deleteMany();
  await prisma.education.createMany({ data: education });
  console.log(`  education: ${education.length}`);

  // --- Site settings (singleton) ------------------------------------------
  const existingSettings = await prisma.siteSettings.findFirst();
  const settings = {
    siteTitle: 'Abdullah Khan',
    tagline: 'Full-stack engineer — React, TypeScript, Node and PostgreSQL',
    bio: 'I build systems where the boundaries are deliberate: a public surface that only reads, an API that owns every rule, and a delivery pipeline that makes a bad release reversible in one action.\n\nMost of my work is the unglamorous middle of an application — the data model, the request lifecycle, the authorisation boundary and the tests that prove it holds. I care more about a system someone else can maintain than about the length of the stack list behind it.',
    emailPublic: 'hello@example.com',
    location: 'Hyderabad, India',
    socialLinks: [
      { label: 'GitHub', url: 'https://github.com/abddoeservthingmba' },
      { label: 'LinkedIn', url: 'https://linkedin.com/in/example' },
    ],
  };

  if (existingSettings) {
    await prisma.siteSettings.update({ where: { id: existingSettings.id }, data: settings });
  } else {
    await prisma.siteSettings.create({ data: settings });
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
