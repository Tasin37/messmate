import test from 'node:test';
import assert from 'node:assert/strict';
import { toPaisa, fromPaisa, formatBDT } from '../../src/lib/money/paisa.js';
import {
  calculateMealRate,
  calculateMemberMealCharges,
  allocateSharedBill,
  calculateMemberBalance,
} from '../../src/lib/money/accounting.js';

test('toPaisa & fromPaisa conversions', () => {
  assert.equal(toPaisa('10.50'), 1050n);
  assert.equal(toPaisa(10.5), 1050n);
  assert.equal(toPaisa('0'), 0n);
  assert.equal(toPaisa('-5.25'), -525n);
  assert.equal(toPaisa('1234.56'), 123456n);

  assert.equal(fromPaisa(1050n), '10.50');
  assert.equal(fromPaisa(0n), '0.00');
  assert.equal(fromPaisa(-525n), '-5.25');
  assert.equal(fromPaisa(5n), '0.05');
});

test('calculateMealRate handles standard and edge cases', () => {
  // Standard case
  const rate1 = calculateMealRate('6000.00', 100);
  assert.equal(rate1.isAvailable, true);
  assert.equal(rate1.rate, '60.0000');

  // Zero meals -> undefined / not available
  const rate2 = calculateMealRate('6000.00', 0);
  assert.equal(rate2.isAvailable, false);
  assert.equal(rate2.rate, null);

  // Zero expense
  const rate3 = calculateMealRate('0.00', 100);
  assert.equal(rate3.isAvailable, true);
  assert.equal(rate3.rate, '0.00');
});

test('calculateMemberMealCharges reconciles exact sum without precision loss', () => {
  const members = [
    { memberId: 'm1', mealUnits: 33 },
    { memberId: 'm2', mealUnits: 33 },
    { memberId: 'm3', mealUnits: 34 },
  ];
  // 100 meals, total 1000.00 BDT
  const charges = calculateMemberMealCharges(members, '1000.00');
  assert.equal(charges.length, 3);
  const totalChargedPaisa = charges.reduce((s, c) => s + c.chargePaisa, 0n);
  assert.equal(totalChargedPaisa, 100000n);

  // Odd decimal test: 3 members with equal meals dividing 100.00 BDT
  const equalMembers = [
    { memberId: 'm1', mealUnits: 10 },
    { memberId: 'm2', mealUnits: 10 },
    { memberId: 'm3', mealUnits: 10 },
  ];
  const oddCharges = calculateMemberMealCharges(equalMembers, '100.00');
  const sumOdd = oddCharges.reduce((s, c) => s + c.chargePaisa, 0n);
  assert.equal(sumOdd, 10000n);
  // Two should get 33.33 and one gets 33.34 to reconcile the 1 paisa residual
  assert.equal(
    oddCharges.map((c) => c.charge).sort().join(','),
    '33.33,33.33,33.34'
  );
});

test('allocateSharedBill handles equal, weighted, and custom splits', () => {
  const members = [
    { memberId: 'm1', weight: 1 },
    { memberId: 'm2', weight: 1 },
    { memberId: 'm3', weight: 1 },
  ];

  // Equal split of 1000 BDT among 3 members: 333.33 + 333.33 + 333.34 = 1000.00
  const equalSplit = allocateSharedBill('1000.00', members, 'equal');
  const equalSum = equalSplit.reduce((s, m) => s + m.amountPaisa, 0n);
  assert.equal(equalSum, 100000n);

  // Weighted split
  const weightedMembers = [
    { memberId: 'm1', weight: 1 },
    { memberId: 'm2', weight: 2 },
  ];
  const weighted = allocateSharedBill('300.00', weightedMembers, 'weighted');
  assert.equal(weighted.find((m) => m.memberId === 'm1').amount, '100.00');
  assert.equal(weighted.find((m) => m.memberId === 'm2').amount, '200.00');

  // Custom split
  const customMembers = [
    { memberId: 'm1', amount: '150.00' },
    { memberId: 'm2', amount: '150.00' },
  ];
  const custom = allocateSharedBill('300.00', customMembers, 'custom');
  assert.equal(custom[0].amount, '150.00');
  assert.equal(custom[1].amount, '150.00');
});

test('calculateMemberBalance computes correct balances and status descriptions', () => {
  // Member owes mess (Due)
  const due = calculateMemberBalance({
    mealCharge: '3500.00',
    sharedBillCharge: '2000.00',
    otherCharges: '100.00',
    expenseCredit: '500.00',
    paymentsTotal: '3000.00',
  });
  // Total charges = 5600, total credits = 3500, balance = 2100
  assert.equal(due.balance, '2100.00');
  assert.equal(due.status, 'due');
  assert.equal(due.statusTextBn, 'বাকি');

  // Advance (Mess owes member)
  const advance = calculateMemberBalance({
    mealCharge: '2000.00',
    sharedBillCharge: '1000.00',
    paymentsTotal: '4000.00',
  });
  // Total charges = 3000, credits = 4000, balance = -1000
  assert.equal(advance.balance, '-1000.00');
  assert.equal(advance.status, 'advance');
  assert.equal(advance.statusTextBn, 'অগ্রিম');

  // Settled
  const settled = calculateMemberBalance({
    mealCharge: '2000.00',
    paymentsTotal: '2000.00',
  });
  assert.equal(settled.balance, '0.00');
  assert.equal(settled.status, 'settled');
  assert.equal(settled.statusTextBn, 'পরিশোধিত');
});
