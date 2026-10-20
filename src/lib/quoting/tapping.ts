// ═══════════════════════════════════════════════════
// Tapping — which holes can be threaded, and what threading them costs
//
// A hole is a tap candidate when its diameter matches a standard tap drill
// (ALL_TAPS in config/manufacturing). Pricing never trusts the client's hole
// data: requested taps are matched against the server-side CNC analysis's
// hole groups, which also supply the thread depth.
// ═══════════════════════════════════════════════════

import { ALL_TAPS, type TapStandard } from '@/config/manufacturing';
import type {
  CncAnalysis,
  CncHoleGroup,
  CncProcess,
  CncShopRates,
  CncTapRequest,
  MachinabilityGroup,
} from '@/types/quoting';
import type { HoleFeature } from '@/types/viewer';
import { Result, ok, err } from '@/utils/result';
import { AppError, ErrorCode } from '@/utils/errors';

/** Same tolerance the tapping UI has always used to recommend threads */
export const TAP_DRILL_TOLERANCE_MM = 0.45;

/** Rigid tapping cutting speed (m/min) per material family — conservative shop values */
const TAP_CUTTING_SPEED_M_MIN: Readonly<Record<MachinabilityGroup, number>> = {
  aluminium: 25,
  brass: 20,
  copper: 15,
  plastic: 25,
  mild_steel: 12,
  alloy_steel: 8,
  stainless: 6,
};

/** Tap wear multiplier per material family (harder material → more taps consumed) */
const TAP_WEAR_FACTOR: Readonly<Record<MachinabilityGroup, number>> = {
  aluminium: 1,
  brass: 1,
  copper: 1.1,
  plastic: 0.8,
  mild_steel: 1.3,
  alloy_steel: 1.8,
  stainless: 2.5,
};

const MAX_RIGID_TAP_RPM = 2000;
const TAP_POSITION_MIN = 0.1; // rapid to hole, peck clearance, dwell
const TAP_TOOL_CHANGE_MIN = 0.25; // per distinct thread size per part
const MAX_THREAD_DEPTH_DIAMETERS = 3; // deeper than 3×D adds no strength

export interface TapCandidate {
  readonly holeIndex: number;
  readonly diameterMm: number;
  readonly depthMm: number;
  readonly center: HoleFeature['center'];
  readonly normal: HoleFeature['normal'];
  /** Closest standard tap (metric preferred on ties) */
  readonly suggestedTapId: string;
  /** Every standard tap whose drill size matches this hole */
  readonly matchingTapIds: readonly string[];
}

export interface TappingCost {
  /** Machine time at the process rate — subject to the batch learning curve */
  readonly machineCostPerPart: number;
  /** Taps consumed — not reduced by quantity */
  readonly wearCostPerPart: number;
  readonly minutesPerPart: number;
  readonly holes: number;
}

export function findTap(tapId: string): TapStandard | undefined {
  return ALL_TAPS.find((t) => t.id === tapId);
}

/** Thread pitch in mm: metric taps carry it; imperial ids end in TPI ("1/4-20"). */
export function tapPitchMm(tap: TapStandard): number {
  if (tap.pitch) return tap.pitch;
  const tpi = Number(tap.id.split('-').pop());
  return Number.isFinite(tpi) && tpi > 0 ? 25.4 / tpi : 1;
}

/** Nominal (major) diameter ≈ tap drill + pitch (exact for ISO coarse threads). */
export function tapMajorDiameterMm(tap: TapStandard): number {
  return tap.drillSize + tapPitchMm(tap);
}

function matchingTaps(diameterMm: number): TapStandard[] {
  return ALL_TAPS.filter((t) => Math.abs(t.drillSize - diameterMm) <= TAP_DRILL_TOLERANCE_MM).sort(
    (a, b) =>
      Math.abs(a.drillSize - diameterMm) - Math.abs(b.drillSize - diameterMm) ||
      Number(Boolean(a.isInch)) - Number(Boolean(b.isInch))
  );
}

