// ═══════════════════════════════════════════════════
// Sheet metal pricing — laser cutting + press-brake bending + tapping
// Turns one /analyze-sheet result into a price for any sheet material,
// thickness and quantity. Pure functions; rates live in sheet-rates.ts.
// ═══════════════════════════════════════════════════

import type {
  DFMIssue,
  QuantityTier,
  SheetAnalysis,
  SheetQuoteBreakdown,
  SheetQuoteRequest,
  SheetQuoteResult,
} from '@/types/quoting';
import { type Result, ok, err } from '@/utils/result';
import { AppError, ErrorCode } from '@/utils/errors';
import { DEFAULT_SHOP_LOAD, calcBatchFinishCost, calcRushMultiplier } from './pricing-engine';
import { getTurnaroundOption } from './materials';
import { calcQuantityMultiplier } from './quantity-tiers';
import { hasBlockingIssues } from './dfm-checks';
import { calcTappingCost, findTap, tapPitchMm, type TapHole } from './tapping';
import {
  SHEET_SHOP_RATES as R,
  cutSpeedMmMin,
  getSheetMaterial,
  laserRatePerHour,
  pierceTimeS,
} from './sheet-rates';

/** Share of the standard quantity discount that applies to machine time */
const SHEET_LEARNING_SHARE = 0.5;
const THICKNESS_MISMATCH_MM = 0.3;
/** Fewer engaged threads than this pulls out under load */
const MIN_ENGAGED_THREADS = 1.5;

const round2 = (n: number) => Math.round(n * 100) / 100;

export function sheetLearningFactor(quantity: number): number {
  return 1 - SHEET_LEARNING_SHARE * (1 - calcQuantityMultiplier(quantity));
}

/** Share of the bought sheet that ends up in parts — better with more parts to nest */
export function nestingEfficiency(quantity: number): number {
  return 0.7 + 0.15 * (1 - 1 / Math.sqrt(Math.max(1, quantity)));
}

/** Analysed through-holes as tapping sees them: depth is the sheet thickness */
export function sheetTapHoles(analysis: SheetAnalysis, thicknessMm: number): TapHole[] {
  return analysis.holes.map((h) => ({ diameterMm: h.diameterMm, depthMm: thicknessMm, count: h.count, through: true }));
}

const issue = (
  code: string,
  message: string,
  fixSuggestion: string,
  blocking: boolean
): DFMIssue => ({ code, severity: blocking ? 'error' : 'warning', message, fixSuggestion, blocking });

const invalid = (code: ErrorCode, message: string, context: Record<string, unknown>) =>
  err(new AppError({ code, message, statusCode: 400, context }));

