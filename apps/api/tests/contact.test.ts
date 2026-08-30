import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp, API_PREFIX } from '../src/app.js';
import * as contactService from '../src/services/contact.service.js';

const app = createApp();

const VALID = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  subject: 'About a role',
  message: 'I read through the architecture notes and had a question about the boundary rule.',
  dwellMs: 5000,
};

beforeEach(() => {
  // The persistence layer needs a database; the behaviour under test is the
  // route's decision about whether to call it at all.
  vi.spyOn(contactService, 'submitMessage').mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /contact — validation', () => {
  it.each([
    ['a missing name', { ...VALID, name: '' }, 'name'],
    ['an invalid email', { ...VALID, email: 'not-an-address' }, 'email'],
    ['a short subject', { ...VALID, subject: 'hi' }, 'subject'],
    ['a short message', { ...VALID, message: 'too short' }, 'message'],
  ])('rejects %s with a field error', async (_label, body, field) => {
    const response = await request(app).post(`${API_PREFIX}/contact`).send(body).expect(422);

    expect(response.body.error.code).toBe('VALIDATION_FAILED');
    expect(response.body.error.fields).toHaveProperty(field);
    expect(contactService.submitMessage).not.toHaveBeenCalled();
  });

  it('rejects an unexpected field rather than ignoring it', async () => {
    await request(app)
      .post(`${API_PREFIX}/contact`)
      .send({ ...VALID, isAdmin: true })
      .expect(422);

    expect(contactService.submitMessage).not.toHaveBeenCalled();
  });

  it('accepts and stores a valid submission', async () => {
    const response = await request(app).post(`${API_PREFIX}/contact`).send(VALID).expect(201);

    expect(response.body.data.received).toBe(true);
    expect(contactService.submitMessage).toHaveBeenCalledTimes(1);
  });
});

describe('POST /contact — bot heuristics fail silently', () => {
  it('discards a submission that fills the honeypot, but reports success', async () => {
    const response = await request(app)
      .post(`${API_PREFIX}/contact`)
      .send({ ...VALID, company: 'spam-bot-co' })
      .expect(201);

    // Indistinguishable from a real success: a scripted submitter is never
    // told why it was rejected (C6).
    expect(response.body.data.received).toBe(true);
    expect(contactService.submitMessage).not.toHaveBeenCalled();
  });

  it('discards a submission made faster than a person could type', async () => {
    const response = await request(app)
      .post(`${API_PREFIX}/contact`)
      .send({ ...VALID, dwellMs: 100 })
      .expect(201);

    expect(response.body.data.received).toBe(true);
    expect(contactService.submitMessage).not.toHaveBeenCalled();
  });

  it('stores a submission that omits the dwell time entirely', async () => {
    const { dwellMs: _omitted, ...withoutDwell } = VALID;

    await request(app).post(`${API_PREFIX}/contact`).send(withoutDwell).expect(201);

    // A missing heuristic is not evidence of a bot; it just cannot be checked.
    expect(contactService.submitMessage).toHaveBeenCalledTimes(1);
  });
});

describe('the contact endpoint is the only public write', () => {
  it('does not expose the inbox publicly', async () => {
    const response = await request(app).get(`${API_PREFIX}/admin/messages`);
    expect(response.status).toBe(401);
  });

  it.each(['patch', 'delete'] as const)(
    'rejects %s on the public contact route',
    async (method) => {
      const response = await request(app)[method](`${API_PREFIX}/contact`).send(VALID);
      expect(response.status).toBe(404);
    },
  );
});
