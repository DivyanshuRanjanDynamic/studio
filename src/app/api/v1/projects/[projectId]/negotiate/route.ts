import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest, checkVerification } from '@/lib/auth-middleware';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { ProjectRfqService } from '@/services/project-rfq.service';
import { logger } from '@/utils/logger';

const NegotiateSchema = z.object({
  message: z.string().min(1).max(2000),
  proposedPrice: z.number().nonnegative().max(1e9).optional(),
});

/**
 * POST /api/v1/projects/[projectId]/negotiate
 * Customer counter-offer. The message is always recorded as role:'user'
 * server-side, so a customer cannot forge admin replies or rewrite the thread.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;

    const auth = await authenticateRequest(req);
    if (!auth.success) {
      return NextResponse.json({ error: 'Please sign in to negotiate' }, { status: auth.status });
    }
    const unverified = checkVerification(auth);
    if (unverified) return unverified;

    const limiter = await rateLimit(`negotiate:${auth.uid}`, 20, 60_000);
    if (!limiter.success) return rateLimitResponse(limiter.reset);

    const parsed = NegotiateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Enter a message for the negotiation.' }, { status: 400 });
    }

    const result = await ProjectRfqService.negotiate(
      auth.uid,
      projectId,
      parsed.data.message,
      parsed.data.proposedPrice
    );
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message, code: result.error.code },
        { status: result.error.statusCode }
      );
    }
    return NextResponse.json({ success: true, ...result.data });
  } catch (error: any) {
    logger.error({ event: 'API: Negotiate failed', error: error?.message });
    return NextResponse.json({ error: 'Failed to send your message' }, { status: 500 });
  }
}
