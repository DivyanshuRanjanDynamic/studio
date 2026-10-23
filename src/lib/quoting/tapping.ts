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
/**
 * Tap wear per hole is sized for a full-depth (3×D) thread and scales with the
 * length actually cut — a 2 mm sheet thread wears a tap far less. The floor
 * covers entry wear and breakage risk on very short threads.
 */
const MIN_WEAR_SHARE = 0.25;

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

/** An analysed group of identical holes, as tapping needs it */
export interface TapHole {
  readonly diameterMm: number;
  readonly depthMm: number;
  readonly count: number;
  readonly through?: boolean;
}

export interface TappableHoleGroup {
  /** Stable within one analysis — index into its hole groups */
  readonly key: string;
  readonly diameterMm: number;
  readonly depthMm: number;
  readonly through: boolean;
  readonly count: number;
  /** Threads whose tap drill matches, closest first (metric preferred on ties) */
  readonly tapIds: readonly string[];
}

/**
 * Hole groups in the server analysis that a standard tap fits. Built from the
 * same holes calcCncTappingCost checks, so a pick from this list always prices.
 */
export function findTappableHoleGroups(analysis: CncAnalysis | null | undefined): TappableHoleGroup[] {
  return findTappableHoles(analysis?.features.holes ?? []);
}

export function findTappableHoles(holeGroups: readonly TapHole[]): TappableHoleGroup[] {
  return holeGroups.flatMap((hole, i) => {
    const taps = matchingTaps(hole.diameterMm);
    if (taps.length === 0 || hole.count < 1) return [];
    return [
      {
        key: String(i),
        diameterMm: hole.diameterMm,
        depthMm: hole.depthMm,
        through: hole.through ?? true,
        count: hole.count,
        tapIds: taps.map((t) => t.id),
      },
    ];
  });
}

/** Per-group picks → one request line per thread size */
export function tapRequestsFromPicks(
  picks: Readonly<Record<string, { readonly tapId: string; readonly count: number }>>
): CncTapRequest[] {
  const counts = new Map<string, number>();
  for (const { tapId, count } of Object.values(picks)) {
    if (count > 0) counts.set(tapId, (counts.get(tapId) ?? 0) + count);
  }
  return [...counts].map(([tapId, count]) => ({ tapId, count }));
}

/**
 * Splits requested threads into what the analysed holes can take and what they can't,
 * allocating exactly as calcCncTappingCost does — so `fitted` always prices.
 * Used where picks come from the 3D preview, whose hole list can disagree with the analysis.
 */
export function fitTapsToAnalysis(
  analysis: CncAnalysis,
  taps: readonly CncTapRequest[] | undefined
): { fitted: CncTapRequest[]; unfitted: number } {
  return fitTapsToHoles(analysis.features.holes, taps);
}

export function fitTapsToHoles(
  holeGroups: readonly TapHole[],
  taps: readonly CncTapRequest[] | undefined
): { fitted: CncTapRequest[]; unfitted: number } {
  const remaining = new Map<TapHole, number>(holeGroups.map((h) => [h, h.count]));
  const fitted = new Map<string, number>();
  let unfitted = 0;

  for (const request of taps ?? []) {
    const tap = findTap(request.tapId);
    const wanted = Number.isInteger(request.count) && request.count > 0 ? request.count : 0;
    if (!tap) {
      unfitted += wanted;
      continue;
    }
    let toPlace = wanted;
    const groupsForTap = [...remaining.keys()]
      .filter((h) => Math.abs(h.diameterMm - tap.drillSize) <= TAP_DRILL_TOLERANCE_MM)
      .sort((a, b) => Math.abs(a.diameterMm - tap.drillSize) - Math.abs(b.diameterMm - tap.drillSize));
    for (const hole of groupsForTap) {
      const take = Math.min(toPlace, remaining.get(hole) ?? 0);
      if (take === 0) continue;
      remaining.set(hole, (remaining.get(hole) ?? 0) - take);
      toPlace -= take;
      if (toPlace === 0) break;
    }
    const placed = wanted - toPlace;
    if (placed > 0) fitted.set(tap.id, (fitted.get(tap.id) ?? 0) + placed);
    unfitted += toPlace;
  }

  return { fitted: [...fitted].map(([tapId, count]) => ({ tapId, count })), unfitted };
}

/**
 * The preview converter reports each cylindrical face, and CAD kernels often store a
 * drilled hole as two half-cylinders — so one hole shows up twice. Merge faces that
 * share an axis, radius and axial span into one hole centred on the axis.
 */
export function mergeCoaxialHoles(holes: readonly HoleFeature[] | undefined): HoleFeature[] {
  const merged: Array<HoleFeature & { members: number }> = [];
  for (const hole of holes ?? []) {
    const n = hole.normal;
    const match = merged.find((m) => {
      if (Math.abs(m.radius - hole.radius) > 0.01) return false;
      const dot = m.normal.x * n.x + m.normal.y * n.y + m.normal.z * n.z;
      if (Math.abs(dot) < 0.999) return false;
      const d = { x: hole.center.x - m.center.x, y: hole.center.y - m.center.y, z: hole.center.z - m.center.z };
      const axial = d.x * n.x + d.y * n.y + d.z * n.z;
      const perp = Math.hypot(d.x - axial * n.x, d.y - axial * n.y, d.z - axial * n.z);
      return perp <= 2 * hole.radius + 0.01 && Math.abs(axial) <= (m.depth + hole.depth) / 2 + 0.5;
    });
    if (!match) {
      merged.push({ ...hole, center: { ...hole.center }, members: 1 });
      continue;
    }
    const k = match.members;
    match.center = {
      x: (match.center.x * k + hole.center.x) / (k + 1),
      y: (match.center.y * k + hole.center.y) / (k + 1),
      z: (match.center.z * k + hole.center.z) / (k + 1),
    };
    match.depth = Math.max(match.depth, hole.depth);
    match.members = k + 1;
  }
  return merged.map(({ members: _members, ...hole }) => hole);
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
  return calcTappingCost(analysis.features.holes, taps, group, rates.machineRatePerHour[process]);
}

/**
 * Tapping cost for any analysed hole groups (CNC holes, or sheet holes whose depth
 * is the sheet thickness) at the given machine rate. Strict: every thread must
 * land on a matching hole.
 */
export function calcTappingCost(
  holeGroups: readonly TapHole[],
  taps: readonly CncTapRequest[] | undefined,
  group: MachinabilityGroup,
  ratePerHour: number
): Result<TappingCost, AppError> {
  if (!taps || taps.length === 0) {
    return ok({ machineCostPerPart: 0, wearCostPerPart: 0, minutesPerPart: 0, holes: 0 });
  }

  // Holes still available per analysed group (two thread types may share a drill size).
  const remaining = new Map<TapHole, number>(holeGroups.map((h) => [h, h.count]));
  const rate = ratePerHour;
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

      const fullDepth = MAX_THREAD_DEPTH_DIAMETERS * major;
      const threadDepth = Math.min(hole.depthMm, fullDepth);
      const perHoleMin = TAP_POSITION_MIN + (2 * threadDepth) / (rpm * pitch); // feed in + reverse out
      minutes += perHoleMin * take;
      const wearShare = Math.max(MIN_WEAR_SHARE, threadDepth / fullDepth);
      wearCost += (4 + 0.8 * major) * wear * wearShare * take;
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
