import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertSnapshot, makePostgresStore, storageMode } from './postgres-store.mjs';
const base = () => ({ db: { policies: [], claims: [], customers: [] }, crm: [], finance: [] });
function fixture() {
  let persisted = base(), staged, exists = true;
  const calls = [];
  const client = { async query(sql, args) {
    calls.push(sql);
    if (sql === 'BEGIN') { staged = structuredClone(persisted); return {}; }
    if (sql.includes('SELECT payload')) return { rows: exists ? [{payload: structuredClone(staged)}] : [] };
    if (sql.startsWith('UPDATE')) { staged = JSON.parse(args[0]); return {rowCount: 1}; }
    if (sql.startsWith('INSERT')) return { rowCount: 0 };
    if (sql === 'COMMIT') persisted = staged;
    return {};
  }, release() { calls.push('release'); } };
  return {store: makePostgresStore({connect: async () => client}), calls, data: () => persisted, missing: () => { exists = false; }};
}
test('database mode fails closed without configuration', () => {
  assert.equal(storageMode({}), 'json');
  assert.equal(storageMode({DATABASE_URL:'postgresql://example'}), 'postgres');
  assert.throws(() => storageMode({STORAGE_MODE:'postgres'}), /DATABASE_URL/);
  assert.throws(() => storageMode({STORAGE_MODE:'json',DATABASE_URL:'postgresql://example'}), /Conflicting/);
});
test('snapshot validation rejects malformed data', () => {
  assert.throws(() => assertSnapshot({db:{policies:[],claims:[]}}));
  assert.throws(() => assertSnapshot({...base(),db:{policies:[],claims:[],customers:42}}));
});
test('writes domain and finance state together before returning success', async () => {
  const f = fixture();
  const response = await f.store.transaction(s => { s.db.customers.push({id:'C-1'}); s.finance.push({id:'P-1'}); return {commit:true, status:201}; });
  assert.equal(response.status,201); assert.equal(f.data().db.customers.length,1); assert.equal(f.data().finance.length,1);
  assert.ok(f.calls.some(s => s.includes('FOR UPDATE'))); assert.equal(f.calls.at(-2),'COMMIT');
});
test('failed HTTP action rolls back staged changes', async () => {
  const f = fixture(); await f.store.transaction(s=>{s.crm.push({id:'x'});return {commit:false};});
  assert.equal(f.data().crm.length,0); assert.equal(f.calls.at(-2),'ROLLBACK');
});
test('unchanged reads do not update persistent state', async () => {
  const f=fixture(); await f.store.transaction(()=>({commit:true})); assert.ok(!f.calls.some(s=>s.startsWith('UPDATE')));
});
test('exceptions roll back and release the connection', async () => {
  const f=fixture(); await assert.rejects(f.store.transaction(()=>{throw Error('test');}), /test/); assert.deepEqual(f.calls.slice(-2),['ROLLBACK','release']);
});
test('missing row does not silently seed', async () => {
  const f=fixture(); f.missing(); await assert.rejects(f.store.transaction(()=>({commit:true})), /not initialized/);
});
test('initialization cannot overwrite an existing row', async () => {
  const f=fixture(); assert.equal(await f.store.initialize(base()),false); assert.ok(f.calls.some(s=>s.includes('ON CONFLICT (id) DO NOTHING')));
});
