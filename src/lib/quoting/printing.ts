// ═══════════════════════════════════════════════════
// FDM 3D printing pricing
// Turns one /analyze-print result into a price for any filament and quantity:
// walls + infill + supports → mass and print time, in the cheapest orientation
// that fits the bed. Pure functions; rates live in print-rates.ts.
// ═══════════════════════════════════════════════════

import type {
  DFMIssue,
  PrintAnalysis,
  PrintOrientation,
  PrintQuoteBreakdown,
  PrintQuoteRequest,
  PrintQuoteResult,
  QuantityTier,
} from '@/types/quoting';
import { type Result, ok, err } from '@/utils/result';
import { AppError, ErrorCode } from '@/utils/errors';
import { DEFAULT_SHOP_LOAD, calcBatchFinishCost, calcRushMultiplier } from './pricing-engine';
import { getTurnaroundOption } from './materials';
import { calcQuantityMultiplier } from './quantity-tiers';
import { hasBlockingIssues } from './dfm-checks';
import { PRINT_SHOP_RATES as R, getPrintMaterial, type PrintMaterialRate } from './print-rates';

const round2 = (n: number) => Math.round(n * 100) / 100;
/** Support heavier than this share of the part is worth a warning */
const HEAVY_SUPPORT_SHARE = 0.3;

export function printLearningFactor(quantity: number): number {
  return 1 - R.learningShare * (1 - calcQuantityMultiplier(quantity));
}

/** Fits the bed in some rotation about Z */
export function fitsBed(o: PrintOrientation): boolean {
  const [a, b] = [o.sizeMm.x, o.sizeMm.y].sort((p, q) => q - p);
  const [bedA, bedB] = [R.bedMm.x, R.bedMm.y].sort((p, q) => q - p);
  return a <= bedA && b <= bedB && o.sizeMm.z <= R.bedMm.z;
}

interface OrientationCost {
  readonly orientation: PrintOrientation;
  readonly materialCost: number;
  readonly machineCost: number;
  readonly labourCost: number;
  readonly massG: number;
  readonly printTimeMin: number;
  readonly supportPrintedMm3: number;
  readonly partPrintedMm3: number;
}

function costOrientation(
  analysis: PrintAnalysis,
  material: PrintMaterialRate,
  orientation: PrintOrientation
): OrientationCost {
  const shell = Math.min(analysis.volumeMm3, analysis.surfaceAreaMm2 * R.wallMm);
  const partPrintedMm3 = shell + (analysis.volumeMm3 - shell) * material.infill;
  const supportPrintedMm3 = orientation.supportVolumeMm3 * R.supportDensity;
  const printedMm3 = partPrintedMm3 + supportPrintedMm3;

  const massG = (printedMm3 / 1000) * material.densityGCm3;
  const materialCost = (massG / 1000) * material.pricePerKg * R.materialWaste;

  const layers = Math.ceil(orientation.sizeMm.z / R.layerHeightMm);
  const printTimeMin = ((printedMm3 / material.flowMm3S + layers * R.layerChangeS) * R.travelFactor) / 60;
  const machineCost = (printTimeMin / 60) * material.machinePerHour;
  const labourCost = R.postProcessPerPart + supportPrintedMm3 * R.supportRemovalPerMm3;

  return { orientation, materialCost, machineCost, labourCost, massG, printTimeMin, supportPrintedMm3, partPrintedMm3 };
}

const issue = (code: string, message: string, fixSuggestion: string, blocking: boolean): DFMIssue => ({
  code,
  severity: blocking ? 'error' : 'warning',
  message,
  fixSuggestion,
  blocking,
});

