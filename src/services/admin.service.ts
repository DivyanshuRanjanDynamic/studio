import { db } from '@/firebase/db';
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase';

/**
 * AdminService handles administrative business logic for the MechHub platform.
 * It encapsulates operations related to RFQs, Orders, Vendors, and Products.
 */
export const AdminService = {
  /**
   * Updates the lifecycle stage of a Project RFQ.
   */
  async updateProjectRfqStatus(id: string, status: string) {
    const ref = doc(db, 'projectRFQs', id);
    return updateDoc(ref, {
      status,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Updates the status of a Shop Order.
   */
  async updateOrderStatus(id: string, status: string) {
    const ref = doc(db, 'orders', id);
    return updateDoc(ref, {
      status,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Updates a contact query status.
   */
  async updateContactQueryStatus(id: string, status: string) {
    const ref = doc(db, 'contactQueries', id);
    return updateDoc(ref, {
      status,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Performs non-blocking updates for high-concurrency admin actions.
   */
  updateStatusNonBlocking(collectionName: string, id: string, status: string) {
    const ref = doc(db, collectionName, id);
    return updateDocumentNonBlocking(ref, {
      status,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Deactivates a product by setting isActive to false.
   */
  async deactivateProduct(id: string) {
    const ref = doc(db, 'products', id);
    return updateDoc(ref, {
      isActive: false,
      updatedAt: new Date().toISOString(),
    });
  },
};
