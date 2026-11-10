import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { expenseEntrySchema } from '@/lib/validation/schemas';
import { addExpenseService, listExpensesService } from '@/server/services/expense-service';

export async function GET(request, { params }) {
  try {
    const { messId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign-in required' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    const data = await listExpensesService({
      messId,
      actorUserId: session.user.id,
      startDate,
      endDate,
      status,
    });

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: { code: err.code || 'SERVER_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { messId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign-in required' } }, { status: 401 });
    }

    const body = await request.json();
    const parsed = expenseEntrySchema.parse({ ...body, messId });

    const expense = await addExpenseService({
      ...parsed,
      actorUserId: session.user.id,
    });

    return NextResponse.json({ data: expense }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: { code: err.code || 'VALIDATION_ERROR', message: err.message } },
      { status: err.status || 400 }
    );
  }
}