export function generatePrintQuote(
  analysis: PrintAnalysis,
  request: PrintQuoteRequest,
  shopUtilization: number = DEFAULT_SHOP_LOAD
): Result<PrintQuoteResult, AppError> {
  const { materialId, finishType, quantity, turnaround } = request;
  const material = getPrintMaterial(materialId);
  if (!material) {
    return err(
      new AppError({
        code: ErrorCode.INVALID_MATERIAL,
        message: 'This material is quoted by our engineers.',
        statusCode: 400,
        context: { materialId },
      })
    );
  }
  if (!material.finishes.includes(finishType)) {
    return err(
      new AppError({
        code: ErrorCode.INVALID_FINISH,
        message: `Finish "${finishType}" not available for ${material.name}`,
        statusCode: 400,
        context: { materialId, finishType },
      })
    );
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return err(
      new AppError({
        code: ErrorCode.INVALID_QUANTITY,
        message: `Quantity must be a positive whole number, got ${quantity}`,
        statusCode: 400,
        context: { quantity },
      })
    );
  }
  if (analysis.orientations.length === 0 || analysis.volumeMm3 <= 0) {
    return err(
      new AppError({
        code: ErrorCode.INVALID_INPUT,
        message: 'The model is not a closed solid, so our engineers will price it.',
        statusCode: 422,
      })
    );
  }

  // ── Cheapest orientation that fits the bed (what a slicer's auto-orient does) ──
  const learning = printLearningFactor(quantity);
  const perPart = (c: OrientationCost) =>
    (c.materialCost + c.machineCost * learning) * (1 + R.failureAllowance) + c.labourCost;
  const costed = analysis.orientations.map((o) => costOrientation(analysis, material, o));
  const fitting = costed.filter((c) => fitsBed(c.orientation));
  const pool = fitting.length > 0 ? fitting : costed;
  const best = pool.reduce((a, b) => (perPart(b) < perPart(a) ? b : a));

  const dfm: DFMIssue[] = [];
  if (fitting.length === 0) {
    dfm.push(
      issue(
        'PART_TOO_LARGE',
        `The part doesn't fit our ${R.bedMm.x} × ${R.bedMm.y} × ${R.bedMm.z} mm build volume in any orientation.`,
        'Split the model into pieces that fit, or ask our engineers about a large-format print.',
        true
      )
    );
  }
  if (best.supportPrintedMm3 > HEAVY_SUPPORT_SHARE * best.partPrintedMm3) {
    dfm.push(
      issue(
        'HEAVY_SUPPORT',
        'This part needs a lot of support material, which adds cost and leaves marks.',
        'Add chamfers under overhangs (45° or steeper) or split the part.',
        false
      )
    );
  }

  const machineCost = best.machineCost * learning * (1 + R.failureAllowance);
  const materialCost = best.materialCost * (1 + R.failureAllowance);
  const setupCost = R.jobSetup / quantity;
  const finishCost = calcBatchFinishCost(analysis.surfaceAreaMm2, finishType, quantity);
  const baseCostPerPart = materialCost + machineCost + best.labourCost + setupCost;

  // Parts are priced from cost; the order minimum (scaled by turnaround) covers the
  // print job. The finish is always added on top, so it shows even on a minimum-priced order.
  const rushMultiplier = calcRushMultiplier(turnaround, shopUtilization);
  const markup = rushMultiplier * (1 + R.marginPct);
  const partPrice = baseCostPerPart * markup;
  const totalPrice =
    Math.max(partPrice * quantity, R.minOrderLine * rushMultiplier) + finishCost * markup * quantity;
  const pricePerPart = totalPrice / quantity;

  const breakdown: PrintQuoteBreakdown = {
    materialCost: round2(materialCost),
    machineCost: round2(machineCost),
    labourCost: round2(best.labourCost),
    setupCost: round2(setupCost),
    finishCost: round2(finishCost),
    massG: round2(best.massG),
    printTimeMin: round2(best.printTimeMin),
    supportVolumeMm3: Math.round(best.supportPrintedMm3),
    orientation: best.orientation.up,
    quantityMultiplier: Math.round(learning * 10000) / 10000,
    rushMultiplier: Math.round(rushMultiplier * 10000) / 10000,
    marginPct: R.marginPct,
  };

  return ok({
    kind: 'print',
    pricePerPart: Math.round(pricePerPart),
    totalPrice: Math.round(totalPrice),
    leadTimeDays: getTurnaroundOption(turnaround)?.days ?? 3,
    breakdown,
    dfmIssues: dfm,
    hasBlockingIssues: hasBlockingIssues(dfm),
    expiresAt: Date.now() + 15 * 60 * 1000,
    quoteRef: `MH-${Date.now().toString(36).toUpperCase().slice(-6)}`,
    parameters: request,
    analysis,
  });
}

const TIER_QUANTITIES = [1, 5, 10, 25, 50, 100, 250, 500, 1000] as const;

export function getPrintTierTable(
  analysis: PrintAnalysis,
  request: PrintQuoteRequest,
  shopUtilization: number = DEFAULT_SHOP_LOAD
): readonly QuantityTier[] {
  const tiers: { quantity: number; pricePerPart: number; totalPrice: number }[] = [];
  for (const quantity of TIER_QUANTITIES) {
    const result = generatePrintQuote(analysis, { ...request, quantity }, shopUtilization);
    if (!result.success) return [];
    tiers.push({ quantity, pricePerPart: result.data.pricePerPart, totalPrice: result.data.totalPrice });
  }
  const single = tiers[0].pricePerPart;
  return tiers.map((tier) => {
    const multiplier = single > 0 ? tier.pricePerPart / single : 1;
    return {
      ...tier,
      multiplier: Math.round(multiplier * 10000) / 10000,
      savingsPercent: Math.max(0, Math.round((1 - multiplier) * 100)),
    };
  });
}
