import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { mealEntrySchema } from '@/lib/validation/schemas';
import {
  addMealEntryService,
  getDailyMealSheetService,
} from '@/server/services/meal-service';

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
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);

    const data = await getDailyMealSheetService({
      messId,
      actorUserId: session.user.id,
      mealDate: date,
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
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Sign-in required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = mealEntrySchema.parse({ ...body, messId });

    const entry = await addMealEntryService({
      ...parsed,
      actorUserId: session.user.id,
    });

    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: { code: err.code || 'VALIDATION_ERROR', message: err.message } },
      { status: err.status || 400 }
    );
  }
}
