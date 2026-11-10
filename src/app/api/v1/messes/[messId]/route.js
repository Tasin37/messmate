import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { withTransaction } from '@/lib/db';
import { getMessById, getMemberByUserId } from '@/server/repositories/mess-repository';

export async function GET(request, { params }) {
  try {
    const { messId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign-in required' } }, { status: 401 });
    }

    const data = await withTransaction(async (client) => {
      const mess = await getMessById(client, messId);
      if (!mess) throw new Error('Mess not found');
      const member = await getMemberByUserId(client, messId, session.user.id);
      if (!member) throw new Error('You are not a member of this mess');

      return { mess, member };
    });

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: err.message } }, { status: 400 });
  }
}
