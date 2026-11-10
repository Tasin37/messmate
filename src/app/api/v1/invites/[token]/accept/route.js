import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { withTransaction } from '@/lib/db';
import { acceptMessInvite } from '@/server/repositories/invite-repository';

export async function POST(request, { params }) {
  try {
    const { token } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign-in required' } }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    const result = await withTransaction(async (client) => {
      return acceptMessInvite(client, {
        token,
        userId: session.user.id,
        displayName: body.displayName || session.user.name || 'নতুন সদস্য',
        phone: body.phone || null,
        roomLabel: body.roomLabel || null,
      });
    });

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: { code: err.code || 'INVITE_ERROR', message: err.message } }, { status: 400 });
  }
}
