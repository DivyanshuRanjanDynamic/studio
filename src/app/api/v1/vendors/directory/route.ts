import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getClientIdentifier } from '@/lib/auth-safety';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import { toVendorCard } from '@/lib/vendor-directory';

/**
 * GET /api/v1/vendors/directory — public cards for active vendors (matching page).
 *
 * Only what a card shows (see src/lib/vendor-directory.ts) — never contact
 * details, GST, revenue or the street address.
 */
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const limiter = await rateLimit(`vendor-directory:${getClientIdentifier(req.headers)}`, 60, 60_000, {
    onStoreError: 'allow',
  });
  if (!limiter.success) return rateLimitResponse(limiter.reset);

  const { adminFirestore: db } = getFirebaseAdmin();
  if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  try {
    const snap = await db
      .collection('users')
      .where('role', 'in', ['vendor', 'mechmaster'])
      .where('isActive', '==', true)
      .limit(200)
      .get();
    const vendors = snap.docs.map((d: { id: string; data: () => Record<string, any> }) => toVendorCard(d.id, d.data()));
    return NextResponse.json(
      { vendors },
      { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } }
    );
  } catch (e: any) {
    logger.error({ event: 'Vendor directory read failed', error: e?.message });
    return NextResponse.json({ error: 'Could not load vendors' }, { status: 500 });
  }
}
