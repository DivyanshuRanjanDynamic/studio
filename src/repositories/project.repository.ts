import { db } from '@/firebase/config';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { Result, ok, err } from '@/utils/result';
import { AppError, internalError, notFoundError } from '@/utils/errors';
import { ProjectRFQ, ProjectRFQStatus } from '@/models/project.model';
import { logger } from '@/utils/logger';

const COLLECTION_NAME = 'projectRFQs';

/**
 * ProjectRepository handles Firestore interactions for innovation projects and RFQs.
 */
export const ProjectRepository = {
  /**
   * Saves a Project RFQ document.
   */
  async saveProjectRfq(rfq: Partial<ProjectRFQ> & { id: string }): Promise<Result<string, AppError>> {
    try {
      const { adminFirestore } = getFirebaseAdmin();
      const timestamp = new Date().toISOString();
      const data = {
        ...rfq,
        updatedAt: timestamp,
      };

      if (adminFirestore) {
        await adminFirestore.collection(COLLECTION_NAME).doc(rfq.id).set(data, { merge: true });
        return ok(rfq.id);
      } else {
        const { setDoc, doc } = await import('firebase/firestore');
        await setDoc(doc(db, COLLECTION_NAME, rfq.id), data, { merge: true });
        return ok(rfq.id);
      }
    } catch (e: any) {
      logger.error({ event: 'ProjectRepository: Failed to save RFQ', error: e.message, id: rfq.id });
      return err(internalError('Database error while saving RFQ'));
    }
  },

  /**
   * Retrieves a Project RFQ by ID.
   */
  async getProjectRfqById(id: string): Promise<Result<ProjectRFQ, AppError>> {
    try {
      const { adminFirestore } = getFirebaseAdmin();
      
      if (adminFirestore) {
        const doc = await adminFirestore.collection(COLLECTION_NAME).doc(id).get();
        if (!doc.exists) return err(notFoundError('ProjectRFQ', id));
        return ok({ id: doc.id, ...doc.data() } as ProjectRFQ);
      } else {
        const { getDoc, doc } = await import('firebase/firestore');
        const snap = await getDoc(doc(db, COLLECTION_NAME, id));
        if (!snap.exists()) return err(notFoundError('ProjectRFQ', id));
        return ok({ id: snap.id, ...snap.data() } as ProjectRFQ);
      }
    } catch (e: any) {
      logger.error({ event: 'ProjectRepository: Failed to fetch RFQ', error: e.message, id });
      return err(internalError('Database error while fetching RFQ'));
    }
  },

  /**
   * Fetches all RFQs for a specific user.
   */
  async getRfqsByUserId(userId: string): Promise<Result<ProjectRFQ[], AppError>> {
    try {
      const { adminFirestore } = getFirebaseAdmin();
      
      if (adminFirestore) {
        const snapshot = await adminFirestore.collection(COLLECTION_NAME).where('userId', '==', userId).get();
        const rfqs: ProjectRFQ[] = [];
        snapshot.forEach((doc: any) => rfqs.push({ id: doc.id, ...doc.data() } as ProjectRFQ));
        return ok(rfqs);
      } else {
        const { query, collection, where, getDocs } = await import('firebase/firestore');
        const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
        const snap = await getDocs(q);
        const rfqs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectRFQ));
        return ok(rfqs);
      }
    } catch (e: any) {
      logger.error({ event: 'ProjectRepository: Failed to fetch user RFQs', error: e.message, userId });
      return err(internalError('Database error while fetching user RFQs'));
    }
  },

  /**
   * Updates the status of an RFQ.
   */
  async updateStatus(id: string, status: ProjectRFQStatus): Promise<Result<void, AppError>> {
    return this.saveProjectRfq({ id, status }).then(res => res.success ? ok(undefined) : res as any);
  }
};
