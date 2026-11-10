import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { z } from 'zod';
import {
  addInventoryItemService,
  listInventoryItemsService,
} from '@/server/services/extra-features-service';

const itemSchema = z.object({
  name: z.string().min(1).max(150),
  quantity: z.number().int().min(1).default(1),
  category: z.string().default('utensils'),
  condition: z.enum(['new', 'good', 'damaged', 'repair_needed']).default('good'),
  location: z.string().max(100).optional(),
  note: z.string().max(255).optional(),
});

export async function GET(request, { params }) {
  try {
    const { messId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign-in required' } }, { status: 401 });
    }

    const data = await listInventoryItemsService({ messId, actorUserId: session.user.id });
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
    const parsed = itemSchema.parse(body);

    const item = await addInventoryItemService({
      messId,
      actorUserId: session.user.id,
      ...parsed,
    });

    return NextResponse.json({ data: item }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: { code: err.code || 'VALIDATION_ERROR', message: err.message } }, { status: 400 });
  }
}
