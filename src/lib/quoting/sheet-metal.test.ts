import { describe, it, expect } from 'vitest';
import { generateSheetQuote, getSheetTierTable, nestingEfficiency } from './sheet-metal';
import { cutSpeedMmMin } from './sheet-rates';
import type { SheetAnalysis, SheetQuoteRequest } from '@/types/quoting';

// ═══════════════════════════════════════════════════
// Sheet metal: laser cutting + bending + tapping
// ═══════════════════════════════════════════════════

/** 200 × 100 × 2 mm flat plate with four Ø4.2 holes (the M5 tap drill) */
const holeArea = Math.PI * 2.1 * 2.1;
const plate: SheetAnalysis = {
  version: 'sheet-1',
  units: 'mm',
  thicknessMm: 2,
  volumeMm3: (200 * 100 - 4 * holeArea) * 2,
  surfaceAreaMm2: 2 * (200 * 100 - 4 * holeArea) + 2 * (600 + 4 * Math.PI * 4.2),
  flatAreaMm2: 200 * 100 - 4 * holeArea,
  cutLengthMm: 600 + 4 * Math.PI * 4.2,
  pierces: 5,
  holes: [{ diameterMm: 4.2, count: 4 }],
  bends: [],
  boundingBox: { x: 200, y: 100, z: 2 },
  isFlat: true,
  bodyCount: 1,
  analysisMs: 120,
};

/** The same blank folded into a U: two 90° bends of 100 mm */
const bracket: SheetAnalysis = {
  ...plate,
  bends: [
    { angleDeg: 90, radiusMm: 2, lengthMm: 100 },
    { angleDeg: 90, radiusMm: 2, lengthMm: 100 },
  ],
  boundingBox: { x: 120, y: 100, z: 42 },
  isFlat: false,
};

const request: SheetQuoteRequest = {
  materialId: 'ss-304',
  thicknessMm: 2,
  finishType: 'none',
  quantity: 1,
  turnaround: 'standard_3d',
};

function quote(overrides: Partial<SheetQuoteRequest> = {}, analysis: SheetAnalysis = plate) {
  const result = generateSheetQuote(analysis, { ...request, ...overrides });
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}

