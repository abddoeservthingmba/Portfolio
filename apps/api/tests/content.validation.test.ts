import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp, API_PREFIX } from '../src/app.js';

const app = createApp();

/**
 * Query and path validation on the public read routes.
 *
 * These cases never reach the database: `validate` rejects before the handler
 * runs, which is exactly the property being tested — a malformed request must
 * not cost a query.
 */
describe('GET /projects — query validation', () => {
  it('rejects a skill filter that is not a uuid', async () => {
    const response = await request(app)
      .get(`${API_PREFIX}/projects`)
      .query({ skill: 'not-a-uuid' })
      .expect(422);

    expect(response.body.error.code).toBe('VALIDATION_FAILED');
    expect(response.body.error.fields).toHaveProperty('skill');
  });

  it('rejects an unknown query parameter rather than ignoring it', async () => {
    const response = await request(app)
      .get(`${API_PREFIX}/projects`)
      .query({ feature: 'true' })
      .expect(422);

    expect(response.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('rejects a search term beyond the length bound', async () => {
    const response = await request(app)
      .get(`${API_PREFIX}/projects`)
      .query({ q: 'x'.repeat(101) })
      .expect(422);

    expect(response.body.error.fields).toHaveProperty('q');
  });

  it('returns a field error map, never a stack trace', async () => {
    const response = await request(app)
      .get(`${API_PREFIX}/projects`)
      .query({ skill: 'nope' })
      .expect(422);

    expect(JSON.stringify(response.body)).not.toContain('at ');
    expect(response.body.meta.requestId).toEqual(expect.any(String));
  });
});

describe('GET /projects/:slug — path validation', () => {
  it.each([
    ['an uppercase slug', 'Portfolio-CMS'],
    ['a path traversal attempt', '..%2F..%2Fetc'],
    ['a slug with underscores', 'portfolio_cms'],
  ])('rejects %s', async (_label, slug) => {
    const response = await request(app).get(`${API_PREFIX}/projects/${slug}`);

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_FAILED');
  });
});

describe('GET /skills — query validation', () => {
  it('rejects an unknown parameter', async () => {
    await request(app).get(`${API_PREFIX}/skills`).query({ group: 'Frontend' }).expect(422);
  });

  it('rejects an empty category', async () => {
    await request(app).get(`${API_PREFIX}/skills`).query({ category: '   ' }).expect(422);
  });
});

describe('public surface shape', () => {
  it.each([
    '/projects',
    '/skills',
    '/experience',
    '/certifications',
    '/education',
    '/resume',
    '/settings',
  ])('exposes no write method on %s', async (path) => {
    // A public route that answered a POST would be a hole in the read-only
    // guarantee the whole public surface rests on (C3).
    const response = await request(app).post(`${API_PREFIX}${path}`).send({});
    expect(response.status).toBe(404);
  });
});
