import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bracketAnalysis } from './__fixtures__/cnc-analysis';
import { ok, err } from '@/utils/result';
import { ErrorCode, notFoundError } from '@/utils/errors';
import type { CncQuoteRequest } from '@/types/quoting';

// No S3, converter or Firestore — every dependency is mocked.
const getSignedUrl = vi.fn();
const getPresignedDownloadUrl = vi.fn();
const analyzeCncFromUrl = vi.fn();
const saveAnalysis = vi.fn();
const getAnalysis = vi.fn();
const saveQuote = vi.fn();
const getUploadRecord = vi.fn();

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args: unknown[]) => getSignedUrl(...args),
}));
vi.mock('@/lib/s3-client', () => ({
  s3Client: {},
  S3_BUCKET: 'mechhub-cad-test',
  getPresignedDownloadUrl: (...args: unknown[]) => getPresignedDownloadUrl(...args),
}));
vi.mock('@/lib/converter-client', () => ({
  analyzeCncFromUrl: (...args: unknown[]) => analyzeCncFromUrl(...args),
}));
vi.mock('@/lib/firebase/repositories/cnc-analyses', () => ({
  CncAnalysesRepository: {
    saveAnalysis: (...args: unknown[]) => saveAnalysis(...args),
    getAnalysis: (...args: unknown[]) => getAnalysis(...args),
  },
}));
vi.mock('@/repositories/file-access.repository', () => ({
  FileAccessRepository: { getUploadRecord: (...args: unknown[]) => getUploadRecord(...args) },
}));
vi.mock('@/lib/firebase/repositories/quotes', () => ({
  QuotesRepository: { saveQuote: (...args: unknown[]) => saveQuote(...args) },
}));

// ═══════════════════════════════════════════════════
// CNC analysis: upload intent → server-side analysis → quote by analysisId
// ═══════════════════════════════════════════════════

const request: CncQuoteRequest = {
  materialId: 'al_6061',
  finishType: 'none',
  quantity: 10,
  turnaround: 'standard_3d',
};
const OWN_KEY = 'cnc-analysis/user_1/abcdefghijkl/bracket.step';

beforeEach(() => {
  [getSignedUrl, getPresignedDownloadUrl, analyzeCncFromUrl, saveAnalysis, getAnalysis, saveQuote, getUploadRecord].forEach(
    (m) => m.mockReset()
  );
  getUploadRecord.mockResolvedValue(ok(null));
});

describe('CncAnalysisService.createUploadIntent', () => {
  it('signs a PUT under a key that belongs to the caller', async () => {
    getSignedUrl.mockResolvedValue('https://s3.example/put?sig=1');
    const { CncAnalysisService } = await import('@/services/cnc-analysis.service');

    const result = await CncAnalysisService.createUploadIntent('user_1', 'My Bracket (v2).STEP', 2048);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.uploadUrl).toBe('https://s3.example/put?sig=1');
    expect(result.data.fileKey).toMatch(/^cnc-analysis\/user_1\/[A-Za-z0-9]{12}\/My_Bracket__v2_\.STEP$/);
    const command = getSignedUrl.mock.calls[0][1];
    expect(command.input).toMatchObject({
      Bucket: 'mechhub-cad-test',
      Key: result.data.fileKey,
      ContentType: result.data.contentType,
    });
  });

  it('rejects non-STEP files and files over the converter limit', async () => {
    const { CncAnalysisService, MAX_CNC_UPLOAD_BYTES } = await import('@/services/cnc-analysis.service');

    const dxf = await CncAnalysisService.createUploadIntent('user_1', 'plate.dxf', 100);
    const huge = await CncAnalysisService.createUploadIntent('user_1', 'big.step', MAX_CNC_UPLOAD_BYTES + 1);

    expect(dxf.success === false && dxf.error.code).toBe(ErrorCode.VALIDATION_FAILED);
    expect(huge.success === false && huge.error.code).toBe(ErrorCode.FILE_TOO_LARGE);
    expect(getSignedUrl).not.toHaveBeenCalled();
  });
});

describe('CncAnalysisService.analyzeUpload', () => {
  it('has the converter analyse a presigned URL and stores the result for the caller', async () => {
    getPresignedDownloadUrl.mockResolvedValue('https://s3.example/get?sig=2');
    analyzeCncFromUrl.mockResolvedValue(ok(bracketAnalysis));
    saveAnalysis.mockImplementation(async (r: { analysisId: string }) => ok(r.analysisId));
    const { CncAnalysisService, ANALYSIS_ID_PATTERN } = await import('@/services/cnc-analysis.service');

    const result = await CncAnalysisService.analyzeUpload('user_1', OWN_KEY);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.analysisId).toMatch(ANALYSIS_ID_PATTERN);
    expect(result.data.analysis).toEqual(bracketAnalysis);
    expect(getPresignedDownloadUrl).toHaveBeenCalledWith(OWN_KEY, 'mechhub-cad-test', expect.any(Number));
    expect(analyzeCncFromUrl).toHaveBeenCalledWith('https://s3.example/get?sig=2', 'bracket.step');
    expect(saveAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        analysisId: result.data.analysisId,
        userId: 'user_1',
        fileKey: OWN_KEY,
        analysis: bracketAnalysis,
      })
    );
  });

  it("refuses other users' keys and malformed keys without calling the converter", async () => {
    const { CncAnalysisService } = await import('@/services/cnc-analysis.service');

    for (const key of [
      'cnc-analysis/user_2/abcdefghijkl/bracket.step',
      'cnc-analysis/user_1/../user_2/abcdefghijkl/x.step',
      'cad-files/abcdefgh/bracket.step',
      'cnc-analysis/user_1/short/bracket.step',
    ]) {
      const result = await CncAnalysisService.analyzeUpload('user_1', key);
      expect(result.success === false && result.error.code, key).toBe(ErrorCode.NOT_FOUND);
    }
    expect(getPresignedDownloadUrl).not.toHaveBeenCalled();
    expect(analyzeCncFromUrl).not.toHaveBeenCalled();
  });

  it('passes converter failures through and stores nothing', async () => {
    getPresignedDownloadUrl.mockResolvedValue('https://s3.example/get');
    analyzeCncFromUrl.mockResolvedValue(err(notFoundError('x', 'y')));
    const { CncAnalysisService } = await import('@/services/cnc-analysis.service');

    const result = await CncAnalysisService.analyzeUpload('user_1', OWN_KEY);
    expect(result.success).toBe(false);
    expect(saveAnalysis).not.toHaveBeenCalled();
  });
});

