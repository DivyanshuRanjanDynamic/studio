import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { customAlphabet, nanoid } from 'nanoid';
import { s3Client, S3_BUCKET, getPresignedDownloadUrl } from '@/lib/s3-client';
import { analyzeCncFromUrl } from '@/lib/converter-client';
import { CncAnalysesRepository } from '@/lib/firebase/repositories/cnc-analyses';
import { FileAccessRepository } from '@/repositories/file-access.repository';
import type { CncAnalysis } from '@/types/quoting';
import { Result, ok, err } from '@/utils/result';
import { AppError, ErrorCode, internalError, notFoundError, validationError } from '@/utils/errors';
import { logger } from '@/utils/logger';

// ═══════════════════════════════════════════════════
// CncAnalysisService — STEP upload → converter → stored analysis
// Browser uploads to S3 with a presigned PUT; this server asks the converter
// to analyse it and keeps the result. Quotes then reference the analysisId.
// ═══════════════════════════════════════════════════

const STEP_EXTENSIONS = ['.step', '.stp'];
export const MAX_CNC_UPLOAD_BYTES = 100 * 1024 * 1024; // converter's MAX_FILE_SIZE
export const CNC_UPLOAD_CONTENT_TYPE = 'application/octet-stream';
const UPLOAD_URL_TTL_S = 15 * 60;
const DOWNLOAD_URL_TTL_S = 10 * 60; // converter fetches immediately

const KEY_PREFIX = 'cnc-analysis';
const KEY_PATTERN = /^cnc-analysis\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]{12}\/[A-Za-z0-9._-]{1,200}$/;
const newKeyId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 12);
export const ANALYSIS_ID_PATTERN = /^cnca_[A-Za-z0-9_-]{16}$/;

export interface CncUploadIntent {
  readonly uploadUrl: string;
  readonly fileKey: string;
  readonly contentType: string;
  readonly expiresInSeconds: number;
}

export interface CncAnalysisHandle {
  readonly analysisId: string;
  readonly analysis: CncAnalysis;
}

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot >= 0 ? fileName.slice(dot).toLowerCase() : '';
}

export const CncAnalysisService = {
  /** Presigned PUT for a STEP file, under a key that belongs to `userId` */
  async createUploadIntent(
    userId: string,
    fileName: string,
    fileSize: number
  ): Promise<Result<CncUploadIntent, AppError>> {
    if (!STEP_EXTENSIONS.includes(extensionOf(fileName))) {
      return err(validationError('CNC quotes need a STEP file (.step or .stp).'));
    }
    if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_CNC_UPLOAD_BYTES) {
      return err(
        new AppError({
          code: ErrorCode.FILE_TOO_LARGE,
          message: `STEP files must be under ${MAX_CNC_UPLOAD_BYTES / (1024 * 1024)} MB.`,
          statusCode: 413,
        })
      );
    }

    const safeName = fileName.replace(/[^A-Za-z0-9.-]/g, '_').slice(-200);
    const fileKey = `${KEY_PREFIX}/${userId}/${newKeyId()}/${safeName}`;

    try {
      const uploadUrl = await getSignedUrl(
        s3Client,
        // ContentLength is signed: S3 rejects a body of any other size, so the
        // limit above holds for what is stored, not just what the client declared.
        new PutObjectCommand({ Bucket: S3_BUCKET, Key: fileKey, ContentType: CNC_UPLOAD_CONTENT_TYPE, ContentLength: fileSize }),
        { expiresIn: UPLOAD_URL_TTL_S }
      );
      return ok({
        uploadUrl,
        fileKey,
        contentType: CNC_UPLOAD_CONTENT_TYPE,
        expiresInSeconds: UPLOAD_URL_TTL_S,
      });
    } catch (e) {
      logger.error({ event: 'CNC upload intent failed', error: e, userId });
      return err(internalError('Could not prepare the file upload'));
    }
  },

  /**
   * Which STEP uploads a user may have analysed: keys minted by createUploadIntent
   * for them, or part-wizard uploads (/api/v1/files/upload-intent) whose
   * server-written ownership record names them. Anything else is NOT_FOUND.
   */
  async isOwnStepUpload(userId: string, fileKey: string): Promise<Result<boolean, AppError>> {
    if (KEY_PATTERN.test(fileKey) && fileKey.startsWith(`${KEY_PREFIX}/${userId}/`)) return ok(true);

    if (!STEP_EXTENSIONS.includes(extensionOf(fileKey))) return ok(false);
    const record = await FileAccessRepository.getUploadRecord(fileKey);
    if (!record.success) return err(record.error);
    return ok(record.data !== null && record.data.userId === userId && record.data.kind === 'cad');
  },

  /** Analyse the caller's own STEP upload and store the result */
  async analyzeUpload(userId: string, fileKey: string): Promise<Result<CncAnalysisHandle, AppError>> {
    const owned = await CncAnalysisService.isOwnStepUpload(userId, fileKey);
    if (!owned.success) return err(owned.error);
    if (!owned.data) {
      logger.warn({ event: 'CNC analyze rejected foreign or malformed key', userId, fileKey });
      return err(notFoundError('Upload', fileKey));
    }
    const fileName = fileKey.slice(fileKey.lastIndexOf('/') + 1);

    let fileUrl: string;
    try {
      fileUrl = await getPresignedDownloadUrl(fileKey, S3_BUCKET, DOWNLOAD_URL_TTL_S);
    } catch (e) {
      logger.error({ event: 'CNC download presign failed', error: e, fileKey });
      return err(internalError('Could not read the uploaded file'));
    }

    const analyzed = await analyzeCncFromUrl(fileUrl, fileName);
    if (!analyzed.success) return err(analyzed.error);

    const analysisId = `cnca_${nanoid(16)}`;
    const saved = await CncAnalysesRepository.saveAnalysis({
      analysisId,
      userId,
      fileKey,
      fileName,
      analysis: analyzed.data,
      createdAt: new Date().toISOString(),
    });
    if (!saved.success) return err(saved.error);

    return ok({ analysisId, analysis: analyzed.data });
  },

  /** A stored analysis, only for the user it was made for (others get NOT_FOUND) */
  async getOwnedAnalysis(userId: string, analysisId: string): Promise<Result<CncAnalysis, AppError>> {
    if (!ANALYSIS_ID_PATTERN.test(analysisId)) {
      return err(notFoundError('CNC analysis', analysisId));
    }
    const stored = await CncAnalysesRepository.getAnalysis(analysisId);
    if (!stored.success) return err(stored.error);
    if (stored.data.userId !== userId) {
      logger.warn({ event: 'CNC analysis owner mismatch', analysisId, userId });
      return err(notFoundError('CNC analysis', analysisId));
    }
    return ok(stored.data.analysis);
  },
};