/** Holes from the 3D preview that a standard tap could thread (for highlighting). */
export function findTapCandidates(holes: readonly HoleFeature[] | undefined): TapCandidate[] {
  return (holes ?? []).flatMap((hole, holeIndex) => {
    const diameterMm = hole.radius * 2;
    const taps = matchingTaps(diameterMm);
    if (taps.length === 0) return [];
    return [
      {
        holeIndex,
        diameterMm,
        depthMm: hole.depth,
        center: hole.center,
        normal: hole.normal,
        suggestedTapId: taps[0].id,
        matchingTapIds: taps.map((t) => t.id),
      },
    ];
  });
}

/**
 * Per-part tapping cost for the requested threads, checked against the analysis:
 * each tap must match an analysed hole group, and no more holes than exist.
 */
export function calcCncTappingCost(
  analysis: CncAnalysis,
  taps: readonly CncTapRequest[] | undefined,
  group: MachinabilityGroup,
  process: CncProcess,
  rates: CncShopRates
): Result<TappingCost, AppError> {
  if (!taps || taps.length === 0) {
    return ok({ machineCostPerPart: 0, wearCostPerPart: 0, minutesPerPart: 0, holes: 0 });
  }

  // Holes still available per analysed group (two thread types may share a drill size).
  const remaining = new Map<CncHoleGroup, number>(analysis.features.holes.map((h) => [h, h.count]));
  const rate = rates.machineRatePerHour[process];
  const vc = TAP_CUTTING_SPEED_M_MIN[group];
  const wear = TAP_WEAR_FACTOR[group];

  let minutes = 0;
  let wearCost = 0;
  let holes = 0;
  const sizes = new Set<string>();

  for (const request of taps) {
    const tap = findTap(request.tapId);
    if (!tap) {
      return err(
        new AppError({
          code: ErrorCode.INVALID_INPUT,
          message: `Unknown thread: ${request.tapId}`,
          statusCode: 400,
          context: { tapId: request.tapId },
        })
      );
    }
    if (!Number.isInteger(request.count) || request.count < 1) {
      return err(
        new AppError({
          code: ErrorCode.INVALID_INPUT,
          message: `Invalid number of ${tap.name} holes: ${request.count}`,
          statusCode: 400,
          context: { tapId: tap.id, count: request.count },
        })
      );
    }

    const pitch = tapPitchMm(tap);
    const major = tapMajorDiameterMm(tap);
    const rpm = Math.min((vc * 1000) / (Math.PI * major), MAX_RIGID_TAP_RPM);

    let toPlace = request.count;
    const groupsForTap = [...remaining.keys()]
      .filter((h) => Math.abs(h.diameterMm - tap.drillSize) <= TAP_DRILL_TOLERANCE_MM)
      .sort((a, b) => Math.abs(a.diameterMm - tap.drillSize) - Math.abs(b.diameterMm - tap.drillSize));

    for (const hole of groupsForTap) {
      const take = Math.min(toPlace, remaining.get(hole) ?? 0);
      if (take === 0) continue;
      remaining.set(hole, (remaining.get(hole) ?? 0) - take);
      toPlace -= take;

      const threadDepth = Math.min(hole.depthMm, MAX_THREAD_DEPTH_DIAMETERS * major);
      const perHoleMin = TAP_POSITION_MIN + (2 * threadDepth) / (rpm * pitch); // feed in + reverse out
      minutes += perHoleMin * take;
      wearCost += (4 + 0.8 * major) * wear * take;
      holes += take;
      if (toPlace === 0) break;
    }

    if (toPlace > 0) {
      const available = request.count - toPlace;
      return err(
        new AppError({
          code: ErrorCode.INVALID_INPUT,
          message: `Only ${available} hole${available === 1 ? '' : 's'} on this part match the ${tap.name} tap drill (Ø${tap.drillSize} mm).`,
          statusCode: 400,
          context: { tapId: tap.id, requested: request.count, available },
        })
      );
    }
    sizes.add(tap.id);
  }

  minutes += sizes.size * TAP_TOOL_CHANGE_MIN;
  return ok({ machineCostPerPart: (minutes / 60) * rate, wearCostPerPart: wearCost, minutesPerPart: minutes, holes });
}
