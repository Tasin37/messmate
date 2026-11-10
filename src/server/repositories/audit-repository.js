/**
 * Audit log repository
 * Inserts immutable audit records for all domain changes
 */

export async function recordAuditEvent(client, {
  messId = null,
  actorUserId = null,
  action,
  entityType,
  entityId,
  beforeData = null,
  afterData = null,
  reason = null,
  requestId = null,
}) {
  const query = `
    INSERT INTO audit_logs (
      mess_id,
      actor_user_id,
      action,
      entity_type,
      entity_id,
      before_data,
      after_data,
      reason,
      request_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;

  const values = [
    messId,
    actorUserId,
    action,
    entityType,
    entityId,
    beforeData ? JSON.stringify(beforeData) : null,
    afterData ? JSON.stringify(afterData) : null,
    reason,
    requestId,
  ];

  const { rows } = await client.query(query, values);
  return rows[0];
}

export async function listAuditLogs(client, messId, { limit = 50, offset = 0 } = {}) {
  const query = `
    SELECT *
    FROM audit_logs
    WHERE mess_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3;
  `;
  const { rows } = await client.query(query, [messId, limit, offset]);
  return rows;
}
