import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import {
  calculatePeriodSettlementService,
  getPeriodSettlementService,
} from '@/server/services/settlement-service';

export async function GET(request, { params }) {
  try {
    const { messId, periodId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign-in required' } }, { status: 401 });
    }

    const data = await getPeriodSettlementService({
      messId,
      actorUserId: session.user.id,
      periodId,
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
    const { messId, periodId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign-in required' } }, { status: 401 });
    }

    const data = await calculatePeriodSettlementService({
      messId,
      actorUserId: session.user.id,
      periodId,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: { code: err.code || 'SERVER_ERROR', message: err.message } },
      { status: err.status || 400 }
    );
  }
}
