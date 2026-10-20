import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, checkVerification } from '@/lib/auth-middleware';
import { mintConvertTicket } from '@/lib/convert-ticket';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import { ErrorCode } from '@/utils/errors';

/**
 * CadController — browser access to the CAD converter's STEP → STL previews.
 */
export const CadController = {
  /**
   * Issues a short-lived ticket the browser sends to the converter's /convert.
   * Only verified, active users; limited per user (not per spoofable IP header).
   * The converter applies its own per-user hourly and concurrency quotas too.
   */
  async createConvertTicket(request: NextRequest) {
    try {
      const auth = await authenticateRequest(request);
      if (!auth.success) {
        return NextResponse.json(
          { error: 'Please sign in to preview CAD files', code: ErrorCode.UNAUTHORIZED },
          { status: auth.status }
        );
      }
      const unverified = checkVerification(auth);
      if (unverified) return unverified;
      if (auth.status === 'suspended') {
        return NextResponse.json(
          { error: 'Your account is not active', code: ErrorCode.FORBIDDEN },
          { status: 403 }
        );
      }

      const limiter = await rateLimit(`convert-ticket:${auth.uid}`, 20, 60_000);
      if (!limiter.success) return rateLimitResponse(limiter.reset);

      const ticket = mintConvertTicket(auth.uid);
      if (!ticket.success) {
        logger.error({ event: 'API: Convert ticket unavailable', code: ticket.error.code });
        return NextResponse.json(
          { error: ticket.error.message, code: ticket.error.code },
          { status: ticket.error.statusCode }
        );
      }
      return NextResponse.json(ticket.data);
    } catch (e) {
      logger.error({ event: 'API: Unexpected error in createConvertTicket', error: e });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
};
