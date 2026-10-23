// ═══════════════════════════════════════════════════
// Pricing Engine — CNC pricing plus the finish and turnaround rules every
// engine shares (sheet-metal.ts and printing.ts price laser and FDM).
// Adapted for INR pricing and Indian manufacturing.
// Pure functions. Zero framework dependencies. Fully testable.
// ═══════════════════════════════════════════════════

import type {
  FinishType,
  TurnaroundType,
  QuantityTier,
  AnyQuoteResult,
  CncAnalysis,
  CncMachiningTime,
  CncProcess,
  CncQuoteBreakdown,
  CncQuoteRequest,
  CncQuoteResult,
  CncShopRates,
  SheetQuoteResult,
} from '@/types/quoting';
import { type Result, ok, err } from '@/utils/result';
import { AppError, ErrorCode } from '@/utils/errors';
import { getMaterialById, getFinishRate, getTurnaroundOption } from './materials';
import { calcQuantityMultiplier } from './quantity-tiers';
import { hasBlockingIssues } from './dfm-checks';
import { DEFAULT_CNC_SHOP_RATES, getCncMaterialData } from './cnc-materials';
import { calcCncTappingCost } from './tapping';

// ═══ Shared by every engine ═══

/** Smallest CNC order line (₹), before turnaround */
export const MIN_ORDER_INR = 2900;

/**
 * Finish cost per part when the finisher's minimum is a lot charge: area × rate
 * per part (with batch discounts), but never less than the minimum spread over the batch.
 */
export function calcBatchFinishCost(
  surfaceAreaMm2: number,
  finishType: FinishType,
  quantity: number
): number {
  if (finishType === 'none') return 0;
  const finish = getFinishRate(finishType);
  let perPart = surfaceAreaMm2 * finish.costPerMm2;
  if (quantity >= 50) perPart *= 0.7;
  else if (quantity >= 10) perPart *= 0.82;
  return Math.max(perPart, finish.minCost / Math.max(1, quantity));
}

/** Shop load assumed until an admin sets one (Admin → Pricing Calibration) */
export const DEFAULT_SHOP_LOAD = 0.65;
/** Rush and Same-day orders surge above this shop load… */
export const SURGE_START = 0.85;
/** …by this much per unit of load: +30% at a full shop */
const SURGE_SLOPE = 2;

/** Surge factor on Rush / Same-day work at a shop load (1 = none) */
export function calcSurge(shopUtilization: number): number {
  return shopUtilization > SURGE_START ? 1 + (shopUtilization - SURGE_START) * SURGE_SLOPE : 1;
}

/**
 * Rush multiplier with dynamic surge pricing: Rush and Same-day orders cost
 * more when the shop is busy. The load is set by an admin.
 */
export function calcRushMultiplier(
  turnaround: TurnaroundType,
  shopUtilization: number = DEFAULT_SHOP_LOAD
): number {
  const option = getTurnaroundOption(turnaround);
  if (!option) {
    return 1.0;
  }

  const base = option.multiplier;
  if (turnaround === 'rush_1d' || turnaround === 'same_day') {
    return base * calcSurge(shopUtilization);
  }
  return base;
}

// ═══ CNC Machining Branch ═══
// Geometry → time happens in the CAD converter (/analyze-cnc); this branch
// turns time + stock into money using the shop's own rates, so one analysis
// prices every material, quantity and finish instantly.

/** Share of the laser volume discount that applies to CNC cycle time. */
const CNC_LEARNING_SHARE = 0.5;

/** Stock cost per part: standard block/bar mass × price, plus waste. */
export function calcCncMaterialCost(
  analysis: CncAnalysis,
  densityGCm3: number,
  pricePerKg: number,
  wastePct: number
): number {
  if (!analysis.stock) {
    return 0;
  }
  const massKg = ((analysis.stock.volumeMm3 / 1000) * densityGCm3) / 1000;
  return massKg * pricePerKg * (1 + wastePct);
}

/**
 * Recurring machine cost per part: cycle + load/unload at the process rate.
 * Turned parts bill secondary milling (flats, cross holes) at the VMC rate.
 */
