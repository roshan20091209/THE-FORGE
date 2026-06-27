import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import { initDb } from '../src/db.js';

describe('Performance Tests', () => {
  before(async () => {
    await initDb();
  });

  it('API response time < 500ms for public endpoints', async () => {
    const start = Date.now();
    await request(app).get('/api/simulations');
    const duration = Date.now() - start;
    assert.ok(duration < 500, `Response took ${duration}ms, expected < 500ms`);
  });

  it('API response time < 500ms for health check', async () => {
    const start = Date.now();
    await request(app).get('/api/health');
    const duration = Date.now() - start;
    assert.ok(duration < 500, `Response took ${duration}ms, expected < 500ms`);
  });

  it('should handle 50 concurrent requests', async () => {
    const requests = Array(50).fill(null).map(() =>
      request(app).get('/api/simulations')
    );
    const start = Date.now();
    const responses = await Promise.all(requests);
    const duration = Date.now() - start;
    const allOk = responses.every(r => r.status === 200);
    assert.ok(allOk, 'All 50 concurrent requests should succeed');
    console.log(`  50 concurrent requests completed in ${duration}ms`);
  });
});
