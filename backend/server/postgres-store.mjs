import { readFileSync } from 'node:fs';
import { makeAccountStore } from './account-store.mjs';

const table = 'insureflow_private.workspace_state';
export function assertSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || !snapshot.db ||
      !Array.isArray(snapshot.db.policies) || !Array.isArray(snapshot.db.claims) ||
      !Array.isArray(snapshot.crm) || !Array.isArray(snapshot.finance)) {
    throw new Error('Invalid InsureFlow workspace snapshot.');
  }
  for (const key of ['customers', 'applications', 'outbox']) {
    if (snapshot.db[key] !== undefined && !Array.isArray(snapshot.db[key])) {
      throw new Error('Invalid InsureFlow workspace snapshot.');
    }
  }
  return snapshot;
}

export async function connectPostgres(env = process.env) {
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required in PostgreSQL mode.');
  const url = new URL(env.DATABASE_URL);
  if (!['postgresql:', 'postgres:'].includes(url.protocol)) throw new Error('DATABASE_URL must be a PostgreSQL connection string.');
  // Do not allow URL options to override explicit certificate verification.
  for (const key of ['ssl', 'sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'uselibpqcompat']) url.searchParams.delete(key);
  const ca = env.DATABASE_CA_FILE ? readFileSync(env.DATABASE_CA_FILE, 'utf8') : env.DATABASE_CA;
  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString: url.toString(),
    ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) },
    max: 2, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000,
    query_timeout: 8000, statement_timeout: 7000 });
  pool.on('error', () => console.error('Idle database connection interrupted.'));
  return makePostgresStore(pool);
}

export function makePostgresStore(pool) {
  async function transaction(fn) {
    const client = await pool.connect();
    let broken = false;
    try {
      await client.query('BEGIN');
      await client.query("SET LOCAL lock_timeout = '5s'");
      const { rows } = await client.query(`SELECT payload FROM ${table} WHERE id = 1 FOR UPDATE`);
      if (rows.length !== 1) throw new Error('Workspace not initialized. Run npm run db:init first.');
      const snapshot = assertSnapshot(structuredClone(rows[0].payload));
      const before = JSON.stringify(snapshot);
      const reply = await fn(snapshot);
      if (reply.commit === false) {
        await client.query('ROLLBACK');
      } else {
        assertSnapshot(snapshot);
        const after = JSON.stringify(snapshot);
        if (before !== after) {
          await client.query(`UPDATE ${table} SET payload = $1::jsonb, updated_at = now() WHERE id = 1`, [after]);
        }
        await client.query('COMMIT');
      }
      return reply;
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch { broken = true; }
      throw error;
    } finally { client.release(broken); }
  }
  async function initialize(snapshot) {
    assertSnapshot(snapshot);
    const client = await pool.connect();
    let broken = false;
    try {
      await client.query('BEGIN');
      await client.query('CREATE SCHEMA IF NOT EXISTS insureflow_private');
      await client.query('REVOKE ALL ON SCHEMA insureflow_private FROM PUBLIC');
      await client.query(`CREATE TABLE IF NOT EXISTS ${table} (id smallint PRIMARY KEY CHECK (id = 1), payload jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`);
      await client.query(`REVOKE ALL ON TABLE ${table} FROM PUBLIC`);
      await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      const result = await client.query(`INSERT INTO ${table} (id, payload) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING`, [JSON.stringify(snapshot)]);
      await client.query('COMMIT');
      return result.rowCount === 1;
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch { broken = true; }
      throw error;
    } finally { client.release(broken); }
  }
  return {
    ...makeAccountStore(pool, assertSnapshot),
    transaction, initialize,
    async check() {
      const { rows } = await pool.query(`SELECT 1 FROM ${table} WHERE id = 1`);
      if (rows.length !== 1) throw new Error('Workspace not initialized.');
    },
    async snapshot() { return transaction(s => ({ value: structuredClone(s), commit: false })).then(r => r.value); },
    close: () => pool.end(),
  };
}

export function storageMode(env = process.env) {
  const mode = env.STORAGE_MODE || (env.DATABASE_URL ? 'postgres' : 'json');
  if (!['postgres', 'json'].includes(mode)) throw new Error('STORAGE_MODE must be postgres or json.');
  if (mode === 'postgres' && !env.DATABASE_URL) throw new Error('DATABASE_URL is missing; refusing to switch to local JSON.');
  if (mode === 'json' && env.DATABASE_URL) throw new Error('Conflicting storage settings: DATABASE_URL with STORAGE_MODE=json.');
  return mode;
}
