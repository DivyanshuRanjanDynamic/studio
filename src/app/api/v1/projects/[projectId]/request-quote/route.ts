import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, checkVerification } from '@/lib/auth-middleware';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { ProjectRfqService } from '@/services/project-rfq.service';
import { logger } from '@/utils/logger';

/**
 * POST /api/v1/projects/[projectId]/request-quote
 * Customer sends the RFQ: captures the instant-cost snapshot, moves the project
 * to `quote_requested` and notifies admin. Owner + draft only (checked in service).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;

    const auth = await authenticateRequest(req);
    if (!auth.success) {
      return NextResponse.json({ error: 'Please sign in to request a quote' }, { status: auth.status });
    }
    const unverified = checkVerification(auth);
    if (unverified) return unverified;

    const limiter = await rateLimit(`request-quote:${auth.uid}`, 10, 60_000);
    if (!limiter.success) return rateLimitResponse(limiter.reset);

    const result = await ProjectRfqService.requestQuote(auth.uid, projectId);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message, code: result.error.code },
        { status: result.error.statusCode }
      );
    }
    return NextResponse.json({ success: true, ...result.data });
  } catch (error: any) {
    logger.error({ event: 'API: Request quote failed', error: error?.message });
    return NextResponse.json({ error: 'Failed to request a quote' }, { status: 500 });
  }
}
