import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

test(
  'HTTP demo: customers, quotes, claims, integration retry, payment correction and policy issuance persist',
  { timeout: 20000 },
  async () => {
    const dir = await mkdtemp(join(tmpdir(), 'insureflow-'));
    let child;
    async function stop() {
      if (child && child.exitCode === null) {
        const done = once(child, 'exit');
        child.kill();
        await done;
      }
    }
    async function start() {
      child = spawn(
        process.execPath,
        [fileURLToPath(new URL('./index.mjs', import.meta.url))],
        {
          env: {
            ...process.env,
            DATA_DIR: dir,
            MOCK_EPHEMERAL: '1',
            PORT: '0',
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );
      return new Promise((resolve, reject) => {
        let output = '';
        child.stdout.on('data', (d) => {
          output += d;
          const m = output.match(
            /InsureFlow demo API: http:\/\/127\.0\.0\.1:(\d+)/,
          );
          if (m) resolve('http://127.0.0.1:' + m[1]);
        });
        child.stderr.on('data', (d) => {
          output += d;
        });
        child.once('exit', (code) =>
          reject(Error('Server exited ' + code + ' ' + output)),
        );
      });
    }
    try {
      let base = await start();
      async function req(path, body, opts = {}) {
        const res = await fetch(base + '/api' + path, {
          method: opts.method ?? (body === undefined ? 'GET' : 'POST'),
          headers: { 'Content-Type': 'application/json', ...opts.headers },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        const data = await res.json();
        assert.equal(res.status, opts.status ?? 200, JSON.stringify(data));
        return data;
      }
      assert.equal((await req('/health')).ok, true);
      assert.deepEqual(await req('/integrations/status'), {
        emlax: true,
        bitrix24: true,
        finance: true,
      });
      assert.equal((await req('/customers')).length, 6);
      const customer = await req(
        '/customers',
        { name: 'Test Customer', email: 'test@example.test' },
        { status: 201 },
      );
      assert.ok(customer.id);
      await req('/customers', { name: 'test customer' }, { status: 409 });
      await req('/customers', { name: 'x' }, { status: 400 });
      await req(
        '/customers',
        { name: 'Cross origin' },
        { status: 403, headers: { origin: 'https://other.example' } },
      );
      assert.equal(
        (
          await req('/quotes', {
            type: 'Property',
            coverage: 100000,
            months: 12,
          })
        ).premium,
        900,
      );
      await req(
        '/quotes',
        { type: 'Property', coverage: -1, months: 12 },
        { status: 400 },
      );
      const claim = await req(
        '/claims',
        {
          policyId: 'POL-1001',
          description: 'Example claim description',
          amount: 100,
        },
        { status: 201 },
      );
      await req(
        '/claims',
        {
          policyId: 'POL-1003',
          description: 'Example claim description',
          amount: 100,
        },
        { status: 400 },
      );
      assert.equal(
        (
          await req(
            '/claims/' + claim.id,
            { status: 'Approved' },
            { method: 'PATCH' },
          )
        ).status,
        'Approved',
      );
      const body = { propertyId: 'EML-101' },
        headers = { 'Idempotency-Key': 'test-request-1' };
      const app = await req('/integrations/applications', body, { headers });
      assert.equal(
        (await req('/integrations/applications', body, { headers })).id,
        app.id,
      );
      const path = '/integrations/applications/' + app.id;
      await req(path + '/issue', {}, { status: 409 });
      assert.equal(
        (await req(path + '/sync', { simulateFailure: true })).crm,
        'Failed',
      );
      assert.equal((await req(path + '/sync', {})).crm, 'Synced');
      assert.equal((await req('/integrations/deals')).length, 1);
      await req(path + '/payment', { scenario: 'duplicate' });
      assert.equal(
        (await req(path + '/reconcile', {})).payment,
        'Needs review',
      );
      await req(path + '/reset-payment', {});
      assert.equal((await req('/integrations/payments')).length, 0);
      await req(path + '/payment', { scenario: 'exact' });
      assert.equal((await req(path + '/reconcile', {})).status, 'Paid');
      const issued = await req(path + '/issue', {});
      assert.equal((await req(path + '/issue', {})).policyId, issued.policyId);
      assert.equal((await req('/policies')).length, 7);
      await stop();
      base = await start();
      assert.equal((await req('/policies')).length, 7);
      assert.equal((await req('/integrations/deals')).length, 1);
      assert.equal((await req('/integrations/payments')).length, 1);
      assert.ok((await req('/customers')).some((c) => c.id === customer.id));
      assert.ok(
        (await req('/claims')).some(
          (c) => c.id === claim.id && c.status === 'Approved',
        ),
      );
    } finally {
      await stop();
      await rm(dir, { recursive: true, force: true });
    }
  },
);
