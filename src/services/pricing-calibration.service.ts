import { PartRepository } from '@/repositories/part.repository';
import { PricingCalibrationRepository } from '@/repositories/pricing-calibration.repository';
import {
  buildCalibrationReport,
  findApplicableGroup,
  samplesFromParts,
  storedOverride,
  SHOP_LOAD_KEY,
  type CalibrationChange,
  type CalibrationConfig,
  type CalibrationReport,
} from '@/lib/quoting/pricing-calibration';
import { DEFAULT_SHOP_LOAD } from '@/lib/quoting/pricing-engine';
import { Result, ok, err } from '@/utils/result';
import { AppError, ErrorCode, notFoundError } from '@/utils/errors';

// ═══════════════════════════════════════════════════
// PricingCalibrationService — report, apply and revert for admins.
// Every decision is re-made here from the stored parts, settings and log;
// the browser only names the group.
// ═══════════════════════════════════════════════════

const rejected = (message: string) =>
  err(new AppError({ code: ErrorCode.VALIDATION_FAILED, message, statusCode: 409 }));

async function load(now: number) {
  const [parts, config, changes] = await Promise.all([
    PartRepository.getInstantPricedParts(),
    PricingCalibrationRepository.getVersionedConfig(),
    PricingCalibrationRepository.listChanges(),
  ]);
  if (!parts.success) return err(parts.error);
  if (!config.success) return err(config.error);
  if (!changes.success) return err(changes.error);
  const report = buildCalibrationReport(samplesFromParts(parts.data), {
    config: config.data,
    changes: changes.data,
    now,
  });
  return ok({ report, config: config.data, changes: changes.data });
}

/** Effective multiplier of a group key under a config */
function effective(config: CalibrationConfig, key: string): number {
  const [service] = key.split(' · ');
  return config.multipliers[key] ?? config.multipliers[service] ?? 1;
}

export const PricingCalibrationService = {
  async getReport(now: number = Date.now()): Promise<Result<CalibrationReport, AppError>> {
    const loaded = await load(now);
    return loaded.success ? ok(loaded.data.report) : loaded;
  },

  /** Moves a service or material multiplier to the report's proposal, within every safety limit */
  async apply(key: string, adminId: string, now: number = Date.now()): Promise<Result<CalibrationChange, AppError>> {
    const loaded = await load(now);
    if (!loaded.success) return loaded;
    const { report, config } = loaded.data;

    const group = findApplicableGroup(report, key);
    if (!group) return err(notFoundError('Calibration group', key));
    if (!group.canApply || group.proposedMultiplier === null) {
      return rejected(group.blockedReason ?? 'This group cannot be adjusted right now.');
    }

    return PricingCalibrationRepository.recordChange(
      {
        key,
        action: 'apply',
        from: group.currentMultiplier,
        to: group.proposedMultiplier,
        previous: storedOverride(config, key),
        next: group.proposedMultiplier,
        samples: group.samples,
        targetMultiplier: group.targetMultiplier,
        appliedBy: adminId,
        appliedAt: new Date(now).toISOString(),
      },
      config.version
    );
  },

  /** Sets the shop load (0–1) that drives Rush / Same-day surge pricing, and logs it */
  async setShopLoad(load: number, adminId: string, now: number = Date.now()): Promise<Result<CalibrationChange, AppError>> {
    if (!Number.isFinite(load) || load < 0 || load > 1) return rejected('Shop load must be between 0% and 100%.');
    const config = await PricingCalibrationRepository.getVersionedConfig();
    if (!config.success) return config;
    const previous = config.data.shopLoad ?? null;
    const next = Math.round(load * 100) / 100;
    // Compare with the load in effect (the default while unset), so no-op changes aren't logged
    if ((previous ?? DEFAULT_SHOP_LOAD) === next) return rejected(`Shop load is already ${Math.round(next * 100)}%.`);

    return PricingCalibrationRepository.recordChange(
      {
        key: SHOP_LOAD_KEY,
        action: 'shop_load',
        from: previous ?? DEFAULT_SHOP_LOAD,
        to: next,
        previous,
        next,
        samples: 0,
        targetMultiplier: null,
        appliedBy: adminId,
        appliedAt: new Date(now).toISOString(),
      },
      config.data.version
    );
  },

  /** Undoes the latest change to a group, restoring exactly what was stored before it */
  async revert(key: string, adminId: string, now: number = Date.now()): Promise<Result<CalibrationChange, AppError>> {
    const loaded = await load(now);
    if (!loaded.success) return loaded;
    const { config, changes } = loaded.data;

    const latest = changes.filter((c) => c.key === key).sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))[0];
    if (!latest || latest.action !== 'apply') return rejected('There is no applied correction to undo for this group.');

    const after: CalibrationConfig = {
      multipliers: (() => {
        const m = { ...config.multipliers };
        if (latest.previous === null) delete m[key];
        else m[key] = latest.previous;
        return m;
      })(),
    };

    return PricingCalibrationRepository.recordChange(
      {
        key,
        action: 'revert',
        from: effective(config, key),
        to: effective(after, key),
        previous: storedOverride(config, key),
        next: latest.previous,
        samples: latest.samples,
        targetMultiplier: null,
        appliedBy: adminId,
        appliedAt: new Date(now).toISOString(),
      },
      config.version
    );
  },
};
