import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { beforeEach, describe, it } from 'node:test';
import { DatabaseSync } from 'node:sqlite';

const schema = readFileSync(new URL('../../db/schema.sql', import.meta.url), 'utf8');
const STARTED_AT = '2026-01-01T00:00:00Z';

describe('optional database schema', () => {
  let database;

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    database.exec(schema);
  });

  const insertSession = () => database
    .prepare('INSERT INTO capture_sessions (started_at) VALUES (?)')
    .run(STARTED_AT).lastInsertRowid;

  const insertSample = (sessionId, offset, alpha = 10, beta = 10, gamma = 10) => database
    .prepare(`INSERT INTO orientation_samples
      (session_id, offset_ms, alpha_degrees, beta_degrees, gamma_degrees)
      VALUES (?, ?, ?, ?, ?)`)
    .run(sessionId, offset, alpha, beta, gamma);

  it('creates both tables', () => {
    const names = database
      .prepare("SELECT name FROM sqlite_schema WHERE type = 'table' ORDER BY name")
      .all()
      .map((row) => row.name);
    assert.deepEqual(names, ['capture_sessions', 'orientation_samples']);
  });

  it('is safe to apply twice', () => {
    assert.doesNotThrow(() => database.exec(schema));
  });

  it('stores a valid sample', () => {
    insertSample(insertSession(), 0);
    assert.equal(database.prepare('SELECT count(*) AS total FROM orientation_samples').get().total, 1);
  });

  it('allows null angles from sensors that report none', () => {
    assert.doesNotThrow(() => insertSample(insertSession(), 0, null, null, null));
  });

  it('rejects out-of-range angles', () => {
    const sessionId = insertSession();
    assert.throws(() => insertSample(sessionId, 1, 361));
    assert.throws(() => insertSample(sessionId, 2, 10, 181));
    assert.throws(() => insertSample(sessionId, 3, 10, 10, 91));
  });

  it('rejects samples for unknown sessions', () => {
    assert.throws(() => insertSample(999, 0));
  });

  it('rejects duplicate offsets within a session', () => {
    const sessionId = insertSession();
    insertSample(sessionId, 5);
    assert.throws(() => insertSample(sessionId, 5));
  });

  it('rejects a session that ends before it starts', () => {
    assert.throws(() => database
      .prepare('INSERT INTO capture_sessions (started_at, ended_at) VALUES (?, ?)')
      .run(STARTED_AT, '2025-01-01T00:00:00Z'));
  });

  for (const value of ['2026-13-01T00:00:00Z', '2026-02-30T00:00:00Z', '2026-01-01Tnot-a-timeZ', '2026-01-01T00:00:00.500Z']) {
    it(`rejects the non-canonical timestamp ${value}`, () => {
      assert.throws(() => database
        .prepare('INSERT INTO capture_sessions (started_at) VALUES (?)')
        .run(value));
    });
  }

  it('rejects a non-canonical end timestamp', () => {
    assert.throws(() => database
      .prepare('INSERT INTO capture_sessions (started_at, ended_at) VALUES (?, ?)')
      .run(STARTED_AT, '2026-01-01T00:00:00.500Z'));
  });

  it('accepts a session ending one second later', () => {
    assert.doesNotThrow(() => database
      .prepare('INSERT INTO capture_sessions (started_at, ended_at) VALUES (?, ?)')
      .run(STARTED_AT, '2026-01-01T00:00:01Z'));
  });

  it('cascades session deletion to samples', () => {
    const sessionId = insertSession();
    insertSample(sessionId, 0);
    database.prepare('DELETE FROM capture_sessions WHERE id = ?').run(sessionId);
    assert.equal(database.prepare('SELECT count(*) AS total FROM orientation_samples').get().total, 0);
  });
});
