import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import request from 'supertest';

/**
 * CRUD success paths (Phase 6 gap).
 *
 * The suite was thorough about refusal — every guarded route rejects the wrong
 * caller — and silent about the routes actually working. A guard that returns
 * 401 to everyone, including the administrator, would have passed the whole
 * suite. These tests close that.
 *
 * Projects and skills only. All seven admin resources share one controller
 * shape, one service shape and one response envelope, so two of them prove the
 * pattern; the other five would restate it at the cost of a file nobody reads.
 * Projects is the interesting one — it is the only resource with a relation to
 * reconcile and a transaction to get right.
 *
 * Prisma is mocked. The value here is the wiring — route to validation to
 * service to envelope to status code — not the SQL, which is Prisma's to test.
 */

vi.mock('../src/lib/auth.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/auth.js')>();
  return { ...actual, verifyAccessToken: vi.fn() };
});

const PROJECT_ID = '33333333-3333-4333-8333-333333333333';
const SKILL_ID = '44444444-4444-4444-8444-444444444444';

const skillRow = {
  id: SKILL_ID,
  name: 'TypeScript',
  category: 'Languages',
  icon: null,
  proficiency: 5,
};

const projectRow = {
  id: PROJECT_ID,
  title: 'Portfolio CMS',
  slug: 'portfolio-cms',
  shortDescription: 'A content-managed portfolio.',
  description: 'The long version.',
  status: 'PUBLISHED',
  repoUrl: null,
  liveUrl: null,
  imagePath: null,
  featured: true,
  skills: [{ projectId: PROJECT_ID, skillId: SKILL_ID, skill: skillRow }],
};

vi.mock('../src/lib/prisma.js', () => {
  const project = {
    // ensureExists asks for `select`; getById asks for `include`. Answering the
    // shape that was requested keeps one mock honest for both callers.
    findUnique: vi.fn(async ({ include }: { include?: unknown }) =>
      include ? projectRow : { id: PROJECT_ID },
    ),
    findMany: vi.fn(async () => [projectRow]),
    create: vi.fn(async () => projectRow),
    update: vi.fn(async () => projectRow),
    delete: vi.fn(async () => projectRow),
  };

  return {
    prisma: {
      user: { findUnique: vi.fn(async () => ({ id: 'admin-1', role: 'admin' })) },
      project,
      projectSkill: {
        deleteMany: vi.fn(async () => ({ count: 1 })),
        createMany: vi.fn(async () => ({ count: 1 })),
      },
      skill: {
        findUnique: vi.fn(async () => ({ id: SKILL_ID })),
        create: vi.fn(async () => skillRow),
        update: vi.fn(async () => skillRow),
        delete: vi.fn(async () => skillRow),
      },
      // The service runs its writes inside an interactive transaction; the mock
      // hands the same client back as the transaction client.
      $transaction: vi.fn(),
    },
    checkDatabase: vi.fn(async () => true),
  };
});

const { verifyAccessToken } = await import('../src/lib/auth.js');
const { prisma } = await import('../src/lib/prisma.js');
const { createApp, API_PREFIX } = await import('../src/app.js');

const app = createApp();

const AS_ADMIN = 'Bearer a.valid.admin.token';

/** Every request in this file is the authenticated administrator. */
function asAdmin(method: 'get' | 'post' | 'patch' | 'delete', path: string) {
  return request(app)[method](`${API_PREFIX}${path}`).set('Authorization', AS_ADMIN);
}

beforeEach(() => {
  // Call history only — mockClear leaves the implementations from the factory
  // above in place. Without this, "was not called" assertions see calls made by
  // whichever test ran before them.
  vi.clearAllMocks();

  vi.mocked(verifyAccessToken).mockResolvedValue({
    userId: '22222222-2222-4222-8222-222222222222',
    email: 'admin@example.com',
  });

  // $transaction is overloaded — an array form and an interactive callback
  // form — and TypeScript cannot narrow a mock implementation to one of them.
  // The services only ever use the callback form, which is what this supplies.
  (prisma.$transaction as unknown as Mock).mockImplementation((fn: (tx: unknown) => unknown) =>
    fn(prisma),
  );
});