export function generateSheetQuote(
  analysis: SheetAnalysis,
  request: SheetQuoteRequest,
  shopUtilization: number = DEFAULT_SHOP_LOAD
): Result<SheetQuoteResult, AppError> {
  const { materialId, thicknessMm: t, finishType, quantity, turnaround } = request;

  const material = getSheetMaterial(materialId);
  if (!material) {
    return invalid(ErrorCode.INVALID_MATERIAL, 'This material is quoted by our engineers.', { materialId });
  }
  if (!material.finishes.includes(finishType)) {
    return invalid(ErrorCode.INVALID_FINISH, `Finish "${finishType}" not available for ${material.name}`, {
      materialId,
      finishType,
    });
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return invalid(ErrorCode.INVALID_QUANTITY, `Quantity must be a positive whole number, got ${quantity}`, {
      quantity,
    });
  }
  const tableSpeed = cutSpeedMmMin(material.family, t);
  if (tableSpeed === null) {
    return err(
      new AppError({
        code: ErrorCode.INVALID_THICKNESS,
        message: `Laser cutting ${t} mm ${material.name} is quoted by our engineers.`,
        statusCode: 422,
        context: { materialId, thicknessMm: t },
      })
    );
  }

  // ── Manufacturability ──
  const dfm: DFMIssue[] = [];
  const dims = [analysis.boundingBox.x, analysis.boundingBox.y, analysis.boundingBox.z].sort((a, b) => b - a);
  const longest = dims[0];

  // A DXF profile has no thickness of its own to disagree with.
  if (!analysis.profileOnly && Math.abs(analysis.thicknessMm - t) > THICKNESS_MISMATCH_MM) {
    dfm.push(
      issue(
        'THICKNESS_MISMATCH',
        `Your model is ${analysis.thicknessMm} mm thick but ${t} mm sheet is selected — priced at ${t} mm.`,
        'Pick the sheet thickness that matches your model, or update the model.',
        false
      )
    );
  }
  if (analysis.bodyCount > 1) {
    dfm.push(
      issue(
        'MULTIPLE_BODIES',
        `File contains ${analysis.bodyCount} separate bodies; only the largest was priced.`,
        'Upload each part as its own file.',
        false
      )
    );
  }
  const fitsSheet = analysis.isFlat
    ? dims[0] <= material.sheetMm.long && dims[1] <= material.sheetMm.short
    : analysis.flatAreaMm2 <= material.sheetMm.long * material.sheetMm.short * 0.9;
  if (!fitsSheet) {
    dfm.push(
      issue(
        'PART_TOO_LARGE',
        `The blank is larger than a standard ${material.sheetMm.long} × ${material.sheetMm.short} mm sheet.`,
        'Split the part or ask our engineers about a welded assembly.',
        true
      )
    );
  }

  const bendCount = analysis.bends.length;
  if (bendCount > 0) {
    if (material.maxBendThicknessMm === null) {
      dfm.push(
        issue('NOT_BENDABLE', `${material.name} can't be bent.`, 'Choose a bendable material such as Al 5052 or CRCA mild steel.', true)
      );
    } else if (t > material.maxBendThicknessMm) {
      dfm.push(
        issue(
          'TOO_THICK_TO_BEND',
          `${t} mm ${material.name} is thicker than our ${material.maxBendThicknessMm} mm bending limit.`,
          `Use ${material.maxBendThicknessMm} mm or thinner sheet.`,
          true
        )
      );
    }
    const longBend = analysis.bends.find((b) => b.lengthMm > R.maxBendLineMm);
    if (longBend) {
      dfm.push(
        issue(
          'BEND_TOO_LONG',
          `A ${Math.round(longBend.lengthMm)} mm bend is longer than our ${R.maxBendLineMm} mm press brake.`,
          'Shorten the bend or split the part.',
          true
        )
      );
    }
    if (!request.bendingSelected) {
      dfm.push(
        issue(
          'BENDING_INCLUDED',
          `Bending included — your model has ${bendCount} bend${bendCount === 1 ? '' : 's'}.`,
          'Bent parts are cut flat and then formed on a press brake.',
          false
        )
      );
    }
  }

  // ── Material: blank + nesting scrap ──
  const blankArea = Math.max(
    analysis.flatAreaMm2,
    analysis.isFlat ? dims[0] * dims[1] : analysis.flatAreaMm2 / R.bentRectangularity
  );
  const grossArea = blankArea / nestingEfficiency(quantity);
  const massKg = (grossArea * t * material.densityGCm3) / 1e6;
  const materialCost = massKg * material.pricePerKg;

  // ── Laser cutting ──
  const learning = sheetLearningFactor(quantity);
  const effectiveSpeed = tableSpeed * R.cornerFactor;
  const pierceS = analysis.pierces * (pierceTimeS(material.family, t) + R.rapidSPerPierce);
  const cutTimeMin = analysis.cutLengthMm / effectiveSpeed + (pierceS + R.handlingSPerPart) / 60;
  const cutCost = (cutTimeMin / 60) * laserRatePerHour(material.family) * learning;
  const laserSetupCost = R.laserJobSetup / quantity;

  // ── Bending ──
  let bendingCost = 0;
  let bendTimeMin = 0;
  if (bendCount > 0) {
    const persons = longest > R.twoPersonLengthMm ? 2 : 1;
    bendTimeMin = (R.bendHandlingMin + R.bendPerHitMin * bendCount) * (1 + longest / 1000) * persons;
    const setupMin = R.bendSetupBaseMin + R.bendSetupPerBendMin * bendCount;
    bendingCost =
      (bendTimeMin / 60) * R.pressBrakePerHour * learning + ((setupMin / 60) * R.pressBrakePerHour) / quantity;
  }

  // ── Tapping ──
  let tappingCost = 0;
  let tappedHoles = 0;
  if (request.taps && request.taps.length > 0) {
    if (!material.tapGroup) {
      return invalid(ErrorCode.INVALID_INPUT, `Threads can't be tapped in ${material.name}.`, { materialId });
    }
    const tapping = calcTappingCost(sheetTapHoles(analysis, t), request.taps, material.tapGroup, R.tappingPerHour);
    if (!tapping.success) return err(tapping.error);
    tappingCost = tapping.data.machineCostPerPart * learning + tapping.data.wearCostPerPart;
    tappedHoles = tapping.data.holes;

    for (const req of request.taps) {
      const tap = findTap(req.tapId);
      if (tap && t / tapPitchMm(tap) < MIN_ENGAGED_THREADS) {
        dfm.push(
          issue(
            'THIN_THREAD',
            `${tap.name} in ${t} mm sheet engages only ${(t / tapPitchMm(tap)).toFixed(1)} threads.`,
            'Use a self-clinching (PEM) nut or rivet nut for a strong thread.',
            false
          )
        );
      }
    }
  }

  const finishCost = calcBatchFinishCost(2 * analysis.flatAreaMm2, finishType, quantity);

  // ── Price ──
  // Parts are priced from cost; the order minimum (scaled by turnaround, so Economy
  // and Rush still apply) covers the cut job. Bends, threads and the finish are added
  // on top, so each of them shows in the price even on a minimum-priced order.
  const rushMultiplier = calcRushMultiplier(turnaround, shopUtilization);
  const markup = rushMultiplier * (1 + R.marginPct);
  const partPrice = (materialCost + cutCost + laserSetupCost) * markup;
  const totalPrice =
    Math.max(partPrice * quantity, R.minOrderLine * rushMultiplier) +
    (bendingCost + tappingCost + finishCost) * markup * quantity;
  const pricePerPart = totalPrice / quantity;

  const breakdown: SheetQuoteBreakdown = {
    materialCost: round2(materialCost),
    cutCost: round2(cutCost),
    laserSetupCost: round2(laserSetupCost),
    bendingCost: round2(bendingCost),
    tappingCost: round2(tappingCost),
    tappedHoles,
    finishCost: round2(finishCost),
    cutTimeMin: round2(cutTimeMin),
    bendCount,
    bendTimeMin: round2(bendTimeMin),
    sheetUtilisation: Math.round((analysis.flatAreaMm2 / grossArea) * 1000) / 1000,
    quantityMultiplier: Math.round(learning * 10000) / 10000,
    rushMultiplier: Math.round(rushMultiplier * 10000) / 10000,
    marginPct: R.marginPct,
  };

  return ok({
    kind: 'sheet',
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

/** Tier table re-priced at each quantity (setup and nesting change with the batch) */
export function getSheetTierTable(
  analysis: SheetAnalysis,
  request: SheetQuoteRequest,
  shopUtilization: number = DEFAULT_SHOP_LOAD
): readonly QuantityTier[] {
  const tiers: { quantity: number; pricePerPart: number; totalPrice: number }[] = [];
  for (const quantity of TIER_QUANTITIES) {
    const result = generateSheetQuote(analysis, { ...request, quantity }, shopUtilization);
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
