/**
 * Centralized Permission and Role Enforcement
 * Follows docs/security.md and docs/api-spec.md
 */

export const ROLES = {
  MANAGER: 'manager',
  MEMBER: 'member',
};

export const ACTIONS = {
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_OWN_STATEMENT: 'view_own_statement',
  VIEW_ALL_BALANCES: 'view_all_balances',
  ENTER_OWN_MEAL: 'enter_own_meal',
  EDIT_ANY_MEAL: 'edit_any_meal',
  APPROVE_MEAL_OFF: 'approve_meal_off',
  ADD_EXPENSE: 'add_expense',
  VOID_EXPENSE: 'void_expense',
  CONFIRM_SHARED_BILL: 'confirm_shared_bill',
  RECORD_PAYMENT: 'record_payment',
  REVERSE_PAYMENT: 'reverse_payment',
  CLOSE_PERIOD: 'close_period',
  REOPEN_PERIOD: 'reopen_period',
  MANAGE_MEMBERS: 'manage_members',
  MANAGE_INVITES: 'manage_invites',
};

const ROLE_PERMISSIONS = {
  [ROLES.MANAGER]: new Set([
    ACTIONS.VIEW_DASHBOARD,
    ACTIONS.VIEW_OWN_STATEMENT,
    ACTIONS.VIEW_ALL_BALANCES,
    ACTIONS.ENTER_OWN_MEAL,
    ACTIONS.EDIT_ANY_MEAL,
    ACTIONS.APPROVE_MEAL_OFF,
    ACTIONS.ADD_EXPENSE,
    ACTIONS.VOID_EXPENSE,
    ACTIONS.CONFIRM_SHARED_BILL,
    ACTIONS.RECORD_PAYMENT,
    ACTIONS.REVERSE_PAYMENT,
    ACTIONS.CLOSE_PERIOD,
    ACTIONS.REOPEN_PERIOD,
    ACTIONS.MANAGE_MEMBERS,
    ACTIONS.MANAGE_INVITES,
  ]),
  [ROLES.MEMBER]: new Set([
    ACTIONS.VIEW_DASHBOARD,
    ACTIONS.VIEW_OWN_STATEMENT,
    ACTIONS.ENTER_OWN_MEAL,
    ACTIONS.ADD_EXPENSE,
    ACTIONS.RECORD_PAYMENT,
  ]),
};

export function hasPermission(role, action) {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.has(action);
}

export function assertPermission(role, action) {
  if (!hasPermission(role, action)) {
    const error = new Error(`Permission denied: '${role}' cannot perform '${action}'`);
    error.code = 'FORBIDDEN';
    error.status = 403;
    throw error;
  }
}
