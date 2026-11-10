/**
 * Manager Rotation Scheduling
 * Follows docs/business-rules.md Section 7
 */

/**
 * Calculates which member is active manager on a given targetDate
 * based on schedule configuration.
 */
export function getActiveManagerForDate({
  members, // Array of active member objects in sequence [{ id, displayName }]
  startDate, // 'YYYY-MM-DD'
  targetDate, // 'YYYY-MM-DD'
  rotationType = 'fixed_days', // 'fixed_days' | 'monthly'
  rotationDays = 7, // Positive integer if fixed_days
}) {
  if (!members || members.length === 0) return null;

  const start = new Date(startDate);
  const target = new Date(targetDate);

  if (target < start) {
    return null; // Prior to schedule start
  }

  if (rotationType === 'monthly') {
    const startYear = start.getUTCFullYear();
    const startMonth = start.getUTCMonth();
    const targetYear = target.getUTCFullYear();
    const targetMonth = target.getUTCMonth();

    const monthDiff = (targetYear - startYear) * 12 + (targetMonth - startMonth);
    const index = monthDiff % members.length;
    return members[(index + members.length) % members.length];
  }

  // Fixed days rotation
  const diffTime = target.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const turnIndex = Math.floor(diffDays / rotationDays);
  const memberIndex = turnIndex % members.length;

  return members[(memberIndex + members.length) % members.length];
}
