import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { withTransaction } from '@/lib/db';
import { getMessById, getMemberByUserId, listMembers } from '@/server/repositories/mess-repository';
import { calculateMealRate, calculateMemberMealCharges, calculateMemberBalance } from '@/lib/money/accounting';
import { fromPaisa, toPaisa } from '@/lib/money/paisa';

export async function GET(request, { params }) {
  try {
    const { messId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign-in required' } }, { status: 401 });
    }

    const data = await withTransaction(async (client) => {
      // 1. Verify membership
      const member = await getMemberByUserId(client, messId, session.user.id);
      if (!member) throw new Error('Not a member of this mess');

      const mess = await getMessById(client, messId);

      // 2. Fetch or create current open period
      const now = new Date();
      const currentYear = now.getUTCFullYear();
      const currentMonth = now.getUTCMonth() + 1;

      let periodRow = (
        await client.query(
          `SELECT * FROM accounting_periods WHERE mess_id = $1 AND year = $2 AND month = $3`,
          [messId, currentYear, currentMonth]
        )
      ).rows[0];

      if (!periodRow) {
        periodRow = (
          await client.query(
            `INSERT INTO accounting_periods (mess_id, year, month, status) VALUES ($1, $2, $3, 'open')
             ON CONFLICT (mess_id, year, month) DO UPDATE SET mess_id = $1 RETURNING *`,
            [messId, currentYear, currentMonth]
          )
        ).rows[0];
      }

      const periodId = periodRow.id;
      const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(Date.UTC(currentYear, currentMonth, 0)).getUTCDate();
      const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      // 3. Fetch all active members
      const activeMembers = await listMembers(client, messId, { status: 'active' });

      // 4. Total meal expenses (meal pool)
      const expenseRes = await client.query(
        `SELECT COALESCE(SUM(e.amount), 0) as total_meal_expense
         FROM expenses e
         JOIN expense_categories ec ON e.category_id = ec.id
         WHERE e.mess_id = $1 AND e.period_id = $2 AND ec.pool = 'meal' AND e.status = 'approved'`,
        [messId, periodId]
      );
      const totalMealExpenseStr = String(expenseRes.rows[0]?.total_meal_expense || '0.00');

      // 5. Total meal count in period
      const mealCountsRes = await client.query(
        `SELECT member_id, entry_type, host_member_id, quantity
         FROM meal_entries
         WHERE mess_id = $1 AND meal_date >= $2 AND meal_date <= $3`,
        [messId, startDate, endDate]
      );

      // Calculate billable meals per member
      const memberMealMap = new Map();
      for (const m of activeMembers) memberMealMap.set(m.id, 0);

      for (const row of mealCountsRes.rows) {
        const qty = Number(row.quantity || 0);
        if (row.entry_type === 'self' || row.entry_type === 'manager_adjustment') {
          memberMealMap.set(row.member_id, (memberMealMap.get(row.member_id) || 0) + qty);
        } else if (row.entry_type === 'guest') {
          const hostId = row.host_member_id || row.member_id;
          memberMealMap.set(hostId, (memberMealMap.get(hostId) || 0) + qty);
        }
      }

      const totalBillableMeals = Array.from(memberMealMap.values()).reduce((s, v) => s + v, 0);

      // 6. Meal rate calculation
      const rateResult = calculateMealRate(totalMealExpenseStr, totalBillableMeals);

      // 7. Member meal charges
      const memberMealInputs = activeMembers.map((m) => ({
        memberId: m.id,
        mealUnits: memberMealMap.get(m.id) || 0,
      }));
      const memberMealCharges = calculateMemberMealCharges(memberMealInputs, totalMealExpenseStr);
      const myMealChargeObj = memberMealCharges.find((c) => c.memberId === member.id) || { charge: '0.00' };

      // 8. Shared bills in period
      const sharedBillsRes = await client.query(
        `SELECT COALESCE(SUM(amount), 0) as total_shared_bills
         FROM shared_bills
         WHERE mess_id = $1 AND period_id = $2 AND status = 'confirmed'`,
        [messId, periodId]
      );
      const totalSharedBillsStr = String(sharedBillsRes.rows[0]?.total_shared_bills || '0.00');

      // My shared bills allocation
      const myBillAllocRes = await client.query(
        `SELECT COALESCE(SUM(ba.amount), 0) as my_bill_charge
         FROM bill_allocations ba
         JOIN shared_bills sb ON ba.shared_bill_id = sb.id
         WHERE ba.mess_id = $1 AND sb.period_id = $2 AND ba.member_id = $3 AND sb.status = 'confirmed'`,
        [messId, periodId, member.id]
      );
      const mySharedBillChargeStr = String(myBillAllocRes.rows[0]?.my_bill_charge || '0.00');

      // My expense credits (bazaar paid by me)
      const myCreditRes = await client.query(
        `SELECT COALESCE(SUM(amount), 0) as my_credit
         FROM expenses
         WHERE mess_id = $1 AND period_id = $2 AND paid_by_member_id = $3 AND status = 'approved'`,
        [messId, periodId, member.id]
      );
      const myExpenseCreditStr = String(myCreditRes.rows[0]?.my_credit || '0.00');

      // My deposits / payments
      const myDepositRes = await client.query(
        `SELECT COALESCE(SUM(amount), 0) as my_deposit
         FROM member_payments
         WHERE mess_id = $1 AND period_id = $2 AND member_id = $3 AND status = 'confirmed'`,
        [messId, periodId, member.id]
      );
      const myTotalDepositStr = String(myDepositRes.rows[0]?.my_deposit || '0.00');

      // Calculate my balance
      const myBalance = calculateMemberBalance({
        mealCharge: myMealChargeObj.charge,
        sharedBillCharge: mySharedBillChargeStr,
        expenseCredit: myExpenseCreditStr,
        paymentsTotal: myTotalDepositStr,
      });

      // 9. Today's meals for current user
      const todayStr = now.toISOString().slice(0, 10);
      const todayMealsRes = await client.query(
        `SELECT ms.code, me.quantity
         FROM meal_entries me
         JOIN meal_slots ms ON me.meal_slot_id = ms.id
         WHERE me.mess_id = $1 AND me.member_id = $2 AND me.meal_date = $3`,
        [messId, member.id, todayStr]
      );
      const todayMeals = { breakfast: 0, lunch: 0, dinner: 0 };
      for (const r of todayMealsRes.rows) {
        if (todayMeals[r.code] !== undefined) todayMeals[r.code] = Number(r.quantity || 0);
      }

      // 10. Today's bazaar duty
      const todayRoster = (
        await client.query(
          `SELECT br.*, mm.display_name as member_name
           FROM bazaar_roster br
           JOIN mess_members mm ON br.member_id = mm.id
           WHERE br.mess_id = $1 AND br.duty_date = $2`,
          [messId, todayStr]
        )
      ).rows[0];

      // 11. Recent activities
      const recentExpenses = (
        await client.query(
          `SELECT e.id, e.title, e.amount, e.expense_date, mm.display_name as payer_name
           FROM expenses e
           JOIN mess_members mm ON e.paid_by_member_id = mm.id
           WHERE e.mess_id = $1 AND e.status = 'approved'
           ORDER BY e.created_at DESC LIMIT 5`,
          [messId]
        )
      ).rows;

      const recentPayments = (
        await client.query(
          `SELECT mp.id, mp.amount, mp.payment_date, mp.method, mm.display_name as member_name
           FROM member_payments mp
           JOIN mess_members mm ON mp.member_id = mm.id
           WHERE mp.mess_id = $1 AND mp.status = 'confirmed'
           ORDER BY mp.created_at DESC LIMIT 5`,
          [messId]
        )
      ).rows;

      return {
        mess,
        member,
        period: periodRow,
        summary: {
          totalBazaar: totalMealExpenseStr,
          totalMeals: totalBillableMeals,
          mealRate: rateResult.rate || '0.00',
          sharedBills: totalSharedBillsStr,
        },
        myAccount: {
          displayName: member.display_name,
          role: member.role,
          myMeals: memberMealMap.get(member.id) || 0,
          mealCharge: myMealChargeObj.charge,
          sharedBillCharge: mySharedBillChargeStr,
          expenseCredit: myExpenseCreditStr,
          totalDeposit: myTotalDepositStr,
          balance: myBalance.balance,
          status: myBalance.status,
          statusTextBn: myBalance.statusTextBn,
          statusTextEn: myBalance.statusTextEn,
        },
        today: {
          date: todayStr,
          meals: todayMeals,
          roster: todayRoster || null,
        },
        recentActivities: {
          expenses: recentExpenses,
          payments: recentPayments,
        },
      };
    });

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: err.message } }, { status: 400 });
  }
}
