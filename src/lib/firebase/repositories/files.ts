import { collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/db';
import { Result, ok, err } from '@/utils/result';
import { AppError, internalError, notFoundError } from '@/utils/errors';
import { UploadedFile } from '@/types/quoting';
import { logger } from '@/utils/logger';

// ═══════════════════════════════════════════════════
// FilesRepository — Firestore operations for Uploaded Files
// ═══════════════════════════════════════════════════

const COLLECTION_NAME = 'uploaded_files';

export const FilesRepository = {
  /**
   * Saves file metadata to Firestore.
   */
  async saveFileMetadata(file: UploadedFile, userId?: string): Promise<Result<string, AppError>> {
    try {
      const fileRef = doc(collection(db, COLLECTION_NAME), file.id);

      const data = {
        ...file,
        userId: userId || null,
        createdAt: serverTimestamp(),
      };

      await setDoc(fileRef, data);

      logger.info({
        event: 'File metadata saved to Firestore',
        fileId: file.id,
        fileName: file.fileName,
        userId,
      });
      return ok(file.id);
    } catch (e) {
      logger.error({ event: 'Failed to save file metadata', error: e, fileId: file.id });
      return err(internalError('Failed to save file metadata to database'));
    }
  },

  /**
   * Retrieves file metadata by its ID.
   */
  async getFileMetadata(
    id: string
  ): Promise<Result<UploadedFile & { userId: string | null }, AppError>> {
    try {
      const fileDoc = await getDoc(doc(db, COLLECTION_NAME, id));

      if (!fileDoc.exists()) {
        return err(notFoundError('File', id));
      }

      return ok(fileDoc.data() as UploadedFile & { userId: string | null });
    } catch (e) {
      logger.error({ event: 'Failed to fetch file metadata', error: e, fileId: id });
      return err(internalError('Failed to fetch file metadata from database'));
    }
  },
};
