// ═══════════════════════════════════════════════════
// Sheet metal rate card (INR) — laser cutting, press-brake bending, tapping
// Keyed by the part wizard's sheet material ids (material-data.ts).
// Sheet prices and densities come from material-prices.ts.
// Defaults for an Indian job shop — calibrate against MechMaster job cards.
// ═══════════════════════════════════════════════════

import type { FinishType, MachinabilityGroup, SheetCutFamily } from '@/types/quoting';
import { MATERIAL_PRICES, stockPrice } from './material-prices';

export interface SheetMaterialRate {
  readonly id: string;
  readonly name: string;
  readonly family: SheetCutFamily;
  readonly densityGCm3: number;
  readonly pricePerKg: number;
  /** Standard sheet the blank is nested on (long × short side) */
  readonly sheetMm: { readonly long: number; readonly short: number };
  /** Thickest sheet the press brake bends in this material; null = not bendable */
  readonly maxBendThicknessMm: number | null;
  /** Tapping speed/wear family; null = threads can't be tapped (wood) */
  readonly tapGroup: MachinabilityGroup | null;
  readonly finishes: readonly FinishType[];
}

const METAL_SHEET = { long: 2500, short: 1250 } as const;
const BOARD_SHEET = { long: 2440, short: 1220 } as const;

export const SHEET_MATERIALS: Readonly<Record<string, SheetMaterialRate>> = {
  'ms-crca': {
    id: 'ms-crca',
    name: 'CRCA Mild Steel',
    family: 'mild_steel',
    densityGCm3: MATERIAL_PRICES.mild_steel.densityGCm3,
    pricePerKg: stockPrice('mild_steel', 'sheet'),
    sheetMm: METAL_SHEET,
    maxBendThicknessMm: 5,
    tapGroup: 'mild_steel',
    finishes: ['none', 'deburr', 'powder_coat', 'zinc_plate', 'black_oxide', 'sand_blasting'],
  },
  'ss-304': {
    id: 'ss-304',
    name: 'Stainless Steel 304',
    family: 'stainless',
    densityGCm3: MATERIAL_PRICES.ss_304.densityGCm3,
    pricePerKg: stockPrice('ss_304', 'sheet'),
    sheetMm: METAL_SHEET,
    maxBendThicknessMm: 5,
    tapGroup: 'stainless',
    finishes: ['none', 'deburr', 'powder_coat', 'mirror_polish', 'sand_blasting'],
  },
  'al-5052': {
    id: 'al-5052',
    name: 'Aluminium 5052',
    family: 'aluminium',
    densityGCm3: MATERIAL_PRICES.al_5052.densityGCm3,
    pricePerKg: stockPrice('al_5052', 'sheet'),
    sheetMm: { long: 2440, short: 1220 },
    maxBendThicknessMm: 5,
    tapGroup: 'aluminium',
    finishes: ['none', 'deburr', 'anodize_clear', 'anodize_color', 'powder_coat', 'sand_blasting'],
  },
  'al-6061': {
    id: 'al-6061',
    name: 'Aluminium 6061',
    family: 'aluminium',
    densityGCm3: MATERIAL_PRICES.al_6061.densityGCm3,
    pricePerKg: stockPrice('al_6061', 'sheet'),
    sheetMm: { long: 2440, short: 1220 },
    maxBendThicknessMm: null, // T6 cracks on tight bends
    tapGroup: 'aluminium',
    finishes: ['none', 'deburr', 'anodize_clear', 'anodize_color', 'powder_coat', 'sand_blasting'],
  },
  acrylic: {
    id: 'acrylic',
    name: 'Acrylic',
    family: 'acrylic',
    densityGCm3: MATERIAL_PRICES.acrylic.densityGCm3,
    pricePerKg: stockPrice('acrylic', 'sheet'),
    sheetMm: BOARD_SHEET,
    maxBendThicknessMm: null,
    tapGroup: 'plastic',
    finishes: ['none'],
  },
  mdf: {
    id: 'mdf',
    name: 'MDF',
    family: 'mdf',
    densityGCm3: MATERIAL_PRICES.mdf.densityGCm3,
    pricePerKg: stockPrice('mdf', 'sheet'),
    sheetMm: BOARD_SHEET,
    maxBendThicknessMm: null,
    tapGroup: null,
    finishes: ['none'],
  },
  plywood: {
    id: 'plywood',
    name: 'Plywood',
    family: 'plywood',
    densityGCm3: MATERIAL_PRICES.plywood.densityGCm3,
    pricePerKg: stockPrice('plywood', 'sheet'),
    sheetMm: BOARD_SHEET,
    maxBendThicknessMm: null,
    tapGroup: null,
    finishes: ['none'],
  },
  balsa: {
    id: 'balsa',
    name: 'Balsa Wood',
    family: 'balsa',
    densityGCm3: MATERIAL_PRICES.balsa.densityGCm3,
    pricePerKg: stockPrice('balsa', 'sheet'),
    sheetMm: { long: 915, short: 100 },
    maxBendThicknessMm: null,
    tapGroup: null,
    finishes: ['none'],
  },
};

