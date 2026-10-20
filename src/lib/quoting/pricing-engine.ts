// ═══════════════════════════════════════════════════
// Pricing Engine — Core IP. Exact formulas from Architecture.md
// Adapted for INR pricing and Indian manufacturing.
// Pure functions. Zero framework dependencies. Fully testable.
// ═══════════════════════════════════════════════════

import type {
  Material,
  Machine,
  ParsedGeometry,
  FinishType,
  TurnaroundType,
  QuoteResult,
  QuoteBreakdown,
  QuantityTier,
  AnyQuoteResult,
  CncAnalysis,
  CncMachiningTime,
  CncProcess,
  CncQuoteBreakdown,
  CncQuoteRequest,
  CncQuoteResult,
  CncShopRates,
} from '@/types/quoting';
import { type Result, ok, err } from '@/utils/result';
import { AppError, ErrorCode } from '@/utils/errors';
import { getMaterialById, getFinishRate, getTurnaroundOption, LASER_MACHINE } from './materials';
import { calcQuantityMultiplier } from './quantity-tiers';
import { runDFMChecks, hasBlockingIssues } from './dfm-checks';
import { DEFAULT_CNC_SHOP_RATES, getCncMaterialData } from './cnc-materials';
import { calcCncTappingCost } from './tapping';

// ═══ Configuration constants ═══

const TARGET_MARGIN = 0.42;
const MIN_ORDER_INR = 2900;
const BASE_SETUP_COST_INR = 1200;
const COMPLEX_SURCHARGE_INR = 500;
const LEAD_IN_TIME_S = 2.5;

const MIN_UNIT_PRICE: Record<string, number> = {
  laser_cut_fiber: 180,
  laser_cut_co2: 120,
  waterjet: 500,
  plasma: 100,
  cnc_machining_3axis: 400,
  cnc_machining_5axis: 800,
  sheet_metal_bending: 250,
  cnc_turning: 300,
};

// ═══ Cost Component Calculations ═══

/**
 * Material cost per part.
 * Volume → mass → raw cost + waste surcharge from nesting efficiency.
 */
export function calcMaterialCost(
  geometry: ParsedGeometry,
  material: Material,
  thicknessMm: number,
  quantity: number
): number {
  const volumeCm3 = (geometry.areaMm2 * thicknessMm) / 1000;
  const massKg = (volumeCm3 * material.densityGCm3) / 1000;
  const rawCost = massKg * material.pricePerKg;

  const sheetArea = material.sheetWidthMm * material.sheetHeightMm;
  const boundingArea = geometry.boundingBox.widthMm * geometry.boundingBox.heightMm;

  // Nesting efficiency improves with quantity
  const nestingEfficiency = Math.min(0.85, 0.45 + quantity * 0.004);
  const effectiveArea = boundingArea / nestingEfficiency;
  const sheetsPerPart = effectiveArea / sheetArea;
  const sheetCost = sheetsPerPart * material.pricePerSheet;
  const wasteSurcharge = Math.max(0, sheetCost - rawCost);

  return rawCost + wasteSurcharge;
}

/**
 * Cut time cost per part.
 * Speed factor from thickness, complexity penalty, pierce time.
 */
export function calcCutCost(
  geometry: ParsedGeometry,
  material: Material,
  thicknessMm: number,
  machine: Machine
): number {
  const speedFactor = 1.0 / (1 + 0.28 * thicknessMm);
  const effectiveSpeed = machine.maxSpeedMmS * speedFactor;
  const complexityPenalty = 1.0 + geometry.complexityScore * 0.12;
  const cutTimeS = (geometry.cutLengthMm / effectiveSpeed) * complexityPenalty;
  const pierceTimeS = geometry.holeCount * machine.pierceTimeS;
  const totalTimeS = cutTimeS + pierceTimeS + LEAD_IN_TIME_S;

  let cutCost = (totalTimeS / 3600) * machine.hourlyRate;

  // Complexity surcharge for high node count
  if (geometry.nodeCount > 500) {
    const complexitySurcharge = ((geometry.nodeCount - 500) / 100) * 0.025;
    cutCost *= 1 + complexitySurcharge;
  }

  // Bulk nesting credit for 100+ identical parts with good aspect ratio
  if (geometry.boundingBox.aspectRatio < 3.0 && geometry.boundingBox.aspectRatio > 0) {
    // Credit increases gradually from 0% at 1pc to 8% at 100+pc
    const nestingCreditPct = Math.min(0.08, Math.max(0, (100 - 1) * 0.0008));
    cutCost *= 1 - nestingCreditPct;
  }

  return cutCost;
}

