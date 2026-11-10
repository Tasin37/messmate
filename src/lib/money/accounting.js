import { toPaisa, fromPaisa } from './paisa.js';

/**
 * Calculates meal rate:
 * Meal rate = eligible meal expenses / total billable meal units
 * Returns { rate: string | null, ratePaisaPerUnit: number | null }
 */
export function calculateMealRate(totalMealExpense, totalMealUnits) {
  const units = Number(totalMealUnits);
  if (!Number.isFinite(units) || units <= 0) {
    return {
      rate: null,
      ratePaisaPerUnit: null,
      isAvailable: false,
    };
  }

  const expensePaisa = toPaisa(totalMealExpense);
  if (expensePaisa <= 0n) {
    return {
      rate: '0.00',
      ratePaisaPerUnit: 0,
      isAvailable: true,
    };
  }

  // Calculate precise rate per meal unit
  const rateNumber = Number(expensePaisa) / (units * 100);
  return {
    rate: rateNumber.toFixed(4),
    ratePaisaPerUnit: Number(expensePaisa) / units,
    isAvailable: true,
  };
}

/**
 * Calculates meal charge for all members using deterministic largest-remainder rounding
 * so that sum(member_charges) === total_meal_expense.
 */
export function calculateMemberMealCharges(members, totalMealExpense) {
  const totalExpensePaisa = toPaisa(totalMealExpense);
  const totalUnits = members.reduce((sum, m) => sum + Number(m.mealUnits || 0), 0);

  if (totalUnits <= 0 || totalExpensePaisa <= 0n) {
    return members.map((m) => ({
      memberId: m.memberId,
      mealUnits: Number(m.mealUnits || 0),
      chargePaisa: 0n,
      charge: '0.00',
    }));
  }

  // 1. Initial floor calculation and calculate fractional remainders
  const allocations = members.map((m) => {
    const units = Number(m.mealUnits || 0);
    // Raw paisa value before rounding
    const rawPaisa = (Number(totalExpensePaisa) * units) / totalUnits;
    const basePaisa = BigInt(Math.floor(rawPaisa));
    const remainder = rawPaisa - Math.floor(rawPaisa);

    return {
      memberId: m.memberId,
      mealUnits: units,
      basePaisa,
      remainder,
    };
  });

  const allocatedPaisaSum = allocations.reduce((sum, a) => sum + a.basePaisa, 0n);
  let residualPaisa = totalExpensePaisa - allocatedPaisaSum;

  // 2. Sort by largest remainder descending, then stable memberId order
  const sorted = [...allocations].sort((a, b) => {
    if (b.remainder !== a.remainder) return b.remainder - a.remainder;
    return String(a.memberId).localeCompare(String(b.memberId));
  });

  // 3. Distribute residual paisa 1 by 1
  const extraPaisaMap = new Map();
  for (const item of sorted) {
    if (residualPaisa > 0n) {
      extraPaisaMap.set(item.memberId, 1n);
      residualPaisa -= 1n;
    } else {
      extraPaisaMap.set(item.memberId, 0n);
    }
  }

  return allocations.map((item) => {
    const finalPaisa = item.basePaisa + (extraPaisaMap.get(item.memberId) || 0n);
    return {
      memberId: item.memberId,
      mealUnits: item.mealUnits,
      chargePaisa: finalPaisa,
      charge: fromPaisa(finalPaisa),
    };
  });
}

/**
 * Distributes a shared bill among members according to policy:
 * - 'equal'
 * - 'weighted'
 * - 'custom'
 * Ensures sum of member allocations exactly equals bill amount using largest remainder.
 */
