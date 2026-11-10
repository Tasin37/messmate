import crypto from 'node:crypto';
import { recordAuditEvent } from './audit-repository.js';
import { addMemberToMess } from './mess-repository.js';

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateInviteToken() {
  return crypto.randomBytes(24).toString('base64url');
}

/**
 * Creates an invite link token for a mess
 */
export async function createMessInvite(
  client,
  {
    messId,
    roleToAssign = 'member',
    expiresInDays = 7,
    maxUses = 1,
    actorUserId,
  }
) {
  const token = generateInviteToken();
  const tokenHash = hashToken(token);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const query = `
    INSERT INTO mess_invites (
      mess_id,
      token_hash,
      role_to_assign,
      expires_at,
      max_uses,
      created_by
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

  const { rows } = await client.query(query, [
    messId,
    tokenHash,
    roleToAssign,
    expiresAt.toISOString(),
    maxUses,
    actorUserId,
  ]);

  const invite = rows[0];

  await recordAuditEvent(client, {
    messId,
    actorUserId,
    action: 'CREATE_INVITE',
    entityType: 'mess_invites',
    entityId: invite.id,
    afterData: { ...invite, token_hash: '[REDACTED]' },
  });

  return {
    invite,
    token, // Only return the raw token once at creation time
  };
}

/**
 * Validates and accepts an invite token, adding the user to the mess
 */
export async function acceptMessInvite(
  client,
  { token, userId, displayName, phone = null, roomLabel = null }
) {
  const tokenHash = hashToken(token);

  // 1. Fetch valid invite
  const query = `
    SELECT * FROM mess_invites
    WHERE token_hash = $1
      AND revoked_at IS NULL
      AND expires_at > now()
      AND used_count < max_uses
    FOR UPDATE;
  `;

  const { rows } = await client.query(query, [tokenHash]);
  const invite = rows[0];

  if (!invite) {
    const error = new Error('Invite is invalid, expired, or has reached maximum usage');
    error.code = 'INVALID_INVITE';
    error.status = 400;
    throw error;
  }

  // 2. Check if already a member
  const checkMemberQuery = `
    SELECT id, status FROM mess_members
    WHERE mess_id = $1 AND user_id = $2;
  `;
  const { rows: existingMemberRows } = await client.query(checkMemberQuery, [
    invite.mess_id,
    userId,
  ]);

  if (existingMemberRows.length > 0) {
    const existing = existingMemberRows[0];
    if (existing.status === 'active') {
      const error = new Error('User is already an active member of this mess');
      error.code = 'ALREADY_MEMBER';
      error.status = 409;
      throw error;
    }
  }

  // 3. Add member
  const newMember = await addMemberToMess(client, {
    messId: invite.mess_id,
    userId,
    displayName,
    phone,
    roomLabel,
    role: invite.role_to_assign,
    actorUserId: userId,
  });

  // 4. Increment used_count
  await client.query(
    `UPDATE mess_invites SET used_count = used_count + 1 WHERE id = $1`,
    [invite.id]
  );

  return { member: newMember, messId: invite.mess_id };
}

/**
 * Revoke an active invite
 */
export async function revokeMessInvite(client, { messId, inviteId, actorUserId }) {
  const query = `
    UPDATE mess_invites
    SET revoked_at = now()
    WHERE id = $1 AND mess_id = $2 AND revoked_at IS NULL
    RETURNING *;
  `;
  const { rows } = await client.query(query, [inviteId, messId]);
  const revoked = rows[0];

  if (revoked) {
    await recordAuditEvent(client, {
      messId,
      actorUserId,
      action: 'REVOKE_INVITE',
      entityType: 'mess_invites',
      entityId: inviteId,
      afterData: revoked,
    });
  }

  return revoked;
}
