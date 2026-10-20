import { collection, doc, setDoc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { Result, ok, err } from '@/utils/result';
import { AppError, internalError, notFoundError } from '@/utils/errors';
import { AnyQuoteResult } from '@/types/quoting';
import { logger } from '@/utils/logger';

// ═══════════════════════════════════════════════════
// QuotesRepository — Firestore operations for Quotes
// Server routes use the Admin SDK (no client rules cover `quotes`);
// the client SDK is only a fallback when Admin is not configured.
// ═══════════════════════════════════════════════════

const COLLECTION_NAME = 'quotes';

export type StoredQuote = AnyQuoteResult & { userId: string | null };

/** Firestore Timestamp (either SDK) or a plain number → epoch millis */
function toMillis(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

/** Strips storage-only fields so callers get back the quote they saved */
function toStoredQuote(data: Record<string, unknown>): StoredQuote {
  const { createdAt: _createdAt, status: _status, ...quote } = data;
  return {
    ...(quote as unknown as AnyQuoteResult),
    expiresAt: toMillis(data.expiresAt),
    userId: (data.userId as string | null | undefined) ?? null,
  };
}

export const QuotesRepository = {
  /**
   * Saves a quote result (laser or CNC) to Firestore.
   * `expiresAt` keeps the quote's own epoch-millis value (15 minutes from pricing).
   */
  async saveQuote(quote: AnyQuoteResult, userId?: string): Promise<Result<string, AppError>> {
    try {
      // Admin SDK rejects `undefined` (e.g. optional DFM fields) — drop them.
      const data = JSON.parse(
        JSON.stringify({
          ...quote,
          userId: userId || null,
          createdAt: new Date().toISOString(),
          status: 'active',
        })
      );

      const { adminFirestore } = getFirebaseAdmin();
      if (adminFirestore) {
        await adminFirestore.collection(COLLECTION_NAME).doc(quote.quoteRef).set(data);
      } else {
        await setDoc(doc(collection(db, COLLECTION_NAME), quote.quoteRef), data);
      }

      logger.info({ event: 'Quote saved to Firestore', quoteRef: quote.quoteRef, userId });
      return ok(quote.quoteRef);
    } catch (e) {
      logger.error({ event: 'Failed to save quote', error: e, quoteRef: quote.quoteRef });
      return err(internalError('Failed to save quote to database'));
    }
  },

  /**
   * Retrieves a quote by its reference ID. Expired quotes are still returned;
   * callers decide what expiry means (share shows it, checkout rejects it).
   */
  async getQuoteByRef(ref: string): Promise<Result<StoredQuote, AppError>> {
    try {
      const { adminFirestore } = getFirebaseAdmin();
      let data: Record<string, unknown> | undefined;

      if (adminFirestore) {
        const snap = await adminFirestore.collection(COLLECTION_NAME).doc(ref).get();
        data = snap.exists ? snap.data() : undefined;
      } else {
        const snap = await getDoc(doc(db, COLLECTION_NAME, ref));
        data = snap.exists() ? snap.data() : undefined;
      }

      if (!data) {
        return err(notFoundError('Quote', ref));
      }

      const quote = toStoredQuote(data);
      if (quote.expiresAt < Date.now()) {
        logger.warn({ event: 'Attempted to access expired quote', quoteRef: ref });
      }

      return ok(quote);
    } catch (e) {
      logger.error({ event: 'Failed to fetch quote', error: e, quoteRef: ref });
      return err(internalError('Failed to fetch quote from database'));
    }
  },

  /**
   * Retrieves all quotes for a specific user.
   */
  async getQuotesByUserId(userId: string): Promise<Result<AnyQuoteResult[], AppError>> {
    try {
      const { adminFirestore } = getFirebaseAdmin();
      const quotes: AnyQuoteResult[] = [];

      if (adminFirestore) {
        const snapshot = await adminFirestore
          .collection(COLLECTION_NAME)
          .where('userId', '==', userId)
          .get();
        snapshot.forEach((d: { data: () => Record<string, unknown> }) =>
          quotes.push(toStoredQuote(d.data()))
        );
      } else {
        const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        snapshot.forEach((d) => quotes.push(toStoredQuote(d.data())));
      }

      return ok(quotes);
    } catch (e) {
      logger.error({ event: 'Failed to fetch user quotes', error: e, userId });
      return err(internalError('Failed to fetch user quotes from database'));
    }
  },
};
