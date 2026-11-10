import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { withTransaction } from '@/lib/db';
import { getMemberByUserId } from '@/server/repositories/mess-repository';
import { createMessInvite } from '@/server/repositories/invite-repository';
import { assertPermission, ACTIONS } from '@/lib/permissions';

export async function POST(request, { params }) {
  try {
    const { messId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign-in required' } }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    const result = await withTransaction(async (client) => {
      const myMember = await getMemberByUserId(client, messId, session.user.id);
      if (!myMember) throw new Error('Not a member of this mess');
      assertPermission(myMember.role, ACTIONS.MANAGE_INVITES);

      return createMessInvite(client, {
        messId,
        roleToAssign: body.roleToAssign || 'member',
        expiresInDays: body.expiresInDays || 7,
        maxUses: body.maxUses || 10,
        actorUserId: session.user.id,
      });
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: err.message } }, { status: 400 });
  }
}
