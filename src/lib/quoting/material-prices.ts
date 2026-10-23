// ═══════════════════════════════════════════════════
// Material price list (INR/kg) — the one place stock prices live
// Laser (sheet-rates.ts), CNC (cnc-materials.ts) and the material catalogue
// (materials.ts) all read density and price from here, so a metal can't be
// priced two ways. Prices are by stock form: sheet for laser cutting, block
// (plate/billet) and round bar for machining.
// Defaults for an Indian job shop — calibrate against MechMaster job cards
// (see pricing-calibration.ts).
// ═══════════════════════════════════════════════════

export type MaterialGrade =
  | 'mild_steel'
  | 'en8'
  | 'en24'
  | 'ss_304'
  | 'ss_316'
  | 'al_5052'
  | 'al_6061'
  | 'brass'
  | 'copper'
  | 'acrylic'
  | 'mdf'
  | 'plywood'
  | 'balsa';

export interface MaterialPrice {
  readonly densityGCm3: number;
  /** Laser-cut sheet (cold-rolled for mild steel); absent = not stocked as sheet */
  readonly sheetPerKg?: number;
  /** Machining plate / billet */
  readonly blockPerKg?: number;
  /** Machining round bar */
  readonly barPerKg?: number;
}

export const MATERIAL_PRICES: Readonly<Record<MaterialGrade, MaterialPrice>> = {
  mild_steel: { densityGCm3: 7.85, sheetPerKg: 72, blockPerKg: 85, barPerKg: 80 },
  en8: { densityGCm3: 7.85, blockPerKg: 105, barPerKg: 98 },
  en24: { densityGCm3: 7.85, blockPerKg: 175, barPerKg: 165 },
  ss_304: { densityGCm3: 8.0, sheetPerKg: 260, blockPerKg: 320, barPerKg: 300 },
  ss_316: { densityGCm3: 8.0, blockPerKg: 440, barPerKg: 420 },
  al_5052: { densityGCm3: 2.68, sheetPerKg: 300, blockPerKg: 360, barPerKg: 350 },
  al_6061: { densityGCm3: 2.7, sheetPerKg: 330, blockPerKg: 380, barPerKg: 360 },
  brass: { densityGCm3: 8.5, blockPerKg: 720, barPerKg: 680 },
  copper: { densityGCm3: 8.96, blockPerKg: 1050, barPerKg: 1000 },
  acrylic: { densityGCm3: 1.19, sheetPerKg: 380 },
  mdf: { densityGCm3: 0.75, sheetPerKg: 45 },
  plywood: { densityGCm3: 0.6, sheetPerKg: 110 },
  balsa: { densityGCm3: 0.16, sheetPerKg: 2200 },
};

/** Price of a stock form; throws at module load if a rate card names a form that isn't priced */
export function stockPrice(grade: MaterialGrade, form: 'sheet' | 'block' | 'bar'): number {
  const p = MATERIAL_PRICES[grade];
  const price = form === 'sheet' ? p.sheetPerKg : form === 'block' ? p.blockPerKg : p.barPerKg;
  if (price === undefined) throw new Error(`No ${form} price for ${grade} in material-prices.ts`);
  return price;
}
