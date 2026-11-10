import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { withTransaction } from '@/lib/db';
import { getMemberByUserId } from '@/server/repositories/mess-repository';
import { getExpenseCategories } from '@/server/repositories/expense-repository';

const DEFAULT_SPEC_CATEGORIES = [
  { code: 'chal', name: 'চাল (Rice)', pool: 'meal', sortOrder: 1 },
  { code: 'dal', name: 'ডাল (Lentils)', pool: 'meal', sortOrder: 2 },
  { code: 'mach-mangsho', name: 'মাছ-মাংস (Fish/Meat)', pool: 'meal', sortOrder: 3 },
  { code: 'sobji', name: 'সবজি (Vegetables)', pool: 'meal', sortOrder: 4 },
  { code: 'tel-moshla', name: 'তেল-মসলা (Oil & Spices)', pool: 'meal', sortOrder: 5 },
  { code: 'gas', name: 'গ্যাস সিলিন্ডার (Gas)', pool: 'meal', sortOrder: 6 },
  { code: 'other', name: 'অন্যান্য (Others)', pool: 'meal', sortOrder: 7 },
];

export async function GET(request, { params }) {
  try {
    const { messId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign-in required' } }, { status: 401 });
    }

    const categories = await withTransaction(async (client) => {
      const actor = await getMemberByUserId(client, messId, session.user.id);
      if (!actor || actor.status !== 'active') {
        const error = new Error('Not an active member');
        error.code = 'UNAUTHORIZED';
        error.status = 403;
        throw error;
      }

      // Ensure required categories exist
      for (const cat of DEFAULT_SPEC_CATEGORIES) {
        await client.query(
          `INSERT INTO expense_categories (mess_id, code, name, pool, sort_order)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (mess_id, code) DO NOTHING`,
          [messId, cat.code, cat.name, cat.pool, cat.sortOrder]
        );
      }

      return getExpenseCategories(client, messId);
    });

    return NextResponse.json({ data: categories });
  } catch (err) {
    return NextResponse.json(
      { error: { code: err.code || 'SERVER_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
