import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

test('Hosted demo: access gate, SPA deep links, assets, API and origin restrictions', { timeout: 15000 }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'insureflow-host-'));
  const dist = join(dir, 'dist');
  await mkdir(join(dist, 'assets'), { recursive: true });
  await writeFile(join(dist, 'index.html'), '<html>InsureFlow test fixture</html>');
  await writeFile(join(dist, 'assets', 'index.js'), 'console.log("fixture")');
  const password = 'test-only-demo-password';
  const child = spawn(process.execPath, [fileURLToPath(new URL('./index.mjs', import.meta.url))], {
    env: { ...process.env, HOSTED_DEMO: '1', STATIC_DIR: dist, DEMO_PASSWORD: password, DATA_DIR: join(dir, 'data'), MOCK_EPHEMERAL: '1', PORT: '0', RENDER_EXTERNAL_URL: 'https://demo.example' }, stdio: ['ignore', 'pipe', 'pipe']
  });
  try {
    const base = await new Promise((resolve, reject) => {
      let output = '';
      child.stdout.on('data', d => { output += d; const match = output.match(/API: http:\/\/0\.0\.0\.0:(\d+)/); if (match) resolve('http://127.0.0.1:' + match[1]); });
      child.stderr.on('data', d => { output += d; });
      child.once('exit', code => reject(new Error('Server exited ' + code + ': ' + output)));
    });
    const auth = { Authorization: 'Basic ' + Buffer.from('demo:' + password).toString('base64') };
    assert.equal((await fetch(base + '/api/health')).status, 200);
    for (const path of ['/', '/api/customers', '/assets/index.js']) {
      const r = await fetch(base + path); assert.equal(r.status, 401); assert.match(r.headers.get('www-authenticate'), /Basic/);
    }
    assert.equal((await fetch(base + '/', { headers: { Authorization: 'Basic ' + Buffer.from('demo:wrong').toString('base64') } })).status, 401);
    const page = await fetch(base + '/customers', { headers: auth });
    assert.equal(page.status, 200); assert.match(await page.text(), /InsureFlow test fixture/);
    const asset = await fetch(base + '/assets/index.js', { headers: auth });
    assert.match(asset.headers.get('content-type'), /javascript/);
    assert.equal((await fetch(base + '/assets/missing.js', { headers: auth })).status, 404);
    assert.equal((await fetch(base + '/api/nonexistent', { headers: auth })).status, 404);
    assert.equal((await (await fetch(base + '/api/policies', { headers: auth })).json()).length, 6);
    const post = origin => fetch(base + '/api/quotes', { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify({ type: 'Property', coverage: 100000, months: 12 }) });
    assert.equal((await post('https://other.example')).status, 403);
    assert.equal((await post('https://demo.example')).status, 200);
  } finally {
    if (child.exitCode === null) { const done = once(child, 'exit'); child.kill(); await done; }
    await rm(dir, { recursive: true, force: true });
  }
});
