import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { withTransaction } from '@/lib/db';
import { getMemberByUserId, updateMember } from '@/server/repositories/mess-repository';
import { assertPermission, ACTIONS } from '@/lib/permissions';

export async function PATCH(request, { params }) {
  try {
    const { messId, memberId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign-in required' } }, { status: 401 });
    }

    const updates = await request.json();

    const updated = await withTransaction(async (client) => {
      const myMember = await getMemberByUserId(client, messId, session.user.id);
      if (!myMember) throw new Error('Not a member of this mess');

      // If updating another member, must be manager
      if (myMember.id !== memberId) {
        assertPermission(myMember.role, ACTIONS.MANAGE_MEMBERS);
      }

      return updateMember(client, {
        messId,
        memberId,
        updates,
        actorUserId: session.user.id,
      });
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: err.message } }, { status: 400 });
  }
}
