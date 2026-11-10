import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROLES,
  ACTIONS,
  hasPermission,
  assertPermission,
} from '../../src/lib/permissions/index.js';

test('permissions check for manager and member', () => {
  // Manager permissions
  assert.equal(hasPermission(ROLES.MANAGER, ACTIONS.CLOSE_PERIOD), true);
  assert.equal(hasPermission(ROLES.MANAGER, ACTIONS.EDIT_ANY_MEAL), true);
  assert.equal(hasPermission(ROLES.MANAGER, ACTIONS.REVERSE_PAYMENT), true);

  // Member permissions
  assert.equal(hasPermission(ROLES.MEMBER, ACTIONS.VIEW_DASHBOARD), true);
  assert.equal(hasPermission(ROLES.MEMBER, ACTIONS.ENTER_OWN_MEAL), true);
  assert.equal(hasPermission(ROLES.MEMBER, ACTIONS.CLOSE_PERIOD), false);
  assert.equal(hasPermission(ROLES.MEMBER, ACTIONS.EDIT_ANY_MEAL), false);
  assert.equal(hasPermission(ROLES.MEMBER, ACTIONS.REVERSE_PAYMENT), false);

  // assertPermission throws on forbidden action
  assert.throws(
    () => assertPermission(ROLES.MEMBER, ACTIONS.CLOSE_PERIOD),
    /Permission denied/
  );
  assert.doesNotThrow(() => assertPermission(ROLES.MANAGER, ACTIONS.CLOSE_PERIOD));
});
