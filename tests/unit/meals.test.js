import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Unit tests for meal aggregation and guest meal business rules
 * Follows docs/business-rules.md Section 3 & docs/testing.md
 */

function calculateBillableMealsForMember(memberId, entries) {
  return entries.reduce((total, entry) => {
    // 1. Self meals by this member
    if (entry.entryType === 'self' && entry.memberId === memberId) {
      return total + Number(entry.quantity || 0);
    }
    // 2. Guest meals hosted by this member
    if (entry.entryType === 'guest' && entry.hostMemberId === memberId) {
      return total + Number(entry.quantity || 0);
    }
    // 3. Manager adjustment for this member
    if (entry.entryType === 'manager_adjustment' && entry.memberId === memberId) {
      return total + Number(entry.quantity || 0);
    }
    return total;
  }, 0);
}

test('guest meals are attributed to host member exactly once', () => {
  const entries = [
    // Member 1 self meals
    { memberId: 'm1', quantity: 2, entryType: 'self' },
    // Member 1 hosts a guest meal (e.g. 1 guest meal)
    { memberId: 'm1', hostMemberId: 'm1', quantity: 1, entryType: 'guest' },
    // Member 2 self meals
    { memberId: 'm2', quantity: 1.5, entryType: 'self' },
  ];

  const m1Total = calculateBillableMealsForMember('m1', entries);
  const m2Total = calculateBillableMealsForMember('m2', entries);

  // m1 has 2 self + 1 guest = 3.0 meals
  assert.equal(m1Total, 3.0);
  // m2 has 1.5 self meals
  assert.equal(m2Total, 1.5);
});

test('half meals and decimal meal counts accumulate accurately', () => {
  const entries = [
    { memberId: 'm1', quantity: 0.5, entryType: 'self' },
    { memberId: 'm1', quantity: 1.0, entryType: 'self' },
    { memberId: 'm1', quantity: 0.5, entryType: 'self' },
  ];

  const total = calculateBillableMealsForMember('m1', entries);
  assert.equal(total, 2.0);
});

test('manager adjustment properly reflects in billable meal count', () => {
  const entries = [
    { memberId: 'm1', quantity: 1.0, entryType: 'self' },
    // Meal off approval sets 0 adjustment
    { memberId: 'm1', quantity: -1.0, entryType: 'manager_adjustment' },
  ];

  const total = calculateBillableMealsForMember('m1', entries);
  assert.equal(total, 0.0);
});
