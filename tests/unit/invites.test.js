import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateInviteToken,
  hashToken,
} from '../../src/server/repositories/invite-repository.js';

test('invite token generation produces high-entropy random strings', () => {
  const t1 = generateInviteToken();
  const t2 = generateInviteToken();
  assert.notEqual(t1, t2);
  assert.ok(t1.length >= 24);
});

test('hashToken is deterministic and SHA-256 length', () => {
  const token = 'sample-test-invite-token';
  const hash1 = hashToken(token);
  const hash2 = hashToken(token);

  assert.equal(hash1, hash2);
  assert.equal(hash1.length, 64); // 32 bytes hex = 64 characters
  assert.notEqual(token, hash1);
});
