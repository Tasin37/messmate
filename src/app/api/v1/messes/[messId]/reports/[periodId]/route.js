import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { exportPeriodCsvService } from '@/server/services/settlement-service';

export async function GET(request, { params }) {
  try {
    const { messId, periodId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign-in required' } }, { status: 401 });
    }

    const csvData = await exportPeriodCsvService({
      messId,
      actorUserId: session.user.id,
      periodId,
    });

    return new Response(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="settlement_${periodId}.csv"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: { code: err.code || 'SERVER_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
