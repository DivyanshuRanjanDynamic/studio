import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { Result, ok, err } from '@/utils/result';
import { AppError, internalError } from '@/utils/errors';
import type { MechanicalPart } from '@/models/project.model';
import { logger } from '@/utils/logger';

/**
 * PartRepository — server-side writes to `projectParts` (Admin SDK).
 * Parts carrying a price are only ever created here; the client rules forbid
 * price fields on parts.
 */
export const PartRepository = {
  /** New document id in `projectParts` */
  newPartId(): string {
    const { adminFirestore } = getFirebaseAdmin();
    if (!adminFirestore) throw new Error('Firestore Admin not initialized');
    return adminFirestore.collection('projectParts').doc().id;
  },

  /** Every part of a project (ordered by creation) */
  async getPartsByProjectId(projectId: string): Promise<Result<MechanicalPart[], AppError>> {
    try {
      const { adminFirestore } = getFirebaseAdmin();
      if (!adminFirestore) return err(internalError('Database is not configured'));
      const snap = await adminFirestore.collection('projectParts').where('projectId', '==', projectId).get();
      const parts = snap.docs.map((d: { data: () => MechanicalPart }) => d.data() as MechanicalPart);
      parts.sort((a: MechanicalPart, b: MechanicalPart) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
      return ok(parts);
    } catch (e: any) {
      logger.error({ event: 'PartRepository: Failed to fetch parts', error: e?.message, projectId });
      return err(internalError('Failed to load the project parts'));
    }
  },

  /** Parts added with an instant price (capped; unordered, so no composite index) — pricing calibration reads these */
  async getInstantPricedParts(limit = 2000): Promise<Result<MechanicalPart[], AppError>> {
    try {
      const { adminFirestore } = getFirebaseAdmin();
      if (!adminFirestore) return err(internalError('Database is not configured'));
      const snap = await adminFirestore
        .collection('projectParts')
        .where('quoteStatus', '==', 'instant')
        .limit(limit)
        .get();
      return ok(snap.docs.map((d: { data: () => MechanicalPart }) => d.data() as MechanicalPart));
    } catch (e: any) {
      logger.error({ event: 'PartRepository: Failed to fetch instant-priced parts', error: e?.message });
      return err(internalError('Failed to load priced parts'));
    }
  },

  /** Creates the part and touches the project's updatedAt in one batch */
  async createPart(part: MechanicalPart): Promise<Result<MechanicalPart, AppError>> {
    try {
      const { adminFirestore } = getFirebaseAdmin();
      if (!adminFirestore) return err(internalError('Database is not configured'));

      // Admin SDK rejects `undefined` — drop optional fields that aren't set.
      const data = JSON.parse(JSON.stringify(part));
      const batch = adminFirestore.batch();
      batch.set(adminFirestore.collection('projectParts').doc(part.id), data);
      batch.update(adminFirestore.collection('projectRFQs').doc(part.projectId), {
        updatedAt: part.createdAt,
      });
      await batch.commit();
      return ok(part);
    } catch (e: any) {
      logger.error({ event: 'PartRepository: Failed to create part', error: e?.message, projectId: part.projectId });
      return err(internalError('Failed to save the part'));
    }
  },
};
