// ═══════════════════════════════════════════════════
// wizard-pricing — part-wizard selections → CNC pricing request
// Shared by the wizard's live price and the server route that adds the part,
// so the number the customer sees is the number the server stores.
// ═══════════════════════════════════════════════════

import type { ColorOption, SecondaryProcess, TapSelection } from '@/models/project.model';
import type { CncQuoteRequest, CncTapRequest, FinishType, TurnaroundType } from '@/types/quoting';
import { getCncMaterialData } from './cnc-materials';
import { getAvailableFinishes } from './materials';

/** Finishes each wizard process can be priced as (anodizing: clear or coloured) */
export const FINISHES_FOR_PROCESS: Readonly<Partial<Record<SecondaryProcess, readonly FinishType[]>>> = {
  anodizing: ['anodize_clear', 'anodize_color'],
  powder_coating: ['powder_coat'],
  chrome_plating: ['chrome_plate'],
  nickel_plating: ['nickel_plate'],
  zinc_plating: ['zinc_plate'],
  sand_blasting: ['sand_blasting'],
};

/**
 * Whether the wizard should offer a finishing process for a CNC material:
 * only if the pricing catalogue lists a matching finish for it. Processes the
 * engine doesn't price (heat treatment, tapping, bending) are always offered.
 */
export function isFinishOfferedForCncMaterial(process: SecondaryProcess, wizardMaterialId: string): boolean {
  const finishes = FINISHES_FOR_PROCESS[process];
  if (!finishes) return true;
  const materialId = resolveCncMaterialId(wizardMaterialId);
  if (!materialId) return true;
  const available = getAvailableFinishes(materialId);
  return finishes.some((f) => available.includes(f));
}

/** Ids saved by older wizard versions → pricing catalogue ids */
const LEGACY_MATERIAL_IDS: Readonly<Record<string, string>> = {
  'al-6061-cnc': 'al_6061',
  'al-6061': 'al_6061',
  'al-5052': 'al_5052',
  'ss-304': 'ss_304',
  'ms-crca': 'ms_a36',
};

/** Pricing material id for a wizard material, or null if CNC can't price it */
export function resolveCncMaterialId(wizardMaterialId: string): string | null {
  const id = LEGACY_MATERIAL_IDS[wizardMaterialId] ?? wizardMaterialId;
  return getCncMaterialData(id) ? id : null;
}

/**
 * The finish the engine prices. Coatings win over plating, plating over blasting;
 * anything else selected is listed as `unpriced` (confirmed on RFQ review).
 */
export function resolveFinish(
  processes: readonly SecondaryProcess[],
  coatingColor: ColorOption | null | undefined
): { finishType: FinishType; unpriced: SecondaryProcess[] } {
  const priority: Array<[SecondaryProcess, FinishType]> = [
    ['anodizing', coatingColor && String(coatingColor) !== 'clear' ? 'anodize_color' : 'anodize_clear'],
    ['powder_coating', 'powder_coat'],
    ['chrome_plating', 'chrome_plate'],
    ['nickel_plating', 'nickel_plate'],
    ['zinc_plating', 'zinc_plate'],
    ['sand_blasting', 'sand_blasting'],
  ];
  const chosen = priority.find(([process]) => processes.includes(process));
  const finishType: FinishType = chosen ? chosen[1] : 'none';
  const unpriced = processes.filter(
    (p) => p !== 'tapping' && p !== 'bending' && (!chosen || p !== chosen[0])
  );
  return { finishType, unpriced };
}

/** Per-hole thread picks → "N holes of thread X" for the engine */
export function groupTapSelections(taps: readonly TapSelection[] | undefined): CncTapRequest[] {
  const counts = new Map<string, number>();
  for (const tap of taps ?? []) counts.set(tap.tapType, (counts.get(tap.tapType) ?? 0) + 1);
  return [...counts].map(([tapId, count]) => ({ tapId, count }));
}

export interface WizardPricingInput {
  readonly materialId: string;
  readonly secondaryProcesses: readonly SecondaryProcess[];
  readonly coatingColor?: ColorOption | null;
  readonly taps?: readonly TapSelection[];
  readonly quantity: number;
  readonly turnaround?: TurnaroundType;
}

export type WizardPricingRequest =
  | { readonly priceable: true; readonly request: CncQuoteRequest; readonly unpriced: SecondaryProcess[] }
  | { readonly priceable: false; readonly reason: string };

export function buildCncQuoteRequest(input: WizardPricingInput): WizardPricingRequest {
  const materialId = resolveCncMaterialId(input.materialId);
  if (!materialId) {
    return { priceable: false, reason: 'This material is quoted by our engineers.' };
  }
  const { finishType, unpriced } = resolveFinish(input.secondaryProcesses, input.coatingColor);
  const taps = input.secondaryProcesses.includes('tapping') ? groupTapSelections(input.taps) : [];
  return {
    priceable: true,
    unpriced,
    request: {
      materialId,
      finishType,
      quantity: input.quantity,
      turnaround: input.turnaround ?? 'standard_3d',
      ...(taps.length > 0 ? { taps } : {}),
    },
  };
}
