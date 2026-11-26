import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seed, validateClaim, estimate } from './domain.mjs';
const valid = {
  policyId: 'POL-1001',
  description: 'Vehicle damage repair',
  amount: 200,
};
test('valid active policy claim', () =>
  assert.equal(validateClaim(valid, seed.policies), null));
test('expired policy rejected', () =>
  assert.match(
    validateClaim({ ...valid, policyId: 'POL-1003' }, seed.policies),
    /active policy/,
  ));
test('negative and nonfinite amount rejected', () => {
  for (const amount of [-1, Infinity, NaN, 0])
    assert.match(validateClaim({ ...valid, amount }, seed.policies), /Amount/);
});
test('short description rejected', () =>
  assert.match(
    validateClaim({ ...valid, description: 'abc' }, seed.policies),
    /Description/,
  ));
test('quote annual motor premium', () =>
  assert.equal(estimate('Motor', 20000, 12), 360));
test('invalid quote inputs rejected', () => {
  assert.throws(() => estimate('Other', 20000, 12));
  assert.throws(() => estimate('Motor', 20, 12));
  assert.throws(() => estimate('Motor', 20000, 2));
});
