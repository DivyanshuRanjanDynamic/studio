import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCncQuote } from './pricing-engine';
import { bracketAnalysis } from './__fixtures__/cnc-analysis';
import { ok } from '@/utils/result';
import { ErrorCode } from '@/utils/errors';
import type { CncAnalysis } from '@/types/quoting';
import { isCncPartQuote, type PartInstantQuote } from '@/models/project.model';

// ═══════════════════════════════════════════════════
// PartService.addPart — the server prices and stores wizard parts
// Firestore, S3 and the converter are mocked.
// ═══════════════════════════════════════════════════

const getProjectRfqById = vi.fn();
const getUploadRecord = vi.fn();
const createPart = vi.fn();
const getAnalysis = vi.fn();
const saveQuote = vi.fn();

vi.mock('@/repositories/project.repository', () => ({
  ProjectRepository: { getProjectRfqById: (...a: unknown[]) => getProjectRfqById(...a) },
}));
vi.mock('@/repositories/file-access.repository', () => ({
  FileAccessRepository: { getUploadRecord: (...a: unknown[]) => getUploadRecord(...a) },
}));
vi.mock('@/repositories/part.repository', () => ({
  PartRepository: { newPartId: () => 'part_1', createPart: (...a: unknown[]) => createPart(...a) },
}));
vi.mock('@/lib/firebase/repositories/cnc-analyses', () => ({
  CncAnalysesRepository: { getAnalysis: (...a: unknown[]) => getAnalysis(...a), saveAnalysis: vi.fn() },
}));
vi.mock('@/lib/firebase/repositories/quotes', () => ({
  QuotesRepository: { saveQuote: (...a: unknown[]) => saveQuote(...a) },
}));
vi.mock('@/lib/s3-client', () => ({ s3Client: {}, S3_BUCKET: 'b', getPresignedDownloadUrl: vi.fn() }));
vi.mock('@/lib/converter-client', () => ({ analyzeCncFromUrl: vi.fn() }));

const FILE_KEY = 'cad-files/Ab12Cd34/bracket.step';
const ANALYSIS_ID = 'cnca_0123456789abcdef';

/** Bracket with four Ø5.0 (M6 tap drill) holes */
const tappable: CncAnalysis = {
  ...bracketAnalysis,
  features: {
    ...bracketAnalysis.features,
    holes: [{ diameterMm: 5.0, depthMm: 12, through: false, depthToDiameter: 2.4, count: 4 }],
  },
};

const body = (overrides: Record<string, unknown> = {}) => ({
  partName: 'Motor bracket',
  service: 'cnc_machining',
  cadFile: { fileName: 'bracket.step', fileKey: FILE_KEY, fileSize: 120_000 },
  material: { id: 'al_6061', name: 'Aluminium 6061', grade: '6061-T6' },
  secondaryProcesses: ['tapping', 'anodizing', 'heat_treatment'],
  coatingColor: 'black',
  taps: [
    { holeIndex: 0, tapType: 'M6x1.0' },
    { holeIndex: 1, tapType: 'M6x1.0' },
  ],
  quantity: 25,
  analysisId: ANALYSIS_ID,
  ...overrides,
});

beforeEach(() => {
  [getProjectRfqById, getUploadRecord, createPart, getAnalysis, saveQuote].forEach((m) => m.mockReset());
  getProjectRfqById.mockResolvedValue(ok({ id: 'proj_1', userId: 'user_1', status: 'draft' }));
  getUploadRecord.mockResolvedValue(
    ok({ fileId: 'f1', fileKey: FILE_KEY, userId: 'user_1', kind: 'cad', source: 'server', createdAt: '2026-10-20T00:00:00Z' })
  );
  getAnalysis.mockResolvedValue(ok({ analysisId: ANALYSIS_ID, userId: 'user_1', analysis: tappable }));
  saveQuote.mockImplementation(async (q: { quoteRef: string }) => ok(q.quoteRef));
  createPart.mockImplementation(async (part: unknown) => ok(part));
});

const tappedHoles = (q: PartInstantQuote | null | undefined) =>
  q && isCncPartQuote(q) ? q.breakdown.tappedHoles : undefined;

async function add(overrides: Record<string, unknown> = {}, userId = 'user_1') {
  const { PartService } = await import('@/services/part.service');
  return PartService.addPart(userId, 'proj_1', body(overrides));
}

