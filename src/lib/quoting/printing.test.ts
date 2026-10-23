import { describe, it, expect } from 'vitest';
import { fitsBed, generatePrintQuote, getPrintTierTable } from './printing';
import type { PrintAnalysis, PrintOrientation, PrintQuoteRequest } from '@/types/quoting';

// ═══════════════════════════════════════════════════
// FDM 3D printing: walls + infill + supports → mass, time, price
// ═══════════════════════════════════════════════════

const cubeOrientations = (side: number): PrintOrientation[] =>
  (['+x', '-x', '+y', '-y', '+z', '-z'] as const).map((up) => ({
    up,
    sizeMm: { x: side, y: side, z: side },
    supportVolumeMm3: 0,
  }));

const cube = (side: number): PrintAnalysis => ({
  version: 'print-1',
  units: 'mm',
  volumeMm3: side ** 3,
  surfaceAreaMm2: 6 * side * side,
  triangleCount: 12,
  orientations: cubeOrientations(side),
  analysisMs: 20,
});

const request: PrintQuoteRequest = { materialId: 'pla', finishType: 'none', quantity: 1, turnaround: 'standard_3d' };

function quote(overrides: Partial<PrintQuoteRequest> = {}, analysis: PrintAnalysis = cube(60)) {
  const result = generatePrintQuote(analysis, { ...request, ...overrides });
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}

describe('generatePrintQuote', () => {
  it('prices a 60 mm PLA cube from walls, infill and print time (hand-checked)', () => {
    const q = quote();
    // Shell 21 600 mm² × 1.2 mm = 25 920 mm³; infill 20% of the other 190 080 → 63 936 mm³ printed
    expect(q.breakdown.massG).toBeCloseTo(79.28, 1); // × 1.24 g/cc
    // (63 936 / 12 mm³/s + 300 layers × 3 s) × 1.15 travel
    expect(q.breakdown.printTimeMin).toBeCloseTo(119.37, 1);
    expect(q.breakdown.materialCost).toBeCloseTo(85.41, 1); // ₹950/kg × 1.05 waste × 1.08 failures
    expect(q.breakdown.machineCost).toBeCloseTo(128.92, 1); // ₹60/hr × 1.08 failures
    expect(q.breakdown.labourCost).toBe(25);
    expect(q.breakdown.setupCost).toBe(150);
    expect(q.pricePerPart).toBe(553); // × 1.42 margin
    expect(q.kind).toBe('print');
  });

  it('applies the minimum order line to small prints', () => {
    const small = quote({}, cube(20));
    expect(small.breakdown.massG).toBeCloseTo(4.84, 1);
    expect(small.totalPrice).toBe(300);
  });

  it('adds the finish on top of the minimum order line', () => {
    // Blasting used to vanish under the ₹300 minimum on small prints.
    const blasted = quote({ finishType: 'sand_blasting' }, cube(20));
    expect(blasted.totalPrice).toBeGreaterThan(300);
  });

  it('spreads setup over a batch but keeps material per part', () => {
    const one = quote();
    const many = quote({ quantity: 50 });
    expect(many.pricePerPart).toBeLessThan(one.pricePerPart);
    expect(many.breakdown.materialCost).toBe(one.breakdown.materialCost);
    const tiers = getPrintTierTable(cube(60), request);
    expect(tiers).toHaveLength(9);
    for (let i = 1; i < tiers.length; i++) expect(tiers[i].pricePerPart).toBeLessThanOrEqual(tiers[i - 1].pricePerPart);
  });

  it('prints flexible and enclosed-printer filaments slower or dearer', () => {
    expect(quote({ materialId: 'tpu' }).breakdown.printTimeMin).toBeGreaterThan(quote().breakdown.printTimeMin);
    expect(quote({ materialId: 'asa' }).pricePerPart).toBeGreaterThan(quote().pricePerPart);
  });

  it('picks the cheapest orientation that fits the bed', () => {
    // A 200 × 40 × 10 mm bar with an overhang: flat needs support, on its side it doesn't
    const bar: PrintAnalysis = {
      ...cube(10),
      volumeMm3: 200 * 40 * 10,
      surfaceAreaMm2: 2 * (200 * 40 + 200 * 10 + 40 * 10),
      orientations: [
        { up: '+z', sizeMm: { x: 200, y: 40, z: 10 }, supportVolumeMm3: 40_000 },
        { up: '+y', sizeMm: { x: 200, y: 10, z: 40 }, supportVolumeMm3: 0 },
        { up: '+x', sizeMm: { x: 40, y: 10, z: 200 }, supportVolumeMm3: 0 },
      ],
    };
    const q = quote({}, bar);
    expect(q.breakdown.orientation).toBe('+y');
    expect(q.breakdown.supportVolumeMm3).toBe(0);
    expect(q.hasBlockingIssues).toBe(false);
  });

  it('blocks parts that fit no orientation and warns about heavy support', () => {
    const huge = quote({}, { ...cube(300) });
    expect(huge.dfmIssues.find((i) => i.code === 'PART_TOO_LARGE')?.blocking).toBe(true);
    expect(fitsBed({ up: '+z', sizeMm: { x: 250, y: 100, z: 50 }, supportVolumeMm3: 0 })).toBe(true);
    expect(fitsBed({ up: '+z', sizeMm: { x: 100, y: 100, z: 300 }, supportVolumeMm3: 0 })).toBe(false);

    const overhang: PrintAnalysis = {
      ...cube(40),
      orientations: [{ up: '+z', sizeMm: { x: 40, y: 40, z: 40 }, supportVolumeMm3: 100_000 }],
    };
    const q = quote({}, overhang);
    expect(q.breakdown.supportVolumeMm3).toBe(15_000); // 15% lattice
    expect(q.dfmIssues.find((i) => i.code === 'HEAVY_SUPPORT')?.blocking).toBe(false);
  });

  it('rejects unknown filaments, unavailable finishes and open meshes', () => {
    const resin = generatePrintQuote(cube(60), { ...request, materialId: 'resin' });
    expect(resin.success === false && resin.error.message).toMatch(/engineers/);
    const anodised = generatePrintQuote(cube(60), { ...request, finishType: 'anodize_clear' });
    expect(anodised.success === false && anodised.error.code).toBe('INVALID_FINISH');
    const open = generatePrintQuote({ ...cube(60), orientations: [] }, request);
    expect(open.success).toBe(false);
  });
});
