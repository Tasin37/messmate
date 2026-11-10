import { NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db';
import { createMess } from '@/server/repositories/mess-repository';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = body.email || 'tanvir@mess.local';
    const name = body.name || 'তানভীর আহমেদ';
    const userId = 'usr_' + Buffer.from(email).toString('hex').slice(0, 16);
    const now = new Date();

    // Ensure user exists in Better Auth user table with both camelCase & snake_case columns
    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO "user" (id, name, email, email_verified, "emailVerified", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, true, true, $4, $4)
         ON CONFLICT (id) DO UPDATE SET name = $2, "updatedAt" = $4`,
        [userId, name, email, now.toISOString()]
      );

      // Check if user already has a mess
      const { rows: existingMesses } = await client.query(
        `SELECT mess_id FROM mess_members WHERE user_id = $1`,
        [userId]
      );

      if (existingMesses.length === 0) {
        // Create a default initial mess for them so they can immediately see and test!
        await createMess(client, {
          name: 'স্বপ্নিল মেস (Shopnil Mess)',
          slug: 'shopnil-' + Math.random().toString(36).slice(2, 7),
          currencyCode: 'BDT',
          timezone: 'Asia/Dhaka',
          address: 'মিরপুর ২, ঢাকা',
          createdByUserId: userId,
          creatorDisplayName: name,
          creatorPhone: '01711-234567',
        });
      }
    });

    // Create session token and set cookie
    const token = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO session (id, token, user_id, "userId", expires_at, "expiresAt", created_at, "createdAt", updated_at, "updatedAt")
         VALUES ($1, $2, $3, $3, $4, $4, $5, $5, $5, $5)`,
        [token, token, userId, expiresAt.toISOString(), now.toISOString()]
      );
    });

    const response = NextResponse.json({
      data: {
        user: { id: userId, name, email },
        token,
      },
    });

    // Set Better Auth compatible session cookie
    response.cookies.set('better-auth.session_token', token, {
      httpOnly: true,
      path: '/',
      expires: expiresAt,
      sameSite: 'lax',
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: { code: 'AUTH_ERROR', message: err.message } }, { status: 500 });
  }
}
