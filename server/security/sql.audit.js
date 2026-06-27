import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import { initDb } from '../src/db.js';

const sqlPayloads = [
  "'; DROP TABLE users; --",
  "1 OR 1=1",
  "1; DELETE FROM users WHERE '1'='1",
  "' UNION SELECT * FROM users --",
  "admin'--",
  "1' AND 1=1--",
  "1' AND 1=2--",
  "' OR '1'='1",
  "' AND 1=0 UNION SELECT null, version() --",
];

describe('SECURITY: SQL Injection Prevention', () => {
  before(async () => {
    await initDb();
  });

  sqlPayloads.forEach(payload => {
    it(`should reject SQL injection: ${payload.substring(0, 40)}`, async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: payload, password: 'SecurePass123!', full_name: 'Test' });
      assert.ok([201, 400].includes(res.status),
        `SQL injection payload should not cause 500 error: ${payload}`);
    });
  });

  it('should handle malicious login attempts safely', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: "admin' OR '1'='1", password: "' OR '1'='1" });
    assert.strictEqual(res.status, 401,
      'SQL injection login should fail with 401, not succeed');
  });
});
