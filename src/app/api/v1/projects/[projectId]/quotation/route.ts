import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, checkVerification } from '@/lib/auth-middleware';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { QuotationService } from '@/services/quotation.service';
import { logger } from '@/utils/logger';

/**
 * GET /api/v1/projects/[projectId]/quotation
 * Downloads the project's quotation PDF — an instant estimate before engineering
 * review, the final quotation once an engineer has priced it. Owner or admin only.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;

    const auth = await authenticateRequest(req);
    if (!auth.success) {
      return NextResponse.json({ error: 'Please sign in to download your quotation' }, { status: auth.status });
    }
    const unverified = checkVerification(auth);
    if (unverified) return unverified;

    const limiter = await rateLimit(`quotation:${auth.uid}`, 30, 60_000);
    if (!limiter.success) return rateLimitResponse(limiter.reset);

    const result = await QuotationService.generate(auth.uid, projectId, auth.role === 'admin');
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message, code: result.error.code },
        { status: result.error.statusCode }
      );
    }

    const bytes = new Uint8Array(result.data.pdf);
    return new Response(bytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${result.data.fileName}"`,
        'Content-Length': String(bytes.byteLength),
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error: any) {
    logger.error({ event: 'API: Quotation download failed', error: error?.message });
    return NextResponse.json({ error: 'Failed to generate the quotation' }, { status: 500 });
  }
}
