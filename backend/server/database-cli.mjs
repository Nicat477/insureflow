import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { seed } from './domain.mjs';
import { connectPostgres, assertSnapshot } from './postgres-store.mjs';
const dir = process.env.DATA_DIR ? pathToFileURL(resolve(process.env.DATA_DIR) + sep) : new URL('./', import.meta.url);
function read(name, fallback) {
  try { return JSON.parse(readFileSync(new URL(name, dir), 'utf8')); }
  catch (e) { if (e.code !== 'ENOENT') throw e; return structuredClone(fallback); }
}
let store;
try {
  const action = process.argv[2];
  if (!['init','backup'].includes(action)) throw Error('Use init or backup.');
  store = await connectPostgres();
  if (action === 'init') {
    const snapshot = assertSnapshot({ db: read('data.json', seed), crm: read('mock-crm.json', []), finance: read('mock-finance.json', []) });
    const imported = await store.initialize(snapshot);
    console.log(imported ? 'Initial local demo snapshot imported. Existing local files were not changed.' : 'Database already initialized. Existing cloud data was NOT overwritten.');
    console.log('Database connection verified.');
  } else {
    const snapshot = await store.snapshot();
    const backup = new URL('../.local-backups/', import.meta.url);
    mkdirSync(backup, { recursive: true });
    const name = 'workspace-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
    writeFileSync(new URL(name, backup), JSON.stringify(snapshot, null, 2), { flag: 'wx', mode: 0o600 });
    console.log('Backup saved in backend/.local-backups/' + name + '. Keep private; do not commit.');
  }
} catch (e) {
  console.error('Database operation failed. Check DATABASE_URL, CA certificate, database availability, and local JSON validity. Error code: ' + (typeof e.code === 'string' && /^[A-Z0-9_]+$/.test(e.code) ? e.code : 'UNKNOWN'));
  process.exitCode = 1;
} finally { if (store) await store.close(); }
