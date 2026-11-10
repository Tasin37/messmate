import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { z } from 'zod';
import { reopenPeriodService } from '@/server/services/settlement-service';

const reopenSchema = z.object({
  reason: z.string().min(3, 'A reason of at least 3 characters is required'),
});

export async function POST(request, { params }) {
  try {
    const { messId, periodId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign-in required' } }, { status: 401 });
    }

    const body = await request.json();
    const { reason } = reopenSchema.parse(body);

    const reopened = await reopenPeriodService({
      messId,
      actorUserId: session.user.id,
      periodId,
      reason,
    });

    return NextResponse.json({ data: reopened });
  } catch (err) {
    return NextResponse.json(
      { error: { code: err.code || 'SERVER_ERROR', message: err.message } },
      { status: err.status || 400 }
    );
  }
}