describe('CncAnalysisService.analyzeUpload — part-wizard uploads', () => {
  const WIZARD_KEY = 'cad-files/Ab12Cd34/bracket.step';
  const record = (userId: string, kind = 'cad') => ok({ fileId: 'file_1', fileKey: WIZARD_KEY, userId, kind, source: 'server' });

  it("analyses the caller's own wizard upload, so one upload drives preview and costing", async () => {
    getUploadRecord.mockResolvedValue(record('user_1'));
    getPresignedDownloadUrl.mockResolvedValue('https://s3.example/get');
    analyzeCncFromUrl.mockResolvedValue(ok(bracketAnalysis));
    saveAnalysis.mockImplementation(async (r: { analysisId: string }) => ok(r.analysisId));
    const { CncAnalysisService } = await import('@/services/cnc-analysis.service');

    const result = await CncAnalysisService.analyzeUpload('user_1', WIZARD_KEY);

    expect(result.success).toBe(true);
    expect(getUploadRecord).toHaveBeenCalledWith(WIZARD_KEY);
    expect(analyzeCncFromUrl).toHaveBeenCalledWith('https://s3.example/get', 'bracket.step');
  });

  it("refuses someone else's wizard upload, artifacts and non-STEP files", async () => {
    const { CncAnalysisService } = await import('@/services/cnc-analysis.service');

    getUploadRecord.mockResolvedValueOnce(record('user_2'));
    expect((await CncAnalysisService.analyzeUpload('user_1', WIZARD_KEY)).success).toBe(false);

    getUploadRecord.mockResolvedValueOnce(record('user_1', 'artifact'));
    expect((await CncAnalysisService.analyzeUpload('user_1', WIZARD_KEY)).success).toBe(false);

    getUploadRecord.mockClear();
    const dxf = await CncAnalysisService.analyzeUpload('user_1', 'cad-files/Ab12Cd34/plate.dxf');
    expect(dxf.success === false && dxf.error.code).toBe(ErrorCode.NOT_FOUND);
    expect(getUploadRecord).not.toHaveBeenCalled();
    expect(analyzeCncFromUrl).not.toHaveBeenCalled();
  });
});

describe('QuotingService.processStoredCncQuoteRequest', () => {
  const stored = {
    analysisId: 'cnca_0123456789abcdef',
    userId: 'user_1',
    fileKey: OWN_KEY,
    fileName: 'bracket.step',
    analysis: bracketAnalysis,
    createdAt: '2026-10-20T00:00:00.000Z',
  };

  it('prices the stored analysis for its owner', async () => {
    getAnalysis.mockResolvedValue(ok(stored));
    saveQuote.mockImplementation(async (q: { quoteRef: string }) => ok(q.quoteRef));
    const { QuotingService } = await import('@/services/quoting.service');
    const { generateCncQuote } = await import('./pricing-engine');

    const result = await QuotingService.processStoredCncQuoteRequest(stored.analysisId, request, 'user_1');

    expect(result.success).toBe(true);
    if (!result.success) return;
    const expected = generateCncQuote(bracketAnalysis, request);
    expect(expected.success && expected.data.totalPrice).toBe(result.data.totalPrice);
    expect(result.data.analysis).toEqual(bracketAnalysis);
    expect(saveQuote).toHaveBeenCalledWith(result.data, 'user_1');
  });

  it("does not let one user quote another user's analysis", async () => {
    getAnalysis.mockResolvedValue(ok(stored));
    const { QuotingService } = await import('@/services/quoting.service');

    const result = await QuotingService.processStoredCncQuoteRequest(stored.analysisId, request, 'user_2');

    expect(result.success === false && result.error.code).toBe(ErrorCode.NOT_FOUND);
    expect(saveQuote).not.toHaveBeenCalled();
  });

  it('rejects malformed analysis ids without a database read', async () => {
    const { QuotingService } = await import('@/services/quoting.service');

    const result = await QuotingService.processStoredCncQuoteRequest('../quotes/x', request, 'user_1');
    expect(result.success === false && result.error.code).toBe(ErrorCode.NOT_FOUND);
    expect(getAnalysis).not.toHaveBeenCalled();
  });
});
