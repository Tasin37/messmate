import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { withTransaction } from '@/lib/db';
import { createMess, getUserMesses } from '@/server/repositories/mess-repository';
import { createMessSchema } from '@/lib/validation/schemas';

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign-in required' } }, { status: 401 });
    }

    const messes = await withTransaction((client) => getUserMesses(client, session.user.id));
    return NextResponse.json({ data: messes });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: err.message } }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign-in required' } }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createMessSchema.parse(body);

    const result = await withTransaction((client) =>
      createMess(client, {
        name: parsed.name,
        slug: parsed.slug,
        currencyCode: parsed.currencyCode || 'BDT',
        timezone: parsed.timezone || 'Asia/Dhaka',
        address: parsed.address || null,
        createdByUserId: session.user.id,
        creatorDisplayName: session.user.name || 'ম্যানেজার',
        creatorPhone: null,
      })
    );

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: { code: err.code || 'VALIDATION_ERROR', message: err.message } }, { status: 400 });
  }
}
