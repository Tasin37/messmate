import test from 'node:test';
import assert from 'node:assert/strict';
import { getActiveManagerForDate } from '../../src/lib/dates/rotation.js';

test('fixed-day manager rotation (e.g. 7 days)', () => {
  const members = [
    { id: 'm1', displayName: 'Manager 1' },
    { id: 'm2', displayName: 'Manager 2' },
    { id: 'm3', displayName: 'Manager 3' },
  ];

  // Week 1 -> m1
  const d1 = getActiveManagerForDate({
    members,
    startDate: '2026-11-01',
    targetDate: '2026-11-05',
    rotationType: 'fixed_days',
    rotationDays: 7,
  });
  assert.equal(d1.id, 'm1');

  // Week 2 -> m2
  const d2 = getActiveManagerForDate({
    members,
    startDate: '2026-11-01',
    targetDate: '2026-11-08',
    rotationType: 'fixed_days',
    rotationDays: 7,
  });
  assert.equal(d2.id, 'm2');

  // Week 3 -> m3
  const d3 = getActiveManagerForDate({
    members,
    startDate: '2026-11-01',
    targetDate: '2026-11-15',
    rotationType: 'fixed_days',
    rotationDays: 7,
  });
  assert.equal(d3.id, 'm3');

  // Week 4 -> cycles back to m1
  const d4 = getActiveManagerForDate({
    members,
    startDate: '2026-11-01',
    targetDate: '2026-11-22',
    rotationType: 'fixed_days',
    rotationDays: 7,
  });
  assert.equal(d4.id, 'm1');
});

test('monthly manager rotation across year boundary', () => {
  const members = [
    { id: 'm1', displayName: 'Manager 1' },
    { id: 'm2', displayName: 'Manager 2' },
  ];

  // Dec 2026 -> m1 (month 0)
  const dec = getActiveManagerForDate({
    members,
    startDate: '2026-12-01',
    targetDate: '2026-12-15',
    rotationType: 'monthly',
  });
  assert.equal(dec.id, 'm1');

  // Jan 2027 -> m2 (month 1)
  const jan = getActiveManagerForDate({
    members,
    startDate: '2026-12-01',
    targetDate: '2027-01-10',
    rotationType: 'monthly',
  });
  assert.equal(jan.id, 'm2');

  // Feb 2027 -> m1 (month 2)
  const feb = getActiveManagerForDate({
    members,
    startDate: '2026-12-01',
    targetDate: '2027-02-05',
    rotationType: 'monthly',
  });
  assert.equal(feb.id, 'm1');
});
