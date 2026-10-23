import { NextRequest, NextResponse } from 'next/server';
import { QuotingService } from '@/services/quoting.service';
import {
  sheetQuoteCreateSchema,
  cncQuoteCreateSchema,
  cncUploadIntentSchema,
  cncAnalyzeSchema,
  partAnalyzeSchema,
} from '@/lib/validation/quoting';
import { CncAnalysisService } from '@/services/cnc-analysis.service';
import { PartAnalysisService } from '@/services/part-analysis.service';
import { PricingCalibrationRepository } from '@/repositories/pricing-calibration.repository';
import { authenticateRequest } from '@/lib/auth-middleware';
import { logger } from '@/utils/logger';
import { ErrorCode } from '@/utils/errors';

/**
 * Instant CNC / laser pricing is for registered users only.
 * Returns the caller's uid, or the 401/403 response to send back.
 */
async function requireRegisteredUser(
  request: NextRequest,
  reqId: string
): Promise<{ uid: string } | NextResponse> {
  const auth = await authenticateRequest(request);
  if (!auth.success) {
    logger.warn({ event: 'API: Quote request without valid session', reqId, status: auth.status });
    return NextResponse.json(
      auth.status === 401
        ? { error: 'Please sign in to get instant quotes', code: ErrorCode.UNAUTHORIZED }
        : { error: auth.error, code: ErrorCode.INTERNAL_ERROR },
      { status: auth.status }
    );
  }
  if (auth.status === 'suspended') {
    return NextResponse.json(
      { error: 'Your account is not active', code: ErrorCode.FORBIDDEN },
      { status: 403 }
    );
  }
  return { uid: auth.uid };
}

/**
 * QuoteController handles all API requests related to instant quoting.
 */
