import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

/**
 * The authorisation half of requireAuth (D9, C4).
 *
 * authBoundary.test.ts proves an *invalid* token is refused. That is only half
 * the guard. This file proves the other half: a token that verifies perfectly —
 * a real, current Supabase session — still does not get in unless the users
 * table says that person is the administrator.
 *
 * The distinction matters because the Supabase project can have other users.
 * Anyone who can sign up holds a valid token. If verification alone were the
 * gate, signing up would be the same as becoming the administrator.
 *
 * It lives in its own file rather than alongside the boundary tests because
 * vi.mock is hoisted across the whole module: stubbing verifyAccessToken there
 * would make every "rejects a forged token" assertion vacuous.
 */

// Only verifyAccessToken is replaced. readBearerToken stays real, so the header
// parsing on the way in is still the code that runs in production.
vi.mock('../src/lib/auth.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/auth.js')>();
  return { ...actual, verifyAccessToken: vi.fn() };
});

vi.mock('../src/lib/prisma.js', () => ({
  prisma: { user: { findUnique: vi.fn() } },
  checkDatabase: vi.fn(async () => true),
}));

const { verifyAccessToken } = await import('../src/lib/auth.js');
const { prisma } = await import('../src/lib/prisma.js');
const { createApp, API_PREFIX } = await import('../src/app.js');

const app = createApp();

const AUTH_USER_ID = '22222222-2222-4222-8222-222222222222';
const VALID_HEADER = 'Bearer a.valid.token';

beforeEach(() => {
  vi.mocked(verifyAccessToken).mockResolvedValue({
    userId: AUTH_USER_ID,
    email: 'someone.else@example.com',
  });
});

/**
 * A full users row. requireAuth selects only id and role, but the mock loses
 * that narrowing and is typed against the whole model, so the extra fields keep
 * the compiler satisfied without changing what is being tested.
 */
function userRow(role: string) {
  return {
    id: 'user-1',
    authUserId: AUTH_USER_ID,
    role,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

describe('a valid token that is not the administrator', () => {
  const cases: Array<[label: string, row: ReturnType<typeof userRow> | null]> = [
    // Signed up through Supabase, never granted anything in this application.
    ['has no row in the users table', null],
    // Has a row, but not the one role that may write.
    ['has a row with a non-admin role', userRow('editor')],
  ];

  it.each(cases)('is refused with 403 when the caller %s', async (_label, row) => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(row);

    const response = await request(app)
      .patch(`${API_PREFIX}/admin/settings`)
      .set('Authorization', VALID_HEADER)
      .send({ siteTitle: 'Hijacked' });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('is 403 and not 401 — the caller is authenticated, just not permitted', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(userRow('editor'));

    const response = await request(app)
      .delete(`${API_PREFIX}/admin/projects/00000000-0000-4000-8000-000000000000`)
      .set('Authorization', VALID_HEADER);

    // Collapsing these two into one status is how a system ends up unable to
    // answer "who tried, and were they known?".
    expect(response.status).toBe(403);
    expect(response.status).not.toBe(401);
  });

  it('is refused before validation, so the payload shape stays hidden', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const response = await request(app)
      .post(`${API_PREFIX}/admin/projects`)
      .set('Authorization', VALID_HEADER)
      .send({ nonsense: true });

    expect(response.status).toBe(403);
    expect(response.body.error).not.toHaveProperty('fields');
  });

  it('looks the caller up by the token subject, not by anything they sent', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await request(app)
      .patch(`${API_PREFIX}/admin/settings`)
      .set('Authorization', VALID_HEADER)
      // A role claim in the body must have no bearing on the lookup.
      .send({ siteTitle: 'x', role: 'admin' });

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { authUserId: AUTH_USER_ID } }),
    );
  });
});

describe('a valid token that IS the administrator', () => {
  it('passes the guard and reaches the route', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(userRow('admin'));

    const response = await request(app)
      .get(`${API_PREFIX}/admin/session`)
      .set('Authorization', VALID_HEADER);

    // The positive case, so the tests above are proving refusal rather than
    // simply proving that nothing ever gets through.
    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe('someone.else@example.com');
  });
});
