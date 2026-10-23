// ═══════════════════════════════════════════════════
// pricing-calibration — instant prices vs engineers' prices, and the
// correction multipliers admins apply from them
//
// The rate cards (material-prices.ts, sheet-rates.ts, cnc-materials.ts,
// print-rates.ts, and the converter's machinability table) are shop defaults.
// Every part an engineer has quoted carries both the instant price it was added
// with and the admin-agreed unit price, so the gap between them is direct
// evidence of where the rates are off.
//
// A correction is a multiplier on the final instant price, set per service
// ('sheet') or per material ('sheet · ms-crca'; it wins over the service's).
// Every quote records the multiplier it was priced with, so the report judges
// each sample against the price it was actually given and never double-counts
// a correction. Applying is limited: enough samples, a capped step, absolute
// bounds and a cooldown. Pure functions; storage lives in the repository.
// ═══════════════════════════════════════════════════

import type { MechanicalPart } from '@/models/project.model';
import type { QuantityTier } from '@/types/quoting';

export type CalibrationService = 'cnc' | 'sheet' | 'print';
export type CalibrationView = 'service' | 'material' | 'quantity';

export interface CalibrationSample {
  readonly service: CalibrationService;
  readonly materialId: string;
  readonly quantity: number;
  readonly instantPricePerPart: number;
  readonly agreedPricePerPart: number;
  /** Correction multiplier the instant price already included (1 before corrections existed) */
  readonly multiplierAtPricing: number;
}

/** Multipliers by key: 'sheet' (service) or 'sheet · ms-crca' (material). Missing = 1.00 */
export interface CalibrationConfig {
  readonly multipliers: Readonly<Record<string, number>>;
  /** Admin-set shop load (0–1) for Rush / Same-day surge; absent = the engines' default */
  readonly shopLoad?: number;
}

/** Log key for shop-load changes */
export const SHOP_LOAD_KEY = 'shop_load';

export interface CalibrationChange {
  readonly id: string;
  /** Group key, e.g. 'sheet' or 'cnc · al_6061'; SHOP_LOAD_KEY for shop-load changes */
  readonly key: string;
  readonly action: 'apply' | 'revert' | 'shop_load';
  /** Effective multiplier (or shop load, 0–1) before and after */
  readonly from: number;
  readonly to: number;
  /** Stored override before / after (null = none, falls back to the service or 1.00) — revert restores `previous` */
  readonly previous: number | null;
  readonly next: number | null;
  /** Evidence at the time of an apply */
  readonly samples: number;
  readonly targetMultiplier: number | null;
  readonly appliedBy: string;
  readonly appliedAt: string;
}

export type CalibrationVerdict = 'insufficient_data' | 'on_target' | 'adjust';

export interface CalibrationGroup {
  readonly key: string;
  readonly view: CalibrationView;
  readonly samples: number;
  /** Median of agreed ÷ instant, as the parts were priced: 1.10 = engineers charged 10% more */
  readonly medianRatio: number;
  /** Mean of |agreed − instant| ÷ agreed */
  readonly meanAbsErrorPct: number;
  /** Multiplier in force for this group now */
  readonly currentMultiplier: number;
  /** Multiplier that would have matched the engineers (median, 2 dp) */
  readonly targetMultiplier: number;
  readonly verdict: CalibrationVerdict;
  /** What Apply would set, after the step cap and bounds; null when nothing can be applied */
  readonly proposedMultiplier: number | null;
  readonly canApply: boolean;
  /** Why Apply is unavailable, in words for the admin */
  readonly blockedReason: string | null;
  /** The latest change to this group can be undone */
  readonly canRevert: boolean;
}

export interface CalibrationReport {
  readonly samples: number;
  readonly byService: readonly CalibrationGroup[];
  readonly byMaterial: readonly CalibrationGroup[];
  readonly byQuantity: readonly CalibrationGroup[];
  readonly multipliers: Readonly<Record<string, number>>;
  /** Admin-set shop load (0–1), or null while the default applies */
  readonly shopLoad: number | null;
  readonly changes: readonly CalibrationChange[];
}

export interface CalibrationContext {
  readonly config: CalibrationConfig;
  /** Newest first */
  readonly changes: readonly CalibrationChange[];
  readonly now: number;
}

export const NO_CALIBRATION: CalibrationConfig = { multipliers: {} };

