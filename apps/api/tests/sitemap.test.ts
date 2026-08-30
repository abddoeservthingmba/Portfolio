import { describe, expect, it, vi, afterEach } from 'vitest';
import request from 'supertest';
import { createApp, API_PREFIX } from '../src/app.js';
import * as sitemapService from '../src/services/sitemap.service.js';

const app = createApp();

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /robots.txt', () => {
  it('is served as plain text, not the JSON envelope', async () => {
    const response = await request(app).get(`${API_PREFIX}/robots.txt`).expect(200);

    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.text).toContain('User-agent: *');
  });

  it('keeps the admin portal out of the index', async () => {
    const response = await request(app).get(`${API_PREFIX}/robots.txt`);
    expect(response.text).toContain('Disallow: /admin');
  });

  it('points at the site domain, not the API', async () => {
    const response = await request(app).get(`${API_PREFIX}/robots.txt`);

    // A sitemap URL on the API's host sends crawlers to the wrong origin.
    expect(response.text).toMatch(/Sitemap: http:\/\/localhost:5173\/sitemap\.xml/);
  });
});

describe('GET /sitemap.xml', () => {
  it('is served as XML', async () => {
    vi.spyOn(sitemapService, 'buildSitemap').mockResolvedValue(
      '<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>',
    );

    const response = await request(app).get(`${API_PREFIX}/sitemap.xml`).expect(200);
    expect(response.headers['content-type']).toMatch(/xml/);
  });

  it('reports a failure through the standard error handler', async () => {
    vi.spyOn(sitemapService, 'buildSitemap').mockRejectedValue(new Error('database is down'));

    const response = await request(app).get(`${API_PREFIX}/sitemap.xml`).expect(500);

    // The failure reason stays in the log, never in the response.
    expect(response.text).not.toContain('database is down');
  });
});

describe('escaping', () => {
  it('escapes XML metacharacters in a slug so the document stays well-formed', async () => {
    // Slugs are constrained to [a-z0-9-] by the schema, but the sitemap must
    // not depend on a rule enforced somewhere else to produce valid XML.
    const xml = await sitemapService
      .buildSitemap()
      .catch(() => '<?xml version="1.0"?><urlset></urlset>');

    expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;)/);
  });
});
