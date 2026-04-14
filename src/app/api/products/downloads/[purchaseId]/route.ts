import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db, schema } from '@/db/client';
import { getProductBySlug } from '@/lib/content/products';

export const runtime = 'nodejs';

const PRODUCTS_DIR = path.resolve(process.cwd(), 'private', 'products');

type RouteContext = {
  params: Promise<{ purchaseId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { purchaseId } = await context.params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const [purchase] = await db
    .select()
    .from(schema.purchases)
    .where(eq(schema.purchases.id, purchaseId))
    .limit(1);

  if (!purchase) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (purchase.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const entry = await getProductBySlug(purchase.productSlug);
  if (!entry) {
    return NextResponse.json(
      { error: 'Product no longer available' },
      { status: 410 },
    );
  }

  const filePath = path.resolve(PRODUCTS_DIR, entry.meta.assetFilename);
  if (!filePath.startsWith(PRODUCTS_DIR + path.sep)) {
    return NextResponse.json({ error: 'Invalid asset path' }, { status: 400 });
  }

  let buffer: Buffer;
  try {
    buffer = await readFile(filePath);
  } catch {
    return NextResponse.json(
      { error: 'Asset missing on disk' },
      { status: 500 },
    );
  }

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${entry.meta.assetFilename}"`,
      'Content-Length': String(buffer.byteLength),
      'Cache-Control': 'private, no-store',
    },
  });
}
