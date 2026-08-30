import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp, API_PREFIX } from '../src/app.js';

const app = createApp();

describe('GET /health', () => {
  it('reports liveness in the standard success envelope', async () => {
    const response = await request(app).get(`${API_PREFIX}/health`).expect(200);

    expect(response.body.data.status).toBe('ok');
    expect(response.body.meta.requestId).toEqual(expect.any(String));
  });

  it('echoes the correlation id on the response header', async () => {
    const response = await request(app).get(`${API_PREFIX}/health`);

    expect(response.headers['x-request-id']).toBe(response.body.meta.requestId);
  });

  it('honours an inbound correlation id so a trace survives a proxy hop', async () => {
    const response = await request(app)
      .get(`${API_PREFIX}/health`)
      .set('x-request-id', 'trace-from-upstream');

    expect(response.body.meta.requestId).toBe('trace-from-upstream');
  });

  it('carries baseline security headers', async () => {
    const response = await request(app).get(`${API_PREFIX}/health`);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});

describe('unmatched routes', () => {
  it('returns the standard error envelope rather than an HTML page', async () => {
    const response = await request(app).get(`${API_PREFIX}/nothing-here`).expect(404);

    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.meta.requestId).toEqual(expect.any(String));
  });

  it('never leaks a stack trace', async () => {
    const response = await request(app).get('/some/unrouted/path').expect(404);

    expect(JSON.stringify(response.body)).not.toContain('at ');
  });
});

describe('CORS allow-list', () => {
  it('accepts an allowed origin', async () => {
    const response = await request(app)
      .get(`${API_PREFIX}/health`)
      .set('Origin', 'http://localhost:5173')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('rejects an origin outside the allow-list with 403 and no wildcard header', async () => {
    const response = await request(app)
      .get(`${API_PREFIX}/health`)
      .set('Origin', 'https://not-my-site.example')
      .expect(403);

    expect(response.body.error.code).toBe('FORBIDDEN');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    // A rejected origin must still be traceable back to a log line.
    expect(response.body.meta.requestId).toEqual(expect.any(String));
  });
});
