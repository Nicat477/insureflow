import { test } from 'node:test';
import assert from 'node:assert/strict';
import { engine, properties } from './integrations.mjs';
import { seed } from './domain.mjs';
function fixture() {
  let db = structuredClone(seed),
    payments = [],
    deals = [];
  const external = {
    properties: async () => properties,
    crm: async (x) => {
      if (x.simulateFailure) throw Error('offline');
      let deal = deals.find((d) => d.externalId === x.externalId);
      if (!deal) {
        deal = { ...x, id: 'DEAL-1' };
        deals.push(deal);
      }
      return deal;
    },
    payments: async () => payments,
    payment: async (x) => {
      const a = { ...x, id: 'PAY-1' };
      payments.push(a);
      if (x.duplicate) payments.push({ ...a, id: 'PAY-2' });
      return [a];
    },
  };
  return {
    service: engine({
      read: () => db,
      commit: (d) => {
        db = d;
      },
      external,
    }),
    db: () => db,
    deals: () => deals,
  };
}
test('create application and outbox together; exact replay returns original', async () => {
  const f = fixture(),
    a = await f.service.create({ propertyId: 'EML-101' }, 'request-1'),
    b = await f.service.create({ propertyId: 'EML-101' }, 'request-1');
  assert.equal(a.id, b.id);
  assert.equal(f.db().applications.length, 1);
  assert.equal(f.db().outbox.length, 1);
  assert.equal(a.premiumMinor, 108000);
});
test('reject reused key for different property, duplicate reservation, or available property', async () => {
  const { service: s } = fixture();
  await s.create({ propertyId: 'EML-101' }, 'request-1');
  await assert.rejects(
    s.create({ propertyId: 'EML-102' }, 'request-1'),
    /different request/,
  );
  await assert.rejects(
    s.create({ propertyId: 'EML-101' }, 'request-2'),
    /already exists/,
  );
  await assert.rejects(
    s.create({ propertyId: 'EML-103' }, 'request-3'),
    /reserved property/,
  );
});
test('CRM failure is persisted and safe retry sends exactly one deal', async () => {
  const f = fixture(),
    a = await f.service.create({ propertyId: 'EML-101' }, 'request-1');
  assert.equal((await f.service.sync(a.id, true)).crm, 'Failed');
  assert.equal(f.db().outbox[0].attempts, 1);
  assert.equal((await f.service.sync(a.id)).crm, 'Synced');
  await f.service.sync(a.id);
  assert.equal(f.db().outbox[0].attempts, 2);
  assert.equal(f.deals().length, 1);
});
test('exact payment + CRM sync permits policy issuance only once', async () => {
  const f = fixture(),
    a = await f.service.create({ propertyId: 'EML-101' }, 'request-1');
  assert.throws(() => f.service.issue(a.id), /Match the payment/);
  await f.service.demoPayment(a.id, 'exact');
  assert.equal((await f.service.reconcile(a.id)).status, 'Paid');
  assert.throws(() => f.service.issue(a.id), /sync CRM/);
  await f.service.sync(a.id);
  const issued = f.service.issue(a.id);
  assert.equal(issued.status, 'Policy issued');
  assert.equal(f.service.issue(a.id).policyId, issued.policyId);
  assert.equal(f.db().policies.length, 7);
});
for (const scenario of ['wrong', 'duplicate'])
  test(`${scenario} payment remains unpaid and requires review`, async () => {
    const f = fixture(),
      a = await f.service.create({ propertyId: 'EML-101' }, 'request-1');
    await f.service.demoPayment(a.id, scenario);
    const result = await f.service.reconcile(a.id);
    assert.equal(result.status, 'Awaiting payment');
    assert.equal(result.payment, 'Needs review');
  });
test('no payment remains unmatched', async () => {
  const f = fixture(),
    a = await f.service.create({ propertyId: 'EML-101' }, 'request-1');
  assert.equal((await f.service.reconcile(a.id)).payment, 'Unmatched');
});
