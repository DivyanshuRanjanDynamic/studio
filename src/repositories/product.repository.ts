import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { Result, ok, err } from '@/utils/result';
import { AppError, internalError } from '@/utils/errors';
import { logger } from '@/utils/logger';

const COLLECTION_NAME = 'products';

/** Shop product as stored by the admin catalogue (fields checkout relies on) */
export interface StoredProduct {
  readonly id: string;
  readonly name?: string;
  readonly sku?: string;
  readonly basePrice?: number;
  readonly salePrice?: number;
  readonly inventory?: number;
  readonly isActive?: boolean;
}

/**
 * ProductRepository — server-side reads of the shop catalogue (Admin SDK).
 * Checkout prices come from here, never from the cart.
 */
export const ProductRepository = {
  /** Products by id; ids that don't exist are simply absent from the map */
  async getProductsByIds(ids: readonly string[]): Promise<Result<Map<string, StoredProduct>, AppError>> {
    const found = new Map<string, StoredProduct>();
    if (ids.length === 0) return ok(found);

    try {
      const { adminFirestore } = getFirebaseAdmin();
      if (!adminFirestore) return err(internalError('Database is not configured'));

      const refs = ids.map((id) => adminFirestore.collection(COLLECTION_NAME).doc(id));
      const snaps = await adminFirestore.getAll(...refs);
      for (const snap of snaps) {
        if (snap.exists) found.set(snap.id, { id: snap.id, ...snap.data() } as StoredProduct);
      }
      return ok(found);
    } catch (e: any) {
      logger.error({ event: 'ProductRepository: Failed to fetch products', error: e?.message });
      return err(internalError('Database error while fetching products'));
    }
  },
};
