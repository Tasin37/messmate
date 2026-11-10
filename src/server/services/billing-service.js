import { withTransaction } from '../../lib/db/index.js';
import { assertPermission, ACTIONS } from '../../lib/permissions/index.js';
import { getMemberByUserId, listMembers } from '../repositories/mess-repository.js';
import { allocateSharedBill } from '../../lib/money/accounting.js';
import { fromPaisa, toPaisa } from '../../lib/money/paisa.js';
import {
  createSharedBill,
  saveBillAllocations,
  listSharedBills,
  recordPayment,
  reversePayment,
  listPayments,
} from '../repositories/billing-repository.js';

export async function addSharedBillService({
  messId,
  actorUserId,
  periodId,
  templateId,
  title,
  category,
  amount,
  allocationMethod = 'equal',
  customAllocations = null,
}) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active') {
      const error = new Error('Not an active member');
      error.code = 'UNAUTHORIZED';
      error.status = 403;
      throw error;
    }

    assertPermission(actor.role, ACTIONS.CONFIRM_SHARED_BILL);

    // 1. Create the shared bill record
    const bill = await createSharedBill(client, {
      messId,
      periodId,
      templateId,
      title,
      category,
      amount,
      allocationMethod,
      actorUserId,
    });

    // 2. Auto-allocate among active members
    const activeMembers = await listMembers(client, messId, { status: 'active' });

    let computedAllocations;

    if (allocationMethod === 'custom' && customAllocations) {
      computedAllocations = allocateSharedBill(amount, customAllocations, 'custom');
    } else {
      const memberInputs = activeMembers.map((m) => ({
        memberId: m.id,
        weight: 1,
      }));
      computedAllocations = allocateSharedBill(amount, memberInputs, allocationMethod);
    }

    // 3. Save allocations to DB
    const dbAllocations = computedAllocations.map((a) => ({
      memberId: a.memberId,
      amount: a.amount,
      weight: 1,
      calculationNote: `${allocationMethod} split`,
    }));

    await saveBillAllocations(client, {
      messId,
      sharedBillId: bill.id,
      allocations: dbAllocations,
      actorUserId,
    });

    return { bill, allocations: computedAllocations };
  });
}

export async function listSharedBillsService({ messId, actorUserId, periodId }) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active') {
      const error = new Error('Not an active member');
      error.code = 'UNAUTHORIZED';
      error.status = 403;
      throw error;
    }

    return listSharedBills(client, messId, periodId);
  });
}

export async function recordPaymentService({
  messId,
  actorUserId,
  memberId,
  periodId,
  amount,
  paymentDate,
  method,
  reference,
  note,
  idempotencyKey,
}) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active') {
      const error = new Error('Not an active member');
      error.code = 'UNAUTHORIZED';
      error.status = 403;
      throw error;
    }

    assertPermission(actor.role, ACTIONS.RECORD_PAYMENT);

    return recordPayment(client, {
      messId,
      memberId,
      periodId,
      amount,
      paymentDate,
      method,
      reference,
      note,
      idempotencyKey,
      actorUserId,
    });
  });
}

export async function reversePaymentService({ messId, actorUserId, paymentId, reason }) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active') {
      const error = new Error('Not an active member');
      error.code = 'UNAUTHORIZED';
      error.status = 403;
      throw error;
    }

    assertPermission(actor.role, ACTIONS.REVERSE_PAYMENT);

    return reversePayment(client, { messId, paymentId, reason, actorUserId });
  });
}

export async function listPaymentsService({ messId, actorUserId, periodId }) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active') {
      const error = new Error('Not an active member');
      error.code = 'UNAUTHORIZED';
      error.status = 403;
      throw error;
    }

    return listPayments(client, messId, periodId);
  });
}
