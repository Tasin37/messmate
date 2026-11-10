import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { z } from 'zod';
import { reviewMealOffService } from '@/server/services/meal-service';

const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

export async function POST(request, { params }) {
  try {
    const { messId, id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Sign-in required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status } = reviewSchema.parse(body);

    const result = await reviewMealOffService({
      messId,
      actorUserId: session.user.id,
      requestId: id,
      status,
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    return NextResponse.json(
      { error: { code: err.code || 'VALIDATION_ERROR', message: err.message } },
      { status: err.status || 400 }
    );
  }
}
