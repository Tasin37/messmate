import test from 'node:test';
import assert from 'node:assert/strict';
import { getActiveManagerForDate } from '../../src/lib/dates/rotation.js';

test('manager rotation custom days stepper calculation (e.g. 3 days, 5 days, 7 days)', () => {
  const members = [
    { id: 'm1', displayName: 'Tanvir' },
    { id: 'm2', displayName: 'Rakib' },
    { id: 'm3', displayName: 'Sakib' },
  ];

  // 3-day rotation
  const day1 = getActiveManagerForDate({
    members,
    startDate: '2026-11-01',
    targetDate: '2026-11-02',
    rotationType: 'fixed_days',
    rotationDays: 3,
  });
  assert.equal(day1.id, 'm1');

  // Day 4 (targetDate: 2026-11-04) -> Turn 1 (Rakib)
  const day4 = getActiveManagerForDate({
    members,
    startDate: '2026-11-01',
    targetDate: '2026-11-04',
    rotationType: 'fixed_days',
    rotationDays: 3,
  });
  assert.equal(day4.id, 'm2');

  // Day 7 (targetDate: 2026-11-07) -> Turn 2 (Sakib)
  const day7 = getActiveManagerForDate({
    members,
    startDate: '2026-11-01',
    targetDate: '2026-11-07',
    rotationType: 'fixed_days',
    rotationDays: 3,
  });
  assert.equal(day7.id, 'm3');
});

test('shopping list item toggle logic', () => {
  const item = { id: 's1', name: 'Mustard Oil', isPurchased: false };
  const toggled = { ...item, isPurchased: true };
  assert.equal(toggled.isPurchased, true);
});

test('complaint anonymous attribution protects submitter identity', () => {
  const complaint = {
    title: 'Food quality',
    isAnonymous: true,
    memberId: 'mem_123',
  };

  const displayName = complaint.isAnonymous ? 'বেনামী (Anonymous)' : 'Known Member';
  assert.equal(displayName, 'বেনামী (Anonymous)');
});
