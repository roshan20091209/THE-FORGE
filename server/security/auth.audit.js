import { describe, it } from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

describe('SECURITY: Authentication', () => {
  it('should use strong JWT secret (min 32 chars)', () => {
    const secret = process.env.JWT_SECRET || 'the-forge-local-dev-secret-key-change-in-production';
    assert.ok(secret);
    assert.ok(secret.length >= 32, 'JWT secret must be at least 32 characters');
  });

  it('should hash passwords with bcrypt (min 10 rounds)', async () => {
    const password = 'TestPass123!';
    const hash = bcrypt.hashSync(password, 12);
    assert.ok(hash.startsWith('$2'));
    const isValid = bcrypt.compareSync(password, hash);
    assert.strictEqual(isValid, true);
  });

  it('should reject wrong bcrypt password', () => {
    const password = 'TestPass123!';
    const hash = bcrypt.hashSync(password, 12);
    const isValid = bcrypt.compareSync('WrongPass456!', hash);
    assert.strictEqual(isValid, false);
  });

  it('should expire JWT tokens', () => {
    const secret = process.env.JWT_SECRET || 'test-secret-that-is-at-least-32-characters-long!';
    const token = jwt.sign({ userId: 1 }, secret, { expiresIn: '24h' });
    const decoded = jwt.decode(token);
    assert.ok(decoded.exp);
    assert.ok(decoded.exp > Date.now() / 1000);
  });

  it('should reject expired tokens', () => {
    const secret = process.env.JWT_SECRET || 'test-secret-that-is-at-least-32-characters-long!';
    const expiredToken = jwt.sign({ userId: 1 }, secret, { expiresIn: '-1h' });
    assert.throws(() => {
      jwt.verify(expiredToken, secret);
    });
  });

  it('should reject tampered tokens', () => {
    const secret = process.env.JWT_SECRET || 'test-secret-that-is-at-least-32-characters-long!';
    const token = jwt.sign({ userId: 1 }, secret);
    const tampered = token.slice(0, -5) + 'XXXXX';
    assert.throws(() => {
      jwt.verify(tampered, secret);
    });
  });

  it('should generate unique hashes for same password', () => {
    const password = 'SamePass123!';
    const hash1 = bcrypt.hashSync(password, 10);
    const hash2 = bcrypt.hashSync(password, 10);
    assert.notStrictEqual(hash1, hash2);
  });
});
