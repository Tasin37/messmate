import { recordAuditEvent } from './audit-repository.js';

/**
 * Expense Repository
 * Handles bazaar expenses, categories, and receipt metadata.
 */

export async function getExpenseCategories(client, messId) {
  const query = `
    SELECT * FROM expense_categories
    WHERE mess_id = $1 AND is_active = true
    ORDER BY sort_order ASC;
  `;
  const { rows } = await client.query(query, [messId]);
  return rows;
}

export async function createExpense(
  client,
  {
    messId,
    periodId,
    expenseDate,
    paidByMemberId,
    categoryId,
    title,
    amount,
    note = null,
    status = 'approved',
    actorUserId,
  }
) {
  // Resolve period if not provided
  let resolvedPeriodId = periodId;
  if (!resolvedPeriodId) {
    const d = new Date(expenseDate);
    const { rows: periodRows } = await client.query(
      `SELECT id, status FROM accounting_periods
       WHERE mess_id = $1 AND year = $2 AND month = $3`,
      [messId, d.getUTCFullYear(), d.getUTCMonth() + 1]
    );
    if (periodRows.length === 0) {
      // Auto-create period if it doesn't exist
      const { rows: newPeriod } = await client.query(
        `INSERT INTO accounting_periods (mess_id, year, month, status)
         VALUES ($1, $2, $3, 'open')
         ON CONFLICT (mess_id, year, month) DO UPDATE SET mess_id = $1
         RETURNING id, status`,
        [messId, d.getUTCFullYear(), d.getUTCMonth() + 1]
      );
      resolvedPeriodId = newPeriod[0].id;
      if (newPeriod[0].status === 'closed') {
        const error = new Error('Cannot add expense to a closed accounting period');
        error.code = 'PERIOD_CLOSED';
        error.status = 400;
        throw error;
      }
    } else {
      if (periodRows[0].status === 'closed') {
        const error = new Error('Cannot add expense to a closed accounting period');
        error.code = 'PERIOD_CLOSED';
        error.status = 400;
        throw error;
      }
      resolvedPeriodId = periodRows[0].id;
    }
  }

  // Verify payer belongs to this mess
  const { rows: memberRows } = await client.query(
    `SELECT id FROM mess_members WHERE id = $1 AND mess_id = $2 AND status = 'active'`,
    [paidByMemberId, messId]
  );
  if (memberRows.length === 0) {
    const error = new Error('Payer is not an active member of this mess');
    error.code = 'INVALID_MEMBER';
    error.status = 400;
    throw error;
  }

  // Verify category belongs to this mess
  const { rows: catRows } = await client.query(
    `SELECT id FROM expense_categories WHERE id = $1 AND mess_id = $2`,
    [categoryId, messId]
  );
  if (catRows.length === 0) {
    const error = new Error('Category does not belong to this mess');
    error.code = 'INVALID_CATEGORY';
    error.status = 400;
    throw error;
  }

  const query = `
    INSERT INTO expenses (
      mess_id, period_id, expense_date, paid_by_member_id,
      category_id, title, amount, note, status, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *;
  `;

  const { rows } = await client.query(query, [
    messId, resolvedPeriodId, expenseDate, paidByMemberId,
    categoryId, title, amount, note, status, actorUserId,
  ]);
  const expense = rows[0];

  await recordAuditEvent(client, {
    messId,
    actorUserId,
    action: 'CREATE_EXPENSE',
    entityType: 'expenses',
    entityId: expense.id,
    afterData: expense,
  });

  return expense;
}

export async function voidExpense(
  client,
  { messId, expenseId, reason, actorUserId }
) {
  const { rows: before } = await client.query(
    `SELECT * FROM expenses WHERE id = $1 AND mess_id = $2`,
    [expenseId, messId]
  );
  if (before.length === 0) {
    const error = new Error('Expense not found');
    error.code = 'NOT_FOUND';
    error.status = 404;
    throw error;
  }
  if (before[0].status === 'voided') {
    const error = new Error('Expense is already voided');
    error.code = 'ALREADY_VOIDED';
    error.status = 400;
    throw error;
  }

  const query = `
    UPDATE expenses
    SET status = 'voided', void_reason = $1, voided_by = $2, voided_at = now(), updated_at = now()
    WHERE id = $3 AND mess_id = $4
    RETURNING *;
  `;
  const { rows } = await client.query(query, [reason, actorUserId, expenseId, messId]);
  const voided = rows[0];

  await recordAuditEvent(client, {
    messId,
    actorUserId,
    action: 'VOID_EXPENSE',
    entityType: 'expenses',
    entityId: expenseId,
    beforeData: before[0],
    afterData: voided,
    reason,
  });

  return voided;
}

export async function listExpenses(
  client,
  messId,
  { startDate, endDate, status = null, limit = 50, offset = 0 } = {}
) {
  let query = `
    SELECT
      e.*,
      mm.display_name as paid_by_name,
      ec.name as category_name,
      ec.pool as category_pool
    FROM expenses e
    JOIN mess_members mm ON e.paid_by_member_id = mm.id
    JOIN expense_categories ec ON e.category_id = ec.id
    WHERE e.mess_id = $1
  `;
  const params = [messId];
  let idx = 2;

  if (startDate) {
    query += ` AND e.expense_date >= $${idx}`;
    params.push(startDate);
    idx++;
  }
  if (endDate) {
    query += ` AND e.expense_date <= $${idx}`;
    params.push(endDate);
    idx++;
  }
  if (status) {
    query += ` AND e.status = $${idx}`;
    params.push(status);
    idx++;
  }

  query += ` ORDER BY e.expense_date DESC, e.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
  params.push(limit, offset);

  const { rows } = await client.query(query, params);
  return rows;
}

export async function getExpenseTotalsForPeriod(client, messId, periodId) {
  const query = `
    SELECT
      ec.pool,
      COALESCE(SUM(e.amount), 0) as total_amount,
      COUNT(e.id) as entry_count
    FROM expenses e
    JOIN expense_categories ec ON e.category_id = ec.id
    WHERE e.mess_id = $1 AND e.period_id = $2 AND e.status = 'approved'
    GROUP BY ec.pool;
  `;
  const { rows } = await client.query(query, [messId, periodId]);
  return rows;
}

export async function getMemberExpenseCredits(client, messId, periodId) {
  const query = `
    SELECT
      e.paid_by_member_id as member_id,
      mm.display_name,
      COALESCE(SUM(e.amount), 0) as total_credit
    FROM expenses e
    JOIN mess_members mm ON e.paid_by_member_id = mm.id
    WHERE e.mess_id = $1 AND e.period_id = $2 AND e.status = 'approved'
    GROUP BY e.paid_by_member_id, mm.display_name;
  `;
  const { rows } = await client.query(query, [messId, periodId]);
  return rows;
}
