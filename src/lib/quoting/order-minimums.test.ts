import { describe, it, expect } from 'vitest';
import { generateSheetQuote } from './sheet-metal';
import { generateCncQuote } from './pricing-engine';
import { generatePrintQuote } from './printing';
import { bracketAnalysis } from './__fixtures__/cnc-analysis';
import type {
  PrintAnalysis,
  SheetAnalysis,
  TurnaroundType,
} from '@/types/quoting';

// ═══════════════════════════════════════════════════
// Minimums cover the order line, not each part: small parts at volume are priced
// from cost, and turnaround scales the minimum so Economy and Rush always apply.
// ═══════════════════════════════════════════════════

const MARGIN = 1.42;

/** 200 × 100 × 2 mm plate with 4 × Ø4.2 holes, as the converter measured it */
const plate: SheetAnalysis = {
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

const cube = (side: number): PrintAnalysis => ({
  version: 'print-1',
  units: 'mm',
  volumeMm3: side ** 3,
  surfaceAreaMm2: 6 * side * side,
  triangleCount: 12,
  orientations: (['+x', '-x', '+y', '-y', '+z', '-z'] as const).map((up) => ({
    up,
    sizeMm: { x: side, y: side, z: side },
    supportVolumeMm3: 0,
  })),
  analysisMs: 20,
});

function sheet(quantity: number, turnaround: TurnaroundType = 'standard_3d') {
  const r = generateSheetQuote(plate, { materialId: 'ms-crca', thicknessMm: 2, finishType: 'none', quantity, turnaround });
  if (!r.success) throw new Error(r.error.message);
  return r.data;
}

function cnc(quantity: number, turnaround: TurnaroundType = 'standard_3d') {
  const r = generateCncQuote(bracketAnalysis, { materialId: 'al_6061', finishType: 'none', quantity, turnaround });
  if (!r.success) throw new Error(r.error.message);
  return r.data;
}

function print(quantity: number, turnaround: TurnaroundType = 'standard_3d') {
  const r = generatePrintQuote(cube(10), { materialId: 'pla', finishType: 'none', quantity, turnaround });
  if (!r.success) throw new Error(r.error.message);
  return r.data;
}

describe('no per-part floor at volume', () => {
  it('prices sheet parts from cost (the old ₹150 floor would have charged 2.5×)', () => {
    const q = sheet(100);
    const b = q.breakdown;
    expect(q.pricePerPart).toBe(Math.round((b.materialCost + b.cutCost + b.laserSetupCost) * MARGIN));
    expect(q.pricePerPart).toBeLessThan(150);
  });

  it('prices CNC parts from cost', () => {
    const q = cnc(1000);
    const b = q.breakdown;
    const cost = b.materialCost + b.machiningCost + b.setupCost + b.programmingCost;
    expect(q.pricePerPart).toBe(Math.round(cost * MARGIN));
  });

  it('prices small prints from cost (below the old ₹99 floor)', () => {
    const q = print(100);
    const b = q.breakdown;
    expect(q.pricePerPart).toBe(Math.round((b.materialCost + b.machineCost + b.labourCost + b.setupCost) * MARGIN));
    expect(q.pricePerPart).toBeLessThan(99);
  });
});

describe('order minimum follows turnaround', () => {
  it('scales the sheet ₹1,000 minimum for a one-off plate', () => {
    expect(sheet(1, 'economy_7d').totalPrice).toBe(820);
    expect(sheet(1, 'standard_3d').totalPrice).toBe(1000);
    expect(sheet(1, 'rush_1d').totalPrice).toBe(1750);
  });

  it('scales the CNC ₹2,900 minimum and the ₹300 print minimum', () => {
    expect(cnc(1, 'economy_7d').totalPrice).toBeLessThan(cnc(1).totalPrice);
    expect(cnc(1, 'economy_7d').totalPrice).toBeGreaterThanOrEqual(Math.round(2900 * 0.82));
    expect(print(1, 'economy_7d').totalPrice).toBe(246);
    expect(print(1).totalPrice).toBe(300);
    expect(print(1, 'express_2d').totalPrice).toBe(405);
  });

  it('still charges the minimum on tiny orders', () => {
    expect(sheet(2).totalPrice).toBe(1000);
    expect(print(2).totalPrice).toBe(300);
  });
});
