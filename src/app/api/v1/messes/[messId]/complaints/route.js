import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { z } from 'zod';
import {
  submitComplaintService,
  listComplaintsService,
} from '@/server/services/extra-features-service';

const complaintSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(5),
  isAnonymous: z.boolean().default(false),
});

export async function GET(request, { params }) {
  try {
    const { messId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign-in required' } }, { status: 401 });
    }

    const data = await listComplaintsService({ messId, actorUserId: session.user.id });
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
    const parsed = complaintSchema.parse(body);

    const complaint = await submitComplaintService({
      messId,
      actorUserId: session.user.id,
      ...parsed,
    });

    return NextResponse.json({ data: complaint }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: { code: err.code || 'VALIDATION_ERROR', message: err.message } }, { status: 400 });
  }
}