/**
 * Setup cost per part. Fixed per job, amortized by quantity.
 */
export function calcSetupCost(quantity: number, complexityScore: number): number {
  let setupTotal = BASE_SETUP_COST_INR;

  if (complexityScore > 5) {
    setupTotal += COMPLEX_SURCHARGE_INR;
  }

  return setupTotal / quantity;
}

/**
 * Finish cost per part.
 * Surface area × rate, with batch discounts.
 */
export function calcFinishCost(
  geometry: ParsedGeometry,
  finishType: FinishType,
  quantity: number
): number {
  // Surface area = both faces (edge area negligible for sheet metal)
  return calcFinishCostForArea(geometry.areaMm2 * 2, finishType, quantity);
}

/** Finish cost per part for a known wetted surface area. */
export function calcFinishCostForArea(
  surfaceAreaMm2: number,
  finishType: FinishType,
  quantity: number
): number {
  const finish = getFinishRate(finishType);

  if (finishType === 'none') {
    return 0;
  }

  let costPerPart = Math.max(finish.minCost, surfaceAreaMm2 * finish.costPerMm2);

  // Batch discounts for finishing
  if (quantity >= 50) {
    costPerPart *= 0.7;
  } else if (quantity >= 10) {
    costPerPart *= 0.82;
  }

  return costPerPart;
}

/**
 * Rush multiplier with dynamic surge pricing.
 */
export function calcRushMultiplier(
  turnaround: TurnaroundType,
  shopUtilization: number = 0.65
): number {
  const option = getTurnaroundOption(turnaround);
  if (!option) {
    return 1.0;
  }

  const base = option.multiplier;

  // Dynamic surge when shop is busy
  if (shopUtilization > 0.85 && (turnaround === 'rush_1d' || turnaround === 'same_day')) {
    const surge = 1.0 + (shopUtilization - 0.85) * 2.0;
    return base * surge;
  }

  return base;
}

// ═══ Master Quote Generation ═══

/**
 * Generates a complete quote from inputs.
 * Returns Result<QuoteResult, AppError> — never throws.
 */
