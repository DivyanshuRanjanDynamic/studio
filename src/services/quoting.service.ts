import {
  AnyQuoteResult,
  CncAnalysis,
  CncQuoteRequest,
  CncQuoteResult,
  SheetAnalysis,
  SheetQuoteRequest,
  SheetQuoteResult,
} from '@/types/quoting';
import { Result, ok, err } from '@/utils/result';
import { AppError, internalError, notFoundError } from '@/utils/errors';
import { generateCncQuote } from '@/lib/quoting/pricing-engine';
import { generateSheetQuote } from '@/lib/quoting/sheet-metal';
import { fitTapsToAnalysis } from '@/lib/quoting/tapping';
import { QuotesRepository } from '@/lib/firebase/repositories/quotes';
import { CncAnalysisService } from '@/services/cnc-analysis.service';
import { PartAnalysisService } from '@/services/part-analysis.service';
import { PricingCalibrationRepository } from '@/repositories/pricing-calibration.repository';
import { calibrateQuote, resolveMultiplier } from '@/lib/quoting/pricing-calibration';
import { logger } from '@/utils/logger';
import { customAlphabet } from 'nanoid';

// The engine's ref is timestamp-derived (collides, guessable). Persisted quotes are
// share links and checkout keys, so they get a random ref (no 0/O/1/I).
const newQuoteRef = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 10);
export const QUOTE_REF_PATTERN = /^MH-[23456789A-HJ-NP-Z]{10}$/;

/** A fresh random quote ref (MH-XXXXXXXXXX) */
export function issueQuoteRef(): string {
  return `MH-${newQuoteRef()}`;
}

// ═══════════════════════════════════════════════════
// QuotingService — Orchestrates the quoting process
// ═══════════════════════════════════════════════════

export const QuotingService = {
  /**
   * Processes a laser (sheet) quote request:
   * 1. Re-prices the /analyze-sheet result server-side (client prices are display-only)
   * 2. Persists the result to Firestore
   * 3. Returns the final SheetQuoteResult
   */
  async processSheetQuoteRequest(
    analysis: SheetAnalysis,
    request: SheetQuoteRequest,
    userId?: string
  ): Promise<Result<SheetQuoteResult, AppError>> {
    logger.info({
      event: 'Processing laser quote request',
      materialId: request.materialId,
      thicknessMm: request.thicknessMm,
      quantity: request.quantity,
      userId,
    });

    try {
      const calibration = await PricingCalibrationRepository.getConfig();
      const quoteResult = generateSheetQuote(analysis, request, calibration.shopLoad);

      if (!quoteResult.success) {
        return err(quoteResult.error);
      }

      const calibrated = calibrateQuote(quoteResult.data, resolveMultiplier(calibration, 'sheet', request.materialId));
      const resultData: SheetQuoteResult = { ...calibrated, quoteRef: `MH-${newQuoteRef()}` };

      const saveResult = await QuotesRepository.saveQuote(resultData, userId);

      if (!saveResult.success) {
        return err(saveResult.error);
      }

      logger.info({
        event: 'Laser quote processed and saved successfully',
        quoteRef: resultData.quoteRef,
        totalPrice: resultData.totalPrice,
      });

      return ok(resultData);
    } catch (e) {
      logger.error({ event: 'Unexpected error in QuotingService (laser)', error: e, request });
      return err(internalError('An unexpected error occurred during quoting'));
    }
  },

  /**
   * Prices and saves a laser quote from a sheet analysis this server stored for
   * the caller. The customer only names the analysis — never its numbers.
   */
  async processStoredSheetQuoteRequest(
    analysisId: string,
    request: SheetQuoteRequest,
    userId: string
  ): Promise<Result<SheetQuoteResult, AppError>> {
    const analysis = await PartAnalysisService.getOwnedSheetAnalysis(userId, analysisId);
    if (!analysis.success) return err(analysis.error);
    return QuotingService.processSheetQuoteRequest(analysis.data, request, userId);
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
      const calibration = await PricingCalibrationRepository.getConfig();
      const quoteResult = generateCncQuote(analysis, request, undefined, calibration.shopLoad);

      if (!quoteResult.success) {
        return err(quoteResult.error);
      }

      const calibrated = calibrateQuote(quoteResult.data, resolveMultiplier(calibration, 'cnc', request.materialId));
      const resultData: CncQuoteResult = { ...calibrated, quoteRef: `MH-${newQuoteRef()}` };

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
    userId: string,
    /** Price only the threads the analysed holes can take (parts from the 3D-preview wizard) */
    options: { fitTaps?: boolean } = {}
  ): Promise<Result<CncQuoteResult, AppError>> {
    const analysis = await CncAnalysisService.getOwnedAnalysis(userId, analysisId);
    if (!analysis.success) return err(analysis.error);
    let priced = request;
    if (options.fitTaps && request.taps?.length) {
      const { fitted } = fitTapsToAnalysis(analysis.data, request.taps);
      const { taps: _requested, ...rest } = request;
      priced = fitted.length > 0 ? { ...rest, taps: fitted } : rest;
    }
    return QuotingService.processCncQuoteRequest(analysis.data, priced, userId);
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
