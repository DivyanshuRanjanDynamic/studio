// ═══════════════════════════════════════════════════
// CNC material & shop-rate data (INR)
// Keyed by MATERIAL_CATALOG ids so laser and CNC share one material list.
// Defaults for an Indian job shop — calibrate against MechMaster job cards.
// ═══════════════════════════════════════════════════

import type { CncMaterialData, CncProcess, CncShopRates, CncStock } from '@/types/quoting';
import { stockPrice, type MaterialGrade } from './material-prices';

/** Block and bar prices come from material-prices.ts, the shared price list */
const machined = (machinabilityGroup: CncMaterialData['machinabilityGroup'], grade: MaterialGrade): CncMaterialData => ({
  machinabilityGroup,
  blockPricePerKg: stockPrice(grade, 'block'),
  barPricePerKg: stockPrice(grade, 'bar'),
});

export const CNC_MATERIAL_DATA: Readonly<Record<string, CncMaterialData>> = {
  al_6061: machined('aluminium', 'al_6061'),
  al_5052: machined('aluminium', 'al_5052'),
  ms_a36: machined('mild_steel', 'mild_steel'),
  en8: machined('mild_steel', 'en8'),
  en24: machined('alloy_steel', 'en24'),
  ss_304: machined('stainless', 'ss_304'),
  ss_316: machined('stainless', 'ss_316'),
  brass: machined('brass', 'brass'),
  copper: machined('copper', 'copper'),
};

export const DEFAULT_CNC_SHOP_RATES: CncShopRates = {
  machineRatePerHour: {
    cnc_machining_3axis: 1000,
    cnc_machining_5axis: 3000,
    cnc_turning: 750,
  },
  setupRatePerHour: 800,
  programmingRatePerHour: 600,
  materialWastePct: 0.05,
  marginPct: 0.42,
};

export const CNC_PROCESSES: readonly CncProcess[] = [
  'cnc_machining_3axis',
  'cnc_machining_5axis',
  'cnc_turning',
];

export function getCncMaterialData(materialId: string): CncMaterialData | undefined {
  return CNC_MATERIAL_DATA[materialId];
}

export const CNC_PROCESS_LABELS: Readonly<Record<CncProcess, string>> = {
  cnc_machining_3axis: 'CNC Milling (3-axis)',
  cnc_machining_5axis: 'CNC Milling (5-axis)',
  cnc_turning: 'CNC Turning',
};

/** "105 × 65 × 25 mm block" or "Ø32 × 55 mm bar" */
export function formatCncStock(stock: CncStock | null): string {
  if (!stock) return 'Non-standard';
  const d = stock.dimensionsMm;
  const n = (v: number) => Math.round(v * 10) / 10;
  return 'diameter' in d
    ? `Ø${n(d.diameter)} × ${n(d.length)} mm bar`
    : `${n(d.x)} × ${n(d.y)} × ${n(d.z)} mm block`;
}
