import type { Project } from '@/types/content';
import { skillsByIds } from './skills';

/** PHASE 2 MOCK DATA — deleted at the Phase 3 exit gate (M3). */
export const mockProjects: Project[] = [
  {
    id: 'pr-1',
    title: 'Portfolio CMS',
    slug: 'portfolio-cms',
    shortDescription:
      'A two-surface portfolio platform: a public React site and a private admin portal over one content layer.',
    description:
      'A static portfolio is cheap to build and expensive to keep truthful. Every certification, finished project and change of role means a code edit, a commit and a deploy — so the portfolio stops being updated within months.\n\nPortfolio CMS splits the site into two surfaces over one data layer. The public site is a fast, SEO-friendly React application that reads content through a versioned REST API. The private admin portal is an authenticated CRUD interface over the same data. Content lives in PostgreSQL and object storage; presentation lives in code.\n\nThe interesting parts are the boundaries: Supabase supplies the database, identity and object store, while Express owns every piece of business logic, validation and authorisation. Privileged keys never reach the browser. Adding a project became a form submission rather than a release.',
    status: 'PUBLISHED',
    repoUrl: 'https://github.com/example/portfolio-cms',
    liveUrl: null,
    imageUrl: null,
    featured: true,
    skills: skillsByIds(['sk-1', 'sk-5', 'sk-9', 'sk-10', 'sk-11', 'sk-13']),
  },
  {
    id: 'pr-2',
    title: 'Release Health Dashboard',
    slug: 'release-health-dashboard',
    shortDescription:
      'A single screen showing whether the last deploy is healthy, built for people who do not read logs.',
    description:
      'Deployment failures were being discovered by users rather than by the team. The pipeline reported success as soon as the build finished, which said nothing about whether the running service actually worked.\n\nThis dashboard polls health endpoints across environments and renders one unambiguous state per service, with the last five deploys and their outcomes underneath. The design constraint was that it had to be readable from across a room, which ruled out most of the chart types that felt natural at first.',
    status: 'PUBLISHED',
    repoUrl: 'https://github.com/example/release-health',
    liveUrl: 'https://example.com/release-health',
    imageUrl: null,
    featured: true,
    skills: skillsByIds(['sk-1', 'sk-5', 'sk-9', 'sk-15']),
  },
  {
    id: 'pr-3',
    title: 'Schema Diff Tool',
    slug: 'schema-diff-tool',
    shortDescription:
      'Compares a Prisma schema against a live database and reports the drift as a readable summary.',
    description:
      'Schema drift between environments is usually discovered during an incident. This tool introspects a live database, compares it against the committed schema, and prints the difference in the order a reviewer would want it: destructive changes first, additive ones last.\n\nIt deliberately does not fix anything. Generating a corrective migration automatically is how a tool ends up dropping a column at three in the morning.',
    status: 'PUBLISHED',
    repoUrl: 'https://github.com/example/schema-diff',
    liveUrl: null,
    imageUrl: null,
    featured: false,
    skills: skillsByIds(['sk-1', 'sk-11', 'sk-13', 'sk-3']),
  },
  {
    id: 'pr-4',
    title: 'Contact Abuse Filter',
    slug: 'contact-abuse-filter',
    shortDescription:
      'Honeypot, dwell-time and rate-limit heuristics for public contact forms, with no third-party service.',
    description:
      'Public contact forms attract scripted submissions. The usual answer is a third-party CAPTCHA, which adds a credential, a privacy question and a dependency on someone else being available.\n\nThis is the cheap alternative: a hidden field a human never fills, a dwell-time check, and a per-address rate limit. Bot heuristics fail silently — a scripted submitter is never told why it was rejected — while genuine validation failures return actionable field errors. It does not stop a determined attacker, and it was never meant to.',
    status: 'PUBLISHED',
    repoUrl: 'https://github.com/example/contact-filter',
    liveUrl: null,
    imageUrl: null,
    featured: false,
    skills: skillsByIds(['sk-9', 'sk-10', 'sk-12']),
  },
  {
    id: 'pr-5',
    title: 'Design Token Pipeline',
    slug: 'design-token-pipeline',
    shortDescription:
      'One token source compiled into CSS custom properties and a typed TypeScript module.',
    description:
      'Spacing, colour and radius values were being redefined per component, so a visual change meant a search-and-replace across the codebase and a guaranteed miss somewhere.\n\nThis pipeline takes one token definition and emits both CSS custom properties and a typed module, so a component cannot reference a value that does not exist and a redesign is a single edit.',
    status: 'PUBLISHED',
    repoUrl: 'https://github.com/example/token-pipeline',
    liveUrl: null,
    imageUrl: null,
    featured: false,
    skills: skillsByIds(['sk-1', 'sk-7', 'sk-5']),
  },
];
