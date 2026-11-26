import { randomUUID } from 'node:crypto';
import { estimate } from './domain.mjs';
export const properties = [
  {
    id: 'EML-101',
    unit: 'Caspian Residence / A-12',
    customer: 'Demo Customer A',
    value: 120000,
    status: 'Reserved',
  },
  {
    id: 'EML-102',
    unit: 'Park View / B-07',
    customer: 'Demo Customer B',
    value: 185000,
    status: 'Reserved',
  },
  {
    id: 'EML-103',
    unit: 'City Garden / C-03',
    customer: 'Demo Customer C',
    value: 90000,
    status: 'Available',
  },
];
export class DomainError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
const fail = (message, status) => {
  throw new DomainError(message, status);
};
const now = () => new Date().toISOString();
export function engine({ read, commit, external }) {
  const state = () => ({ applications: [], outbox: [], ...read() });
  const get = (id) =>
    state().applications.find((a) => a.id === id) ||
    fail('Application not found.', 404);
  const change = (app, job) => {
    const d = state();
    commit({
      ...d,
      applications: d.applications.map((a) => (a.id === app.id ? app : a)),
      outbox: job ? d.outbox.map((j) => (j.id === job.id ? job : j)) : d.outbox,
    });
  };
  return {
    async overview() {
      const d = state();
      let units = [],
        error = '';
      try {
        units = await external.properties();
      } catch {
        error = 'Emlax mock is unavailable.';
      }
      return {
        properties: units,
        applications: d.applications,
        outbox: d.outbox,
        emlaxError: error,
      };
    },
    async create({ propertyId }, key) {
      if (typeof key !== 'string' || key.length < 8 || key.length > 100)
        fail('Idempotency-Key required (8–100 characters).');
      const d = state();
      const old = d.applications.find((a) => a.key === key);
      if (old) {
        if (old.propertyId !== propertyId)
          fail('Idempotency key already used for a different request.', 409);
        return old;
      }
      const existing = d.applications.find((a) => a.propertyId === propertyId);
      if (existing)
        fail('Application already exists for this reservation.', 409);
      const units = await external.properties();
      const unit = units.find(
        (p) => p.id === propertyId && p.status === 'Reserved',
      );
      if (!unit) fail('Select a reserved property.');
      const app = {
        id: 'APP-' + randomUUID().slice(0, 8).toUpperCase(),
        key,
        propertyId,
        unit: unit.unit,
        customer: unit.customer,
        coverage: unit.value,
        premiumMinor: Math.round(estimate('Property', unit.value, 12) * 100),
        crm: 'Pending',
        status: 'Awaiting payment',
        payment: 'Unmatched',
        createdAt: now(),
      };
      const job = {
        id: 'CRM-' + app.id,
        applicationId: app.id,
        status: 'Pending',
        attempts: 0,
        error: '',
        updatedAt: now(),
      };
      const fresh = state();
      commit({
        ...fresh,
        applications: [app, ...fresh.applications],
        outbox: [job, ...fresh.outbox],
      });
      return app;
    },
    async sync(id, simulateFailure = false) {
      const app = get(id);
      const job = state().outbox.find((j) => j.applicationId === id);
      if (job.status === 'Synced') return app;
      try {
        const result = await external.crm({
          externalId: job.id,
          applicationId: id,
          customer: app.customer,
          unit: app.unit,
          premiumMinor: app.premiumMinor,
          simulateFailure,
        });
        const next = { ...app, crm: 'Synced', crmId: result.id };
        change(next, {
          ...job,
          status: 'Synced',
          attempts: job.attempts + 1,
          error: '',
          updatedAt: now(),
        });
        return next;
      } catch (e) {
        const next = { ...app, crm: 'Failed' };
        change(next, {
          ...job,
          status: 'Failed',
          attempts: job.attempts + 1,
          error: 'CRM unavailable or rejected request. Retry safely.',
          updatedAt: now(),
        });
        return next;
      }
    },
    async demoPayment(id, scenario) {
      const a = get(id);
      if (!['exact', 'wrong', 'duplicate'].includes(scenario))
        fail('Invalid payment scenario.');
      if (a.status !== 'Awaiting payment')
        fail('Application is already paid.', 409);
      return external.payment({
        reference: id,
        amountMinor: a.premiumMinor + (scenario === 'wrong' ? 100 : 0),
        currency: 'AZN',
        externalId: id + '-' + scenario,
        duplicate: scenario === 'duplicate',
      });
    },
    async reconcile(id) {
      const a = get(id);
      if (a.status !== 'Awaiting payment') return a;
      const payments = (await external.payments()).filter(
        (p) => p.reference === id,
      );
      const exact = payments.filter(
        (p) => p.currency === 'AZN' && p.amountMinor === a.premiumMinor,
      );
      const next = {
        ...a,
        payment:
          payments.length === 0
            ? 'Unmatched'
            : payments.length === 1 && exact.length === 1
              ? 'Matched'
              : 'Needs review',
        status:
          payments.length === 1 && exact.length === 1
            ? 'Paid'
            : 'Awaiting payment',
      };
      if (next.status === 'Paid') next.paymentId = exact[0].id;
      change(next);
      return next;
    },
    async resetPayment(id) {
      const a = get(id);
      if (a.status !== 'Awaiting payment')
        fail('Only unpaid demo applications can be reset.', 409);
      await external.resetPayment(id);
      const next = { ...a, payment: 'Unmatched' };
      change(next);
      return next;
    },
    issue(id) {
      const a = get(id);
      if (a.status === 'Policy issued') return a;
      if (a.status !== 'Paid' || a.crm !== 'Synced')
        fail('Match the payment and sync CRM before issuing.', 409);
      const start = new Date(),
        end = new Date(start);
      end.setUTCFullYear(end.getUTCFullYear() + 1);
      const policy = {
        id: 'POL-' + a.id.slice(4),
        customer: a.customer,
        type: 'Property',
        premium: a.premiumMinor / 100,
        status: 'Active',
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10),
      };
      const d = state();
      const next = { ...a, status: 'Policy issued', policyId: policy.id };
      commit({
        ...d,
        applications: d.applications.map((x) => (x.id === id ? next : x)),
        policies: [policy, ...d.policies],
      });
      return next;
    },
  };
}
