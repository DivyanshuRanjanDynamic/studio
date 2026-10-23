import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSheetQuote } from './sheet-metal';
import { generatePrintQuote } from './printing';
import { ok } from '@/utils/result';
import { ErrorCode } from '@/utils/errors';
import type { PrintAnalysis, SheetAnalysis } from '@/types/quoting';

// ═══════════════════════════════════════════════════
// PartService.addPart — sheet metal and FDM parts priced from stored analyses
// Firestore, S3 and the converter are mocked.
// ═══════════════════════════════════════════════════

const getProjectRfqById = vi.fn();
const getUploadRecord = vi.fn();
const createPart = vi.fn();
const getPartAnalysis = vi.fn();

vi.mock('@/repositories/project.repository', () => ({
  ProjectRepository: { getProjectRfqById: (...a: unknown[]) => getProjectRfqById(...a) },
}));
vi.mock('@/repositories/file-access.repository', () => ({
  FileAccessRepository: { getUploadRecord: (...a: unknown[]) => getUploadRecord(...a) },
}));
vi.mock('@/repositories/part.repository', () => ({
  PartRepository: { newPartId: () => 'part_1', createPart: (...a: unknown[]) => createPart(...a) },
}));
vi.mock('@/lib/firebase/repositories/part-analyses', () => ({
  PartAnalysesRepository: { getAnalysis: (...a: unknown[]) => getPartAnalysis(...a), saveAnalysis: vi.fn() },
}));
vi.mock('@/lib/firebase/repositories/cnc-analyses', () => ({
  CncAnalysesRepository: { getAnalysis: vi.fn(), saveAnalysis: vi.fn() },
}));
vi.mock('@/lib/firebase/repositories/quotes', () => ({ QuotesRepository: { saveQuote: vi.fn() } }));
vi.mock('@/lib/s3-client', () => ({ s3Client: {}, S3_BUCKET: 'b', getPresignedDownloadUrl: vi.fn() }));
vi.mock('@/lib/converter-client', () => ({
  analyzeCncFromUrl: vi.fn(),
  analyzeSheetFromUrl: vi.fn(),
  analyzePrintFromUrl: vi.fn(),
}));

const SHEET_ID = 'sma_0123456789abcdef';
const PRINT_ID = 'pra_0123456789abcdef';

/** 200 × 100 × 2 mm plate, four Ø4.2 holes, one 90° bend */
const sheet: SheetAnalysis = {
  version: 'sheet-1',
  units: 'mm',
  thicknessMm: 2,
  volumeMm3: 39_889,
  surfaceAreaMm2: 41_195,
  flatAreaMm2: 19_944.6,
  cutLengthMm: 652.8,
  pierces: 5,
  holes: [{ diameterMm: 4.2, count: 4 }],
  bends: [{ angleDeg: 90, radiusMm: 2, lengthMm: 100 }],
  boundingBox: { x: 150, y: 100, z: 52 },
  isFlat: false,
  bodyCount: 1,
  analysisMs: 80,
};

const print: PrintAnalysis = {
  version: 'print-1',
  units: 'mm',
  volumeMm3: 216_000,
  surfaceAreaMm2: 21_600,
  triangleCount: 12,
  orientations: [{ up: '+z', sizeMm: { x: 60, y: 60, z: 60 }, supportVolumeMm3: 0 }],
  analysisMs: 10,
};

beforeEach(() => {
  [getProjectRfqById, getUploadRecord, createPart, getPartAnalysis].forEach((m) => m.mockReset());
  getProjectRfqById.mockResolvedValue(ok({ id: 'proj_1', userId: 'user_1', status: 'draft' }));
  getUploadRecord.mockImplementation(async (fileKey: string) =>
    ok({ fileId: 'f1', fileKey, userId: 'user_1', kind: 'cad', source: 'server', createdAt: '2026-10-20T00:00:00Z' })
  );
  getPartAnalysis.mockImplementation(async (id: string) =>
    ok(
      id === SHEET_ID
        ? { analysisId: id, userId: 'user_1', kind: 'sheet', analysis: sheet }
        : { analysisId: id, userId: 'user_1', kind: 'print', analysis: print }
    )
  );
  createPart.mockImplementation(async (part: unknown) => ok(part));
});

const sheetBody = (overrides: Record<string, unknown> = {}) => ({
  partName: 'Mounting plate',
  service: 'sheet_metal_cutting',
  cadFile: { fileName: 'plate.step', fileKey: 'cad-files/x/plate.step', fileSize: 50_000 },
  material: { id: 'ss-304', name: 'Stainless Steel 304', grade: '304', thickness: 2 },
  secondaryProcesses: ['tapping'],
  taps: [0, 1, 2, 3].map((holeIndex) => ({ holeIndex, tapType: 'M5x0.8' })),
  quantity: 10,
  analysisId: SHEET_ID,
  ...overrides,
});

