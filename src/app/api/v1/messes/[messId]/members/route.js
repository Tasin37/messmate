import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { withTransaction } from '@/lib/db';
import { listMembers, getMemberByUserId, addMemberToMess } from '@/server/repositories/mess-repository';
import { assertPermission, ACTIONS } from '@/lib/permissions';

export async function GET(request, { params }) {
  try {
    const { messId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign-in required' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || null; // null returns all (active & inactive)

    const members = await withTransaction(async (client) => {
      const myMember = await getMemberByUserId(client, messId, session.user.id);
      if (!myMember) throw new Error('Not a member of this mess');

      return listMembers(client, messId, { status });
    });

    return NextResponse.json({ data: members });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: err.message } }, { status: 400 });
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

    const newMember = await withTransaction(async (client) => {
      const myMember = await getMemberByUserId(client, messId, session.user.id);
      if (!myMember) throw new Error('Not a member of this mess');
      assertPermission(myMember.role, ACTIONS.MANAGE_MEMBERS);

      // Create a shadow/invite user if userId is not given
      const targetUserId = body.userId || `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Ensure user exists in "user" table
      await client.query(
        `INSERT INTO "user" (id, name, email) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
        [targetUserId, body.displayName, `${targetUserId}@mess.local`]
      );

      return addMemberToMess(client, {
        messId,
        userId: targetUserId,
        displayName: body.displayName,
        phone: body.phone || null,
        roomLabel: body.roomLabel || null,
        role: body.role || 'member',
        actorUserId: session.user.id,
      });
    });

    return NextResponse.json({ data: newMember }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: err.message } }, { status: 400 });
  }
}