/**
 * Laser cutting speed (mm/min) by thickness (mm). Fiber 3 kW for metals
 * (O₂ on mild steel, N₂ on stainless/aluminium); CO₂ 150 W for plastics and wood.
 * Thicknesses outside a table are not cut on our machines → engineer quote.
 */
export const CUT_SPEED_MM_MIN: Readonly<Record<SheetCutFamily, ReadonlyArray<readonly [number, number]>>> = {
  mild_steel: [
    [0.8, 28000], [1, 25000], [1.5, 16000], [2, 9000], [3, 5000], [4, 3800],
    [5, 3000], [6, 2400], [8, 1600], [10, 1100], [12, 850],
  ],
  stainless: [
    [0.5, 32000], [0.8, 26000], [1, 22000], [1.5, 13000], [2, 8000], [3, 4000],
    [4, 2600], [5, 1600], [6, 1200], [8, 600], [10, 400],
  ],
  aluminium: [
    [0.5, 30000], [0.8, 24000], [1, 20000], [1.5, 12000], [2, 7000], [3, 3500],
    [4, 2200], [5, 1400], [6, 1000], [8, 600], [10, 400],
  ],
  acrylic: [[1, 3000], [2, 2000], [3, 1200], [4.5, 800], [6, 500], [8, 350], [10, 250], [12.7, 160]],
  mdf: [[2, 2400], [3, 1500], [4, 1100], [6, 600], [9, 350], [12, 200], [12.7, 180]],
  plywood: [[3, 1300], [4, 1000], [6, 500], [9, 300], [12, 180]],
  balsa: [[1, 6000], [3, 3500], [5, 2000], [6, 1600]],
};

const FIBER_FAMILIES: readonly SheetCutFamily[] = ['mild_steel', 'stainless', 'aluminium'];

export const SHEET_SHOP_RATES = {
  /** Fiber 3 kW incl. power, assist gas and operator */
  fiberLaserPerHour: 2400,
  /** CO₂ 150 W incl. power and operator */
  co2LaserPerHour: 900,
  /** Real speed vs. table: acceleration in corners and short segments */
  cornerFactor: 0.75,
  /** Load/unload and rapid moves per part */
  handlingSPerPart: 3,
  rapidSPerPierce: 0.5,
  /** CAM nesting + sheet loading, once per job */
  laserJobSetup: 600,
  /** Press brake incl. operator */
  pressBrakePerHour: 900,
  bendSetupBaseMin: 15,
  bendSetupPerBendMin: 2,
  bendHandlingMin: 0.3,
  bendPerHitMin: 0.25,
  maxBendLineMm: 2500,
  /** Two people handle parts longer than this */
  twoPersonLengthMm: 1200,
  /** Tapping arm incl. operator */
  tappingPerHour: 600,
  /** Blank ÷ bounding rectangle for bent parts (flat parts use the exact box) */
  bentRectangularity: 0.75,
  marginPct: 0.42,
  /** Smallest cut-job value per order line, before turnaround; there is no per-part floor */
  minOrderLine: 1000,
} as const;

export function getSheetMaterial(id: string): SheetMaterialRate | undefined {
  return SHEET_MATERIALS[id];
}

export function laserRatePerHour(family: SheetCutFamily): number {
  return FIBER_FAMILIES.includes(family) ? SHEET_SHOP_RATES.fiberLaserPerHour : SHEET_SHOP_RATES.co2LaserPerHour;
}

/** Pierce time (s): thicker sheet takes longer to burn through; non-metals pierce fast. */
export function pierceTimeS(family: SheetCutFamily, thicknessMm: number): number {
  return FIBER_FAMILIES.includes(family) ? 0.25 + 0.3 * thicknessMm : 0.15 + 0.05 * thicknessMm;
}

/** Table speed (mm/min) at a thickness, linearly interpolated; null outside the table. */
export function cutSpeedMmMin(family: SheetCutFamily, thicknessMm: number): number | null {
  const table = CUT_SPEED_MM_MIN[family];
  if (thicknessMm < table[0][0] - 1e-9 || thicknessMm > table[table.length - 1][0] + 1e-9) return null;
  for (let i = 0; i < table.length - 1; i++) {
    const [t0, v0] = table[i];
    const [t1, v1] = table[i + 1];
    if (thicknessMm <= t1 + 1e-9) {
      const f = (thicknessMm - t0) / (t1 - t0);
      return v0 + Math.max(0, Math.min(1, f)) * (v1 - v0);
    }
  }
  return table[table.length - 1][1];
}
