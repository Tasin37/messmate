import { recordAuditEvent } from './audit-repository.js';

/**
 * Mess and membership repository
 */

export async function createMess(
  client,
  {
    name,
    slug,
    currencyCode = 'BDT',
    timezone = 'Asia/Dhaka',
    address = null,
    createdByUserId,
    creatorDisplayName = 'Manager',
    creatorPhone = null,
  }
) {
  // 1. Insert Mess
  const messQuery = `
    INSERT INTO messes (name, slug, currency_code, timezone, address, created_by)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const { rows: messRows } = await client.query(messQuery, [
    name,
    slug,
    currencyCode,
    timezone,
    address,
    createdByUserId,
  ]);
  const mess = messRows[0];

  // 2. Add creator as founding manager
  const memberQuery = `
    INSERT INTO mess_members (mess_id, user_id, display_name, phone, role, status)
    VALUES ($1, $2, $3, $4, 'manager', 'active')
    RETURNING *;
  `;
  const { rows: memberRows } = await client.query(memberQuery, [
    mess.id,
    createdByUserId,
    creatorDisplayName,
    creatorPhone,
  ]);
  const foundingMember = memberRows[0];

  // 3. Create default meal slots
  const defaultSlots = [
    { code: 'breakfast', label: 'সকালের খাবার / Breakfast', sortOrder: 1 },
    { code: 'lunch', label: 'দুপুরের খাবার / Lunch', sortOrder: 2 },
    { code: 'dinner', label: 'রাতের খাবার / Dinner', sortOrder: 3 },
  ];
  for (const slot of defaultSlots) {
    await client.query(
      `INSERT INTO meal_slots (mess_id, code, label, sort_order) VALUES ($1, $2, $3, $4)`,
      [mess.id, slot.code, slot.label, slot.sortOrder]
    );
  }

  // 4. Create default expense categories
  const defaultCategories = [
    { code: 'bazaar', name: 'বাজার / Daily Bazaar', pool: 'meal', sortOrder: 1 },
    { code: 'rent', name: 'বাসা ভাড়া / House Rent', pool: 'shared', sortOrder: 2 },
    { code: 'utilities', name: 'বিদ্যুৎ/পানি / Utilities', pool: 'shared', sortOrder: 3 },
    { code: 'internet', name: 'ইন্টারনেট / WiFi', pool: 'shared', sortOrder: 4 },
    { code: 'maid', name: 'বুয়া বিল / Maid Service', pool: 'shared', sortOrder: 5 },
    { code: 'others', name: 'অন্যান্য / Others', pool: 'shared', sortOrder: 6 },
  ];
  for (const cat of defaultCategories) {
    await client.query(
      `INSERT INTO expense_categories (mess_id, code, name, pool, sort_order) VALUES ($1, $2, $3, $4, $5)`,
      [mess.id, cat.code, cat.name, cat.pool, cat.sortOrder]
    );
  }

  // 5. Initialize current accounting period
  const now = new Date();
  await client.query(
    `INSERT INTO accounting_periods (mess_id, year, month, status) VALUES ($1, $2, $3, 'open')
     ON CONFLICT (mess_id, year, month) DO NOTHING`,
    [mess.id, now.getUTCFullYear(), now.getUTCMonth() + 1]
  );

  // 6. Record audit log
  await recordAuditEvent(client, {
    messId: mess.id,
    actorUserId: createdByUserId,
    action: 'CREATE_MESS',
    entityType: 'messes',
    entityId: mess.id,
    afterData: { mess, foundingMember },
  });

  return { mess, foundingMember };
}

export async function getMessById(client, messId) {
  const query = `SELECT * FROM messes WHERE id = $1;`;
  const { rows } = await client.query(query, [messId]);
  return rows[0] || null;
}

export async function getMessBySlug(client, slug) {
  const query = `SELECT * FROM messes WHERE slug = $1;`;
  const { rows } = await client.query(query, [slug]);
  return rows[0] || null;
}

export async function getUserMesses(client, userId) {
  const query = `
    SELECT m.*, mm.role as user_role, mm.id as member_id, mm.display_name
    FROM messes m
    JOIN mess_members mm ON m.id = mm.mess_id
    WHERE mm.user_id = $1 AND mm.status = 'active'
    ORDER BY m.created_at DESC;
  `;
  const { rows } = await client.query(query, [userId]);
  return rows;
}

export async function getMemberByUserId(client, messId, userId) {
  const query = `
    SELECT * FROM mess_members
    WHERE mess_id = $1 AND user_id = $2;
  `;
  const { rows } = await client.query(query, [messId, userId]);
  return rows[0] || null;
}

export async function listMembers(client, messId, { status = 'active' } = {}) {
  let query = `SELECT * FROM mess_members WHERE mess_id = $1`;
  const params = [messId];

  if (status) {
    query += ` AND status = $2`;
    params.push(status);
  }
  query += ` ORDER BY display_name ASC;`;

  const { rows } = await client.query(query, params);
  return rows;
}

export async function addMemberToMess(
  client,
  {
    messId,
    userId,
    displayName,
    phone = null,
    roomLabel = null,
    role = 'member',
    actorUserId,
  }
) {
  const query = `
    INSERT INTO mess_members (mess_id, user_id, display_name, phone, room_label, role, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'active')
    RETURNING *;
  `;
  const { rows } = await client.query(query, [
    messId,
    userId,
    displayName,
    phone,
    roomLabel,
    role,
  ]);
  const member = rows[0];

  await recordAuditEvent(client, {
    messId,
    actorUserId,
    action: 'ADD_MEMBER',
    entityType: 'mess_members',
    entityId: member.id,
    afterData: member,
  });

  return member;
}

export async function updateMember(
  client,
  { messId, memberId, updates, actorUserId }
) {
  const existing = (
    await client.query('SELECT * FROM mess_members WHERE mess_id = $1 AND id = $2', [
      messId,
      memberId,
    ])
  ).rows[0];

  if (!existing) {
    throw new Error('Member not found');
  }

  const allowedFields = ['display_name', 'phone', 'room_label', 'role', 'status', 'left_on'];
  const setClauses = [];
  const values = [messId, memberId];
  let paramIdx = 3;

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = $${paramIdx}`);
      values.push(updates[field]);
      paramIdx++;
    }
  }

  if (setClauses.length === 0) return existing;

  setClauses.push(`updated_at = now()`);

  const updateQuery = `
    UPDATE mess_members
    SET ${setClauses.join(', ')}
    WHERE mess_id = $1 AND id = $2
    RETURNING *;
  `;

  const { rows } = await client.query(updateQuery, values);
  const updated = rows[0];

  await recordAuditEvent(client, {
    messId,
    actorUserId,
    action: 'UPDATE_MEMBER',
    entityType: 'mess_members',
    entityId: memberId,
    beforeData: existing,
    afterData: updated,
  });

  return updated;
}
