import { withTransaction } from '../../lib/db/index.js';
import { assertPermission, ACTIONS } from '../../lib/permissions/index.js';
import { getMemberByUserId, listMembers } from '../repositories/mess-repository.js';
import {
  getExpenseCategories,
  createExpense,
  voidExpense,
  listExpenses,
} from '../repositories/expense-repository.js';

export async function addExpenseService({
  messId,
  actorUserId,
  expenseDate,
  paidByMemberId,
  categoryId,
  title,
  amount,
  note,
}) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active') {
      const error = new Error('Not an active member');
      error.code = 'UNAUTHORIZED';
      error.status = 403;
      throw error;
    }

    assertPermission(actor.role, ACTIONS.ADD_EXPENSE);

    return createExpense(client, {
      messId,
      expenseDate,
      paidByMemberId,
      categoryId,
      title,
      amount,
      note,
      actorUserId,
    });
  });
}

export async function voidExpenseService({ messId, actorUserId, expenseId, reason }) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active') {
      const error = new Error('Not an active member');
      error.code = 'UNAUTHORIZED';
      error.status = 403;
      throw error;
    }

    assertPermission(actor.role, ACTIONS.VOID_EXPENSE);

    return voidExpense(client, { messId, expenseId, reason, actorUserId });
  });
}

export async function listExpensesService({ messId, actorUserId, startDate, endDate, status }) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active') {
      const error = new Error('Not an active member');
      error.code = 'UNAUTHORIZED';
      error.status = 403;
      throw error;
    }

    return listExpenses(client, messId, { startDate, endDate, status });
  });
}

export async function getCategoriesService({ messId, actorUserId }) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active') {
      const error = new Error('Not an active member');
      error.code = 'UNAUTHORIZED';
      error.status = 403;
      throw error;
    }

    return getExpenseCategories(client, messId);
  });
}
