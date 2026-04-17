import { NextResponse } from 'next/server';
import { QuotingService } from '@/services/quoting.service';
import { quoteRequestSchema } from '@/lib/validation/quoting';
import { logger } from '@/utils/logger';
import { ErrorCode } from '@/utils/errors';

/**
 * QuoteController handles all API requests related to instant quoting.
 */
export const QuoteController = {
  /**
   * Generates a new instant quote.
   * 
   * SECURITY NOTE: This endpoint is intentionally unauthenticated to allow 
   * anonymous users to receive instant estimates. Rate limiting is enforced 
   * at the edge/middleware level.
   */
  async createQuote(request: Request) {
    const reqId = Math.random().toString(36).substring(7);
    logger.info({ event: 'API: Quote creation started', reqId });

    try {
      const body = await request.json();

      // 1. Validate Input
      const validation = quoteRequestSchema.safeParse(body);
      if (!validation.success) {
        logger.warn({
          event: 'API: Quote validation failed',
          reqId,
          errors: validation.error.format(),
        });
        return NextResponse.json(
          {
            error: 'Invalid quote request',
            details: validation.error.format(),
          },
          { status: 400 }
        );
      }

      // 2. Process Quote via Service
      const result = await QuotingService.processQuoteRequest(validation.data);

      if (result.success) {
        logger.info({
          event: 'API: Quote generated successfully',
          reqId,
          quoteRef: result.data.quoteRef,
        });
        return NextResponse.json(result.data);
      } else {
        const error = result.error;
        logger.error({
          event: 'API: Quote generation failed',
          reqId,
          code: error.code,
          message: error.message,
        });
        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
          },
          { status: error.code === ErrorCode.VALIDATION_FAILED ? 400 : 500 }
        );
      }
    } catch (e) {
      logger.error({ event: 'API: Unexpected error in QuoteController', reqId, error: e });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },

  /**
   * Retrieves a shared quote by reference.
   */
  async getSharedQuote(ref: string) {
    logger.info({ event: 'API: Share quote lookup started', ref });

    try {
      const result = await QuotingService.getQuote(ref);

      if (result.success) {
        logger.info({ event: 'API: Shared quote retrieved', ref });
        return NextResponse.json(result.data);
      } else {
        logger.warn({ event: 'API: Shared quote not found', ref, error: result.error });
        return NextResponse.json(
          {
            error: 'Quote not found or has expired',
            code: 'NOT_FOUND',
          },
          { status: 404 }
        );
      }
    } catch (e) {
      logger.error({ event: 'API: Error retrieving shared quote', ref, error: e });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
};
