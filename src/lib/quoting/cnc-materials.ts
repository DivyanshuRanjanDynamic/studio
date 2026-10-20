// ═══════════════════════════════════════════════════
// CNC material & shop-rate data (INR)
// Keyed by MATERIAL_CATALOG ids so laser and CNC share one material list.
// Defaults for an Indian job shop — calibrate against MechMaster job cards.
// ═══════════════════════════════════════════════════

import type { CncMaterialData, CncProcess, CncShopRates, CncStock } from '@/types/quoting';

export const CNC_MATERIAL_DATA: Readonly<Record<string, CncMaterialData>> = {
  al_6061: { machinabilityGroup: 'aluminium', blockPricePerKg: 380, barPricePerKg: 360 },
  al_5052: { machinabilityGroup: 'aluminium', blockPricePerKg: 360, barPricePerKg: 350 },
  ms_a36: { machinabilityGroup: 'mild_steel', blockPricePerKg: 85, barPricePerKg: 80 },
  en8: { machinabilityGroup: 'mild_steel', blockPricePerKg: 105, barPricePerKg: 98 },
  en24: { machinabilityGroup: 'alloy_steel', blockPricePerKg: 175, barPricePerKg: 165 },
  ss_304: { machinabilityGroup: 'stainless', blockPricePerKg: 320, barPricePerKg: 300 },
  ss_316: { machinabilityGroup: 'stainless', blockPricePerKg: 440, barPricePerKg: 420 },
  brass: { machinabilityGroup: 'brass', blockPricePerKg: 720, barPricePerKg: 680 },
  copper: { machinabilityGroup: 'copper', blockPricePerKg: 1050, barPricePerKg: 1000 },
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
