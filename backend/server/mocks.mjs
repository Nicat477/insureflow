import http from 'node:http';
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { properties } from './integrations.mjs';
import { pathToFileURL } from 'node:url';
import { resolve, sep } from 'node:path';
const root = process.env.DATA_DIR
  ? pathToFileURL(resolve(process.env.DATA_DIR) + sep)
  : new URL('./', import.meta.url);
function store(name) {
  const file = new URL(name + '.json', root),
    tmp = new URL(name + '.tmp', root);
  let data;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    data = [];
  }
  return {
    read: () => data,
    write: (v) => {
      writeFileSync(tmp, JSON.stringify(v, null, 2));
      renameSync(tmp, file);
      data = v;
    },
  };
}
function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}
async function parse(req) {
  let s = '';
  for await (const c of req) {
    s += c;
    if (s.length > 16000) throw Error('Too large');
  }
  return JSON.parse(s);
}
export async function startMocks(ports = [4101, 4102, 4103]) {
  const crm = store('mock-crm'),
    finance = store('mock-finance');
  const handlers = [
    async (req, res) => {
      if (req.method === 'GET' && req.url === '/health')
        return json(res, 200, { ok: true });
      if (req.method === 'GET' && req.url === '/reservations')
        return json(res, 200, properties);
      json(res, 404, {});
    },
    async (req, res) => {
      if (req.method === 'GET' && req.url === '/health')
        return json(res, 200, { ok: true });
      if (req.method === 'GET' && req.url === '/deals')
        return json(res, 200, crm.read());
      if (req.method === 'POST' && req.url === '/deals') {
        const data = await parse(req);
        if (data.simulateFailure)
          return json(res, 503, { message: 'Simulated CRM outage' });
        const existing = crm
          .read()
          .find((d) => d.externalId === data.externalId);
        if (existing) return json(res, 200, existing);
        const deal = { ...data, id: 'DEAL-' + data.applicationId };
        delete deal.simulateFailure;
        crm.write([...crm.read(), deal]);
        return json(res, 201, deal);
      }
      json(res, 404, {});
    },
    async (req, res) => {
      if (req.method === 'GET' && req.url === '/health')
        return json(res, 200, { ok: true });
      if (req.method === 'POST' && req.url === '/reset-payment') {
        const { reference } = await parse(req);
        finance.write(finance.read().filter((p) => p.reference !== reference));
        return json(res, 200, { ok: true });
      }
      if (req.method === 'GET' && req.url === '/payments')
        return json(res, 200, finance.read());
      if (req.method === 'POST' && req.url === '/payments') {
        const p = await parse(req);
        const old = finance.read().filter((x) => x.externalId === p.externalId);
        if (old.length) return json(res, 200, old);
        const { duplicate, ...fields } = p;
        const rows = [{ ...fields, id: 'PAY-' + p.externalId + '-1' }];
        if (duplicate)
          rows.push({ ...fields, id: 'PAY-' + p.externalId + '-2' });
        finance.write([...finance.read(), ...rows]);
        return json(res, 201, rows);
      }
      json(res, 404, {});
    },
  ];
  const servers = [];
  try {
    for (let i = 0; i < handlers.length; i++) {
      const server = http.createServer((req, res) =>
        handlers[i](req, res).catch(() =>
          json(res, 400, { message: 'Invalid mock request' }),
        ),
      );
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(ports[i], '127.0.0.1', resolve);
      });
      servers.push(server);
    }
  } catch (e) {
    servers.forEach((s) => s.close());
    throw e;
  }
  return { servers, ports: servers.map((s) => s.address().port) };
}
export function mockClient(ports) {
  async function req(i, path, data) {
    const res = await fetch('http://127.0.0.1:' + ports[i] + path, {
      signal: AbortSignal.timeout(3000),
      ...(data === undefined
        ? {}
        : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          }),
    });
    if (!res.ok) throw Error('Mock HTTP ' + res.status);
    return res.json();
  }
  return {
    properties: () => req(0, '/reservations'),
    crm: (d) => req(1, '/deals', d),
    payments: () => req(2, '/payments'),
    payment: (d) => req(2, '/payments', d),
    deals: () => req(1, '/deals'),
    resetPayment: (reference) => req(2, '/reset-payment', { reference }),
    health: () =>
      Promise.all(
        [0, 1, 2].map((i) =>
          req(i, '/health')
            .then(() => true)
            .catch(() => false),
        ),
      ),
  };
}
