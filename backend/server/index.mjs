import http from 'node:http';
import { hosting } from './hosting.mjs';
import { readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { engine, DomainError } from './integrations.mjs';
import { startMocks, mockClient } from './mocks.mjs';
import { seed, validateClaim, claimStatuses, estimate } from './domain.mjs';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { connectPostgres, storageMode } from './postgres-store.mjs';
import { authConfig, verifiedUser } from './account-auth.mjs';
const accounts = authConfig();
// InsureFlow PostgreSQL storage v1
const mode = storageMode();
if (accounts && mode !== 'postgres') throw Error('Account mode requires PostgreSQL.');
const storage = mode === 'postgres' ? await connectPostgres() : null;
if (storage) {
  try { await storage.check(); if (accounts) await storage.checkAccounts(); }
  catch { await storage.close(); throw new Error('PostgreSQL unavailable or uninitialized. Check configuration and run db:init locally first.'); }
}
let activeSnapshot = null;
console.log('InsureFlow storage: ' + mode);
const root = process.env.DATA_DIR
  ? pathToFileURL(resolve(process.env.DATA_DIR) + sep)
  : new URL('./', import.meta.url);
const file = new URL('data.json', root);
let db;
if (!storage) {
  mkdirSync(root, { recursive: true });
  try {
    db = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    db = structuredClone(seed);
  }
}
function commit(next) {
  if (storage) {
    if (!activeSnapshot) throw new Error('No active database transaction.');
    activeSnapshot.db = next;
    db = next;
    return;
  }
  const tmp = new URL('data.tmp', root);
  writeFileSync(tmp, JSON.stringify(next, null, 2));
  renameSync(tmp, file);
  db = next;
}
function send(res, code, value) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(value));
}
async function body(req) {
  let text = '';
  for await (const chunk of req) {
    text += chunk;
    if (text.length > 16000) throw new Error('Request too large.');
  }
  return JSON.parse(text);
}
const hosted = process.env.HOSTED_DEMO === '1';
const web = hosted ? hosting({ directory: process.env.STATIC_DIR, password: accounts ? randomUUID() : process.env.DEMO_PASSWORD }) : null;
const allowedOrigins = [
  'http://localhost:5173', 'http://127.0.0.1:5173',
  'http://localhost:4173', 'http://127.0.0.1:4173',
  ...(hosted && process.env.RENDER_EXTERNAL_URL ? [new URL(process.env.RENDER_EXTERNAL_URL).origin] : []),
];
const mockToken = storage ? randomUUID() : undefined;
const scopedStore = (key) => ({
  read: () => {
    if (!activeSnapshot) throw new Error('No active mock transaction.');
    return activeSnapshot[key];
  },
  write: (value) => {
    if (!activeSnapshot) throw new Error('No active mock transaction.');
    activeSnapshot[key] = value;
  },
});
const mocks = await startMocks(
  process.env.MOCK_EPHEMERAL === '1' ? [0, 0, 0] : undefined,
  storage ? { crm: scopedStore('crm'), finance: scopedStore('finance'), token: mockToken } : {},
);
console.log(
  `Local demo mocks: Emlax ${mocks.ports[0]} | Bitrix24 ${mocks.ports[1]} | 1C ${mocks.ports[2]}`,
);
const external = mockClient(mocks.ports, mockToken);
const integration = engine({ read: () => db, commit, external });
let queue = Promise.resolve();
function serial(fn) {
  const next = queue.then(fn);
  queue = next.catch(() => {});
  return next;
}
const server = http.createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (req.method === 'GET' && path === '/api/auth/config') return send(res, 200, accounts ? { enabled: true, ...accounts } : { enabled: false });
  if (accounts && req.method === 'GET' && path === '/api/health') {
    try { await storage.checkAccounts(); return send(res, 200, { ok:true, mode:hosted?'hosted-demo':'local-demo', storage:mode, auth:'supabase' }); }
    catch { return send(res, 503, { ok:false, storage:mode, auth:'supabase' }); }
  }
  let userId;
  if (accounts) {
    if (web && path !== '/api' && !path.startsWith('/api/')) { void web.serve(req,res,path); return; }
    try { userId = await verifiedUser(req.headers.authorization, accounts); }
    catch { return send(res, 503, { message: 'Authentication service unavailable.' }); }
    if (!userId) return send(res, 401, { message: 'Sign in to access your workspace.' });
  }
  if (web && !accounts) {
    if (req.method === 'GET' && path === '/api/health') {
      if (!storage) return send(res, 200, { ok: true, mode: 'hosted-demo', storage: 'json' });
      return storage.check().then(
        () => send(res, 200, { ok: true, mode: 'hosted-demo', storage: 'postgres' }),
        () => send(res, 503, { ok: false, mode: 'hosted-demo', storage: 'postgres' }),
      );
    }
    const publicDemo = process.env.PUBLIC_DEMO === '1';
    if (publicDemo) {
      const allowed =
        req.method === 'GET' ||
        req.method === 'HEAD' ||
        (req.method === 'POST' && path === '/api/quotes');

      if (!allowed) {
        return send(res, 403, {
          message: 'This action is disabled in the public demo.',
        });
      }
    } else {
      if (!web.authorized(req, res)) return;
    }
    if (path !== '/api' && !path.startsWith('/api/')) { void web.serve(req, res, path); return; }
  }
  return serial(async () => {
    if (!storage) return handle(req, res, path);
    try {
      const transaction = accounts ? (fn) => storage.accountTransaction(userId, fn) : (fn) => storage.transaction(fn);
      const reply = await transaction(async (snapshot) => {
        activeSnapshot = snapshot;
        db = snapshot.db;
        let status, headers, responseBody;
        // Hold the HTTP result until the database transaction commits.
        const buffered = {
          writeHead(code, h) { status = code; headers = h; },
          end(value) { responseBody = value; },
        };
        try {
          await handle(req, buffered, path);
          if (status === undefined || responseBody === undefined) throw new Error('Missing API response.');
          return { status, headers, responseBody, commit: status < 400 };
        } finally { activeSnapshot = null; db = undefined; }
      });
      res.writeHead(reply.status, reply.headers);
      res.end(reply.responseBody);
    } catch {
      console.error('PostgreSQL request failed; transaction rolled back or connection interrupted.');
      if (!res.headersSent) send(res, 503, { message: 'Request could not be completed.' });
      else res.destroy();
    }
  });
});
async function handle(req, res, path) {
    try {
      if (
        req.method !== 'GET' &&
        req.headers.origin &&
        !allowedOrigins.includes(req.headers.origin)
      )
        return send(res, 403, {
          message: 'Origin not allowed for this local demo.',
        });
      if (
        ['POST', 'PATCH'].includes(req.method) &&
        !req.headers['content-type']?.startsWith('application/json')
      )
        return send(res, 415, { message: 'JSON request required.' });
      if (req.method === 'GET' && path === '/api/integrations/status') {
        const health = await external.health();
        return send(res, 200, {
          emlax: health[0],
          bitrix24: health[1],
          finance: health[2],
        });
      }
      if (req.method === 'GET' && path === '/api/integrations/payments')
        return send(res, 200, await external.payments());
      if (req.method === 'GET' && path === '/api/integrations/deals')
        return send(res, 200, await external.deals());
      if (req.method === 'GET' && path === '/api/customers') {
        const names = [
          ...new Set([
            ...db.policies.map((p) => p.customer),
            ...(db.applications || []).map((a) => a.customer),
          ]),
        ];
        const added = db.customers || [];
        return send(res, 200, [
          ...added,
          ...names
            .filter(
              (n) =>
                !added.some((c) => c.name.toLowerCase() === n.toLowerCase()),
            )
            .map((n) => ({
              id: 'seed-' + n,
              name: n,
              email: '',
              source: 'Insurance records',
            })),
        ]);
      }
      if (req.method === 'POST' && path === '/api/customers') {
        const data = await body(req);
        const name = typeof data?.name === 'string' ? data.name.trim() : '';
        const email = typeof data?.email === 'string' ? data.email.trim() : '';
        if (
          name.length < 2 ||
          name.length > 80 ||
          email.length > 120 ||
          (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        )
          return send(res, 400, {
            message: 'Enter a valid name and optional email.',
          });
        const existing = [
          ...db.policies.map((p) => p.customer),
          ...(db.applications || []).map((a) => a.customer),
          ...(db.customers || []).map((c) => c.name),
        ];
        if (existing.some((n) => n.toLowerCase() === name.toLowerCase()))
          return send(res, 409, { message: 'Customer already exists.' });
        const item = {
          id: 'CUS-' + randomUUID().slice(0, 8),
          name,
          email,
          source: 'Manual demo',
        };
        commit({ ...db, customers: [item, ...(db.customers || [])] });
        return send(res, 201, item);
      }

      if (req.method === 'GET' && path === '/api/health')
        return send(res, 200, { ok: true, mode: 'local-demo', storage: mode });
      if (path.startsWith('/api/integrations')) {
        const result = await (async () => {
          if (req.method === 'GET' && path === '/api/integrations')
            return integration.overview();
          if (
            req.method === 'POST' &&
            path === '/api/integrations/applications'
          )
            return integration.create(
              await body(req),
              req.headers['idempotency-key'],
            );
          const m = path.match(
            /^\/api\/integrations\/applications\/([^/]+)\/(sync|payment|reconcile|issue|reset-payment)$/,
          );
          if (req.method === 'POST' && m) {
            const id = decodeURIComponent(m[1]);
            const data = await body(req);
            switch (m[2]) {
              case 'sync':
                return integration.sync(id, data.simulateFailure === true);
              case 'payment':
                return integration.demoPayment(id, data.scenario);
              case 'reconcile':
                return integration.reconcile(id);
              case 'issue':
                return integration.issue(id);
              case 'reset-payment':
                return integration.resetPayment(id);
            }
          }
          throw new DomainError('Integration endpoint not found.', 404);
        })();
        return send(res, 200, result);
      }
      if (req.method === 'GET' && path === '/api/policies')
        return send(res, 200, db.policies);
      if (req.method === 'GET' && path === '/api/claims')
        return send(res, 200, db.claims);
      if (req.method === 'POST' && path === '/api/claims') {
        const data = await body(req);
        const error = validateClaim(data, db.policies);
        if (error) return send(res, 400, { message: error });
        const item = {
          id: 'CLM-' + randomUUID().slice(0, 8).toUpperCase(),
          policyId: data.policyId,
          description: data.description.trim(),
          amount: data.amount,
          status: 'Pending',
          date: new Date().toISOString().slice(0, 10),
        };
        commit({ ...db, claims: [item, ...db.claims] });
        return send(res, 201, item);
      }
      if (req.method === 'PATCH' && path.startsWith('/api/claims/')) {
        const id = decodeURIComponent(path.slice(12));
        const data = await body(req);
        if (!claimStatuses.includes(data?.status))
          return send(res, 400, { message: 'Invalid status.' });
        const item = db.claims.find((c) => c.id === id);
        if (!item) return send(res, 404, { message: 'Claim not found.' });
        const updated = { ...item, status: data.status };
        commit({
          ...db,
          claims: db.claims.map((c) => (c.id === id ? updated : c)),
        });
        return send(res, 200, updated);
      }
      if (req.method === 'POST' && path === '/api/quotes') {
        const data = await body(req);
        return send(res, 200, {
          premium: estimate(data.type, data.coverage, data.months),
          currency: 'AZN',
          illustrative: true,
        });
      }
      return send(res, 404, { message: 'Endpoint not found.' });
    } catch (e) {
      if (e instanceof DomainError)
        return send(res, e.status, { message: e.message });
      return send(res, 400, {
        message:
          e instanceof SyntaxError
            ? 'Invalid JSON.'
            : e.message === 'Invalid quote parameters.'
              ? e.message
              : 'Request could not be completed.',
      });
    }
}
server.requestTimeout = 15000;
const host = hosted ? '0.0.0.0' : '127.0.0.1';
server.listen(Number(process.env.PORT ?? 3001), host, () =>
  console.log('InsureFlow demo API: http://' + host + ':' + server.address().port),
);
