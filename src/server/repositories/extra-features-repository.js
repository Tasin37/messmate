import { recordAuditEvent } from './audit-repository.js';

/**
 * Repository for Extra Features:
 * - Shopping List
 * - Bazaar Roster
 * - Inventory / Utensils
 * - Complaints / Suggestions
 * - Notices
 */

// ─── 1. Shopping List ───

export async function addShoppingItem(client, { messId, itemName, quantity = null, addedByMemberId = null }) {
  const query = `
    INSERT INTO shopping_list_items (mess_id, item_name, quantity, added_by)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const { rows } = await client.query(query, [messId, itemName, quantity, addedByMemberId]);
  return rows[0];
}

export async function listShoppingItems(client, messId) {
  const query = `
    SELECT sli.*, mm.display_name as added_by_name
    FROM shopping_list_items sli
    LEFT JOIN mess_members mm ON sli.added_by = mm.id
    WHERE sli.mess_id = $1
    ORDER BY sli.is_purchased ASC, sli.created_at DESC;
  `;
  const { rows } = await client.query(query, [messId]);
  return rows;
}

export async function toggleShoppingItem(client, { messId, itemId, isPurchased, purchasedByMemberId = null }) {
  const query = `
    UPDATE shopping_list_items
    SET is_purchased = $1, purchased_by = $2, updated_at = now()
    WHERE id = $3 AND mess_id = $4
    RETURNING *;
  `;
  const { rows } = await client.query(query, [isPurchased, purchasedByMemberId, itemId, messId]);
  return rows[0];
}

export async function deleteShoppingItem(client, { messId, itemId }) {
  const query = `DELETE FROM shopping_list_items WHERE id = $1 AND mess_id = $2 RETURNING *;`;
  const { rows } = await client.query(query, [itemId, messId]);
  return rows[0];
}

// ─── 2. Bazaar Roster ───

export async function assignBazaarDuty(client, { messId, memberId, dutyDate, note = null, actorUserId }) {
  const query = `
    INSERT INTO bazaar_roster (mess_id, member_id, duty_date, note)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (mess_id, duty_date)
    DO UPDATE SET member_id = $2, note = $4
    RETURNING *;
  `;
  const { rows } = await client.query(query, [messId, memberId, dutyDate, note]);
  const roster = rows[0];

  await recordAuditEvent(client, {
    messId,
    actorUserId,
    action: 'ASSIGN_BAZAAR_ROSTER',
    entityType: 'bazaar_roster',
    entityId: roster.id,
    afterData: roster,
  });

  return roster;
}

export async function listBazaarRoster(client, messId, { startDate, endDate } = {}) {
  let query = `
    SELECT br.*, mm.display_name as member_name, mm.room_label
    FROM bazaar_roster br
    JOIN mess_members mm ON br.member_id = mm.id
    WHERE br.mess_id = $1
  `;
  const params = [messId];
  if (startDate) {
    query += ` AND br.duty_date >= $2`;
    params.push(startDate);
  }
  if (endDate) {
    query += ` AND br.duty_date <= $${params.length + 1}`;
    params.push(endDate);
  }
  query += ` ORDER BY br.duty_date ASC;`;

  const { rows } = await client.query(query, params);
  return rows;
}

// ─── 3. Inventory / Utensils ───

export async function addInventoryItem(client, { messId, name, quantity = 1, category = 'utensils', condition = 'good', location = null, note = null }) {
  const query = `
    INSERT INTO inventory_items (mess_id, name, quantity, category, condition, location, note)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  const { rows } = await client.query(query, [messId, name, quantity, category, condition, location, note]);
  return rows[0];
}

export async function listInventoryItems(client, messId) {
  const query = `SELECT * FROM inventory_items WHERE mess_id = $1 ORDER BY name ASC;`;
  const { rows } = await client.query(query, [messId]);
  return rows;
}

export async function updateInventoryItem(client, { messId, itemId, updates }) {
  const allowed = ['name', 'quantity', 'category', 'condition', 'location', 'note'];
  const clauses = [];
  const values = [itemId, messId];
  let idx = 3;

  for (const k of allowed) {
    if (updates[k] !== undefined) {
      clauses.push(`${k} = $${idx}`);
      values.push(updates[k]);
      idx++;
    }
  }

  if (clauses.length === 0) return null;

  const query = `UPDATE inventory_items SET ${clauses.join(', ')} WHERE id = $1 AND mess_id = $2 RETURNING *;`;
  const { rows } = await client.query(query, values);
  return rows[0];
}

// ─── 4. Complaints / Suggestions ───

export async function createComplaint(client, { messId, memberId, title, description, isAnonymous = false }) {
  const query = `
    INSERT INTO complaints (mess_id, member_id, title, description, is_anonymous)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const { rows } = await client.query(query, [messId, memberId, title, description, isAnonymous]);
  return rows[0];
}

export async function listComplaints(client, messId) {
  const query = `
    SELECT
      c.id, c.mess_id, c.title, c.description, c.is_anonymous, c.status,
      c.resolution_note, c.created_at,
      CASE WHEN c.is_anonymous THEN 'বেনামী (Anonymous)' ELSE mm.display_name END as submitter_name
    FROM complaints c
    LEFT JOIN mess_members mm ON c.member_id = mm.id
    WHERE c.mess_id = $1
    ORDER BY c.created_at DESC;
  `;
  const { rows } = await client.query(query, [messId]);
  return rows;
}

export async function resolveComplaint(client, { messId, complaintId, resolutionNote, resolverUserId }) {
  const query = `
    UPDATE complaints
    SET status = 'resolved', resolution_note = $1, resolved_by = $2, resolved_at = now()
    WHERE id = $3 AND mess_id = $4
    RETURNING *;
  `;
  const { rows } = await client.query(query, [resolutionNote, resolverUserId, complaintId, messId]);
  return rows[0];
}

// ─── 5. Notices ───

export async function createNotice(client, { messId, title, content, isPinned = false, createdByUserId }) {
  const query = `
    INSERT INTO notices (mess_id, title, content, is_pinned, created_by)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const { rows } = await client.query(query, [messId, title, content, isPinned, createdByUserId]);
  return rows[0];
}

export async function listNotices(client, messId) {
  const query = `
    SELECT * FROM notices
    WHERE mess_id = $1
    ORDER BY is_pinned DESC, created_at DESC;
  `;
  const { rows } = await client.query(query, [messId]);
  return rows;
}
