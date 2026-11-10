import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { z } from 'zod';
import {
  addShoppingItemService,
  listShoppingItemsService,
  toggleShoppingItemService,
} from '@/server/services/extra-features-service';

const addItemSchema = z.object({
  itemName: z.string().min(1).max(150),
  quantity: z.string().max(50).optional(),
});

const toggleSchema = z.object({
  itemId: z.string().uuid(),
  isPurchased: z.boolean(),
});

export async function GET(request, { params }) {
  try {
    const { messId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign-in required' } }, { status: 401 });
    }

    const data = await listShoppingItemsService({ messId, actorUserId: session.user.id });
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
    const parsed = addItemSchema.parse(body);

    const item = await addShoppingItemService({
      messId,
      actorUserId: session.user.id,
      ...parsed,
    });

    return NextResponse.json({ data: item }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: { code: err.code || 'VALIDATION_ERROR', message: err.message } }, { status: 400 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { messId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign-in required' } }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, isPurchased } = toggleSchema.parse(body);

    const updated = await toggleShoppingItemService({
      messId,
      actorUserId: session.user.id,
      itemId,
      isPurchased,
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json({ error: { code: err.code || 'SERVER_ERROR', message: err.message } }, { status: 400 });
  }
}
