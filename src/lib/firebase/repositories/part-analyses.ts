import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { Result, ok, err } from '@/utils/result';
import { AppError, internalError, notFoundError } from '@/utils/errors';
import type { PrintAnalysis, SheetAnalysis } from '@/types/quoting';
import { logger } from '@/utils/logger';

// ═══════════════════════════════════════════════════
// PartAnalysesRepository — sheet-metal and 3D-print converter results
// Quotes reference an analysisId, so customers can't submit their own geometry.
// Admin SDK only: no client rules cover this collection.
// ═══════════════════════════════════════════════════

const COLLECTION_NAME = 'partAnalyses';

interface StoredBase {
  readonly analysisId: string;
  readonly userId: string;
  readonly fileKey: string;
  readonly fileName: string;
  readonly createdAt: string;
}

export type StoredPartAnalysis =
  | (StoredBase & { readonly kind: 'sheet'; readonly analysis: SheetAnalysis })
  | (StoredBase & { readonly kind: 'print'; readonly analysis: PrintAnalysis });

export const PartAnalysesRepository = {
  async saveAnalysis(record: StoredPartAnalysis): Promise<Result<string, AppError>> {
    try {
      const { adminFirestore } = getFirebaseAdmin();
      if (!adminFirestore) return err(internalError('Database is not configured'));

      // Admin SDK rejects `undefined` — drop it.
      const data = JSON.parse(JSON.stringify(record));
      await adminFirestore.collection(COLLECTION_NAME).doc(record.analysisId).set(data);

      logger.info({ event: 'Part analysis saved', analysisId: record.analysisId, kind: record.kind, userId: record.userId });
      return ok(record.analysisId);
    } catch (e) {
      logger.error({ event: 'Failed to save part analysis', error: e, analysisId: record.analysisId });
      return err(internalError('Failed to save part analysis'));
    }
  },

  async getAnalysis(analysisId: string): Promise<Result<StoredPartAnalysis, AppError>> {
    try {
      const { adminFirestore } = getFirebaseAdmin();
      if (!adminFirestore) return err(internalError('Database is not configured'));

      const snap = await adminFirestore.collection(COLLECTION_NAME).doc(analysisId).get();
      if (!snap.exists) return err(notFoundError('Part analysis', analysisId));
      return ok(snap.data() as StoredPartAnalysis);
    } catch (e) {
      logger.error({ event: 'Failed to fetch part analysis', error: e, analysisId });
      return err(internalError('Failed to fetch part analysis'));
    }
  },
};
