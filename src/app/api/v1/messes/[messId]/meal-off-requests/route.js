import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { z } from 'zod';
import { requestMealOffService } from '@/server/services/meal-service';
import { listMealOffRequests } from '@/server/repositories/meal-repository';
import { withTransaction } from '@/lib/db';

const createMealOffSchema = z.object({
  memberId: z.string().uuid(),
  mealDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealSlotId: z.string().uuid(),
  reason: z.string().max(255).optional(),
});

export async function GET(request, { params }) {
  try {
    const { messId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Sign-in required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || null;

    const data = await withTransaction((client) =>
      listMealOffRequests(client, messId, { status })
    );

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
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Sign-in required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createMealOffSchema.parse(body);

    const result = await requestMealOffService({
      messId,
      actorUserId: session.user.id,
      ...parsed,
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: { code: err.code || 'VALIDATION_ERROR', message: err.message } },
      { status: err.status || 400 }
    );
  }
}
