import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { paymentSchema } from '@/lib/validation/schemas';
import { recordPaymentService, listPaymentsService } from '@/server/services/billing-service';

export async function GET(request, { params }) {
  try {
    const { messId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign-in required' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periodId = searchParams.get('periodId');
    if (!periodId) {
      return NextResponse.json({ error: { code: 'MISSING_PERIOD', message: 'periodId is required' } }, { status: 400 });
    }

    const data = await listPaymentsService({ messId, actorUserId: session.user.id, periodId });
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
    const parsed = paymentSchema.parse({ ...body, messId });

    const payment = await recordPaymentService({
      ...parsed,
      actorUserId: session.user.id,
    });

    return NextResponse.json({ data: payment }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: { code: err.code || 'VALIDATION_ERROR', message: err.message } },
      { status: err.status || 400 }
    );
  }
}
