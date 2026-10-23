// ═══════════════════════════════════════════════════
// FDM 3D printing rate card (INR)
// Keyed by the part wizard's filament ids (material-data.ts).
// Defaults for an Indian print farm (0.4 mm nozzle, 0.2 mm layers) —
// calibrate against MechMaster job cards.
// ═══════════════════════════════════════════════════

import type { FinishType } from '@/types/quoting';

export interface PrintMaterialRate {
  readonly id: string;
  readonly name: string;
  readonly densityGCm3: number;
  readonly pricePerKg: number;
  /** Sustained volumetric flow at quality settings (mm³/s) */
  readonly flowMm3S: number;
  /** Printer cost incl. power, depreciation and upkeep (enclosed printers cost more) */
  readonly machinePerHour: number;
  /** Interior fill fraction */
  readonly infill: number;
  readonly finishes: readonly FinishType[];
}

export const PRINT_MATERIALS: Readonly<Record<string, PrintMaterialRate>> = {
  pla: { id: 'pla', name: 'PLA', densityGCm3: 1.24, pricePerKg: 950, flowMm3S: 12, machinePerHour: 60, infill: 0.2, finishes: ['none', 'sand_blasting'] },
  petg: { id: 'petg', name: 'PETG', densityGCm3: 1.27, pricePerKg: 1100, flowMm3S: 9, machinePerHour: 60, infill: 0.2, finishes: ['none', 'sand_blasting'] },
  abs: { id: 'abs', name: 'ABS', densityGCm3: 1.04, pricePerKg: 1050, flowMm3S: 10, machinePerHour: 90, infill: 0.2, finishes: ['none', 'sand_blasting'] },
  asa: { id: 'asa', name: 'ASA', densityGCm3: 1.07, pricePerKg: 2000, flowMm3S: 9, machinePerHour: 90, infill: 0.2, finishes: ['none', 'sand_blasting'] },
  tpu: { id: 'tpu', name: 'TPU', densityGCm3: 1.21, pricePerKg: 2200, flowMm3S: 3, machinePerHour: 60, infill: 0.3, finishes: ['none'] },
};

export const PRINT_SHOP_RATES = {
  layerHeightMm: 0.2,
  /** 3 perimeters × 0.4 mm nozzle */
  wallMm: 1.2,
  /** Printed support is a sparse lattice */
  supportDensity: 0.15,
  /** Z hop, retraction and travel at every layer change */
  layerChangeS: 3,
  /** Travel and acceleration on top of extrusion time */
  travelFactor: 1.15,
  /** Purge, skirt and spool ends */
  materialWaste: 1.05,
  /** Reprints of failed jobs, spread over every job */
  failureAllowance: 0.08,
  /** Slicing and plate preparation, once per job */
  jobSetup: 150,
  /** Removing from the plate, cleanup and QC, per part */
  postProcessPerPart: 25,
  /** Breaking away printed support, per mm³ of support */
  supportRemovalPerMm3: 0.02,
  /** Largest build volume in the farm (Bambu-class core XY) */
  bedMm: { x: 256, y: 256, z: 256 },
  /** Share of the standard quantity discount on machine time — printing scales weakly */
  learningShare: 0.2,
  marginPct: 0.42,
  /** Smallest print-job value per order line, before turnaround; there is no per-part floor */
  minOrderLine: 300,
} as const;

export function getPrintMaterial(id: string): PrintMaterialRate | undefined {
  return PRINT_MATERIALS[id];
}
