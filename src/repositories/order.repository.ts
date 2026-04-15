import { db } from '@/firebase/config';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { Result, ok, err } from '@/utils/result';
import { AppError, internalError, notFoundError } from '@/utils/errors';
import { QuoteOrder, OrderStatus } from '@/models/order.model';
import { logger } from '@/utils/logger';

const COLLECTION_NAME = 'orders';

/**
 * OrderRepository handles Firestore operations for MechHub orders.
 */
export const OrderRepository = {
  /**
   * Saves or updates an order document.
   */
  async saveOrder(order: Partial<QuoteOrder> & { id: string }): Promise<Result<string, AppError>> {
    try {
      const { adminFirestore } = getFirebaseAdmin();
      const timestamp = new Date().toISOString();
      const data = {
        ...order,
        updatedAt: timestamp,
      };

      if (adminFirestore) {
        // Clean undefined properties for Admin SDK
        const cleanData = JSON.parse(JSON.stringify(data));
        await adminFirestore.collection(COLLECTION_NAME).doc(order.id).set(cleanData, { merge: true });
        return ok(order.id);
      } else {
        const { setDoc, doc } = await import('firebase/firestore');
        await setDoc(doc(db, COLLECTION_NAME, order.id), data, { merge: true });
        return ok(order.id);
      }
    } catch (e: any) {
      logger.error({ event: 'OrderRepository: Failed to save order', error: e.message, id: order.id });
      return err(internalError(`Database Error: ${e.message}`));
    }
  },

  /**
   * Retrieves an order by ID.
   */
  async getOrderById(id: string): Promise<Result<QuoteOrder, AppError>> {
    try {
      const { adminFirestore } = getFirebaseAdmin();
      
      if (adminFirestore) {
        const doc = await adminFirestore.collection(COLLECTION_NAME).doc(id).get();
        if (!doc.exists) return err(notFoundError('Order', id));
        return ok({ id: doc.id, ...doc.data() } as QuoteOrder);
      } else {
        const { getDoc, doc } = await import('firebase/firestore');
        const snap = await getDoc(doc(db, COLLECTION_NAME, id));
        if (!snap.exists()) return err(notFoundError('Order', id));
        return ok({ id: snap.id, ...snap.data() } as QuoteOrder);
      }
    } catch (e: any) {
      logger.error({ event: 'OrderRepository: Failed to fetch order', error: e.message, id });
      return err(internalError('Database error while fetching order'));
    }
  },

  /**
   * Fetches all orders for a specific user.
   */
  async getOrdersByUserId(userId: string): Promise<Result<QuoteOrder[], AppError>> {
    try {
      const { adminFirestore } = getFirebaseAdmin();
      
      if (adminFirestore) {
        const snapshot = await adminFirestore.collection(COLLECTION_NAME).where('userId', '==', userId).get();
        const orders: QuoteOrder[] = [];
        snapshot.forEach((doc: any) => orders.push({ id: doc.id, ...doc.data() } as QuoteOrder));
        return ok(orders);
      } else {
        const { query, collection, where, getDocs } = await import('firebase/firestore');
        const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
        const snap = await getDocs(q);
        const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuoteOrder));
        return ok(orders);
      }
    } catch (e: any) {
      logger.error({ event: 'OrderRepository: Failed to fetch user orders', error: e.message, userId });
      return err(internalError('Database error while fetching user orders'));
    }
  },

  /**
   * Updates the lifecycle status of an order.
   */
  async updateStatus(id: string, status: OrderStatus): Promise<Result<void, AppError>> {
    return this.saveOrder({ id, status }).then(res => res.success ? ok(undefined) : res as any);
  }
};