describe('projects', () => {
  it('lists every project, whatever its status', async () => {
    const response = await asAdmin('get', '/admin/projects');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].slug).toBe('portfolio-cms');
    // The envelope is part of the contract, not an implementation detail.
    expect(response.body.meta).toHaveProperty('requestId');
  });

  it('reads one project by id', async () => {
    const response = await asAdmin('get', `/admin/projects/${PROJECT_ID}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(PROJECT_ID);
    expect(response.body.data.skills[0].name).toBe('TypeScript');
  });

  it('creates a project and answers 201', async () => {
    const response = await asAdmin('post', '/admin/projects').send({
      title: 'Portfolio CMS',
      slug: 'portfolio-cms',
      shortDescription: 'A content-managed portfolio.',
      description: 'The long version.',
      skillIds: [SKILL_ID],
    });

    expect(response.status).toBe(201);
    expect(response.body.data.slug).toBe('portfolio-cms');

    // status and featured are absent above; the schema supplies them, so a
    // caller cannot accidentally publish by omission.
    expect(prisma.project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'DRAFT', featured: false }),
      }),
    );
  });

  it('updates a project and replaces its tags wholesale', async () => {
    const response = await asAdmin('patch', `/admin/projects/${PROJECT_ID}`).send({
      title: 'Renamed',
      skillIds: [SKILL_ID],
    });

    expect(response.status).toBe(200);
    // Tags are reconciled, not appended to — the old rows go first.
    expect(prisma.projectSkill.deleteMany).toHaveBeenCalledWith({
      where: { projectId: PROJECT_ID },
    });
    expect(prisma.projectSkill.createMany).toHaveBeenCalled();
    // Both writes must be in the same transaction, or a failure leaves the
    // project's tags wrong with nothing shown to the user.
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('leaves tags alone when skillIds is omitted', async () => {
    await asAdmin('patch', `/admin/projects/${PROJECT_ID}`).send({ title: 'Renamed' });

    expect(prisma.projectSkill.deleteMany).not.toHaveBeenCalled();
  });

  it('deletes a project and answers 204 with no body', async () => {
    const response = await asAdmin('delete', `/admin/projects/${PROJECT_ID}`);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
    expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: PROJECT_ID } });
  });

  it('answers 404 for a project that is not there', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValueOnce(null);

    const response = await asAdmin('get', `/admin/projects/${PROJECT_ID}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('still validates the body for an administrator', async () => {
    // Being the admin buys authorisation, not a bypass of the schema.
    const response = await asAdmin('post', '/admin/projects').send({
      title: 'x',
      slug: 'Not A Valid Slug',
    });

    expect(response.status).toBe(422);
    expect(response.body.error).toHaveProperty('fields');
  });
});

describe('skills', () => {
  it('creates a skill and answers 201', async () => {
    const response = await asAdmin('post', '/admin/skills').send({
      name: 'TypeScript',
      category: 'Languages',
      proficiency: 5,
    });

    expect(response.status).toBe(201);
    expect(response.body.data).toEqual(skillRow);
  });

  it('updates a skill', async () => {
    const response = await asAdmin('patch', `/admin/skills/${SKILL_ID}`).send({ proficiency: 4 });

    expect(response.status).toBe(200);
    expect(prisma.skill.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: SKILL_ID } }),
    );
  });

  it('deletes a skill and answers 204', async () => {
    const response = await asAdmin('delete', `/admin/skills/${SKILL_ID}`);

    expect(response.status).toBe(204);
    expect(prisma.skill.delete).toHaveBeenCalledWith({ where: { id: SKILL_ID } });
  });

  it('rejects a proficiency outside 1–5', async () => {
    const response = await asAdmin('post', '/admin/skills').send({
      name: 'TypeScript',
      category: 'Languages',
      proficiency: 9,
    });

    expect(response.status).toBe(422);
  });
});
