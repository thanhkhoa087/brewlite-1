import test from 'node:test';
import assert from 'node:assert/strict';
import { computeCustomizedUnitPrice, computeCartSummary } from '../src/utils/pricing.mjs';

test('UI-T01: computes drink unit price accurately for Size S/M/L and toppings', () => {
  // Base 29,000 + Size L (+12,000) + 2 toppings (10,000 + 8,000) = 59,000
  const unitPrice = computeCustomizedUnitPrice(29000, 'L', [10000, 8000], false);
  assert.equal(unitPrice, 59000);

  // Bakery ignores size extra & toppings
  const bakeryPrice = computeCustomizedUnitPrice(28000, 'L', [10000], true);
  assert.equal(bakeryPrice, 28000);
});

test('UI-T02: computes cart subtotal, quantity, and SGUFREE voucher discount', () => {
  const items = [
    { unitPrice: 35000, quantity: 2 },
    { unitPrice: 42000, quantity: 1 },
  ];

  const noPromo = computeCartSummary(items);
  assert.equal(noPromo.subTotal, 112000);
  assert.equal(noPromo.totalQuantity, 3);
  assert.equal(noPromo.discountAmount, 0);
  assert.equal(noPromo.finalAmount, 112000);

  const withPromo = computeCartSummary(items, 'sgufree');
  assert.equal(withPromo.discountAmount, 15000);
  assert.equal(withPromo.finalAmount, 97000);
});

test('UI-T02 (Edge): final cart amount never drops below 0 VND', () => {
  const items = [{ unitPrice: 10000, quantity: 1 }];
  const res = computeCartSummary(items, 'SGUFREE');
  assert.equal(res.finalAmount, 0);
});
