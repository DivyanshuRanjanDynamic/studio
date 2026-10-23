// ═══════════════════════════════════════════════════
// Material Catalog — machining materials, finish rates and turnaround options
// Pure data. Zero framework dependencies. Stock prices: material-prices.ts.
// ═══════════════════════════════════════════════════

import type {
  Material,
  FinishRate,
  FinishType,
  TurnaroundOption,
  TurnaroundType,
} from '@/types/quoting';
import { getSheetMaterial } from './sheet-rates';
import { getPrintMaterial } from './print-rates';
import { MATERIAL_PRICES } from './material-prices';

/**
 * Machining material catalogue. Density comes from material-prices.ts; stock
 * prices live there too (block/bar for CNC, sheet for laser).
 */
export const MATERIAL_CATALOG: readonly Material[] = [
  {
    id: 'ms_a36',
    name: 'Mild Steel',
    alloy: 'A36 / IS 2062',
    densityGCm3: MATERIAL_PRICES.mild_steel.densityGCm3,
    availableFinishes: ['none', 'deburr', 'powder_coat', 'zinc_plate', 'black_oxide', 'sand_blasting'],
    isActive: true,
  },
  {
    id: 'ss_304',
    name: 'Stainless Steel 304',
    alloy: '304 / AISI 304',
    densityGCm3: MATERIAL_PRICES.ss_304.densityGCm3,
    availableFinishes: ['none', 'deburr', 'mirror_polish', 'sand_blasting'],
    isActive: true,
  },
  {
    id: 'ss_316',
    name: 'Stainless Steel 316',
    alloy: '316 / AISI 316',
    densityGCm3: MATERIAL_PRICES.ss_316.densityGCm3,
    availableFinishes: ['none', 'deburr', 'mirror_polish', 'sand_blasting'],
    isActive: true,
  },
  {
    id: 'al_6061',
    name: 'Aluminium 6061-T6',
    alloy: '6061-T6',
    densityGCm3: MATERIAL_PRICES.al_6061.densityGCm3,
    availableFinishes: ['none', 'deburr', 'anodize_clear', 'anodize_color', 'powder_coat', 'sand_blasting'],
    isActive: true,
  },
  {
    id: 'al_5052',
    name: 'Aluminium 5052',
    alloy: '5052-H32',
    densityGCm3: MATERIAL_PRICES.al_5052.densityGCm3,
    availableFinishes: ['none', 'deburr', 'anodize_clear', 'anodize_color', 'powder_coat', 'sand_blasting'],
    isActive: true,
  },
  {
    id: 'copper',
    name: 'Copper',
    alloy: 'C110 ETP',
    densityGCm3: MATERIAL_PRICES.copper.densityGCm3,
    availableFinishes: ['none', 'deburr', 'nickel_plate', 'mirror_polish'],
    isActive: true,
  },
  {
    id: 'brass',
    name: 'Brass',
    alloy: 'C260 Cartridge',
    densityGCm3: MATERIAL_PRICES.brass.densityGCm3,
    availableFinishes: ['none', 'deburr', 'nickel_plate', 'chrome_plate', 'mirror_polish'],
    isActive: true,
  },
  {
    id: 'en8',
    name: 'EN8 Steel',
    alloy: 'EN8 / C45',
    densityGCm3: MATERIAL_PRICES.en8.densityGCm3,
    availableFinishes: ['none', 'deburr', 'zinc_plate', 'black_oxide', 'powder_coat'],
    isActive: true,
  },
  {
    id: 'en24',
    name: 'EN24 Steel',
    alloy: 'EN24 / 817M40',
    densityGCm3: MATERIAL_PRICES.en24.densityGCm3,
    availableFinishes: ['none', 'deburr', 'zinc_plate', 'black_oxide', 'chrome_plate'],
    isActive: true,
  },
] as const;

/** Finish rate card */
export const FINISH_RATES: Record<FinishType, FinishRate> = {
  none: { type: 'none', label: 'Raw / As Cut', costPerMm2: 0, minCost: 0 },
  deburr: { type: 'deburr', label: 'Deburr', costPerMm2: 0.0006, minCost: 150 },
  anodize_clear: {
    type: 'anodize_clear',
    label: 'Anodize (Clear)',
    costPerMm2: 0.0035,
    minCost: 500,
  },
  anodize_color: {
    type: 'anodize_color',
    label: 'Anodize (Color)',
    costPerMm2: 0.0048,
    minCost: 750,
  },
  powder_coat: { type: 'powder_coat', label: 'Powder Coating', costPerMm2: 0.003, minCost: 800 },
  zinc_plate: { type: 'zinc_plate', label: 'Zinc Plating', costPerMm2: 0.0022, minCost: 400 },
  chrome_plate: {
    type: 'chrome_plate',
    label: 'Chrome Plating',
    costPerMm2: 0.0065,
    minCost: 1200,
  },
  nickel_plate: {
    type: 'nickel_plate',
    label: 'Nickel Plating',
    costPerMm2: 0.0055,
    minCost: 1000,
  },
  black_oxide: { type: 'black_oxide', label: 'Black Oxide', costPerMm2: 0.0018, minCost: 300 },
  mirror_polish: { type: 'mirror_polish', label: 'Mirror Polish', costPerMm2: 0.007, minCost: 600 },
  sand_blasting: {
    type: 'sand_blasting',
    label: 'Sand Blasting',
    costPerMm2: 0.0012,
    minCost: 200,
  },
};

/** Turnaround options */
export const TURNAROUND_OPTIONS: readonly TurnaroundOption[] = [
  {
    type: 'economy_7d',
    label: 'Economy (7 days)',
    days: 7,
    multiplier: 0.82,
    description: '18% discount — frees up capacity',
  },
  {
    type: 'standard_3d',
    label: 'Standard (3 days)',
    days: 3,
    multiplier: 1.0,
    description: 'Baseline turnaround',
  },
  {
    type: 'express_2d',
    label: 'Express (2 days)',
    days: 2,
    multiplier: 1.35,
    description: '+35% rush fee',
  },
  {
    type: 'rush_1d',
    label: 'Rush (1 day)',
    days: 1,
    multiplier: 1.75,
    description: '+75% rush fee',
  },
  {
    type: 'same_day',
    label: 'Same Day',
    days: 0,
    multiplier: 2.4,
    description: '+140% — subject to capacity',
  },
];

// ═══ Lookup functions ═══

export function getMaterialById(id: string): Material | undefined {
  return MATERIAL_CATALOG.find((m) => m.id === id);
}

/** Display name for any quote's material: laser quotes use sheet ids ('ms-crca'), prints filament ids ('pla'), CNC the catalogue's */
export function getMaterialName(id: string): string {
  return getMaterialById(id)?.name ?? getSheetMaterial(id)?.name ?? getPrintMaterial(id)?.name ?? id;
}

export function getActiveMaterials(): readonly Material[] {
  return MATERIAL_CATALOG.filter((m) => m.isActive);
}

export function getAvailableFinishes(materialId: string): readonly FinishType[] {
  const material = getMaterialById(materialId);
  return material?.availableFinishes ?? ['none'];
}

export function getFinishRate(finishType: FinishType): FinishRate {
  return FINISH_RATES[finishType];
}

export function getTurnaroundOption(type: TurnaroundType): TurnaroundOption | undefined {
  return TURNAROUND_OPTIONS.find((t) => t.type === type);
}
