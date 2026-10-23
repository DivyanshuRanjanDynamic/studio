import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSheetQuote } from './sheet-metal';
import { generateCncQuote, isCncQuote, isSheetQuoteResult } from './pricing-engine';
import { getMaterialName } from './materials';
import { bracketAnalysis } from './__fixtures__/cnc-analysis';
import { sheetAnalysisSchema } from '@/lib/validation/quoting';
import { SHEET_MATERIAL_OPTIONS, defaultThickness, isSheetFileName } from '@/hooks/use-sheet-quote';
import type { SheetAnalysis, SheetQuoteRequest } from '@/types/quoting';

// ═══════════════════════════════════════════════════
// Instant quote page, laser branch: priced from the converter's sheet analysis
// of the real STEP / DXF file (no simulated geometry). fetch is stubbed.
// ═══════════════════════════════════════════════════

const stepPlate: SheetAnalysis = {
  version: 'sheet-1',
  units: 'mm',
  thicknessMm: 2,
  volumeMm3: 39889.2,
  surfaceAreaMm2: 41194.8,
  flatAreaMm2: 19944.6,
  cutLengthMm: 652.8,
  pierces: 5,
  holes: [{ diameterMm: 4.2, count: 4 }],
  bends: [],
  boundingBox: { x: 200, y: 100, z: 2 },
  isFlat: true,
  bodyCount: 1,
  analysisMs: 40,
};
/** The same plate read from a DXF: extruded 1 mm by the converter, thickness left to the customer */
const dxfPlate: SheetAnalysis = { ...stepPlate, thicknessMm: 1, boundingBox: { x: 200, y: 100, z: 1 }, profileOnly: true };

const request = (thicknessMm: number): SheetQuoteRequest => ({
  materialId: 'ms-crca',
  thicknessMm,
  finishType: 'none',
  quantity: 10,
  turnaround: 'standard_3d',
});

const codes = (a: SheetAnalysis, t: number) => {
  const r = generateSheetQuote(a, request(t));
  if (!r.success) throw new Error(r.error.message);
  return r.data.dfmIssues.map((i) => i.code);
};

describe('laser pricing from real files', () => {
  it('prices a DXF profile at the chosen thickness without a mismatch warning', () => {
    expect(codes(dxfPlate, 3)).not.toContain('THICKNESS_MISMATCH');
    expect(codes(dxfPlate, 6)).not.toContain('THICKNESS_MISMATCH');
    // A 3D model has its own thickness to compare against
    expect(codes(stepPlate, 3)).toContain('THICKNESS_MISMATCH');
    expect(codes(stepPlate, 2)).not.toContain('THICKNESS_MISMATCH');
  });

  it('charges thicker sheet more for the same profile', () => {
    const price = (t: number) => {
      const r = generateSheetQuote(dxfPlate, { ...request(t), quantity: 100 });
      if (!r.success) throw new Error(r.error.message);
      return r.data.totalPrice;
    };
    expect(price(6.3)).toBeGreaterThan(price(3));
  });

  it('keeps profileOnly through response validation', () => {
    const parsed = sheetAnalysisSchema.safeParse(dxfPlate);
    expect(parsed.success && parsed.data.profileOnly).toBe(true);
  });

  it('tells sheet, CNC and legacy quotes apart', () => {
    const sheet = generateSheetQuote(stepPlate, request(2));
    const cnc = generateCncQuote(bracketAnalysis, { materialId: 'al_6061', finishType: 'none', quantity: 1, turnaround: 'standard_3d' });
    if (!sheet.success || !cnc.success) throw new Error('fixtures failed');
    expect(isSheetQuoteResult(sheet.data)).toBe(true);
    expect(isCncQuote(sheet.data)).toBe(false);
    expect(isCncQuote(cnc.data)).toBe(true);
    expect(isSheetQuoteResult(cnc.data)).toBe(false);
  });

  it('names materials from either catalogue', () => {
    expect(getMaterialName('ms-crca')).toBe('CRCA Mild Steel');
    expect(getMaterialName('al_6061')).toBe('Aluminium 6061-T6');
    expect(getMaterialName('unobtainium')).toBe('unobtainium');
  });
});

describe('laser configurator defaults', () => {
  it('offers only sheet materials that have a rate card', () => {
    const ids = SHEET_MATERIAL_OPTIONS.map((m) => m.id);
    expect(ids).toContain('ms-crca');
    expect(ids).toContain('ss-304');
    expect(ids).not.toContain('cf-plate'); // engineer-priced
    expect(SHEET_MATERIAL_OPTIONS.every((m) => m.thicknesses.length > 0)).toBe(true);
  });

  it("follows the model's thickness, and picks 2 mm for a DXF", () => {
    const crca = SHEET_MATERIAL_OPTIONS.find((m) => m.id === 'ms-crca')!.thicknesses;
    expect(defaultThickness(crca, { ...stepPlate, thicknessMm: 3 })).toBe(3);
    expect(defaultThickness(crca, { ...stepPlate, thicknessMm: 2 })).toBe(1.9);
    expect(defaultThickness([1, 2, 3], dxfPlate)).toBe(2);
    expect(defaultThickness([3.2, 6.3], null)).toBe(3.2);
  });

  it('accepts STEP and DXF only', () => {
    expect(isSheetFileName('Bracket.DXF')).toBe(true);
    expect(isSheetFileName('part.stp')).toBe(true);
    expect(isSheetFileName('part.stl')).toBe(false);
  });
});

describe('analyzeSheetPart (browser → MechHub → S3 → converter)', () => {
  const fetchMock = vi.fn();
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  const file = new File(['0\nSECTION'], 'bracket.dxf');

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('uploads the real file and returns the stored analysis', async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, { uploadUrl: 'https://s3.example/put?sig=1', fileKey: 'cad-files/abc/bracket.dxf' }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(json(200, { kind: 'sheet', analysisId: 'sma_0123456789abcdef', analysis: dxfPlate }));
    const { analyzeSheetPart } = await import('@/services/quoteApi.service');

    const result = await analyzeSheetPart(file);

    expect(result.success && result.data.analysisId).toBe('sma_0123456789abcdef');
    expect(result.success && result.data.analysis.cutLengthMm).toBe(652.8);
    const [intentUrl, intentInit] = fetchMock.mock.calls[0];
    expect(intentUrl).toBe('/api/v1/files/upload-intent');
    expect(JSON.parse(intentInit.body)).toMatchObject({ fileName: 'bracket.dxf', contentType: 'application/octet-stream' });
    const [putUrl, putInit] = fetchMock.mock.calls[1];
    expect(putUrl).toBe('https://s3.example/put?sig=1');
    expect(putInit.body).toBe(file);
    const [analyzeUrl, analyzeInit] = fetchMock.mock.calls[2];
    expect(analyzeUrl).toBe('/api/v1/quote/part/analyze');
    expect(JSON.parse(analyzeInit.body)).toEqual({ fileKey: 'cad-files/abc/bracket.dxf', kind: 'sheet' });
  });

  it('stops when the S3 upload fails', async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, { uploadUrl: 'https://s3.example/put?sig=1', fileKey: 'cad-files/abc/bracket.dxf' }))
      .mockResolvedValueOnce(new Response(null, { status: 403 }));
    const { analyzeSheetPart } = await import('@/services/quoteApi.service');

    const result = await analyzeSheetPart(file);
    expect(result.success).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
