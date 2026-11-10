import { withTransaction } from '../../lib/db/index.js';
import { assertPermission, ACTIONS } from '../../lib/permissions/index.js';
import { getMemberByUserId } from '../repositories/mess-repository.js';
import {
  calculatePeriodSettlement,
  closePeriod,
  reopenPeriod,
  getPeriodSettlement,
} from '../repositories/settlement-repository.js';

export async function calculatePeriodSettlementService({ messId, actorUserId, periodId }) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active') {
      const error = new Error('Not an active member');
      error.code = 'UNAUTHORIZED';
      error.status = 403;
      throw error;
    }

    assertPermission(actor.role, ACTIONS.VIEW_ALL_BALANCES);

    return calculatePeriodSettlement(client, {
      messId,
      periodId,
      calculatedByUserId: actorUserId,
    });
  });
}

export async function closePeriodService({ messId, actorUserId, periodId }) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active') {
      const error = new Error('Not an active member');
      error.code = 'UNAUTHORIZED';
      error.status = 403;
      throw error;
    }

    assertPermission(actor.role, ACTIONS.CLOSE_PERIOD);

    // Calculate snapshot first to ensure fresh data
    await calculatePeriodSettlement(client, {
      messId,
      periodId,
      calculatedByUserId: actorUserId,
    });

    return closePeriod(client, { messId, periodId, closedByUserId: actorUserId });
  });
}

export async function reopenPeriodService({ messId, actorUserId, periodId, reason }) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active') {
      const error = new Error('Not an active member');
      error.code = 'UNAUTHORIZED';
      error.status = 403;
      throw error;
    }

    assertPermission(actor.role, ACTIONS.REOPEN_PERIOD);

    return reopenPeriod(client, { messId, periodId, reason, reopenedByUserId: actorUserId });
  });
}

export async function getPeriodSettlementService({ messId, actorUserId, periodId }) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active') {
      const error = new Error('Not an active member');
      error.code = 'UNAUTHORIZED';
      error.status = 403;
      throw error;
    }

    return getPeriodSettlement(client, messId, periodId);
  });
}

/**
 * Exports settlement data as CSV string
 */
export async function exportPeriodCsvService({ messId, actorUserId, periodId }) {
  const data = await getPeriodSettlementService({ messId, actorUserId, periodId });
  if (!data || !data.lines) {
    throw new Error('No settlement snapshot found for this period');
  }

  const headers = [
    'Member Name',
    'Meal Count',
    'Meal Charge (BDT)',
    'Shared Bills (BDT)',
    'Expense Credits (BDT)',
    'Deposits (BDT)',
    'Final Balance (BDT)',
  ];

  const rows = data.lines.map((l) => [
    `"${l.display_name.replace(/"/g, '""')}"`,
    l.meal_count,
    l.meal_charge,
    l.shared_bill_charge,
    l.expense_credit,
    l.payments_total,
    l.final_balance,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  return csv;
}
