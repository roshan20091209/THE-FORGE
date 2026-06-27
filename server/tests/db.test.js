import { describe, it } from 'node:test';
import assert from 'node:assert';

// Test SQLite with sql.js in-memory
import initSqlJs from 'sql.js';

describe('Database Tests', () => {
  let db;

  it('should initialize SQL.js', async () => {
    const SQL = await initSqlJs();
    db = new SQL.Database();
    assert.ok(db);
  });

  it('should create tables without errors', () => {
    db.run('CREATE TABLE IF NOT EXISTS test_users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, name TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS test_attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, status TEXT)');
    assert.ok(true);
  });

  it('should insert and query data', () => {
    db.run('INSERT INTO test_users (email, name) VALUES (?, ?)', ['test@test.com', 'Test User']);
    const stmt = db.prepare('SELECT * FROM test_users WHERE email = ?');
    stmt.bind(['test@test.com']);
    assert.ok(stmt.step());
    const row = stmt.getAsObject();
    assert.strictEqual(row.email, 'test@test.com');
    assert.strictEqual(row.name, 'Test User');
    stmt.free();
  });

  it('should enforce unique constraints', () => {
    db.run('INSERT INTO test_users (email, name) VALUES (?, ?)', ['unique@test.com', 'Unique']);
    assert.throws(() => {
      db.run('INSERT INTO test_users (email, name) VALUES (?, ?)', ['unique@test.com', 'Duplicate']);
    });
  });

  it('should handle parameterized queries (prevent SQL injection)', () => {
    const malicious = "'; DROP TABLE test_users; --";
    const stmt = db.prepare('SELECT * FROM test_users WHERE email = ?');
    stmt.bind([malicious]);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    assert.strictEqual(rows.length, 0);
    stmt.free();
  });

  it('should handle transactions', () => {
    db.run('BEGIN TRANSACTION');
    db.run('INSERT INTO test_users (email, name) VALUES (?, ?)', ['tx@test.com', 'Transaction Test']);
    db.run('COMMIT');
    const stmt = db.prepare('SELECT COUNT(*) as count FROM test_users WHERE email = ?');
    stmt.bind(['tx@test.com']);
    assert.ok(stmt.step());
    const row = stmt.getAsObject();
    assert.strictEqual(row.count, 1);
    stmt.free();
  });

  it('should rollback on error', () => {
    db.run('BEGIN TRANSACTION');
    db.run('INSERT INTO test_users (email, name) VALUES (?, ?)', ['rollback@test.com', 'Will Rollback']);
    db.run('ROLLBACK');
    const stmt = db.prepare('SELECT COUNT(*) as count FROM test_users WHERE email = ?');
    stmt.bind(['rollback@test.com']);
    assert.ok(stmt.step());
    const row = stmt.getAsObject();
    assert.strictEqual(row.count, 0);
    stmt.free();
  });
});
