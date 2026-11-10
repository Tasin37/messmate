import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMealRate,
  calculateMemberMealCharges,
  allocateSharedBill,
  calculateMemberBalance,
} from '../../src/lib/money/accounting.js';
import { toPaisa, fromPaisa } from '../../src/lib/money/paisa.js';

test('comprehensive settlement fixture: meals + shared bills + bazaar credit + deposits', () => {
  // Scenario: 4 members in mess
  // 1. Tanvir: 48 meals, paid 0 bazaar, deposited 5,000 BDT
  // 2. Rakib: 40 meals, paid 980 BDT bazaar, deposited 4,000 BDT
  // 3. Sakib: 44 meals, paid 1,350 BDT bazaar, deposited 5,500 BDT
  // 4. Naim: 48 meals, paid 0 bazaar, deposited 3,000 BDT
  // Total meals = 180
  // Total bazaar = 980 + 1350 + (3650 paid by mess/others) = 5980.00 BDT
  // Shared bill (Rent + Wifi) = 8,500.00 BDT divided equally among 4 members (2,125.00 each)

  const totalMealExpense = '5980.00';
  const members = [
    { memberId: 'm1', name: 'Tanvir', mealUnits: 48 },
    { memberId: 'm2', name: 'Rakib', mealUnits: 40 },
    { memberId: 'm3', name: 'Sakib', mealUnits: 44 },
    { memberId: 'm4', name: 'Naim', mealUnits: 48 },
  ];

  // 1. Meal Rate
  const totalMealUnits = members.reduce((s, m) => s + m.mealUnits, 0);
  assert.equal(totalMealUnits, 180);
  const rateResult = calculateMealRate(totalMealExpense, totalMealUnits);
  assert.equal(rateResult.isAvailable, true);
  // 5980 / 180 = 33.2222 BDT
  assert.equal(rateResult.rate, '33.2222');

  // 2. Meal charges with largest remainder reconciliation
  const mealCharges = calculateMemberMealCharges(members, totalMealExpense);
  const totalChargedPaisa = mealCharges.reduce((s, c) => s + c.chargePaisa, 0n);
  // Sum of charges must exactly equal total meal expense
  assert.equal(totalChargedPaisa, toPaisa(totalMealExpense));

  // 3. Shared bills (8,500 BDT / 4 = 2,125.00 each)
  const sharedBillAllocations = allocateSharedBill('8500.00', members, 'equal');
  const totalAllocatedPaisa = sharedBillAllocations.reduce((s, a) => s + a.amountPaisa, 0n);
  assert.equal(totalAllocatedPaisa, toPaisa('8500.00'));
  assert.equal(sharedBillAllocations[0].amount, '2125.00');

  // 4. Member Balances
  // Tanvir (m1): meal charge 1594.67 + shared 2125.00 - deposit 5000 = -1280.33 (Advance)
  const m1Meal = mealCharges.find((c) => c.memberId === 'm1');
  const bal1 = calculateMemberBalance({
    mealCharge: m1Meal.charge,
    sharedBillCharge: '2125.00',
    expenseCredit: '0.00',
    paymentsTotal: '5000.00',
  });
  assert.equal(bal1.status, 'advance');

  // Naim (m4): deposited 3000 -> has Due
  const m4Meal = mealCharges.find((c) => c.memberId === 'm4');
  const bal4 = calculateMemberBalance({
    mealCharge: m4Meal.charge,
    sharedBillCharge: '2125.00',
    expenseCredit: '0.00',
    paymentsTotal: '3000.00',
  });
  // Total charges = m4Meal + 2125 = 3719.67. Deposit = 3000. Balance = +719.67 (Due)
  assert.equal(bal4.status, 'due');
  assert.ok(toPaisa(bal4.balance) > 0n);

  // Sakib (m3): deposited 5500 + paid bazaar 1350 = 6850 credits. Total charges ~3586. Advance ~3263
  const m3Meal = mealCharges.find((c) => c.memberId === 'm3');
  const bal3 = calculateMemberBalance({
    mealCharge: m3Meal.charge,
    sharedBillCharge: '2125.00',
    expenseCredit: '1350.00',
    paymentsTotal: '5500.00',
  });
  assert.equal(bal3.status, 'advance');
});