/** Fewer engineer-priced parts than this in a group says nothing reliable */
export const MIN_SAMPLES = 5;
/** Applying a correction needs this many — enough for roughly ±8% confidence */
export const MIN_SAMPLES_TO_APPLY = 10;
/** Within this of the current multiplier, the group is left alone */
export const ON_TARGET_TOLERANCE = 0.05;
/** One change moves a multiplier by at most this share of its current value */
export const MAX_STEP = 0.15;
/** Multipliers never leave this range, however many changes are made */
export const MULTIPLIER_BOUNDS = { min: 0.7, max: 1.5 } as const;
/** A group can be changed again only after this long */
export const COOLDOWN_DAYS = 7;

const QUANTITY_BANDS: ReadonlyArray<readonly [string, number]> = [
  ['1 pc', 1],
  ['2–9 pcs', 9],
  ['10–49 pcs', 49],
  ['50+ pcs', Infinity],
];

const round = (n: number, places: number) => Math.round(n * 10 ** places) / 10 ** places;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function quantityBand(quantity: number): string {
  return QUANTITY_BANDS.find(([, max]) => quantity <= max)![0];
}

export const materialKey = (service: CalibrationService, materialId: string) => `${service} · ${materialId}`;

// ── Applying multipliers to prices ──

/** The multiplier for a part: its material's if set, else its service's, else 1.00 */
export function resolveMultiplier(config: CalibrationConfig, service: CalibrationService, materialId: string): number {
  return config.multipliers[materialKey(service, materialId)] ?? config.multipliers[service] ?? 1;
}

interface PricedQuote {
  readonly pricePerPart: number;
  readonly totalPrice: number;
  readonly parameters: { readonly quantity: number };
  readonly breakdown: object;
}

/**
 * The quote with its correction applied to the final price (order minimum included).
 * Cost lines stay as the engine computed them; breakdown.calibrationMultiplier records
 * the factor so the report can judge this price later.
 */
export function calibrateQuote<T extends PricedQuote>(quote: T, multiplier: number): T {
  if (multiplier === 1) return quote;
  const totalPrice = Math.round(quote.totalPrice * multiplier);
  return {
    ...quote,
    totalPrice,
    pricePerPart: Math.round(totalPrice / quote.parameters.quantity),
    breakdown: { ...quote.breakdown, calibrationMultiplier: multiplier },
  };
}

export function calibrateTiers(tiers: readonly QuantityTier[], multiplier: number): readonly QuantityTier[] {
  if (multiplier === 1) return tiers;
  return tiers.map((t) => ({
    ...t,
    pricePerPart: Math.round(t.pricePerPart * multiplier),
    totalPrice: Math.round(t.totalPrice * multiplier),
  }));
}

// ── Samples ──

/**
 * Engineer-priced parts that also have an instant price for the same quantity.
 * Parts whose quantity changed after the instant quote are skipped: the two
 * prices would describe different batches.
 */
export function samplesFromParts(parts: readonly MechanicalPart[]): CalibrationSample[] {
  return parts.flatMap((part) => {
    const q = part.instantQuote;
    const agreed = Number(part.unitCost);
    if (!q || !Number.isFinite(agreed) || agreed <= 0 || q.pricePerPart <= 0) return [];
    if (q.quantity !== part.quantity) return [];
    const applied = Number((q.breakdown as { calibrationMultiplier?: number } | undefined)?.calibrationMultiplier);
    return [
      {
        service: q.kind ?? 'cnc',
        materialId: q.materialId,
        quantity: q.quantity,
        instantPricePerPart: q.pricePerPart,
        agreedPricePerPart: agreed,
        multiplierAtPricing: Number.isFinite(applied) && applied > 0 ? applied : 1,
      },
    ];
  });
}

// ── Report ──

/** The multiplier in force for a group key ('sheet', 'sheet · ms-crca', or a batch-size key) */
function currentFor(key: string, view: CalibrationView, config: CalibrationConfig): number {
  if (view === 'service') return config.multipliers[key] ?? 1;
  if (view === 'material') {
    const [service] = key.split(' · ');
    return config.multipliers[key] ?? config.multipliers[service] ?? 1;
  }
  return 1;
}

/** Latest change per key */
function latestChange(changes: readonly CalibrationChange[], key: string): CalibrationChange | undefined {
  return changes.filter((c) => c.key === key).sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))[0];
}

