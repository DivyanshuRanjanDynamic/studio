// ═══════════════════════════════════════════════════
// wizard-quote — the part wizard's live price for CNC, sheet metal and FDM printing
// Same request builders and engines the server uses when the part is added.
// ═══════════════════════════════════════════════════

import type { ColorOption, ManufacturingService, SecondaryProcess, TapSelection } from '@/models/project.model';
import type {
  CncAnalysis,
  CncQuoteResult,
  PrintAnalysis,
  PrintQuoteResult,
  QuantityTier,
  SheetAnalysis,
  SheetQuoteResult,
} from '@/types/quoting';
import { generateCncQuote, getCncTierTable } from './pricing-engine';
import { generateSheetQuote, getSheetTierTable } from './sheet-metal';
import { generatePrintQuote, getPrintTierTable } from './printing';
import {
  buildCncQuoteRequest,
  buildPrintQuoteRequest,
  buildSheetQuoteRequest,
  fitRequestToAnalysis,
  fitSheetRequestToAnalysis,
} from './wizard-pricing';
import {
  NO_CALIBRATION,
  calibrateQuote,
  calibrateTiers,
  resolveMultiplier,
  type CalibrationConfig,
} from './pricing-calibration';

export type WizardQuoteKind = 'cnc' | 'sheet' | 'print';
export type WizardQuote = CncQuoteResult | SheetQuoteResult | PrintQuoteResult;

/** Which instant-pricing engine a wizard service uses, if any */
export function wizardQuoteKind(service: ManufacturingService | null): WizardQuoteKind | null {
  if (service === 'cnc_machining' || service === 'cnc_turning') return 'cnc';
  if (service === 'sheet_metal_cutting') return 'sheet';
  if (service === '3d_printing') return 'print';
  return null;
}

export function isSheetQuote(q: WizardQuote): q is SheetQuoteResult {
  return 'kind' in q && q.kind === 'sheet';
}

export function isPrintQuote(q: WizardQuote): q is PrintQuoteResult {
  return 'kind' in q && q.kind === 'print';
}

export interface WizardPricing {
  readonly quote: WizardQuote | null;
  /** Why there is no instant price (material or geometry an engineer must price) */
  readonly reason: string | null;
  readonly unpriced: readonly SecondaryProcess[];
  readonly tiers: readonly QuantityTier[];
}

export type WizardAnalysis =
  | { readonly kind: 'cnc'; readonly analysis: CncAnalysis }
  | { readonly kind: 'sheet'; readonly analysis: SheetAnalysis }
  | { readonly kind: 'print'; readonly analysis: PrintAnalysis };

export interface WizardSelections {
  readonly material: { readonly id: string; readonly thickness?: number };
  readonly secondaryProcesses: readonly SecondaryProcess[];
  readonly coatingColor?: ColorOption | null;
  readonly taps?: readonly TapSelection[];
  readonly quantity: number;
}

/**
 * Live wizard price. `calibration` is the admin-applied multipliers — the same ones
 * the server applies when the part is added, so both prices agree.
 */
export function priceWizardPart(
  source: WizardAnalysis,
  s: WizardSelections,
  calibration: CalibrationConfig = NO_CALIBRATION
): WizardPricing {
  const input = {
    materialId: s.material.id,
    secondaryProcesses: s.secondaryProcesses,
    coatingColor: s.coatingColor,
    taps: s.taps,
    quantity: s.quantity,
  };

  if (source.kind === 'cnc') {
    const built = buildCncQuoteRequest(input);
    if (!built.priceable) return { quote: null, reason: built.reason, unpriced: [], tiers: [] };
    const { request, unpriced } = fitRequestToAnalysis(source.analysis, built.request, built.unpriced);
    const result = generateCncQuote(source.analysis, request, undefined, calibration.shopLoad);
    const m = resolveMultiplier(calibration, 'cnc', request.materialId);
    return result.success
      ? {
        quote: calibrateQuote(result.data, m),
        reason: null,
        unpriced,
        tiers: calibrateTiers(getCncTierTable(source.analysis, { ...request, quantity: 1 }, undefined, calibration.shopLoad), m),
      }
      : { quote: null, reason: result.error.message, unpriced, tiers: [] };
  }

  if (source.kind === 'sheet') {
    const built = buildSheetQuoteRequest({ ...input, thicknessMm: s.material.thickness });
    if (!built.priceable) return { quote: null, reason: built.reason, unpriced: [], tiers: [] };
    const { request, unpriced } = fitSheetRequestToAnalysis(source.analysis, built.request, built.unpriced);
    const result = generateSheetQuote(source.analysis, request, calibration.shopLoad);
    const m = resolveMultiplier(calibration, 'sheet', request.materialId);
    return result.success
      ? {
        quote: calibrateQuote(result.data, m),
        reason: null,
        unpriced,
        tiers: calibrateTiers(getSheetTierTable(source.analysis, { ...request, quantity: 1 }, calibration.shopLoad), m),
      }
      : { quote: null, reason: result.error.message, unpriced, tiers: [] };
  }

  const built = buildPrintQuoteRequest(input);
  if (!built.priceable) return { quote: null, reason: built.reason, unpriced: [], tiers: [] };
  const result = generatePrintQuote(source.analysis, built.request, calibration.shopLoad);
  const m = resolveMultiplier(calibration, 'print', built.request.materialId);
  return result.success
    ? {
      quote: calibrateQuote(result.data, m),
      reason: null,
      unpriced: built.unpriced,
      tiers: calibrateTiers(getPrintTierTable(source.analysis, { ...built.request, quantity: 1 }, calibration.shopLoad), m),
    }
    : { quote: null, reason: result.error.message, unpriced: built.unpriced, tiers: [] };
}
