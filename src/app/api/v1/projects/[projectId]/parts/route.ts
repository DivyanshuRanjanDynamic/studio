import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, checkVerification } from '@/lib/auth-middleware';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { PartService } from '@/services/part.service';
import { logger } from '@/utils/logger';

/**
 * POST /api/v1/projects/[projectId]/parts — Add a part to a draft project.
 * CNC parts are priced server-side from their stored analysis (instant quote);
 * other services are flagged for an engineer's quote.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;

    const auth = await authenticateRequest(req);
    if (!auth.success) {
      return NextResponse.json({ error: 'Please sign in to add parts' }, { status: auth.status });
    }
    const unverified = checkVerification(auth);
    if (unverified) return unverified;

    const limiter = await rateLimit(`add-part:${auth.uid}`, 30, 60_000);
    if (!limiter.success) return rateLimitResponse(limiter.reset);

    const body = await req.json().catch(() => null);
    const result = await PartService.addPart(auth.uid, projectId, body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message, code: result.error.code },
        { status: result.error.statusCode }
      );
    }
    return NextResponse.json({ success: true, part: result.data }, { status: 201 });
  } catch (error: any) {
    logger.error({ event: 'API: Add part failed', error: error?.message });
    return NextResponse.json({ error: 'Failed to add the part' }, { status: 500 });
  }
}