/** What Apply would set from `current` towards `target`, within the step cap and bounds */
export function proposeMultiplier(current: number, target: number): number {
  const stepped = clamp(target, current * (1 - MAX_STEP), current * (1 + MAX_STEP));
  return round(clamp(stepped, MULTIPLIER_BOUNDS.min, MULTIPLIER_BOUNDS.max), 2);
}

function summarise(
  key: string,
  view: CalibrationView,
  group: readonly CalibrationSample[],
  ctx: CalibrationContext
): CalibrationGroup {
  const ratios = group.map((s) => s.agreedPricePerPart / s.instantPricePerPart);
  const errors = group.map((s) => Math.abs(s.agreedPricePerPart - s.instantPricePerPart) / s.agreedPricePerPart);
  const target = median(group.map((s) => (s.agreedPricePerPart / s.instantPricePerPart) * s.multiplierAtPricing));
  const current = currentFor(key, view, ctx.config);
  const gap = target / current - 1;

  const verdict: CalibrationVerdict =
    group.length < MIN_SAMPLES ? 'insufficient_data' : Math.abs(gap) <= ON_TARGET_TOLERANCE ? 'on_target' : 'adjust';

  const latest = latestChange(ctx.changes, key);
  const cooldownEnds = latest ? Date.parse(latest.appliedAt) + COOLDOWN_DAYS * 86_400_000 : 0;
  const proposed = proposeMultiplier(current, target);

  let blockedReason: string | null = null;
  if (view === 'quantity') blockedReason = 'Batch-size gaps point at setup cost or the quantity curve — adjust those by hand.';
  else if (verdict === 'insufficient_data') blockedReason = `Needs ${MIN_SAMPLES - group.length} more engineer-priced parts.`;
  else if (verdict === 'on_target') blockedReason = 'Already within ±5% of engineers.';
  else if (group.length < MIN_SAMPLES_TO_APPLY)
    blockedReason = `Applying needs ${MIN_SAMPLES_TO_APPLY} engineer-priced parts (${group.length} so far).`;
  else if (ctx.now < cooldownEnds)
    blockedReason = `Changed recently — can change again on ${new Date(cooldownEnds).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}.`;
  else if (proposed === round(current, 2)) blockedReason = `At the ${MULTIPLIER_BOUNDS.min}×–${MULTIPLIER_BOUNDS.max}× limit.`;

  const canApply = blockedReason === null;
  return {
    key,
    view,
    samples: group.length,
    medianRatio: round(median(ratios), 3),
    meanAbsErrorPct: round((errors.reduce((a, b) => a + b, 0) / group.length) * 100, 1),
    currentMultiplier: round(current, 2),
    targetMultiplier: round(target, 2),
    verdict,
    proposedMultiplier: canApply ? proposed : null,
    canApply,
    blockedReason,
    canRevert: view !== 'quantity' && latest?.action === 'apply',
  };
}

function groupBy(
  samples: readonly CalibrationSample[],
  view: CalibrationView,
  keyOf: (s: CalibrationSample) => string,
  ctx: CalibrationContext
): CalibrationGroup[] {
  const groups = new Map<string, CalibrationSample[]>();
  for (const s of samples) {
    const key = keyOf(s);
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }
  return [...groups]
    .map(([key, group]) => summarise(key, view, group, ctx))
    .sort((a, b) => b.samples - a.samples || a.key.localeCompare(b.key));
}

export function buildCalibrationReport(
  samples: readonly CalibrationSample[],
  ctx: CalibrationContext = { config: NO_CALIBRATION, changes: [], now: Date.now() }
): CalibrationReport {
  return {
    samples: samples.length,
    byService: groupBy(samples, 'service', (s) => s.service, ctx),
    byMaterial: groupBy(samples, 'material', (s) => materialKey(s.service, s.materialId), ctx),
    byQuantity: groupBy(samples, 'quantity', (s) => `${s.service} · ${quantityBand(s.quantity)}`, ctx),
    multipliers: ctx.config.multipliers,
    shopLoad: ctx.config.shopLoad ?? null,
    changes: ctx.changes,
  };
}

/** Finds a group in a report by key (service and material groups only — batch sizes can't be applied) */
export function findApplicableGroup(report: CalibrationReport, key: string): CalibrationGroup | undefined {
  return [...report.byService, ...report.byMaterial].find((g) => g.key === key);
}

/** The stored override a group key controls, before a change */
export function storedOverride(config: CalibrationConfig, key: string): number | null {
  return config.multipliers[key] ?? null;
}
