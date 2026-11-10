import { recordAuditEvent } from './audit-repository.js';
import {
  calculateMealRate,
  calculateMemberMealCharges,
  calculateMemberBalance,
} from '../../lib/money/accounting.js';
import { fromPaisa, toPaisa } from '../../lib/money/paisa.js';
import { getMemberMealTotals } from './meal-repository.js';
import { getExpenseTotalsForPeriod, getMemberExpenseCredits } from './expense-repository.js';
import { getMemberSharedBillTotals, getMemberPaymentTotals } from './billing-repository.js';
import { listMembers } from './mess-repository.js';

/**
 * Calculates complete monthly settlement snapshot for a mess accounting period
 */
export async function calculatePeriodSettlement(client, { messId, periodId, calculatedByUserId }) {
  // 1. Fetch period details
  const { rows: periodRows } = await client.query(
    `SELECT * FROM accounting_periods WHERE id = $1 AND mess_id = $2`,
    [periodId, messId]
  );
  if (periodRows.length === 0) {
    const error = new Error('Accounting period not found');
    error.code = 'NOT_FOUND';
    error.status = 404;
    throw error;
  }
  const period = periodRows[0];

  // Derive date bounds for the period (e.g. 2026-11-01 to 2026-11-30)
  const startDate = `${period.year}-${String(period.month).padStart(2, '0')}-01`;
  const lastDay = new Date(Date.UTC(period.year, period.month, 0)).getUTCDate();
  const endDate = `${period.year}-${String(period.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // 2. Fetch all members
  const members = await listMembers(client, messId, { status: null });

  // 3. Fetch meal totals per member
  const mealRows = await getMemberMealTotals(client, messId, { startDate, endDate });
  const mealMap = new Map(mealRows.map((m) => [m.member_id, Number(m.total_billable_meals || 0)]));

  // 4. Fetch meal-pool expense totals
  const expensePools = await getExpenseTotalsForPeriod(client, messId, periodId);
  const mealPoolRow = expensePools.find((p) => p.pool === 'meal');
  const totalMealExpense = mealPoolRow ? String(mealPoolRow.total_amount) : '0.00';

  // 5. Calculate total meal units and meal rate
  const totalMealUnits = members.reduce((sum, m) => sum + (mealMap.get(m.id) || 0), 0);
  const rateResult = calculateMealRate(totalMealExpense, totalMealUnits);

  // 6. Calculate member meal charges using deterministic rounding
  const memberMealInputs = members.map((m) => ({
    memberId: m.id,
    mealUnits: mealMap.get(m.id) || 0,
  }));
  const mealCharges = calculateMemberMealCharges(memberMealInputs, totalMealExpense);
  const mealChargeMap = new Map(mealCharges.map((c) => [c.memberId, c]));

  // 7. Fetch shared bill charges per member
  const billRows = await getMemberSharedBillTotals(client, messId, periodId);
  const billMap = new Map(billRows.map((b) => [b.member_id, String(b.total_shared_bill_charge || '0.00')]));

  // 8. Fetch expense credits (bazaar expenses paid by member)
  const creditRows = await getMemberExpenseCredits(client, messId, periodId);
  const creditMap = new Map(creditRows.map((c) => [c.member_id, String(c.total_credit || '0.00')]));

  // 9. Fetch deposits/payments made by member
  const paymentRows = await getMemberPaymentTotals(client, messId, periodId);
  const paymentMap = new Map(paymentRows.map((p) => [p.member_id, String(p.total_payments || '0.00')]));

  // 10. Generate settlement line for every member
  const lines = members.map((m) => {
    const mealInfo = mealChargeMap.get(m.id) || { mealUnits: 0, charge: '0.00' };
    const sharedBillCharge = billMap.get(m.id) || '0.00';
    const expenseCredit = creditMap.get(m.id) || '0.00';
    const paymentsTotal = paymentMap.get(m.id) || '0.00';

    const balanceInfo = calculateMemberBalance({
      mealCharge: mealInfo.charge,
      sharedBillCharge,
      otherCharges: '0.00',
      expenseCredit,
      paymentsTotal,
    });

    return {
      memberId: m.id,
      displayName: m.display_name,
      mealCount: mealInfo.mealUnits,
      mealCharge: mealInfo.charge,
      sharedBillCharge,
      otherCharges: '0.00',
      expenseCredit,
      paymentsTotal,
      finalBalance: balanceInfo.balance,
      status: balanceInfo.status,
      statusTextEn: balanceInfo.statusTextEn,
      statusTextBn: balanceInfo.statusTextBn,
      breakdownJson: {
        mealRate: rateResult.rate,
        totalCharges: balanceInfo.totalCharges,
        totalCredits: balanceInfo.totalCredits,
      },
    };
  });

  // Calculate totals
  const totalSharedBills = lines.reduce((s, l) => s + toPaisa(l.sharedBillCharge), 0n);

  // 11. Upsert snapshot in monthly_settlements
  await client.query(`DELETE FROM monthly_settlements WHERE mess_id = $1 AND period_id = $2`, [messId, periodId]);

  const insertSettlementQuery = `
    INSERT INTO monthly_settlements (
      mess_id, period_id, calculated_by, total_meal_count, total_expense_amount, total_shared_bill_amount
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const { rows: settlementRows } = await client.query(insertSettlementQuery, [
    messId,
    periodId,
    calculatedByUserId,
    totalMealUnits,
    totalMealExpense,
    fromPaisa(totalSharedBills),
  ]);
  const settlement = settlementRows[0];

  // 12. Insert settlement lines
  for (const line of lines) {
    await client.query(
      `
      INSERT INTO settlement_lines (
        mess_id, settlement_id, member_id, meal_count, meal_charge,
        shared_bill_charge, other_charges, expense_credit, payments_total,
        final_balance, breakdown_json
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
      [
        messId,
        settlement.id,
        line.memberId,
        line.mealCount,
        line.mealCharge,
        line.sharedBillCharge,
        line.otherCharges,
        line.expenseCredit,
        line.paymentsTotal,
        line.finalBalance,
        JSON.stringify(line.breakdownJson),
      ]
    );
  }

  return {
    settlement,
    rateResult,
    totalMealUnits,
    totalMealExpense,
    totalSharedBillAmount: fromPaisa(totalSharedBills),
    lines,
  };
}

export async function closePeriod(client, { messId, periodId, closedByUserId }) {
  const query = `
    UPDATE accounting_periods
    SET status = 'closed', closed_at = now(), closed_by = $1, updated_at = now()
    WHERE id = $2 AND mess_id = $3 AND status = 'open'
    RETURNING *;
  `;
  const { rows } = await client.query(query, [closedByUserId, periodId, messId]);
  const closed = rows[0];

  if (!closed) {
    throw new Error('Period not found or already closed');
  }

  await recordAuditEvent(client, {
    messId,
    actorUserId: closedByUserId,
    action: 'CLOSE_PERIOD',
    entityType: 'accounting_periods',
    entityId: periodId,
    afterData: closed,
  });

  return closed;
}

export async function reopenPeriod(client, { messId, periodId, reason, reopenedByUserId }) {
  if (!reason || reason.trim().length === 0) {
    const error = new Error('A reason is required to reopen a closed accounting period');
    error.code = 'REASON_REQUIRED';
    error.status = 400;
    throw error;
  }

  const query = `
    UPDATE accounting_periods
    SET status = 'open', reopened_at = now(), reopened_by = $1, updated_at = now()
    WHERE id = $2 AND mess_id = $3 AND status = 'closed'
    RETURNING *;
  `;
  const { rows } = await client.query(query, [reopenedByUserId, periodId, messId]);
  const reopened = rows[0];

  if (!reopened) {
    throw new Error('Period not found or already open');
  }

  await recordAuditEvent(client, {
    messId,
    actorUserId: reopenedByUserId,
    action: 'REOPEN_PERIOD',
    entityType: 'accounting_periods',
    entityId: periodId,
    afterData: reopened,
    reason,
  });

  return reopened;
}

export async function getPeriodSettlement(client, messId, periodId) {
  const settlementQuery = `
    SELECT * FROM monthly_settlements WHERE mess_id = $1 AND period_id = $2 ORDER BY calculated_at DESC LIMIT 1;
  `;
  const { rows: settlementRows } = await client.query(settlementQuery, [messId, periodId]);
  if (settlementRows.length === 0) return null;

  const settlement = settlementRows[0];
  const linesQuery = `
    SELECT sl.*, mm.display_name
    FROM settlement_lines sl
    JOIN mess_members mm ON sl.member_id = mm.id
    WHERE sl.mess_id = $1 AND sl.settlement_id = $2
    ORDER BY mm.display_name ASC;
  `;
  const { rows: lines } = await client.query(linesQuery, [messId, settlement.id]);

  return { settlement, lines };
}
