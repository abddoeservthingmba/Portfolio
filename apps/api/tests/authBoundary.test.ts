import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp, API_PREFIX } from '../src/app.js';

const app = createApp();

/**
 * THE TEST THAT JUSTIFIES THE SUITE (D9).
 *
 * Every mutation route must reject an unauthenticated caller. The route table
 * is enumerated here rather than tested case by case, so the day someone adds
 * an endpoint and forgets the middleware, this fails loudly.
 *
 * It is the cheapest test in the project and the only one that catches the
 * most serious defect the system can have.
 */

const UUID = '00000000-0000-4000-8000-000000000000';

/** Every route behind /admin. Add a route above, add it here. */
const ADMIN_ROUTES: Array<[method: 'get' | 'post' | 'patch' | 'delete', path: string]> = [
  ['get', '/admin/session'],
  ['get', '/admin/skill-options'],

  ['get', '/admin/projects'],
  ['get', `/admin/projects/${UUID}`],
  ['post', '/admin/projects'],
  ['patch', `/admin/projects/${UUID}`],
  ['delete', `/admin/projects/${UUID}`],

  ['post', '/admin/skills'],
  ['patch', `/admin/skills/${UUID}`],
  ['delete', `/admin/skills/${UUID}`],

  ['post', '/admin/experience'],
  ['patch', `/admin/experience/${UUID}`],
  ['delete', `/admin/experience/${UUID}`],

  ['post', '/admin/certifications'],
  ['patch', `/admin/certifications/${UUID}`],
  ['delete', `/admin/certifications/${UUID}`],

  ['post', '/admin/education'],
  ['patch', `/admin/education/${UUID}`],
  ['delete', `/admin/education/${UUID}`],

  ['get', '/admin/resume'],
  ['post', '/admin/resume'],
  ['patch', `/admin/resume/${UUID}`],
  ['delete', `/admin/resume/${UUID}`],

  ['patch', '/admin/settings'],
];

describe('auth boundary — no token', () => {
  it.each(ADMIN_ROUTES)('%s %s rejects an unauthenticated request', async (method, path) => {
    const response = await request(app)[method](`${API_PREFIX}${path}`).send({});

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });
});

describe('auth boundary — malformed credentials', () => {
  const cases: Array<[label: string, header: string]> = [
    ['an empty bearer token', 'Bearer '],
    ['a non-bearer scheme', 'Basic dXNlcjpwYXNz'],
    ['a bare token with no scheme', 'abc.def.ghi'],
    ['a structurally invalid token', 'Bearer not-a-jwt'],
    ['a token with an unsigned alg:none header', `Bearer ${forgedNoneToken()}`],
  ];

  it.each(cases)('rejects %s', async (_label, header) => {
    const response = await request(app)
      .patch(`${API_PREFIX}/admin/settings`)
      .set('Authorization', header)
      .send({ siteTitle: 'Hijacked' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('never reveals why the token failed', async () => {
    const response = await request(app)
      .patch(`${API_PREFIX}/admin/settings`)
      .set('Authorization', 'Bearer not-a-jwt')
      .send({ siteTitle: 'Hijacked' });

    // The reason belongs in the log, not the response.
    expect(response.body.error.message).not.toMatch(/signature|malformed|jwt|decode/i);
  });
});

describe('authorisation runs before validation', () => {
  it('rejects an unauthenticated caller without revealing the payload shape', async () => {
    // A wildly invalid body would be a 422 if validation ran first. It must be
    // a 401 — an unauthorised caller learns nothing about what a valid request
    // looks like (C4).
    const response = await request(app)
      .post(`${API_PREFIX}/admin/projects`)
      .send({ nonsense: true });

    expect(response.status).toBe(401);
    expect(response.body.error).not.toHaveProperty('fields');
  });
});

describe('the public surface stays read-only', () => {
  it.each(['/projects', '/skills', '/experience', '/certifications', '/education', '/settings'])(
    'has no unauthenticated write path at %s',
    async (path) => {
      for (const method of ['post', 'patch', 'delete'] as const) {
        const response = await request(app)[method](`${API_PREFIX}${path}`).send({});
        // Either the route does not exist, or it is guarded. Never a 2xx.
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    },
  );
});

/**
 * A token claiming `alg: none` with no signature — the classic JWT forgery.
 * Verification pins ES256, so this must never be accepted.
 */
function forgedNoneToken(): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

  const header = encode({ alg: 'none', typ: 'JWT' });
  const payload = encode({
    sub: '11111111-1111-4111-8111-111111111111',
    email: 'attacker@example.com',
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  return `${header}.${payload}.`;
}
