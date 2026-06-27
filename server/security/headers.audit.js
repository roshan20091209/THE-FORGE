import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';

describe('SECURITY: HTTP Headers', () => {
  it('should not expose Express version', async () => {
    const res = await request(app).get('/api/health');
    assert.ok(!res.headers['x-powered-by'],
      'Should not expose x-powered-by header');
  });

  it('should set CORS headers', async () => {
    const res = await request(app)
      .options('/api/health')
      .set('Origin', 'http://localhost:5173');
    assert.ok(res.headers['access-control-allow-origin'],
      'Should set CORS headers');
  });

  it('should have JSON content type', async () => {
    const res = await request(app).get('/api/health');
    assert.ok(res.headers['content-type'].includes('json'),
      'Should return JSON content type');
  });
});
