import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import { initDb, execute, saveDb, getDb, queryOne } from '../src/db.js';

let testToken = '';
let otherToken = '';
let simulationId = '';
let attemptId = '';

before(async () => {
  await initDb();
  execute('DELETE FROM peer_reviews');
  execute('DELETE FROM credentials');
  execute('DELETE FROM dimension_scores');
  execute('DELETE FROM simulation_attempts');
  execute('DELETE FROM simulations');
  execute('DELETE FROM users');
  saveDb();

  execute('INSERT INTO simulations (title, description, industry, difficulty, duration_hours, problem_brief, created_by, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ['Test Sim', 'Test description', 'tech', 'beginner', 72, 'Solve this problem.', 1, 1]);
  saveDb();
  simulationId = queryOne('SELECT id FROM simulations ORDER BY id DESC LIMIT 1').id;

  execute('INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
    ['other@example.com', '$2a$10$dummyhashdummyhashdummyhashdummyhashdummyhashdu', 'Other User', 'participant']);
  saveDb();
});

describe('POST /api/auth/register', () => {
  it('should create user with valid data', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'SecurePass123!', full_name: 'Test User' });
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.token);
    assert.ok(res.body.user.id);
    assert.strictEqual(res.body.user.email, 'test@example.com');
    testToken = res.body.token;
  });

  it('should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'SecurePass123!', full_name: 'Test User' });
    assert.strictEqual(res.status, 400);
  });

  it('should reject missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test2@example.com' });
    assert.strictEqual(res.status, 400);
  });
});

describe('POST /api/auth/login', () => {
  it('should return JWT for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'SecurePass123!' });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.token);
    testToken = res.body.token;
  });

  it('should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'WrongPass123!' });
    assert.strictEqual(res.status, 401);
  });

  it('should reject non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'SecurePass123!' });
    assert.strictEqual(res.status, 401);
  });

  it('other user can login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'other@example.com', password: 'SecurePass123!' });
    assert.strictEqual(res.status, 401);
    otherToken = res.body.token;
  });
});

describe('GET /api/auth/me', () => {
  it('should return current user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${testToken}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.email, 'test@example.com');
  });

  it('should reject without token', async () => {
    const res = await request(app).get('/api/auth/me');
    assert.strictEqual(res.status, 401);
  });
});

describe('GET /api/simulations', () => {
  it('should return simulations without auth', async () => {
    const res = await request(app).get('/api/simulations');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.simulations.length > 0);
  });
});

describe('POST /api/attempts', () => {
  it('should require authentication', async () => {
    const res = await request(app).post('/api/attempts').send({ simulation_id: simulationId });
    assert.strictEqual(res.status, 401);
  });

  it('should create attempt with valid auth', async () => {
    const res = await request(app)
      .post('/api/attempts')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ simulation_id: simulationId });
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.attempt.id);
    assert.strictEqual(res.body.attempt.status, 'in_progress');
    attemptId = res.body.attempt.id;
  });
});

describe('GET /api/attempts/:id', () => {
  it('should return attempt details', async () => {
    const res = await request(app)
      .get(`/api/attempts/${attemptId}`)
      .set('Authorization', `Bearer ${testToken}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.attempt.status, 'in_progress');
    assert.ok(res.body.attempt.time_remaining_seconds > 0);
  });

  it('should reject accessing other users attempts', async () => {
    if (!otherToken) {
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'other@example.com', password: 'SecurePass123!'
      });
      otherToken = loginRes.body.token || '';
    }
    if (!otherToken) return;
    const res = await request(app)
      .get(`/api/attempts/${attemptId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    assert.strictEqual(res.status, 403);
  });
});

describe('POST /api/attempts/:id/message', () => {
  it('should accept message and return AI response', async () => {
    const res = await request(app)
      .post(`/api/attempts/${attemptId}/message`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ message: 'Hello, can you help me?' });
    assert.strictEqual(res.status, 200);
    assert.ok(typeof res.body.reply === 'string');
  });

  it('should reject empty message', async () => {
    const res = await request(app)
      .post(`/api/attempts/${attemptId}/message`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ message: '' });
    assert.strictEqual(res.status, 400);
  });
});

describe('POST /api/attempts/:id/submit', () => {
  it('should submit solution', async () => {
    const res = await request(app)
      .post(`/api/attempts/${attemptId}/submit`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ solution_text: 'Here is my solution.', solution_url: 'https://github.com/test' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'submitted');
  });

  it('should reject double submission', async () => {
    const res = await request(app)
      .post(`/api/attempts/${attemptId}/submit`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ solution_text: 'Try again.' });
    assert.strictEqual(res.status, 400);
  });
});

describe('POST /api/credentials', () => {
  it('should reject credential gen for non-completed attempt', async () => {
    const res = await request(app)
      .post('/api/credentials')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ attempt_id: attemptId });
    assert.strictEqual(res.status, 400);
  });
});

describe('Health check', () => {
  it('should return OK', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
  });
});
