import { recordAuditEvent } from './audit-repository.js';

/**
 * Shared Bills Repository
 * Handles bill templates, bills, allocations, and member payments.
 */

// ─── Bill Templates ───

export async function createBillTemplate(
  client,
  { messId, name, category, defaultAmount = '0.00', allocationMethod = 'equal', actorUserId }
) {
  const query = `
    INSERT INTO shared_bill_templates (mess_id, name, category, default_amount, allocation_method, created_by)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const { rows } = await client.query(query, [messId, name, category, defaultAmount, allocationMethod, actorUserId]);
  return rows[0];
}

export async function listBillTemplates(client, messId) {
  const query = `SELECT * FROM shared_bill_templates WHERE mess_id = $1 AND is_active = true ORDER BY name ASC;`;
  const { rows } = await client.query(query, [messId]);
  return rows;
}

// ─── Shared Bills ───

export async function createSharedBill(
  client,
  { messId, periodId, templateId = null, title, category, amount, allocationMethod = 'equal', actorUserId }
) {
  // Verify period is open
  const { rows: periodRows } = await client.query(
    `SELECT status FROM accounting_periods WHERE id = $1 AND mess_id = $2`,
    [periodId, messId]
  );
  if (periodRows.length === 0) {
    const error = new Error('Accounting period not found');
    error.code = 'NOT_FOUND';
    error.status = 404;
    throw error;
  }
  if (periodRows[0].status === 'closed') {
    const error = new Error('Cannot add bill to a closed accounting period');
    error.code = 'PERIOD_CLOSED';
    error.status = 400;
    throw error;
  }

  // Guard against duplicates from the same template in the same period
  if (templateId) {
    const { rows: existing } = await client.query(
      `SELECT id FROM shared_bills WHERE mess_id = $1 AND period_id = $2 AND template_id = $3 AND status != 'voided'`,
      [messId, periodId, templateId]
    );
    if (existing.length > 0) {
      const error = new Error('A bill from this template already exists for this period');
      error.code = 'DUPLICATE_BILL';
      error.status = 409;
      throw error;
    }
  }

  const query = `
    INSERT INTO shared_bills (mess_id, period_id, template_id, title, category, amount, allocation_method, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
  const { rows } = await client.query(query, [messId, periodId, templateId, title, category, amount, allocationMethod, actorUserId]);
  const bill = rows[0];

  await recordAuditEvent(client, {
    messId,
    actorUserId,
    action: 'CREATE_SHARED_BILL',
    entityType: 'shared_bills',
    entityId: bill.id,
    afterData: bill,
  });

  return bill;
}

export async function saveBillAllocations(client, { messId, sharedBillId, allocations, actorUserId }) {
  // Verify bill belongs to mess
  const { rows: billRows } = await client.query(
    `SELECT * FROM shared_bills WHERE id = $1 AND mess_id = $2`,
    [sharedBillId, messId]
  );
  if (billRows.length === 0) {
    const error = new Error('Shared bill not found');
    error.code = 'NOT_FOUND';
    error.status = 404;
    throw error;
  }

  // Clear previous allocations
  await client.query(`DELETE FROM bill_allocations WHERE shared_bill_id = $1 AND mess_id = $2`, [sharedBillId, messId]);

  // Insert new allocations
  for (const alloc of allocations) {
    await client.query(
      `INSERT INTO bill_allocations (mess_id, shared_bill_id, member_id, amount, weight, calculation_note)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [messId, sharedBillId, alloc.memberId, alloc.amount, alloc.weight || 1.00, alloc.calculationNote || null]
    );
  }

  await recordAuditEvent(client, {
    messId,
    actorUserId,
    action: 'SAVE_BILL_ALLOCATIONS',
    entityType: 'bill_allocations',
    entityId: sharedBillId,
    afterData: { allocationsCount: allocations.length },
  });

  return allocations;
}

export async function listSharedBills(client, messId, periodId) {
  const query = `
    SELECT sb.*,
      (SELECT COALESCE(SUM(ba.amount), 0) FROM bill_allocations ba WHERE ba.shared_bill_id = sb.id) as allocated_total
    FROM shared_bills sb
    WHERE sb.mess_id = $1 AND sb.period_id = $2
    ORDER BY sb.created_at DESC;
  `;
  const { rows } = await client.query(query, [messId, periodId]);
  return rows;
}

export async function getBillAllocations(client, messId, sharedBillId) {
  const query = `
    SELECT ba.*, mm.display_name
    FROM bill_allocations ba
    JOIN mess_members mm ON ba.member_id = mm.id
    WHERE ba.mess_id = $1 AND ba.shared_bill_id = $2
    ORDER BY mm.display_name ASC;
  `;
  const { rows } = await client.query(query, [messId, sharedBillId]);
  return rows;
}

export async function getMemberSharedBillTotals(client, messId, periodId) {
  const query = `
    SELECT
      ba.member_id,
      mm.display_name,
      COALESCE(SUM(ba.amount), 0) as total_shared_bill_charge
    FROM bill_allocations ba
    JOIN shared_bills sb ON ba.shared_bill_id = sb.id
    JOIN mess_members mm ON ba.member_id = mm.id
    WHERE ba.mess_id = $1 AND sb.period_id = $2 AND sb.status = 'confirmed'
    GROUP BY ba.member_id, mm.display_name;
  `;
  const { rows } = await client.query(query, [messId, periodId]);
  return rows;
}

// ─── Member Payments (Deposits) ───

export async function recordPayment(
  client,
  { messId, memberId, periodId, amount, paymentDate, method = 'cash', reference = null, note = null, idempotencyKey = null, actorUserId }
) {
  // Idempotency check
  if (idempotencyKey) {
    const { rows: dup } = await client.query(
      `SELECT * FROM member_payments WHERE mess_id = $1 AND idempotency_key = $2`,
      [messId, idempotencyKey]
    );
    if (dup.length > 0) {
      return dup[0]; // Return existing record
    }
  }

  // Verify period is open
  const { rows: periodRows } = await client.query(
    `SELECT status FROM accounting_periods WHERE id = $1 AND mess_id = $2`,
    [periodId, messId]
  );
  if (periodRows.length > 0 && periodRows[0].status === 'closed') {
    const error = new Error('Cannot record payment in a closed period');
    error.code = 'PERIOD_CLOSED';
    error.status = 400;
    throw error;
  }

  const query = `
    INSERT INTO member_payments (mess_id, member_id, period_id, amount, payment_date, method, reference, note, idempotency_key, recorded_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *;
  `;
  const { rows } = await client.query(query, [messId, memberId, periodId, amount, paymentDate, method, reference, note, idempotencyKey, actorUserId]);
  const payment = rows[0];

  await recordAuditEvent(client, {
    messId,
    actorUserId,
    action: 'RECORD_PAYMENT',
    entityType: 'member_payments',
    entityId: payment.id,
    afterData: payment,
  });

  return payment;
}

export async function reversePayment(
  client,
  { messId, paymentId, reason, actorUserId }
) {
  const { rows: before } = await client.query(
    `SELECT * FROM member_payments WHERE id = $1 AND mess_id = $2`,
    [paymentId, messId]
  );
  if (before.length === 0) {
    const error = new Error('Payment not found');
    error.code = 'NOT_FOUND';
    error.status = 404;
    throw error;
  }
  if (before[0].status === 'reversed') {
    const error = new Error('Payment is already reversed');
    error.code = 'ALREADY_REVERSED';
    error.status = 400;
    throw error;
  }

  const query = `
    UPDATE member_payments
    SET status = 'reversed', reversal_reason = $1, reversed_by = $2, reversed_at = now(), updated_at = now()
    WHERE id = $3 AND mess_id = $4
    RETURNING *;
  `;
  const { rows } = await client.query(query, [reason, actorUserId, paymentId, messId]);
  const reversed = rows[0];

  await recordAuditEvent(client, {
    messId,
    actorUserId,
    action: 'REVERSE_PAYMENT',
    entityType: 'member_payments',
    entityId: paymentId,
    beforeData: before[0],
    afterData: reversed,
    reason,
  });

  return reversed;
}

export async function listPayments(client, messId, periodId) {
  const query = `
    SELECT mp.*, mm.display_name as member_name
    FROM member_payments mp
    JOIN mess_members mm ON mp.member_id = mm.id
    WHERE mp.mess_id = $1 AND mp.period_id = $2
    ORDER BY mp.payment_date DESC, mp.created_at DESC;
  `;
  const { rows } = await client.query(query, [messId, periodId]);
  return rows;
}

export async function getMemberPaymentTotals(client, messId, periodId) {
  const query = `
    SELECT
      mp.member_id,
      mm.display_name,
      COALESCE(SUM(mp.amount), 0) as total_payments
    FROM member_payments mp
    JOIN mess_members mm ON mp.member_id = mm.id
    WHERE mp.mess_id = $1 AND mp.period_id = $2 AND mp.status = 'confirmed'
    GROUP BY mp.member_id, mm.display_name;
  `;
  const { rows } = await client.query(query, [messId, periodId]);
  return rows;
}