export const QuoteController = {
  /**
   * Prices and saves a laser (sheet) quote from a stored sheet analysis
   * ({ analysisId, request }). The client never sends geometry; the client-side
   * estimate is display-only and this is the quote of record.
   */
  async createQuote(request: NextRequest) {
    const reqId = Math.random().toString(36).substring(7);
    logger.info({ event: 'API: Quote creation started', reqId });

    try {
      const user = await requireRegisteredUser(request, reqId);
      if (user instanceof NextResponse) return user;

      const body = await request.json();

      // 1. Validate Input
      const validation = sheetQuoteCreateSchema.safeParse(body);
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

      // 2. Price from the caller's own stored analysis
      const { analysisId, request: quoteRequest } = validation.data;
      const result = await QuotingService.processStoredSheetQuoteRequest(analysisId, quoteRequest, user.uid);

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
          { status: error.statusCode }
        );
      }
    } catch (e) {
      logger.error({ event: 'API: Unexpected error in QuoteController', reqId, error: e });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },

  /**
   * Presigned S3 upload for a STEP file the caller wants priced for CNC.
   */
  async createCncUploadIntent(request: NextRequest) {
    const reqId = Math.random().toString(36).substring(7);

    try {
      const user = await requireRegisteredUser(request, reqId);
      if (user instanceof NextResponse) return user;

      const validation = cncUploadIntentSchema.safeParse(await request.json());
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid upload request', code: ErrorCode.VALIDATION_FAILED },
          { status: 400 }
        );
      }

      const { fileName, fileSize } = validation.data;
      const result = await CncAnalysisService.createUploadIntent(user.uid, fileName, fileSize);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error.message, code: result.error.code },
          { status: result.error.statusCode }
        );
      }
      logger.info({ event: 'API: CNC upload intent issued', reqId, fileKey: result.data.fileKey });
      return NextResponse.json(result.data);
    } catch (e) {
      logger.error({ event: 'API: Unexpected error in createCncUploadIntent', reqId, error: e });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },

  /**
   * Has the converter analyse the caller's uploaded STEP file (server-to-server)
   * and stores the result. Returns { analysisId, analysis } for live pricing.
   */
  async analyzeCnc(request: NextRequest) {
    const reqId = Math.random().toString(36).substring(7);
    logger.info({ event: 'API: CNC analysis started', reqId });

    try {
      const user = await requireRegisteredUser(request, reqId);
      if (user instanceof NextResponse) return user;

      const validation = cncAnalyzeSchema.safeParse(await request.json());
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid analysis request', code: ErrorCode.VALIDATION_FAILED },
          { status: 400 }
        );
      }

      const result = await CncAnalysisService.analyzeUpload(user.uid, validation.data.fileKey);
      if (!result.success) {
        logger.warn({ event: 'API: CNC analysis failed', reqId, code: result.error.code });
        return NextResponse.json(
          { error: result.error.message, code: result.error.code },
          { status: result.error.statusCode }
        );
      }
      logger.info({ event: 'API: CNC analysis stored', reqId, analysisId: result.data.analysisId });
      return NextResponse.json(result.data);
    } catch (e) {
      logger.error({ event: 'API: Unexpected error in analyzeCnc', reqId, error: e });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },

  /**
   * Analyses the caller's wizard upload for sheet-metal or 3D-print pricing and
   * stores it; the part wizard prices from the returned analysisId.
   */
  async analyzePart(request: NextRequest) {
    const reqId = Math.random().toString(36).substring(7);
    logger.info({ event: 'API: Part analysis started', reqId });

    try {
      const user = await requireRegisteredUser(request, reqId);
      if (user instanceof NextResponse) return user;

      const validation = partAnalyzeSchema.safeParse(await request.json());
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid analysis request', code: ErrorCode.VALIDATION_FAILED },
          { status: 400 }
        );
      }

      const { fileKey, kind } = validation.data;
      const result = await PartAnalysisService.analyzeUpload(user.uid, fileKey, kind);
      if (!result.success) {
        logger.warn({ event: 'API: Part analysis failed', reqId, kind, code: result.error.code });
        return NextResponse.json(
          { error: result.error.message, code: result.error.code },
          { status: result.error.statusCode }
        );
      }
      logger.info({ event: 'API: Part analysis stored', reqId, kind, analysisId: result.data.analysisId });
      return NextResponse.json(result.data);
    } catch (e) {
      logger.error({ event: 'API: Unexpected error in analyzePart', reqId, error: e });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },

  /**
   * Prices and saves a CNC quote from an analysis stored by analyzeCnc.
   * Signed-in users only, like createQuote; the price is recomputed server-side.
   */
  async createCncQuote(request: NextRequest) {
    const reqId = Math.random().toString(36).substring(7);
    logger.info({ event: 'API: CNC quote creation started', reqId });

    try {
      const user = await requireRegisteredUser(request, reqId);
      if (user instanceof NextResponse) return user;

      const body = await request.json();

      const validation = cncQuoteCreateSchema.safeParse(body);
      if (!validation.success) {
        logger.warn({
          event: 'API: CNC quote validation failed',
          reqId,
          errors: validation.error.format(),
        });
        return NextResponse.json(
          {
            error: 'Invalid CNC quote request',
            details: validation.error.format(),
          },
          { status: 400 }
        );
      }

      const { analysisId, request: quoteRequest } = validation.data;
      const result = await QuotingService.processStoredCncQuoteRequest(
        analysisId,
        quoteRequest,
        user.uid
      );

      if (result.success) {
        logger.info({
          event: 'API: CNC quote generated successfully',
          reqId,
          quoteRef: result.data.quoteRef,
        });
        return NextResponse.json(result.data);
      } else {
        const error = result.error;
        logger.error({
          event: 'API: CNC quote generation failed',
          reqId,
          code: error.code,
          message: error.message,
        });
        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
          },
          { status: error.statusCode }
        );
      }
    } catch (e) {
      logger.error({ event: 'API: Unexpected error in createCncQuote', reqId, error: e });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },

  /**
   * The admin-applied price multipliers, so live prices in the browser match the
   * quote of record the server saves. Read-only; signed-in users only.
   */
  async getCalibration(request: NextRequest) {
    const reqId = Math.random().toString(36).substring(7);
    const user = await requireRegisteredUser(request, reqId);
    if (user instanceof NextResponse) return user;
    const config = await PricingCalibrationRepository.getConfig();
    return NextResponse.json({ multipliers: config.multipliers, shopLoad: config.shopLoad ?? null });
  },

  /**
   * Retrieves a shared quote by reference (signed-in users only — it shows prices).
   */
  async getSharedQuote(request: NextRequest, ref: string) {
    logger.info({ event: 'API: Share quote lookup started', ref });

    try {
      const user = await requireRegisteredUser(request, ref);
      if (user instanceof NextResponse) return user;

      const result = await QuotingService.getQuote(ref);

      if (result.success) {
        logger.info({ event: 'API: Shared quote retrieved', ref });
        return NextResponse.json(result.data);
      } else if (result.error.code === ErrorCode.NOT_FOUND) {
        logger.warn({ event: 'API: Shared quote not found', ref });
        return NextResponse.json(
          {
            error: 'Quote not found',
            code: ErrorCode.NOT_FOUND,
          },
          { status: 404 }
        );
      } else {
        logger.error({ event: 'API: Shared quote lookup failed', ref, code: result.error.code });
        return NextResponse.json(
          { error: result.error.message, code: result.error.code },
          { status: result.error.statusCode }
        );
      }
    } catch (e) {
      logger.error({ event: 'API: Error retrieving shared quote', ref, error: e });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
};
