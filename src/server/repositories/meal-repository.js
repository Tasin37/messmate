import { recordAuditEvent } from './audit-repository.js';

/**
 * Meal Repository
 * Handles meal slots, daily meal records, guest meals, and meal-off requests.
 */

export async function getMealSlots(client, messId) {
  const query = `
    SELECT * FROM meal_slots
    WHERE mess_id = $1 AND is_active = true
    ORDER BY sort_order ASC;
  `;
  const { rows } = await client.query(query, [messId]);
  return rows;
}

export async function recordMealEntry(
  client,
  {
    messId,
    memberId,
    mealDate,
    mealSlotId,
    quantity = 1.0,
    entryType = 'self',
    hostMemberId = null,
    note = null,
    actorUserId,
  }
) {
  // If guest entry, hostMemberId is required and attributed to host
  const effectiveHostId = entryType === 'guest' ? hostMemberId : null;

  // Insert or update meal entry
  // If entry exists for member, date, slot and type, update quantity
  const upsertQuery = `
    INSERT INTO meal_entries (
      mess_id,
      member_id,
      meal_date,
      meal_slot_id,
      quantity,
      entry_type,
      host_member_id,
      note,
      created_by,
      updated_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
    RETURNING *;
  `;

  const { rows } = await client.query(upsertQuery, [
    messId,
    memberId,
    mealDate,
    mealSlotId,
    quantity,
    entryType,
    effectiveHostId,
    note,
    actorUserId,
  ]);

  const entry = rows[0];

  await recordAuditEvent(client, {
    messId,
    actorUserId,
    action: 'RECORD_MEAL',
    entityType: 'meal_entries',
    entityId: entry.id,
    afterData: entry,
  });

  return entry;
}

export async function getMealsForDate(client, messId, mealDate) {
  const query = `
    SELECT 
      me.*,
      mm.display_name as member_name,
      mm.room_label,
      ms.code as slot_code,
      ms.label as slot_label,
      host.display_name as host_name
    FROM meal_entries me
    JOIN mess_members mm ON me.member_id = mm.id
    JOIN meal_slots ms ON me.meal_slot_id = ms.id
    LEFT JOIN mess_members host ON me.host_member_id = host.id
    WHERE me.mess_id = $1 AND me.meal_date = $2
    ORDER BY ms.sort_order ASC, mm.display_name ASC;
  `;
  const { rows } = await client.query(query, [messId, mealDate]);
  return rows;
}

export async function getMemberMealTotals(
  client,
  messId,
  { startDate, endDate }
) {
  const query = `
    SELECT 
      mm.id as member_id,
      mm.display_name,
      COALESCE(SUM(CASE WHEN me.entry_type = 'self' THEN me.quantity ELSE 0 END), 0) as self_meals,
      COALESCE(SUM(CASE WHEN me.entry_type = 'guest' AND me.host_member_id = mm.id THEN me.quantity ELSE 0 END), 0) as guest_meals,
      COALESCE(SUM(CASE WHEN me.entry_type = 'manager_adjustment' THEN me.quantity ELSE 0 END), 0) as adjustment_meals,
      COALESCE(
        SUM(
          CASE 
            WHEN me.entry_type = 'self' THEN me.quantity
            WHEN me.entry_type = 'guest' AND me.host_member_id = mm.id THEN me.quantity
            WHEN me.entry_type = 'manager_adjustment' THEN me.quantity
            ELSE 0 
          END
        ), 0
      ) as total_billable_meals
    FROM mess_members mm
    LEFT JOIN meal_entries me ON mm.id = me.member_id 
      AND me.mess_id = $1 
      AND me.meal_date >= $2 
      AND me.meal_date <= $3
    WHERE mm.mess_id = $1
    GROUP BY mm.id, mm.display_name
    ORDER BY mm.display_name ASC;
  `;
  const { rows } = await client.query(query, [messId, startDate, endDate]);
  return rows;
}

export async function createMealOffRequest(
  client,
  { messId, memberId, mealDate, mealSlotId, reason = null }
) {
  const query = `
    INSERT INTO meal_off_requests (
      mess_id,
      member_id,
      meal_date,
      meal_slot_id,
      status,
      reason
    ) VALUES ($1, $2, $3, $4, 'pending', $5)
    RETURNING *;
  `;
  const { rows } = await client.query(query, [
    messId,
    memberId,
    mealDate,
    mealSlotId,
    reason,
  ]);
  return rows[0];
}

export async function reviewMealOffRequest(
  client,
  { messId, requestId, status, reviewerUserId }
) {
  const query = `
    UPDATE meal_off_requests
    SET status = $1, reviewed_by = $2, reviewed_at = now()
    WHERE id = $3 AND mess_id = $4
    RETURNING *;
  `;
  const { rows } = await client.query(query, [
    status,
    reviewerUserId,
    requestId,
    messId,
  ]);
  const reviewed = rows[0];

  if (!reviewed) {
    throw new Error('Meal off request not found');
  }

  // If approved, update or insert meal entry with quantity = 0
  if (status === 'approved') {
    await client.query(
      `
      INSERT INTO meal_entries (
        mess_id,
        member_id,
        meal_date,
        meal_slot_id,
        quantity,
        entry_type,
        note,
        created_by,
        updated_by
      ) VALUES ($1, $2, $3, $4, 0.0, 'manager_adjustment', 'Approved meal-off request', $5, $5)
      `,
      [
        messId,
        reviewed.member_id,
        reviewed.meal_date,
        reviewed.meal_slot_id,
        reviewerUserId,
      ]
    );
  }

  await recordAuditEvent(client, {
    messId,
    actorUserId: reviewerUserId,
    action: `REVIEW_MEAL_OFF_${status.toUpperCase()}`,
    entityType: 'meal_off_requests',
    entityId: requestId,
    afterData: reviewed,
  });

  return reviewed;
}

export async function listMealOffRequests(client, messId, { status = null } = {}) {
  let query = `
    SELECT 
      mor.*,
      mm.display_name as member_name,
      ms.label as slot_label
    FROM meal_off_requests mor
    JOIN mess_members mm ON mor.member_id = mm.id
    JOIN meal_slots ms ON mor.meal_slot_id = ms.id
    WHERE mor.mess_id = $1
  `;
  const params = [messId];

  if (status) {
    query += ` AND mor.status = $2`;
    params.push(status);
  }

  query += ` ORDER BY mor.meal_date DESC, mor.requested_at DESC;`;

  const { rows } = await client.query(query, params);
  return rows;
}
