import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { Result, ok, err } from '@/utils/result';
import { AppError, internalError } from '@/utils/errors';
import { logger } from '@/utils/logger';

// ═══════════════════════════════════════════════════
// FileAccessRepository — who owns an uploaded file, and what references it
// `uploaded_files` records are written only here (Admin SDK) when the server
// authorises an upload; no client rule allows writing that collection.
// ═══════════════════════════════════════════════════

const UPLOADS = 'uploaded_files';

export interface UploadRecord {
  readonly fileId: string;
  readonly fileKey: string;
  readonly userId: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly kind: 'cad' | 'artifact';
  /** Projects this file was attached to as an artifact (server-written) */
  readonly projectIds?: readonly string[];
  /** Marks records written by the server — only these prove ownership */
  readonly source: 'server';
  readonly createdAt: string;
}

export interface PartReference {
  readonly userId?: string;
  readonly projectId?: string;
  readonly createdAt?: string;
}

export interface ProjectAccessInfo {
  readonly userId?: string;
  readonly assignedVendorId?: string | null;
  readonly shortlistedVendorIds?: readonly string[];
  readonly artifacts?: ReadonlyArray<{ readonly fileKey?: string; readonly uploadedBy?: string }>;
}

function db() {
  const { adminFirestore } = getFirebaseAdmin();
  if (!adminFirestore) throw new Error('Firestore Admin not initialized');
  return adminFirestore;
}

export const FileAccessRepository = {
  async recordUpload(record: UploadRecord): Promise<Result<void, AppError>> {
    try {
      await db().collection(UPLOADS).doc(record.fileId).set(JSON.parse(JSON.stringify(record)));
      return ok(undefined);
    } catch (e: any) {
      logger.error({ event: 'FileAccess: Failed to record upload', error: e?.message, fileKey: record.fileKey });
      return err(internalError('Could not record the upload'));
    }
  },

  /** The server-written upload record for a key, or null (legacy / unknown key) */
  async getUploadRecord(fileKey: string): Promise<Result<UploadRecord | null, AppError>> {
    try {
      const snap = await db()
        .collection(UPLOADS)
        .where('fileKey', '==', fileKey)
        .where('source', '==', 'server')
        .limit(1)
        .get();
      return ok(snap.empty ? null : (snap.docs[0].data() as UploadRecord));
    } catch (e: any) {
      logger.error({ event: 'FileAccess: Failed to read upload record', error: e?.message, fileKey });
      return err(internalError('Could not check file access'));
    }
  },

  async attachToProject(fileId: string, projectId: string): Promise<Result<void, AppError>> {
    try {
      const { FieldValue } = require('firebase-admin/firestore');
      await db().collection(UPLOADS).doc(fileId).update({ projectIds: FieldValue.arrayUnion(projectId) });
      return ok(undefined);
    } catch (e: any) {
      logger.error({ event: 'FileAccess: Failed to attach upload', error: e?.message, fileId, projectId });
      return err(internalError('Could not attach the file to the project'));
    }
  },

  async getPartsReferencing(fileKey: string): Promise<Result<PartReference[], AppError>> {
    try {
      const snap = await db().collection('projectParts').where('cadFile.fileUrl', '==', fileKey).limit(50).get();
      return ok(snap.docs.map((d: { data: () => PartReference }) => d.data()));
    } catch (e: any) {
      logger.error({ event: 'FileAccess: Failed to read parts', error: e?.message, fileKey });
      return err(internalError('Could not check file access'));
    }
  },

  async getProject(projectId: string): Promise<Result<ProjectAccessInfo | null, AppError>> {
    try {
      const snap = await db().collection('projectRFQs').doc(projectId).get();
      return ok(snap.exists ? (snap.data() as ProjectAccessInfo) : null);
    } catch (e: any) {
      logger.error({ event: 'FileAccess: Failed to read project', error: e?.message, projectId });
      return err(internalError('Could not check file access'));
    }
  },
};
