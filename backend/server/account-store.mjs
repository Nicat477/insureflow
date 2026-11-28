import { validUserId } from './account-auth.mjs';
import { seed } from './domain.mjs';
const table = 'insureflow_private.account_workspace';
export function makeAccountStore(pool, assertSnapshot) {
  const fresh = () => ({ db: structuredClone(seed), crm: [], finance: [] });
  async function tx(fn) {
    const client = await pool.connect(); let broken = false;
    try { await client.query('BEGIN'); await client.query("SET LOCAL lock_timeout = '5s'"); const value = await fn(client); await client.query(value.commit === false ? 'ROLLBACK' : 'COMMIT'); return value; }
    catch (e) { try { await client.query('ROLLBACK'); } catch { broken = true; } throw e; }
    finally { client.release(broken); }
  }
  function checkId(id) { if (!validUserId(id)) throw Error('Invalid account ID.'); }
  return {
    async initAccounts() {
      return tx(async c => {
        await c.query('CREATE SCHEMA IF NOT EXISTS insureflow_private');
        await c.query('REVOKE ALL ON SCHEMA insureflow_private FROM PUBLIC, anon, authenticated');
        await c.query(`CREATE TABLE IF NOT EXISTS ${table} (user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, payload jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`);
        await c.query(`REVOKE ALL ON TABLE ${table} FROM PUBLIC, anon, authenticated`);
        await c.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
        return {commit:true};
      });
    },
    async checkAccounts() { await pool.query(`SELECT user_id FROM ${table} LIMIT 0`); },
    async accountTransaction(id, fn) {
      checkId(id);
      return tx(async c => {
        await c.query(`INSERT INTO ${table} (user_id, payload) VALUES ($1, $2::jsonb) ON CONFLICT (user_id) DO NOTHING`, [id, JSON.stringify(fresh())]);
        const {rows} = await c.query(`SELECT payload FROM ${table} WHERE user_id = $1 FOR UPDATE`, [id]);
        if (rows.length !== 1) throw Error('Account workspace unavailable.');
        const snapshot = assertSnapshot(structuredClone(rows[0].payload)); const before = JSON.stringify(snapshot);
        const reply = await fn(snapshot);
        if (reply.commit !== false) {
          const after = JSON.stringify(assertSnapshot(snapshot));
          if (after !== before) await c.query(`UPDATE ${table} SET payload = $2::jsonb, updated_at = now() WHERE user_id = $1`, [id, after]);
        }
        return reply;
      });
    },
    async importLegacy(id) {
      checkId(id);
      return tx(async c => {
        const user = await c.query('SELECT id FROM auth.users WHERE id = $1 AND email_confirmed_at IS NOT NULL', [id]);
        if (user.rows.length !== 1) throw Error('Verified account not found.');
        const {rows} = await c.query('SELECT payload FROM insureflow_private.workspace_state WHERE id = 1 FOR UPDATE');
        if (rows.length !== 1) throw Error('Legacy snapshot not found.');
        const result = await c.query(`INSERT INTO ${table} (user_id, payload) VALUES ($1, $2::jsonb) ON CONFLICT (user_id) DO NOTHING`, [id, JSON.stringify(assertSnapshot(rows[0].payload))]);
        return {commit:true, imported:result.rowCount === 1};
      });
    }
  };
}