export function calcCncMachiningCost(
  times: CncMachiningTime,
  handlingMin: number,
  process: CncProcess,
  rates: CncShopRates
): number {
  const rate = rates.machineRatePerHour;
  if (process === 'cnc_turning') {
    const latheMin = times.cycleMin - times.secondaryMillingMin + handlingMin;
    return (
      (latheMin / 60) * rate.cnc_turning +
      (times.secondaryMillingMin / 60) * rate.cnc_machining_3axis
    );
  }
  return ((times.cycleMin + handlingMin) / 60) * rate[process];
}

/**
 * Cycle-time learning curve. Setup and programming are already amortised
 * over the batch, so only half of the standard quantity discount applies.
 */
export function calcCncLearningFactor(quantity: number): number {
  return 1 - CNC_LEARNING_SHARE * (1 - calcQuantityMultiplier(quantity));
}

/**
 * Generates a CNC quote from a /analyze-cnc result.
 * Returns Result<CncQuoteResult, AppError> — never throws.
 */
export function generateCncQuote(
  analysis: CncAnalysis,
  request: CncQuoteRequest,
  rates: CncShopRates = DEFAULT_CNC_SHOP_RATES,
  shopUtilization: number = DEFAULT_SHOP_LOAD
): Result<CncQuoteResult, AppError> {
  const { materialId, finishType, quantity, turnaround } = request;

  // ── Validate material ──
  const material = getMaterialById(materialId);
  const cncData = getCncMaterialData(materialId);
  if (!material || !cncData) {
    return err(
      new AppError({
        code: ErrorCode.INVALID_MATERIAL,
        message: `Material not available for CNC machining: ${materialId}`,
        statusCode: 400,
        context: { materialId },
      })
    );
  }

  // ── Validate finish ──
  if (!material.availableFinishes.includes(finishType)) {
    return err(
      new AppError({
        code: ErrorCode.INVALID_FINISH,
        message: `Finish "${finishType}" not available for ${material.name}`,
        statusCode: 400,
        context: { materialId, finishType, available: material.availableFinishes },
      })
    );
  }

  // ── Validate quantity ──
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

  // ── Validate process override ──
  // Stock is sized for the recommended process (bar for turning, block for
  // milling), so only 3-axis ↔ 5-axis can be swapped without re-analysing.
  const recommended = analysis.process.recommended;
  const process = request.process ?? recommended;
  if ((process === 'cnc_turning') !== (recommended === 'cnc_turning')) {
    return err(
      new AppError({
        code: ErrorCode.INVALID_INPUT,
        message: `Process "${process}" is not compatible with this part (analysed as ${recommended})`,
        statusCode: 400,
        context: { process, recommended },
      })
    );
  }

  // ── Validate analysis ──
  if (!analysis.stock) {
    return err(
      new AppError({
        code: ErrorCode.DFM_PART_TOO_LARGE,
        message: 'Part exceeds standard stock sizes',
        statusCode: 422,
        context: { boundingBox: analysis.part.boundingBox },
      })
    );
  }
  const times = analysis.machiningTime[cncData.machinabilityGroup];
  if (!times) {
    return err(
      new AppError({
        code: ErrorCode.INVALID_INPUT,
        message: `Analysis ${analysis.version} has no times for ${cncData.machinabilityGroup}`,
        statusCode: 400,
        context: { version: analysis.version, group: cncData.machinabilityGroup },
      })
    );
  }

  // ── Core cost components (per part) ──
  const stockPrice =
    analysis.stock.shape === 'round_bar' ? cncData.barPricePerKg : cncData.blockPricePerKg;
  const materialCost = calcCncMaterialCost(
    analysis,
    material.densityGCm3,
    stockPrice,
    rates.materialWastePct
  );
  const learningFactor = calcCncLearningFactor(quantity);
  const machiningCost =
    calcCncMachiningCost(times, analysis.handlingTimePerPartMin, process, rates) * learningFactor;
  const setupCost = ((analysis.setupTimeMin / 60) * rates.setupRatePerHour) / quantity;
  const programmingCost =
    ((analysis.programmingTimeMin / 60) * rates.programmingRatePerHour) / quantity;
  const finishCost = calcBatchFinishCost(analysis.part.surfaceAreaMm2, finishType, quantity);

  // ── Tapping: requested threads, checked against the analysed holes ──
  const tapping = calcCncTappingCost(analysis, request.taps, cncData.machinabilityGroup, process, rates);
  if (!tapping.success) {
    return err(tapping.error);
  }
  const tappingCost = tapping.data.machineCostPerPart * learningFactor + tapping.data.wearCostPerPart;

  const baseCostPerPart = materialCost + machiningCost + setupCost + programmingCost;

  // ── Modifiers ──
  const rushMultiplier = calcRushMultiplier(turnaround, shopUtilization);
  const markup = rushMultiplier * (1 + rates.marginPct);

  // ── Order minimum — no per-part floor; tapping and the finish are added on top ──
  // Parts are priced from cost; the order minimum (scaled by turnaround, so Economy
  // and Rush still apply) covers the job, and extras show even on a minimum-priced order.
  const partPrice = baseCostPerPart * markup;
  const totalPrice =
    Math.max(partPrice * quantity, MIN_ORDER_INR * rushMultiplier) + (tappingCost + finishCost) * markup * quantity;
  const pricePerPart = totalPrice / quantity;

  const turnaroundOption = getTurnaroundOption(turnaround);
  const round2 = (n: number) => Math.round(n * 100) / 100;

  const breakdown: CncQuoteBreakdown = {
    materialCost: round2(materialCost),
    machiningCost: round2(machiningCost),
    setupCost: round2(setupCost),
    programmingCost: round2(programmingCost),
    finishCost: round2(finishCost),
    tappingCost: round2(tappingCost),
    tappedHoles: tapping.data.holes,
    cycleTimeMin: round2((times.cycleMin + tapping.data.minutesPerPart) * learningFactor),
    quantityMultiplier: Math.round(learningFactor * 10000) / 10000,
    rushMultiplier: Math.round(rushMultiplier * 10000) / 10000,
    marginPct: rates.marginPct,
  };

  return ok({
    pricePerPart: Math.round(pricePerPart),
    totalPrice: Math.round(totalPrice),
    leadTimeDays: turnaroundOption?.days ?? 3,
    process,
    breakdown,
    dfmIssues: analysis.dfm,
    hasBlockingIssues: hasBlockingIssues(analysis.dfm),
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
    quoteRef: `MH-${Date.now().toString(36).toUpperCase().slice(-6)}`,
    parameters: { ...request, process },
    analysis,
  });
}

