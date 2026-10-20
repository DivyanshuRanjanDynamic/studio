import {
  AnyQuoteResult,
  CncAnalysis,
  CncQuoteRequest,
  CncQuoteResult,
  QuoteRequest,
  QuoteResult,
} from '@/types/quoting';
import { Result, ok, err } from '@/utils/result';
import { AppError, internalError, notFoundError } from '@/utils/errors';
import { generateQuote, generateCncQuote } from '@/lib/quoting/pricing-engine';
import { QuotesRepository } from '@/lib/firebase/repositories/quotes';
import { CncAnalysisService } from '@/services/cnc-analysis.service';
import { logger } from '@/utils/logger';
import { customAlphabet } from 'nanoid';

// The engine's ref is timestamp-derived (collides, guessable). Persisted quotes are
// share links and checkout keys, so they get a random ref (no 0/O/1/I).
const newQuoteRef = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 10);
export const QUOTE_REF_PATTERN = /^MH-[23456789A-HJ-NP-Z]{10}$/;

// ═══════════════════════════════════════════════════
// QuotingService — Orchestrates the quoting process
// ═══════════════════════════════════════════════════

export const QuotingService = {
  /**
   * Processes a quote request:
   * 1. Calculates pricing using engine
   * 2. Runs DFM checks
   * 3. Persists the result to Firestore
   * 4. Returns the final QuoteResult
   */
  async processQuoteRequest(
    request: QuoteRequest,
    userId?: string
  ): Promise<Result<QuoteResult, AppError>> {
    logger.info({
      event: 'Processing quote request',
      materialId: request.materialId,
      quantity: request.quantity,
      userId,
    });

    try {
      // 1. Generate the quote result (Logic in pricing-engine handles DFM + Pricing)
      const quoteResult = generateQuote(
        request.materialId,
        request.thicknessMm,
        request.finishType,
        request.quantity,
        request.turnaround,
        request.geometry
      );

      if (!quoteResult.success) {
        return err(quoteResult.error);
      }

      const resultData: QuoteResult = { ...quoteResult.data, quoteRef: `MH-${newQuoteRef()}` };

      // 2. Persist to Firestore for retrieval during checkout
      const saveResult = await QuotesRepository.saveQuote(resultData, userId);

      if (!saveResult.success) {
        return err(saveResult.error);
      }

      logger.info({
        event: 'Quote processed and saved successfully',
        quoteRef: resultData.quoteRef,
        totalPrice: resultData.totalPrice,
      });

      return ok(resultData);
    } catch (e) {
      logger.error({ event: 'Unexpected error in QuotingService', error: e, request });
      return err(internalError('An unexpected error occurred during quoting'));
    }
  },

  /**
   * Processes a CNC quote request:
   * 1. Re-prices the /analyze-cnc result server-side (client prices are display-only)
   * 2. Persists the result to Firestore
   * 3. Returns the final CncQuoteResult
   */
  async processCncQuoteRequest(
    analysis: CncAnalysis,
    request: CncQuoteRequest,
    userId?: string
  ): Promise<Result<CncQuoteResult, AppError>> {
    logger.info({
      event: 'Processing CNC quote request',
      materialId: request.materialId,
      quantity: request.quantity,
      process: request.process ?? analysis.process.recommended,
      analysisVersion: analysis.version,
      userId,
    });

    try {
      const quoteResult = generateCncQuote(analysis, request);

      if (!quoteResult.success) {
        return err(quoteResult.error);
      }

      const resultData: CncQuoteResult = { ...quoteResult.data, quoteRef: `MH-${newQuoteRef()}` };

      const saveResult = await QuotesRepository.saveQuote(resultData, userId);

      if (!saveResult.success) {
        return err(saveResult.error);
      }

      logger.info({
        event: 'CNC quote processed and saved successfully',
        quoteRef: resultData.quoteRef,
        totalPrice: resultData.totalPrice,
      });

      return ok(resultData);
    } catch (e) {
      logger.error({ event: 'Unexpected error in QuotingService (CNC)', error: e, request });
      return err(internalError('An unexpected error occurred during CNC quoting'));
    }
  },

  /**
   * Prices and saves a CNC quote from an analysis this server stored for the
   * caller. The customer only names the analysis — never its numbers.
   */
  async processStoredCncQuoteRequest(
    analysisId: string,
    request: CncQuoteRequest,
    userId: string
  ): Promise<Result<CncQuoteResult, AppError>> {
    const analysis = await CncAnalysisService.getOwnedAnalysis(userId, analysisId);
    if (!analysis.success) return err(analysis.error);
    return QuotingService.processCncQuoteRequest(analysis.data, request, userId);
  },

  /**
   * Retrieves a previously generated quote for sharing. Expired quotes are
   * returned as-is (the page shows them as expired); the owner's userId is not.
   */
  async getQuote(ref: string): Promise<Result<AnyQuoteResult, AppError>> {
    if (!QUOTE_REF_PATTERN.test(ref)) {
      return err(notFoundError('Quote', ref));
    }

    const result = await QuotesRepository.getQuoteByRef(ref);
    if (!result.success) return err(result.error);

    const { userId: _userId, ...quote } = result.data;
    return ok(quote as AnyQuoteResult);
  },
};