describe('PartService.addPart', () => {
  it('prices a CNC part from the stored analysis and saves the server quote', async () => {
    const result = await add();

    expect(result.success).toBe(true);
    if (!result.success) return;
    const part = result.data;
    const expected = generateCncQuote(tappable, {
      materialId: 'al_6061',
      finishType: 'anodize_color',
      quantity: 25,
      turnaround: 'standard_3d',
      taps: [{ tapId: 'M6x1.0', count: 2 }],
    });
    expect(expected.success).toBe(true);
    if (!expected.success) return;

    expect(part.quoteStatus).toBe('instant');
    expect(part.instantQuote).toMatchObject({
      analysisId: ANALYSIS_ID,
      totalPrice: expected.data.totalPrice,
      pricePerPart: expected.data.pricePerPart,
      finishType: 'anodize_color',
      unpricedProcesses: ['heat_treatment'],
      quantity: 25,
    });
    expect(tappedHoles(part.instantQuote)).toBe(2);
    expect(part).toMatchObject({ id: 'part_1', userId: 'user_1', projectId: 'proj_1', status: 'ready_for_quote' });
    expect(part.cadFile).toMatchObject({ fileUrl: FILE_KEY, uploadedAt: '2026-10-20T00:00:00Z' });
    expect(saveQuote).toHaveBeenCalledWith(expect.anything(), 'user_1');
    expect(createPart).toHaveBeenCalledTimes(1);
  });

  it('ignores any price the client tries to send', async () => {
    const result = await add({ instantQuote: { totalPrice: 1 }, unitCost: 1, quoteStatus: 'instant' });
    expect(result.success && result.data.instantQuote?.totalPrice).toBeGreaterThan(1);
    expect(result.success && (result.data as unknown as { unitCost?: number }).unitCost).toBeUndefined();
  });

  it("refuses other people's projects, quoted projects and files", async () => {
    getProjectRfqById.mockResolvedValueOnce(ok({ id: 'proj_1', userId: 'someone_else', status: 'draft' }));
    expect(((await add()) as { error?: { code: string } }).error?.code).toBe(ErrorCode.NOT_FOUND);

    getProjectRfqById.mockResolvedValueOnce(ok({ id: 'proj_1', userId: 'user_1', status: 'quotation_sent' }));
    expect(((await add()) as { error?: { code: string } }).error?.code).toBe(ErrorCode.FORBIDDEN);

    getUploadRecord.mockResolvedValueOnce(ok({ fileKey: FILE_KEY, userId: 'someone_else', kind: 'cad', source: 'server' }));
    expect(((await add()) as { error?: { code: string } }).error?.code).toBe(ErrorCode.FORBIDDEN);

    getUploadRecord.mockResolvedValueOnce(ok(null));
    expect(((await add()) as { error?: { code: string } }).error?.code).toBe(ErrorCode.FORBIDDEN);
    expect(createPart).not.toHaveBeenCalled();
  });

  it("won't price from someone else's analysis", async () => {
    getAnalysis.mockResolvedValueOnce(ok({ analysisId: ANALYSIS_ID, userId: 'someone_else', analysis: tappable }));
    const result = await add();
    expect(result.success === false && result.error.code).toBe(ErrorCode.NOT_FOUND);
    expect(createPart).not.toHaveBeenCalled();
  });

  it('prices the threads the analysed holes can take and flags the rest for an engineer', async () => {
    // The 3D preview can list more holes than the analysis (split cylinder faces)
    const taps = Array.from({ length: 5 }, (_, i) => ({ holeIndex: i, tapType: 'M6x1.0' }));
    const result = await add({ taps });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.quoteStatus).toBe('instant');
    expect(tappedHoles(result.data.instantQuote)).toBe(4);
    expect(result.data.instantQuote?.unpricedProcesses).toEqual(['heat_treatment', 'tapping']);

    // A thread whose drill fits no analysed hole is flagged, not priced
    const wrongSize = await add({ taps: [{ holeIndex: 0, tapType: 'M12x1.75' }] });
    expect(wrongSize.success && tappedHoles(wrongSize.data.instantQuote)).toBe(0);
    expect(wrongSize.success && wrongSize.data.instantQuote?.unpricedProcesses).toContain('tapping');
  });

  it('adds non-CNC parts, and unpriceable CNC parts, for an engineer to price', async () => {
    const sheet = await add({ service: 'sheet_metal_cutting', analysisId: undefined, secondaryProcesses: [] });
    expect(sheet.success && sheet.data).toMatchObject({ quoteStatus: 'manual_review', instantQuote: null });

    getAnalysis.mockResolvedValueOnce(
      ok({ analysisId: ANALYSIS_ID, userId: 'user_1', analysis: { ...tappable, stock: null } })
    );
    const oversized = await add({ secondaryProcesses: [], taps: [] });
    expect(oversized.success && oversized.data.quoteStatus).toBe('manual_review');
    expect(oversized.success && oversized.data.quoteNote).toMatch(/standard stock/);
  });

  it('validates input', async () => {
    expect((await add({ partName: '1234' })).success).toBe(false);
    expect((await add({ quantity: 0 })).success).toBe(false);
    expect((await add({ preview: { blob: 'x'.repeat(700_000) } })).success).toBe(false);
  });
});