/** True for quotes produced by generateCncQuote (sheet quotes carry an analysis too). */
export function isCncQuote(quote: AnyQuoteResult): quote is CncQuoteResult {
  return 'analysis' in quote && 'process' in quote;
}

/** True for laser quotes priced by generateSheetQuote */
export function isSheetQuoteResult(quote: AnyQuoteResult): quote is SheetQuoteResult {
  return 'kind' in quote && quote.kind === 'sheet';
}

const CNC_TIER_QUANTITIES = [1, 5, 10, 25, 50, 100, 250, 500, 1000] as const;

/**
 * Tier table for a CNC part. Setup and programming amortise over the batch,
 * so each tier is re-priced rather than scaled from the single-unit price.
 */
export function getCncTierTable(
  analysis: CncAnalysis,
  request: CncQuoteRequest,
  rates: CncShopRates = DEFAULT_CNC_SHOP_RATES,
  shopUtilization: number = DEFAULT_SHOP_LOAD
): readonly QuantityTier[] {
  const tiers: { quantity: number; pricePerPart: number; totalPrice: number }[] = [];
  for (const quantity of CNC_TIER_QUANTITIES) {
    const result = generateCncQuote(analysis, { ...request, quantity }, rates, shopUtilization);
    if (!result.success) {
      return [];
    }
    tiers.push({
      quantity,
      pricePerPart: result.data.pricePerPart,
      totalPrice: result.data.totalPrice,
    });
  }

  const singleUnit = tiers[0].pricePerPart;
  return tiers.map((t) => {
    const multiplier = singleUnit > 0 ? t.pricePerPart / singleUnit : 1;
    return {
      ...t,
      multiplier: Math.round(multiplier * 10000) / 10000,
      savingsPercent: Math.max(0, Math.round((1 - multiplier) * 100)),
    };
  });
}