describe('generateSheetQuote', () => {
  it('prices a flat plate from material, laser time and setup (hand-checked)', () => {
    const q = quote();
    // Material: 20 000 mm² blank / 0.70 nesting × 2 mm × 8.0 g/cc = 0.457 kg × ₹260
    expect(q.breakdown.materialCost).toBeCloseTo(118.86, 1);
    // Laser: 652.8 mm at 8000 × 0.75 mm/min + 5 pierces × 1.35 s + 3 s handling → ₹2400/hr
    expect(q.breakdown.cutTimeMin).toBeCloseTo(0.27, 2);
    expect(q.breakdown.cutCost).toBeCloseTo(10.85, 1);
    expect(q.breakdown.laserSetupCost).toBe(600);
    expect(q.breakdown.bendingCost).toBe(0);
    // (118.86 + 10.85 + 600) × 1.42 margin
    expect(q.pricePerPart).toBe(1036);
    expect(q.kind).toBe('sheet');
    expect(q.hasBlockingIssues).toBe(false);
  });

  it('gets cheaper per part with quantity and nests the sheet better', () => {
    const tiers = getSheetTierTable(plate, request);
    expect(tiers.map((t) => t.quantity)).toEqual([1, 5, 10, 25, 50, 100, 250, 500, 1000]);
    for (let i = 1; i < tiers.length; i++) expect(tiers[i].pricePerPart).toBeLessThanOrEqual(tiers[i - 1].pricePerPart);
    expect(nestingEfficiency(1)).toBeCloseTo(0.7, 5);
    expect(nestingEfficiency(100)).toBeGreaterThan(0.83);
    expect(quote({ quantity: 100 }).breakdown.sheetUtilisation).toBeGreaterThan(quote().breakdown.sheetUtilisation);
  });

  it('cuts thicker or harder sheet more slowly', () => {
    expect(cutSpeedMmMin('stainless', 2.5)).toBe(6000); // halfway between 2 mm and 3 mm
    expect(quote({ materialId: 'ms-crca' }).breakdown.cutCost).toBeLessThan(quote().breakdown.cutCost);
    expect(quote({ thicknessMm: 3.2 }).breakdown.cutCost).toBeGreaterThan(quote().breakdown.cutCost);
  });

  it('adds press-brake time for every bend in the model', () => {
    const bent = quote({ materialId: 'al-5052' }, bracket);
    expect(bent.breakdown.bendCount).toBe(2);
    expect(bent.breakdown.bendingCost).toBeGreaterThan(0);
    expect(bent.pricePerPart).toBeGreaterThan(quote({ materialId: 'al-5052' }).pricePerPart);
    expect(bent.dfmIssues.map((i) => i.code)).toContain('BENDING_INCLUDED');
    expect(quote({ materialId: 'al-5052', bendingSelected: true }, bracket).dfmIssues.map((i) => i.code)).not.toContain(
      'BENDING_INCLUDED'
    );
  });

  it('blocks bends the shop cannot make', () => {
    const al6061 = quote({ materialId: 'al-6061' }, bracket);
    expect(al6061.hasBlockingIssues).toBe(true);
    expect(al6061.dfmIssues.find((i) => i.code === 'NOT_BENDABLE')?.blocking).toBe(true);

    const thick = quote({ materialId: 'ms-crca', thicknessMm: 6.3 }, bracket);
    expect(thick.dfmIssues.find((i) => i.code === 'TOO_THICK_TO_BEND')?.blocking).toBe(true);

    const longBend = quote(
      { materialId: 'ms-crca' },
      { ...bracket, bends: [{ angleDeg: 90, radiusMm: 2, lengthMm: 2600 }] }
    );
    expect(longBend.dfmIssues.map((i) => i.code)).toContain('BEND_TOO_LONG');
  });

  it('taps the analysed holes through the sheet thickness', () => {
    const tapped = quote({ taps: [{ tapId: 'M5x0.8', count: 4 }] });
    expect(tapped.breakdown.tappedHoles).toBe(4);
    expect(tapped.breakdown.tappingCost).toBeGreaterThan(0);
    expect(tapped.pricePerPart).toBeGreaterThan(quote().pricePerPart);
    // Stainless wears taps faster than aluminium
    expect(tapped.breakdown.tappingCost).toBeGreaterThan(
      quote({ materialId: 'al-5052', taps: [{ tapId: 'M5x0.8', count: 4 }] }).breakdown.tappingCost
    );
  });

  it('warns when a thin sheet holds too few threads', () => {
    const thin = quote({ thicknessMm: 1, taps: [{ tapId: 'M5x0.8', count: 4 }] });
    expect(thin.dfmIssues.find((i) => i.code === 'THIN_THREAD')?.blocking).toBe(false);
    expect(quote({ taps: [{ tapId: 'M5x0.8', count: 4 }] }).dfmIssues.map((i) => i.code)).not.toContain('THIN_THREAD');
  });

  it('refuses threads it cannot cut and holes that do not exist', () => {
    const wood = generateSheetQuote(plate, { ...request, materialId: 'mdf', thicknessMm: 3.2, taps: [{ tapId: 'M5x0.8', count: 1 }] });
    expect(wood.success === false && wood.error.message).toMatch(/can't be tapped/);
    const tooMany = generateSheetQuote(plate, { ...request, taps: [{ tapId: 'M5x0.8', count: 5 }] });
    expect(tooMany.success === false && tooMany.error.message).toMatch(/Only 4 holes/);
  });

  it('prices finishes on both faces of the blank, with the lot minimum spread over the batch', () => {
    const coated = quote({ materialId: 'ms-crca', finishType: 'powder_coat' });
    expect(coated.breakdown.finishCost).toBe(800); // one part pays the ₹800 lot minimum
    // 100 parts: 2 × 19 945 mm² × ₹0.003 × 0.7 batch rate ≈ ₹84, above ₹800 / 100
    expect(quote({ materialId: 'ms-crca', finishType: 'powder_coat', quantity: 100 }).breakdown.finishCost).toBeCloseTo(83.77, 1);
    const bad = generateSheetQuote(plate, { ...request, finishType: 'anodize_color' });
    expect(bad.success === false && bad.error.code).toBe('INVALID_FINISH');
  });

  it('flags model/sheet thickness mismatches and oversized blanks', () => {
    expect(quote({ thicknessMm: 3.2 }).dfmIssues.find((i) => i.code === 'THICKNESS_MISMATCH')?.blocking).toBe(false);
    const huge = quote({}, { ...plate, boundingBox: { x: 2600, y: 1300, z: 2 } });
    expect(huge.dfmIssues.find((i) => i.code === 'PART_TOO_LARGE')?.blocking).toBe(true);
  });

  it('leaves unknown materials and uncuttable thicknesses to engineers', () => {
    const cf = generateSheetQuote(plate, { ...request, materialId: 'cf-plate' });
    expect(cf.success === false && cf.error.message).toMatch(/engineers/);
    const thickMdf = generateSheetQuote(plate, { ...request, materialId: 'mdf', thicknessMm: 25 });
    expect(thickMdf.success === false && thickMdf.error.code).toBe('INVALID_THICKNESS');
  });

  it('cuts acrylic and wood on the CO2 laser', () => {
    const acrylic = quote({ materialId: 'acrylic', thicknessMm: 3 });
    expect(acrylic.breakdown.cutCost).toBeGreaterThan(0);
    expect(acrylic.hasBlockingIssues).toBe(false);
  });

  it('applies the minimum order line', () => {
    const tiny = quote({ materialId: 'ms-crca', thicknessMm: 1 }, { ...plate, flatAreaMm2: 100, cutLengthMm: 40, pierces: 1, boundingBox: { x: 10, y: 10, z: 1 }, holes: [] });
    expect(tiny.totalPrice).toBeGreaterThanOrEqual(1000);
  });

  it('adds the finish on top of the minimums', () => {
    // Powder coat used to be partly absorbed by the ₹1000 line and the ₹150 unit floor
    // (1 pc ₹2049 → ₹2136, 100 pcs ₹179 → ₹269 per part on this plate).
    for (const quantity of [1, 100]) {
      const bare = quote({ materialId: 'ms-crca', quantity });
      const coated = quote({ materialId: 'ms-crca', quantity, finishType: 'powder_coat' });
      const markup = coated.breakdown.rushMultiplier * (1 + coated.breakdown.marginPct);
      expect(coated.totalPrice - bare.totalPrice).toBeCloseTo(coated.breakdown.finishCost * markup * quantity, -1);
    }
  });

  it('adds bends and tapped holes on top of the minimums', () => {
    // A mild-steel plate sits at the ₹1000 order minimum (1 pc) and is priced from
    // cost at 100 pcs; bends and taps used to vanish under the old per-part floor.
    const crca = { materialId: 'ms-crca' };
    for (const quantity of [1, 100]) {
      const flat = quote({ ...crca, quantity });
      expect(flat.pricePerPart).toBe(quantity === 1 ? 1000 : 59);
      const taps = (count: number) => quote({ ...crca, quantity, taps: [{ tapId: 'M5x0.8', count }] }).totalPrice;
      expect(taps(1)).toBeGreaterThan(flat.totalPrice);
      expect(taps(4)).toBeGreaterThan(taps(1));
      const bends = (n: number) =>
        quote({ ...crca, quantity, bendingSelected: true }, { ...bracket, bends: bracket.bends.slice(0, n) }).totalPrice;
      expect(bends(1)).toBeGreaterThan(flat.totalPrice);
      expect(bends(2)).toBeGreaterThan(bends(1));
    }
  });
});
