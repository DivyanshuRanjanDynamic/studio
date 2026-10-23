import { nanoid } from 'nanoid';
import { S3_BUCKET, getPresignedDownloadUrl } from '@/lib/s3-client';
import { analyzePrintFromUrl, analyzeSheetFromUrl } from '@/lib/converter-client';
import { PartAnalysesRepository } from '@/lib/firebase/repositories/part-analyses';
import { FileAccessRepository } from '@/repositories/file-access.repository';
import type { PartAnalysisHandle, PrintAnalysis, SheetAnalysis } from '@/types/quoting';
import { Result, ok, err } from '@/utils/result';
import { AppError, internalError, notFoundError, validationError } from '@/utils/errors';
import { logger } from '@/utils/logger';

// ═══════════════════════════════════════════════════
// PartAnalysisService — wizard upload → converter → stored sheet/print analysis
// Same contract as CncAnalysisService: the browser never sends geometry;
// quotes are priced from an analysisId the caller owns.
// ═══════════════════════════════════════════════════

export type PartAnalysisKind = 'sheet' | 'print';

const EXTENSIONS: Readonly<Record<PartAnalysisKind, readonly string[]>> = {
  sheet: ['.step', '.stp', '.dxf'],
  print: ['.step', '.stp', '.stl', '.obj'],
};
const ID_PREFIX: Readonly<Record<PartAnalysisKind, string>> = { sheet: 'sma', print: 'pra' };
const ID_PATTERN: Readonly<Record<PartAnalysisKind, RegExp>> = {
  sheet: /^sma_[A-Za-z0-9_-]{16}$/,
  print: /^pra_[A-Za-z0-9_-]{16}$/,
};
const DOWNLOAD_URL_TTL_S = 10 * 60; // converter fetches immediately

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot >= 0 ? fileName.slice(dot).toLowerCase() : '';
}

export function isPartAnalysisId(kind: PartAnalysisKind, analysisId: string): boolean {
  return ID_PATTERN[kind].test(analysisId);
}

export const PartAnalysisService = {
  /** Analyse the caller's own wizard upload for sheet-metal or 3D-print pricing and store it */
  async analyzeUpload(
    userId: string,
    fileKey: string,
    kind: PartAnalysisKind
  ): Promise<Result<PartAnalysisHandle, AppError>> {
    const fileName = fileKey.slice(fileKey.lastIndexOf('/') + 1);
    if (!EXTENSIONS[kind].includes(extensionOf(fileName))) {
      return err(
        validationError(
          kind === 'sheet'
            ? 'Sheet metal quotes need a STEP (.step, .stp) or DXF file.'
            : '3D print quotes need a STEP, STL or OBJ file.'
        )
      );
    }

    // Only files the caller uploaded through /api/v1/files/upload-intent
    const record = await FileAccessRepository.getUploadRecord(fileKey);
    if (!record.success) return err(record.error);
    if (!record.data || record.data.userId !== userId || record.data.kind !== 'cad') {
      logger.warn({ event: 'Part analyze rejected foreign or unknown key', userId, fileKey, kind });
      return err(notFoundError('Upload', fileKey));
    }

    let fileUrl: string;
    try {
      fileUrl = await getPresignedDownloadUrl(fileKey, S3_BUCKET, DOWNLOAD_URL_TTL_S);
    } catch (e) {
      logger.error({ event: 'Part analysis download presign failed', error: e, fileKey });
      return err(internalError('Could not read the uploaded file'));
    }

    const analysisId = `${ID_PREFIX[kind]}_${nanoid(16)}`;
    const createdAt = new Date().toISOString();

    if (kind === 'sheet') {
      const analyzed = await analyzeSheetFromUrl(fileUrl, fileName);
      if (!analyzed.success) return err(analyzed.error);
      const saved = await PartAnalysesRepository.saveAnalysis({
        analysisId, userId, fileKey, fileName, createdAt, kind, analysis: analyzed.data,
      });
      if (!saved.success) return err(saved.error);
      return ok({ kind, analysisId, analysis: analyzed.data });
    }

    const analyzed = await analyzePrintFromUrl(fileUrl, fileName);
    if (!analyzed.success) return err(analyzed.error);
    const saved = await PartAnalysesRepository.saveAnalysis({
      analysisId, userId, fileKey, fileName, createdAt, kind, analysis: analyzed.data,
    });
    if (!saved.success) return err(saved.error);
    return ok({ kind, analysisId, analysis: analyzed.data });
  },

  /** A stored sheet analysis, only for the user it was made for (others get NOT_FOUND) */
  async getOwnedSheetAnalysis(userId: string, analysisId: string): Promise<Result<SheetAnalysis, AppError>> {
    const stored = await getOwned(userId, analysisId, 'sheet');
    return stored.success ? ok(stored.data.analysis as SheetAnalysis) : stored;
  },

  /** A stored print analysis, only for the user it was made for (others get NOT_FOUND) */
  async getOwnedPrintAnalysis(userId: string, analysisId: string): Promise<Result<PrintAnalysis, AppError>> {
    const stored = await getOwned(userId, analysisId, 'print');
    return stored.success ? ok(stored.data.analysis as PrintAnalysis) : stored;
  },
};

async function getOwned(userId: string, analysisId: string, kind: PartAnalysisKind) {
  if (!isPartAnalysisId(kind, analysisId)) return err(notFoundError('Part analysis', analysisId));
  const stored = await PartAnalysesRepository.getAnalysis(analysisId);
  if (!stored.success) return err(stored.error);
  if (stored.data.userId !== userId || stored.data.kind !== kind) {
    logger.warn({ event: 'Part analysis owner/kind mismatch', analysisId, userId, kind });
    return err(notFoundError('Part analysis', analysisId));
  }
  return ok(stored.data);
}
