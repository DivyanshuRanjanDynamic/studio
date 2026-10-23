// ═══════════════════════════════════════════════════
// wizard-pricing — part-wizard selections → CNC / sheet / print pricing requests
// Shared by the wizard's live price and the server route that adds the part,
// so the number the customer sees is the number the server stores.
// ═══════════════════════════════════════════════════

import type { ColorOption, SecondaryProcess, TapSelection } from '@/models/project.model';
import type {
  CncAnalysis,
  CncQuoteRequest,
  CncTapRequest,
  FinishType,
  PrintQuoteRequest,
  SheetAnalysis,
  SheetQuoteRequest,
  TurnaroundType,
} from '@/types/quoting';
import { getCncMaterialData } from './cnc-materials';
import { getAvailableFinishes } from './materials';
import { fitTapsToAnalysis, fitTapsToHoles } from './tapping';
import { getSheetMaterial } from './sheet-rates';
import { getPrintMaterial } from './print-rates';
import { sheetTapHoles } from './sheet-metal';

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

/**
 * Wizard thread picks come from the 3D preview's hole list, which can disagree with
 * the server analysis. Price the threads the analysed holes can take; anything left
 * over is listed as unpriced tapping for the engineer instead of failing the quote.
 */
export function fitRequestToAnalysis(
  analysis: CncAnalysis,
  request: CncQuoteRequest,
  unpriced: readonly SecondaryProcess[]
): { request: CncQuoteRequest; unpriced: SecondaryProcess[] } {
  if (!request.taps || request.taps.length === 0) return { request, unpriced: [...unpriced] };
  const { fitted, unfitted } = fitTapsToAnalysis(analysis, request.taps);
  const { taps: _requested, ...rest } = request;
  return {
    request: fitted.length > 0 ? { ...rest, taps: fitted } : rest,
    unpriced: unfitted > 0 && !unpriced.includes('tapping') ? [...unpriced, 'tapping'] : [...unpriced],
  };
}

const withTapping = (unpriced: readonly SecondaryProcess[]): SecondaryProcess[] =>
  unpriced.includes('tapping') ? [...unpriced] : [...unpriced, 'tapping'];

/** The engine's finish, or 'none' plus the process listed as unpriced when the material can't take it */
function finishFor(
  processes: readonly SecondaryProcess[],
  coatingColor: ColorOption | null | undefined,
  allowed: readonly FinishType[]
): { finishType: FinishType; unpriced: SecondaryProcess[] } {
  const { finishType, unpriced } = resolveFinish(processes, coatingColor);
  if (allowed.includes(finishType)) return { finishType, unpriced };
  const chosen = processes.find((p) => FINISHES_FOR_PROCESS[p]?.includes(finishType));
  return { finishType: 'none', unpriced: chosen ? [...unpriced, chosen] : unpriced };
}

export type SheetWizardRequest =
  | { readonly priceable: true; readonly request: SheetQuoteRequest; readonly unpriced: SecondaryProcess[] }
  | { readonly priceable: false; readonly reason: string };

/** Sheet metal: material + thickness from the wizard; bends are priced from the model, taps from picks */
export function buildSheetQuoteRequest(input: WizardPricingInput & { readonly thicknessMm?: number }): SheetWizardRequest {
  const material = getSheetMaterial(input.materialId);
  if (!material) return { priceable: false, reason: 'This material is quoted by our engineers.' };
  if (!input.thicknessMm || input.thicknessMm <= 0) {
    return { priceable: false, reason: 'Pick a sheet thickness to get an instant price.' };
  }
  const { finishType, unpriced } = finishFor(input.secondaryProcesses, input.coatingColor, material.finishes);
  const tapping = input.secondaryProcesses.includes('tapping');
  const taps = tapping && material.tapGroup ? groupTapSelections(input.taps) : [];
  return {
    priceable: true,
    unpriced: tapping && taps.length === 0 ? withTapping(unpriced) : unpriced,
    request: {
      materialId: material.id,
      thicknessMm: input.thicknessMm,
      finishType,
      quantity: input.quantity,
      turnaround: input.turnaround ?? 'standard_3d',
      bendingSelected: input.secondaryProcesses.includes('bending'),
      ...(taps.length > 0 ? { taps } : {}),
    },
  };
}

/** Sheet thread picks fitted to the analysed through-holes (depth = sheet thickness) */
export function fitSheetRequestToAnalysis(
  analysis: SheetAnalysis,
  request: SheetQuoteRequest,
  unpriced: readonly SecondaryProcess[]
): { request: SheetQuoteRequest; unpriced: SecondaryProcess[] } {
  if (!request.taps || request.taps.length === 0) return { request, unpriced: [...unpriced] };
  const { fitted, unfitted } = fitTapsToHoles(sheetTapHoles(analysis, request.thicknessMm), request.taps);
  const { taps: _requested, ...rest } = request;
  return {
    request: fitted.length > 0 ? { ...rest, taps: fitted } : rest,
    unpriced: unfitted > 0 ? withTapping(unpriced) : [...unpriced],
  };
}

export type PrintWizardRequest =
  | { readonly priceable: true; readonly request: PrintQuoteRequest; readonly unpriced: SecondaryProcess[] }
  | { readonly priceable: false; readonly reason: string };

/** FDM printing: filament + finish; other selected processes are confirmed by an engineer */
export function buildPrintQuoteRequest(input: WizardPricingInput): PrintWizardRequest {
  const material = getPrintMaterial(input.materialId);
  if (!material) return { priceable: false, reason: 'This material is quoted by our engineers.' };
  const { finishType, unpriced } = finishFor(input.secondaryProcesses, input.coatingColor, material.finishes);
  return {
    priceable: true,
    unpriced: input.secondaryProcesses.includes('tapping') ? withTapping(unpriced) : unpriced,
    request: {
      materialId: material.id,
      finishType,
      quantity: input.quantity,
      turnaround: input.turnaround ?? 'standard_3d',
    },
  };
}

export function buildCncQuoteRequest(input: WizardPricingInput): WizardPricingRequest {
  const materialId = resolveCncMaterialId(input.materialId);
  if (!materialId) {
    return { priceable: false, reason: 'This material is quoted by our engineers.' };
  }
  const { finishType, unpriced } = resolveFinish(input.secondaryProcesses, input.coatingColor);
  const tapping = input.secondaryProcesses.includes('tapping');
  const taps = tapping ? groupTapSelections(input.taps) : [];
  return {
    priceable: true,
    // Tapping with no holes picked (e.g. described in notes only) can't be priced here
    unpriced: tapping && taps.length === 0 ? [...unpriced, 'tapping'] : unpriced,
    request: {
      materialId,
      finishType,
      quantity: input.quantity,
      turnaround: input.turnaround ?? 'standard_3d',
      ...(taps.length > 0 ? { taps } : {}),
    },
  };
}