const printBody = (overrides: Record<string, unknown> = {}) => ({
  partName: 'Cable clip',
  service: '3d_printing',
  cadFile: { fileName: 'clip.stl', fileKey: 'cad-files/x/clip.stl', fileSize: 20_000 },
  material: { id: 'petg', name: 'PETG', grade: 'Standard' },
  secondaryProcesses: [],
  quantity: 5,
  analysisId: PRINT_ID,
  ...overrides,
});

async function add(body: Record<string, unknown>, userId = 'user_1') {
  const { PartService } = await import('@/services/part.service');
  return PartService.addPart(userId, 'proj_1', body);
}

describe('PartService.addPart — sheet metal', () => {
  it('prices laser cutting, the model’s bend and the tapped holes from the stored analysis', async () => {
    const result = await add(sheetBody());
    expect(result.success).toBe(true);
    if (!result.success) return;

    const expected = generateSheetQuote(sheet, {
      materialId: 'ss-304',
      thicknessMm: 2,
      finishType: 'none',
      quantity: 10,
      turnaround: 'standard_3d',
      bendingSelected: false,
      taps: [{ tapId: 'M5x0.8', count: 4 }],
    });
    if (!expected.success) throw new Error(expected.error.message);

    const q = result.data.instantQuote;
    expect(result.data.quoteStatus).toBe('instant');
    expect(q).toMatchObject({ kind: 'sheet', analysisId: SHEET_ID, thicknessMm: 2, totalPrice: expected.data.totalPrice });
    expect(q?.kind === 'sheet' && q.breakdown.bendCount).toBe(1);
    expect(q?.kind === 'sheet' && q.breakdown.tappedHoles).toBe(4);
    expect(q?.quoteRef).toMatch(/^MH-[23456789A-HJ-NP-Z]{10}$/);
    expect(q?.dfmIssues.map((i) => i.code)).toContain('BENDING_INCLUDED');
  });

  it('flags tapping it cannot price and finishes the material cannot take', async () => {
    const wood = await add(
      sheetBody({ material: { id: 'mdf', name: 'MDF', thickness: 6.3 }, secondaryProcesses: ['tapping', 'powder_coating'] })
    );
    expect(wood.success && wood.data.quoteStatus).toBe('instant');
    expect(wood.success && wood.data.instantQuote?.unpricedProcesses).toEqual(['powder_coating', 'tapping']);
  });

  it('leaves materials and thicknesses outside the rate card to an engineer', async () => {
    const cf = await add(sheetBody({ material: { id: 'cf-plate', name: 'Carbon Fiber Plate', thickness: 2 } }));
    expect(cf.success && cf.data).toMatchObject({ quoteStatus: 'manual_review', instantQuote: null });
    expect(cf.success && cf.data.quoteNote).toMatch(/engineers/);

    const thick = await add(sheetBody({ material: { id: 'mdf', name: 'MDF', thickness: 25 }, secondaryProcesses: [], taps: [] }));
    expect(thick.success && thick.data.quoteStatus).toBe('manual_review');
  });

  it("won't price from someone else's analysis or the wrong kind", async () => {
    getPartAnalysis.mockResolvedValueOnce(ok({ analysisId: SHEET_ID, userId: 'someone_else', kind: 'sheet', analysis: sheet }));
    const foreign = await add(sheetBody());
    expect(foreign.success === false && foreign.error.code).toBe(ErrorCode.NOT_FOUND);

    const wrongId = await add(sheetBody({ analysisId: PRINT_ID }));
    expect(wrongId.success === false && wrongId.error.code).toBe(ErrorCode.NOT_FOUND);
    expect(createPart).not.toHaveBeenCalled();
  });

  it('adds parts without an analysis for an engineer to price', async () => {
    const result = await add(sheetBody({ analysisId: undefined }));
    expect(result.success && result.data.quoteStatus).toBe('manual_review');
  });
});

describe('PartService.addPart — FDM 3D printing', () => {
  it('prices filament, print time and post-processing from the stored analysis', async () => {
    const result = await add(printBody());
    expect(result.success).toBe(true);
    if (!result.success) return;

    const expected = generatePrintQuote(print, {
      materialId: 'petg',
      finishType: 'none',
      quantity: 5,
      turnaround: 'standard_3d',
    });
    if (!expected.success) throw new Error(expected.error.message);
    expect(result.data.instantQuote).toMatchObject({ kind: 'print', analysisId: PRINT_ID, totalPrice: expected.data.totalPrice });
    expect(result.data.instantQuote?.kind === 'print' && result.data.instantQuote.breakdown.massG).toBeGreaterThan(0);
  });

  it('prices sand blasting and leaves other finishes to an engineer', async () => {
    const blasted = await add(printBody({ secondaryProcesses: ['sand_blasting'] }));
    expect(blasted.success && blasted.data.instantQuote?.finishType).toBe('sand_blasting');

    const painted = await add(printBody({ secondaryProcesses: ['powder_coating'] }));
    expect(painted.success && painted.data.instantQuote?.unpricedProcesses).toEqual(['powder_coating']);
  });

  it('sends unknown filaments to an engineer', async () => {
    const resin = await add(printBody({ material: { id: 'resin', name: 'Resin' } }));
    expect(resin.success && resin.data.quoteStatus).toBe('manual_review');
  });
});
