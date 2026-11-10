import { withTransaction } from '../../lib/db/index.js';
import { assertPermission, ACTIONS } from '../../lib/permissions/index.js';
import { getMemberByUserId } from '../repositories/mess-repository.js';
import {
  getMealSlots,
  recordMealEntry,
  getMealsForDate,
  getMemberMealTotals,
  createMealOffRequest,
  reviewMealOffRequest,
  listMealOffRequests,
} from '../repositories/meal-repository.js';

/**
 * Checks if the accounting period containing targetDate is closed
 */
async function assertPeriodOpen(client, messId, targetDate) {
  const d = new Date(targetDate);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;

  const { rows } = await client.query(
    'SELECT status FROM accounting_periods WHERE mess_id = $1 AND year = $2 AND month = $3',
    [messId, year, month]
  );

  if (rows.length > 0 && rows[0].status === 'closed') {
    const error = new Error('Cannot modify records for a closed accounting period');
    error.code = 'PERIOD_CLOSED';
    error.status = 400;
    throw error;
  }
}

export async function addMealEntryService({
  messId,
  actorUserId,
  memberId,
  mealDate,
  mealSlotId,
  quantity,
  entryType = 'self',
  hostMemberId = null,
  note = null,
}) {
  return withTransaction(async (client) => {
    // 1. Verify actor membership in the mess
    const actorMember = await getMemberByUserId(client, messId, actorUserId);
    if (!actorMember || actorMember.status !== 'active') {
      const error = new Error('User is not an active member of this mess');
      error.code = 'UNAUTHORIZED';
      error.status = 403;
      throw error;
    }

    // 2. Check permission: editing other members' meals requires MANAGER role
    if (actorMember.id !== memberId) {
      assertPermission(actorMember.role, ACTIONS.EDIT_ANY_MEAL);
    } else {
      assertPermission(actorMember.role, ACTIONS.ENTER_OWN_MEAL);
    }

    // 3. Ensure accounting period is open
    await assertPeriodOpen(client, messId, mealDate);

    // 4. If guest meal, verify hostMemberId
    const effectiveHost = entryType === 'guest' ? (hostMemberId || memberId) : null;

    // 5. Record entry
    return recordMealEntry(client, {
      messId,
      memberId,
      mealDate,
      mealSlotId,
      quantity,
      entryType,
      hostMemberId: effectiveHost,
      note,
      actorUserId,
    });
  });
}

export async function requestMealOffService({
  messId,
  actorUserId,
  memberId,
  mealDate,
  mealSlotId,
  reason,
}) {
  return withTransaction(async (client) => {
    const actorMember = await getMemberByUserId(client, messId, actorUserId);
    if (!actorMember || actorMember.status !== 'active') {
      const error = new Error('User is not an active member of this mess');
      error.code = 'UNAUTHORIZED';
      error.status = 403;
      throw error;
    }

    // Ensure member is requesting for themselves unless manager
    if (actorMember.id !== memberId && actorMember.role !== 'manager') {
      const error = new Error('Members can only request meal-off for themselves');
      error.code = 'FORBIDDEN';
      error.status = 403;
      throw error;
    }

    await assertPeriodOpen(client, messId, mealDate);

    return createMealOffRequest(client, {
      messId,
      memberId,
      mealDate,
      mealSlotId,
      reason,
    });
  });
}

export async function reviewMealOffService({
  messId,
  actorUserId,
  requestId,
  status, // 'approved' | 'rejected'
}) {
  return withTransaction(async (client) => {
    const actorMember = await getMemberByUserId(client, messId, actorUserId);
    if (!actorMember || actorMember.status !== 'active') {
      const error = new Error('User is not an active member of this mess');
      error.code = 'UNAUTHORIZED';
      error.status = 403;
      throw error;
    }

    assertPermission(actorMember.role, ACTIONS.APPROVE_MEAL_OFF);

    return reviewMealOffRequest(client, {
      messId,
      requestId,
      status,
      reviewerUserId: actorUserId,
    });
  });
}

export async function getDailyMealSheetService({ messId, actorUserId, mealDate }) {
  return withTransaction(async (client) => {
    const actorMember = await getMemberByUserId(client, messId, actorUserId);
    if (!actorMember || actorMember.status !== 'active') {
      const error = new Error('User is not an active member of this mess');
      error.code = 'UNAUTHORIZED';
      error.status = 403;
      throw error;
    }

    const slots = await getMealSlots(client, messId);
    const meals = await getMealsForDate(client, messId, mealDate);

    return {
      mealDate,
      slots,
      meals,
    };
  });
}
