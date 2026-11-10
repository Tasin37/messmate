import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { z } from 'zod';
import {
  assignBazaarDutyService,
  listBazaarRosterService,
} from '@/server/services/extra-features-service';

const assignDutySchema = z.object({
  memberId: z.string().uuid(),
  dutyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(255).optional(),
});

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

    const data = await listBazaarRosterService({
      messId,
      actorUserId: session.user.id,
      startDate,
      endDate,
    });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: { code: err.code || 'SERVER_ERROR', message: err.message } }, { status: 500 });
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
    const parsed = assignDutySchema.parse(body);

    const roster = await assignBazaarDutyService({
      messId,
      actorUserId: session.user.id,
      ...parsed,
    });

    return NextResponse.json({ data: roster }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: { code: err.code || 'VALIDATION_ERROR', message: err.message } }, { status: 400 });
  }
}
