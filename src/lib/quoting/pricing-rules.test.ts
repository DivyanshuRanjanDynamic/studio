import { describe, it, expect } from 'vitest';
import { MATERIAL_PRICES } from './material-prices';
import { SHEET_MATERIALS } from './sheet-rates';
import { CNC_MATERIAL_DATA } from './cnc-materials';
import { MATERIAL_CATALOG } from './materials';
import { calcBatchFinishCost, calcRushMultiplier } from './pricing-engine';

// ═══════════════════════════════════════════════════
// One price list for every engine, and the finish / turnaround rules they share
// ═══════════════════════════════════════════════════

const SHEET_GRADE: Record<string, keyof typeof MATERIAL_PRICES> = {
  'ms-crca': 'mild_steel',
  'ss-304': 'ss_304',
  'al-5052': 'al_5052',
  'al-6061': 'al_6061',
  acrylic: 'acrylic',
  mdf: 'mdf',
  plywood: 'plywood',
  balsa: 'balsa',
};
const CNC_GRADE: Record<string, keyof typeof MATERIAL_PRICES> = {
  ms_a36: 'mild_steel',
  en8: 'en8',
  en24: 'en24',
  ss_304: 'ss_304',
  ss_316: 'ss_316',
  al_5052: 'al_5052',
  al_6061: 'al_6061',
  brass: 'brass',
  copper: 'copper',
};

describe('one material price list', () => {
  it('prices laser sheet from it', () => {
    expect(Object.keys(SHEET_MATERIALS).sort()).toEqual(Object.keys(SHEET_GRADE).sort());
    for (const [id, grade] of Object.entries(SHEET_GRADE)) {
      expect(SHEET_MATERIALS[id].pricePerKg).toBe(MATERIAL_PRICES[grade].sheetPerKg);
      expect(SHEET_MATERIALS[id].densityGCm3).toBe(MATERIAL_PRICES[grade].densityGCm3);
    }
  });

  it('prices CNC block and bar stock from it, at the catalogue density', () => {
    expect(Object.keys(CNC_MATERIAL_DATA).sort()).toEqual(Object.keys(CNC_GRADE).sort());
    for (const [id, grade] of Object.entries(CNC_GRADE)) {
      expect(CNC_MATERIAL_DATA[id].blockPricePerKg).toBe(MATERIAL_PRICES[grade].blockPerKg);
      expect(CNC_MATERIAL_DATA[id].barPricePerKg).toBe(MATERIAL_PRICES[grade].barPerKg);
      expect(MATERIAL_CATALOG.find((m) => m.id === id)?.densityGCm3).toBe(MATERIAL_PRICES[grade].densityGCm3);
    }
  });

  it('gives the same metal the same density in every engine', () => {
    expect(SHEET_MATERIALS['ss-304'].densityGCm3).toBe(MATERIAL_CATALOG.find((m) => m.id === 'ss_304')?.densityGCm3);
    expect(SHEET_MATERIALS['al-6061'].densityGCm3).toBe(MATERIAL_CATALOG.find((m) => m.id === 'al_6061')?.densityGCm3);
  });
});

describe('shared finish and turnaround rules', () => {
  it('prices a finish by area with batch discounts, never below the lot minimum spread over the batch', () => {
    // Powder coat: ₹0.003/mm², ₹800 lot minimum
    expect(calcBatchFinishCost(100_000, 'powder_coat', 1)).toBe(800);
    expect(calcBatchFinishCost(100_000, 'powder_coat', 10)).toBeCloseTo(300 * 0.82);
    expect(calcBatchFinishCost(100_000, 'powder_coat', 50)).toBeCloseTo(300 * 0.7);
    expect(calcBatchFinishCost(1_000, 'powder_coat', 10)).toBe(80);
    expect(calcBatchFinishCost(100_000, 'none', 10)).toBe(0);
  });

  it('applies turnaround multipliers, with surge only for rush work in a busy shop', () => {
    expect(calcRushMultiplier('economy_7d')).toBe(0.82);
    expect(calcRushMultiplier('standard_3d')).toBe(1);
    expect(calcRushMultiplier('same_day')).toBe(2.4);
    expect(calcRushMultiplier('rush_1d', 0.95)).toBeCloseTo(1.75 * 1.2);
    expect(calcRushMultiplier('express_2d', 0.95)).toBe(1.35);
  });
});

describe('rush surge follows the admin-set shop load', () => {
  it('starts above 85% and reaches +30% at a full shop', async () => {
    const { calcSurge, DEFAULT_SHOP_LOAD } = await import('./pricing-engine');
    expect(calcSurge(DEFAULT_SHOP_LOAD)).toBe(1);
    expect(calcSurge(0.85)).toBe(1);
    expect(calcSurge(0.9)).toBeCloseTo(1.1);
    expect(calcSurge(1)).toBeCloseTo(1.3);
  });

  it('applies only to Rush and Same-day', () => {
    expect(calcRushMultiplier('rush_1d', 1)).toBeCloseTo(1.75 * 1.3);
    expect(calcRushMultiplier('same_day', 0.9)).toBeCloseTo(2.4 * 1.1);
    expect(calcRushMultiplier('standard_3d', 1)).toBe(1);
    expect(calcRushMultiplier('economy_7d', 1)).toBe(0.82);
  });
});
