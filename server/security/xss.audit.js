import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import { initDb } from '../src/db.js';

const xssPayloads = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  'javascript:alert(1)',
  '<svg onload=alert(1)>',
  '<iframe src="javascript:alert(1)">',
  '<body onload=alert(1)>',
  '<input onfocus=alert(1) autofocus>',
];

describe('SECURITY: XSS Prevention', () => {
  before(async () => {
    await initDb();
  });

  xssPayloads.forEach(payload => {
    it(`should sanitize XSS: ${payload.substring(0, 40)}`, async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'xss-test@example.com', password: 'SecurePass123!', full_name: payload });
      const responseText = JSON.stringify(res.body);
      assert.ok(!responseText.includes('<script>'),
        'Response should not contain raw script tags');
    });
  });
});