export function generateQuote(
  materialId: string,
  thicknessMm: number,
  finishType: FinishType,
  quantity: number,
  turnaround: TurnaroundType,
  geometry: ParsedGeometry,
  shopUtilization: number = 0.65
): Result<QuoteResult, AppError> {
  // ── Validate material exists ──
  const material = getMaterialById(materialId);
  if (!material) {
    return err(
      new AppError({
        code: ErrorCode.INVALID_MATERIAL,
        message: `Material not found: ${materialId}`,
        statusCode: 400,
        context: { materialId },
      })
    );
  }

  // ── Validate thickness ──
  if (!material.availableThicknesses.includes(thicknessMm)) {
    return err(
      new AppError({
        code: ErrorCode.INVALID_THICKNESS,
        message: `Thickness ${thicknessMm}mm not available for ${material.name}`,
        statusCode: 400,
        context: { materialId, thicknessMm, available: material.availableThicknesses },
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

  // ── Run DFM checks ──
  const machine = LASER_MACHINE;
  const dfmIssues = runDFMChecks(geometry, material, thicknessMm, machine);
  const blocking = hasBlockingIssues(dfmIssues);

  // ── Core cost components ──
  const materialCost = calcMaterialCost(geometry, material, thicknessMm, quantity);
  const cutCost = calcCutCost(geometry, material, thicknessMm, machine);
  const setupCost = calcSetupCost(quantity, geometry.complexityScore);
  const finishCost = calcFinishCost(geometry, finishType, quantity);

  const baseCostPerPart = materialCost + cutCost + setupCost + finishCost;

  // ── Modifiers ──
  const qtyMultiplier = calcQuantityMultiplier(quantity);
  const rushMultiplier = calcRushMultiplier(turnaround, shopUtilization);

  let pricePerPart = baseCostPerPart * qtyMultiplier * rushMultiplier * (1 + TARGET_MARGIN);

  // ── Minimum unit price ──
  const minPrice = MIN_UNIT_PRICE[material.process] ?? 180;
  pricePerPart = Math.max(pricePerPart, minPrice);

  // ── Minimum order value ──
  let totalPrice = pricePerPart * quantity;
  if (totalPrice < MIN_ORDER_INR) {
    totalPrice = MIN_ORDER_INR;
    pricePerPart = MIN_ORDER_INR / quantity;
  }

  // ── Lead time ──
  const turnaroundOption = getTurnaroundOption(turnaround);
  const leadTimeDays = turnaroundOption?.days ?? 3;

  // ── Build quote reference ──
  const quoteRef = `MH-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  const breakdown: QuoteBreakdown = {
    materialCost: Math.round(materialCost * 100) / 100,
    cutCost: Math.round(cutCost * 100) / 100,
    setupCost: Math.round(setupCost * 100) / 100,
    finishCost: Math.round(finishCost * 100) / 100,
    quantityMultiplier: Math.round(qtyMultiplier * 10000) / 10000,
    rushMultiplier: Math.round(rushMultiplier * 10000) / 10000,
    marginPct: TARGET_MARGIN,
  };

  const result: QuoteResult = {
    pricePerPart: Math.round(pricePerPart),
    totalPrice: Math.round(totalPrice),
    leadTimeDays,
    breakdown,
    dfmIssues,
    hasBlockingIssues: blocking,
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
    quoteRef,
    parameters: {
      materialId,
      thicknessMm,
      finishType,
      quantity,
      turnaround,
    },
    geometry,
  };

  return ok(result);
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
  shopUtilization: number = 0.65
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
  const finishCost = calcFinishCostForArea(analysis.part.surfaceAreaMm2, finishType, quantity);

  // ── Tapping: requested threads, checked against the analysed holes ──
  const tapping = calcCncTappingCost(analysis, request.taps, cncData.machinabilityGroup, process, rates);
  if (!tapping.success) {
    return err(tapping.error);
  }
  const tappingCost = tapping.data.machineCostPerPart * learningFactor + tapping.data.wearCostPerPart;

  const baseCostPerPart =
    materialCost + machiningCost + setupCost + programmingCost + finishCost + tappingCost;

  // ── Modifiers ──
  const rushMultiplier = calcRushMultiplier(turnaround, shopUtilization);
  let pricePerPart = baseCostPerPart * rushMultiplier * (1 + rates.marginPct);

  // ── Minimum unit price ──
  pricePerPart = Math.max(pricePerPart, MIN_UNIT_PRICE[process] ?? 400);

  // ── Minimum order value ──
  let totalPrice = pricePerPart * quantity;
  if (totalPrice < MIN_ORDER_INR) {
    totalPrice = MIN_ORDER_INR;
    pricePerPart = MIN_ORDER_INR / quantity;
  }

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

/** True for quotes produced by generateCncQuote (they carry the analysis). */
export function isCncQuote(quote: AnyQuoteResult): quote is CncQuoteResult {
  return 'analysis' in quote;
}

const CNC_TIER_QUANTITIES = [1, 5, 10, 25, 50, 100, 250, 500, 1000] as const;

/**
 * Tier table for a CNC part. Setup and programming amortise over the batch,
 * so each tier is re-priced rather than scaled from the single-unit price.
 */
export function getCncTierTable(
  analysis: CncAnalysis,
  request: CncQuoteRequest,
  rates: CncShopRates = DEFAULT_CNC_SHOP_RATES
): readonly QuantityTier[] {
  const tiers: { quantity: number; pricePerPart: number; totalPrice: number }[] = [];
  for (const quantity of CNC_TIER_QUANTITIES) {
    const result = generateCncQuote(analysis, { ...request, quantity }, rates);
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
