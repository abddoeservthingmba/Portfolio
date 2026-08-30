import { ProjectStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';

/**
 * Generates the sitemap from live content (O3, checklist B.3).
 *
 * Built here rather than at build time because project slugs change through
 * the admin portal with no redeploy — a sitemap baked into the bundle would
 * start lying the first time a project is published.
 *
 * Netlify rewrites /sitemap.xml to this endpoint, so crawlers see it on the
 * site's own domain rather than the API's.
 */

/** Routes that always exist, with a rough sense of how often they change. */
const STATIC_ROUTES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/projects', changefreq: 'weekly', priority: '0.9' },
  { path: '/skills', changefreq: 'monthly', priority: '0.7' },
  { path: '/experience', changefreq: 'monthly', priority: '0.8' },
  { path: '/certifications', changefreq: 'monthly', priority: '0.7' },
  { path: '/education', changefreq: 'yearly', priority: '0.6' },
  { path: '/resume', changefreq: 'monthly', priority: '0.8' },
  { path: '/contact', changefreq: 'yearly', priority: '0.6' },
];

/** XML has five characters that must never appear raw in text or an attribute. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function buildSitemap(): Promise<string> {
  const base = env.PUBLIC_SITE_URL.replace(/\/$/, '');

  const projects = await prisma.project.findMany({
    where: { status: ProjectStatus.PUBLISHED },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });

  const entries = [
    ...STATIC_ROUTES.map((route) => ({
      loc: `${base}${route.path}`,
      lastmod: undefined as string | undefined,
      changefreq: route.changefreq,
      priority: route.priority,
    })),
    ...projects.map((project) => ({
      loc: `${base}/projects/${encodeURIComponent(project.slug)}`,
      lastmod: project.updatedAt.toISOString().slice(0, 10),
      changefreq: 'monthly',
      priority: '0.8',
    })),
  ];

  const urls = entries
    .map((entry) => {
      const lastmod = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : '';

      return [
        '  <url>',
        `    <loc>${escapeXml(entry.loc)}</loc>${lastmod}`,
        `    <changefreq>${entry.changefreq}</changefreq>`,
        `    <priority>${entry.priority}</priority>`,
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

/**
 * robots.txt, also served through a rewrite so its Sitemap line always matches
 * the deployed domain rather than a value someone forgot to update.
 */
export function buildRobots(): string {
  const base = env.PUBLIC_SITE_URL.replace(/\/$/, '');

  return `User-agent: *
Allow: /

# The admin portal is not public content and must never be indexed.
Disallow: /admin

Sitemap: ${base}/sitemap.xml
`;
}
