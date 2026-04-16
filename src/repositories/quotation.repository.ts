import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { Result, ok, err } from '@/utils/result';
import { AppError, internalError, notFoundError } from '@/utils/errors';
import { Quotation } from '@/models/quotation.model';
import { logger } from '@/utils/logger';

const COLLECTION_NAME = 'quotations';

export const QuotationRepository = {
  /**
   * Saves a Quotation document.
   */
  async saveQuotation(quotation: Partial<Quotation> & { id: string }): Promise<Result<string, AppError>> {
    try {
      const { adminFirestore } = getFirebaseAdmin();
      if (!adminFirestore) {
        return err(internalError('Admin SDK not available'));
      }

      const timestamp = new Date().toISOString();
      const data = {
        ...quotation,
        updatedAt: timestamp,
      };

      await adminFirestore.collection(COLLECTION_NAME).doc(quotation.id).set(data, { merge: true });
      return ok(quotation.id);
    } catch (e: any) {
      logger.error({ event: 'QuotationRepository: Failed to save quotation', error: e.message, id: quotation.id });
      return err(internalError('Database error while saving quotation'));
    }
  },

  /**
   * Retrieves a Quotation by ID.
   */
  async getQuotationById(id: string): Promise<Result<Quotation, AppError>> {
    try {
      const { adminFirestore } = getFirebaseAdmin();
      if (!adminFirestore) return err(internalError('Admin SDK not available'));

      const doc = await adminFirestore.collection(COLLECTION_NAME).doc(id).get();
      if (!doc.exists) return err(notFoundError('Quotation', id));

      return ok({ id: doc.id, ...doc.data() } as Quotation);
    } catch (e: any) {
      logger.error({ event: 'QuotationRepository: Failed to fetch quotation', error: e.message, id });
      return err(internalError('Database error while fetching quotation'));
    }
  },

  /**
   * Fetches quotations by rfqId.
   */
  async getQuotationsByRfqId(rfqId: string): Promise<Result<Quotation[], AppError>> {
    try {
      const { adminFirestore } = getFirebaseAdmin();
      if (!adminFirestore) return err(internalError('Admin SDK not available'));

      const snapshot = await adminFirestore.collection(COLLECTION_NAME)
        .where('rfqId', '==', rfqId)
        .orderBy('createdAt', 'desc')
        .get();

      const quotations: Quotation[] = [];
      snapshot.forEach((doc: any) => quotations.push({ id: doc.id, ...doc.data() } as Quotation));
      return ok(quotations);
    } catch (e: any) {
      logger.error({ event: 'QuotationRepository: Failed to fetch quotations for RFQ', error: e.message, rfqId });
      return err(internalError('Database error while fetching quotations'));
    }
  },

  /**
   * Fetches a single vendor's quotation for a specific RFQ.
   */
  async getVendorQuotationForRfq(rfqId: string, vendorId: string): Promise<Result<Quotation | null, AppError>> {
    try {
      const { adminFirestore } = getFirebaseAdmin();
      if (!adminFirestore) return err(internalError('Admin SDK not available'));

      const snapshot = await adminFirestore.collection(COLLECTION_NAME)
        .where('rfqId', '==', rfqId)
        .where('vendorId', '==', vendorId)
        .limit(1)
        .get();

      if (snapshot.empty) return ok(null);
      const doc = snapshot.docs[0];
      return ok({ id: doc.id, ...doc.data() } as Quotation);
    } catch (e: any) {
      logger.error({ event: 'QuotationRepository: Failed to fetch vendor quotation', error: e.message, rfqId, vendorId });
      return err(internalError('Database error while fetching vendor quotation'));
    }
  }
};