export function allocateSharedBill(billAmount, members, method = 'equal') {
  const totalBillPaisa = toPaisa(billAmount);

  if (members.length === 0 || totalBillPaisa <= 0n) {
    return members.map((m) => ({
      memberId: m.memberId,
      amountPaisa: 0n,
      amount: '0.00',
    }));
  }

  if (method === 'custom') {
    // Custom allocation already has amounts provided per member
    let customSum = 0n;
    const result = members.map((m) => {
      const amountPaisa = toPaisa(m.amount || 0);
      customSum += amountPaisa;
      return {
        memberId: m.memberId,
        amountPaisa,
        amount: fromPaisa(amountPaisa),
      };
    });

    if (customSum !== totalBillPaisa) {
      throw new Error(
        `Custom allocations sum (${fromPaisa(customSum)}) does not match bill total (${fromPaisa(totalBillPaisa)})`
      );
    }
    return result;
  }

  const weights = members.map((m) => ({
    memberId: m.memberId,
    weight: method === 'weighted' ? Number(m.weight || 1) : 1,
  }));

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  if (totalWeight <= 0) {
    throw new Error('Total weight must be greater than zero');
  }

  const allocations = weights.map((w) => {
    const rawPaisa = (Number(totalBillPaisa) * w.weight) / totalWeight;
    const basePaisa = BigInt(Math.floor(rawPaisa));
    const remainder = rawPaisa - Math.floor(rawPaisa);
    return {
      memberId: w.memberId,
      basePaisa,
      remainder,
    };
  });

  const allocatedSum = allocations.reduce((sum, a) => sum + a.basePaisa, 0n);
  let residualPaisa = totalBillPaisa - allocatedSum;

  const sorted = [...allocations].sort((a, b) => {
    if (b.remainder !== a.remainder) return b.remainder - a.remainder;
    return String(a.memberId).localeCompare(String(b.memberId));
  });

  const extraPaisaMap = new Map();
  for (const item of sorted) {
    if (residualPaisa > 0n) {
      extraPaisaMap.set(item.memberId, 1n);
      residualPaisa -= 1n;
    } else {
      extraPaisaMap.set(item.memberId, 0n);
    }
  }

  return allocations.map((item) => {
    const finalPaisa = item.basePaisa + (extraPaisaMap.get(item.memberId) || 0n);
    return {
      memberId: item.memberId,
      amountPaisa: finalPaisa,
      amount: fromPaisa(finalPaisa),
    };
  });
}

/**
 * Calculates member balance:
 * final_balance = meal_charge + shared_bill_charge + other_charges - expense_credit - payments_total
 *
 * Status interpretation:
 * - final_balance > 0: "due" (member owes mess)
 * - final_balance < 0: "advance" (mess owes member)
 * - final_balance == 0: "settled"
 */
export function calculateMemberBalance({
  mealCharge = 0,
  sharedBillCharge = 0,
  otherCharges = 0,
  expenseCredit = 0,
  paymentsTotal = 0,
}) {
  const mealPaisa = toPaisa(mealCharge);
  const sharedPaisa = toPaisa(sharedBillCharge);
  const otherPaisa = toPaisa(otherCharges);
  const creditPaisa = toPaisa(expenseCredit);
  const paymentsPaisa = toPaisa(paymentsTotal);

  const totalCharges = mealPaisa + sharedPaisa + otherPaisa;
  const totalCredits = creditPaisa + paymentsPaisa;
  const balancePaisa = totalCharges - totalCredits;

  let status = 'settled';
  let statusTextEn = 'Settled';
  let statusTextBn = 'পরিশোধিত';

  if (balancePaisa > 0n) {
    status = 'due';
    statusTextEn = 'Owes mess (Due)';
    statusTextBn = 'বাকি';
  } else if (balancePaisa < 0n) {
    status = 'advance';
    statusTextEn = 'Advance / Mess owes member';
    statusTextBn = 'অগ্রিম';
  }

  return {
    balancePaisa,
    balance: fromPaisa(balancePaisa),
    status,
    statusTextEn,
    statusTextBn,
    totalChargesPaisa: totalCharges,
    totalCharges: fromPaisa(totalCharges),
    totalCreditsPaisa: totalCredits,
    totalCredits: fromPaisa(totalCredits),
  };
}
