import { connectPostgres } from './postgres-store.mjs';
let store;
try {
  store = await connectPostgres();
  if (process.argv[2] === 'init') { await store.initAccounts(); await store.checkAccounts(); console.log('Private account workspace table is ready. Legacy data unchanged.'); }
  else if (process.argv[2] === 'import-legacy') { const r = await store.importLegacy(process.argv[3]); console.log(r.imported ? 'Legacy fictional snapshot copied to verified account. Original retained.' : 'Account already has a workspace. Nothing overwritten.'); if (!r.imported) process.exitCode=1; }
  else throw Error('Use init or import-legacy USER_UUID.');
} catch(e) { console.error('Account operation failed. Check configuration and verified account UUID. Code: ' + (/^[A-Z0-9_]+$/.test(e.code || '') ? e.code : 'UNKNOWN')); process.exitCode = 1; }
finally { if(store) await store.close(); }
