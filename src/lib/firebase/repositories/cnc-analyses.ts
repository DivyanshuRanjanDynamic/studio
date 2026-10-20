import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { Result, ok, err } from '@/utils/result';
import { AppError, internalError, notFoundError } from '@/utils/errors';
import type { CncAnalysis } from '@/types/quoting';
import { logger } from '@/utils/logger';

// ═══════════════════════════════════════════════════
// CncAnalysesRepository — converter results, stored server-side
// CNC quotes reference an analysisId, so customers can't submit their own numbers.
// Admin SDK only: no client rules cover this collection.
// ═══════════════════════════════════════════════════

const COLLECTION_NAME = 'cncAnalyses';

export interface StoredCncAnalysis {
  readonly analysisId: string;
  readonly userId: string;
  readonly fileKey: string;
  readonly fileName: string;
  readonly analysis: CncAnalysis;
  readonly createdAt: string;
}

export const CncAnalysesRepository = {
  async saveAnalysis(record: StoredCncAnalysis): Promise<Result<string, AppError>> {
    try {
      const { adminFirestore } = getFirebaseAdmin();
      if (!adminFirestore) return err(internalError('Database is not configured'));

      // Admin SDK rejects `undefined` (e.g. optional DFM fields) — drop them.
      const data = JSON.parse(JSON.stringify(record));
      await adminFirestore.collection(COLLECTION_NAME).doc(record.analysisId).set(data);

      logger.info({ event: 'CNC analysis saved', analysisId: record.analysisId, userId: record.userId });
      return ok(record.analysisId);
    } catch (e) {
      logger.error({ event: 'Failed to save CNC analysis', error: e, analysisId: record.analysisId });
      return err(internalError('Failed to save CNC analysis'));
    }
  },

  async getAnalysis(analysisId: string): Promise<Result<StoredCncAnalysis, AppError>> {
    try {
      const { adminFirestore } = getFirebaseAdmin();
      if (!adminFirestore) return err(internalError('Database is not configured'));

      const snap = await adminFirestore.collection(COLLECTION_NAME).doc(analysisId).get();
      if (!snap.exists) return err(notFoundError('CNC analysis', analysisId));
      return ok(snap.data() as StoredCncAnalysis);
    } catch (e) {
      logger.error({ event: 'Failed to fetch CNC analysis', error: e, analysisId });
      return err(internalError('Failed to fetch CNC analysis'));
    }
  },
};
