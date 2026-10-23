import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { Result, ok, err } from '@/utils/result';
import { AppError, ErrorCode, internalError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import {
  MULTIPLIER_BOUNDS,
  NO_CALIBRATION,
  type CalibrationChange,
  type CalibrationConfig,
} from '@/lib/quoting/pricing-calibration';

// ═══════════════════════════════════════════════════
// PricingCalibrationRepository — admin-applied price multipliers (Admin SDK)
//   pricingCalibration/config   { multipliers, shopLoad, version, updatedAt, updatedBy }
//   pricingCalibrationLog/{id}  one CalibrationChange per apply / revert / shop-load change
// Pricing never fails because of this: unreadable settings price at 1.00.
// ═══════════════════════════════════════════════════

const CONFIG_COLLECTION = 'pricingCalibration';
const CONFIG_DOC = 'config';
const LOG_COLLECTION = 'pricingCalibrationLog';
/** Quotes re-read the multipliers at most this often per server instance */
const CACHE_MS = 30_000;

export interface VersionedCalibrationConfig extends CalibrationConfig {
  readonly version: number;
}

let cache: { config: CalibrationConfig; at: number } | null = null;

/** Only sane multipliers count; anything else (hand edits, bad data) prices at 1.00 */
function sanitise(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const m = Number(value);
    if (Number.isFinite(m) && m >= MULTIPLIER_BOUNDS.min && m <= MULTIPLIER_BOUNDS.max) out[key] = m;
  }
  return out;
}

/** A shop load is a share 0–1; anything else counts as unset (the engines' default) */
function sanitiseShopLoad(raw: unknown): number | undefined {
  const load = Number(raw);
  return raw !== null && raw !== undefined && Number.isFinite(load) && load >= 0 && load <= 1 ? load : undefined;
}

const configFrom = (data: Record<string, unknown> | null | undefined): CalibrationConfig => {
  const shopLoad = sanitiseShopLoad(data?.shopLoad);
  return { multipliers: sanitise(data?.multipliers), ...(shopLoad === undefined ? {} : { shopLoad }) };
};

function db() {
  const { adminFirestore } = getFirebaseAdmin();
  if (!adminFirestore) throw new Error('Firestore Admin not initialized');
  return adminFirestore;
}

export const PricingCalibrationRepository = {
  /** Multipliers for pricing — cached, and never an error (falls back to no corrections) */
  async getConfig(now: number = Date.now()): Promise<CalibrationConfig> {
    if (cache && now - cache.at < CACHE_MS) return cache.config;
    const fresh = await PricingCalibrationRepository.getVersionedConfig();
    if (!fresh.success) return cache?.config ?? NO_CALIBRATION;
    const { version: _version, ...config } = fresh.data;
    cache = { config, at: now };
    return cache.config;
  },

  /** Uncached, with the version an update must match */
  async getVersionedConfig(): Promise<Result<VersionedCalibrationConfig, AppError>> {
    try {
      const snap = await db().collection(CONFIG_COLLECTION).doc(CONFIG_DOC).get();
      const data = snap.exists ? snap.data() : null;
      return ok({ ...configFrom(data), version: Number(data?.version) || 0 });
    } catch (e: any) {
      logger.error({ event: 'PricingCalibration: config read failed', error: e?.message });
      return err(internalError('Could not read pricing calibration'));
    }
  },

  /** Newest first */
  async listChanges(limit = 100): Promise<Result<CalibrationChange[], AppError>> {
    try {
      const snap = await db().collection(LOG_COLLECTION).orderBy('appliedAt', 'desc').limit(limit).get();
      return ok(snap.docs.map((d: { data: () => CalibrationChange }) => d.data()));
    } catch (e: any) {
      logger.error({ event: 'PricingCalibration: log read failed', error: e?.message });
      return err(internalError('Could not read the calibration log'));
    }
  },

  /**
   * Sets one multiplier and logs the change atomically. Fails with 409 if the
   * settings changed since `expectedVersion` was read (another admin acted).
   */
  async recordChange(
    change: Omit<CalibrationChange, 'id'>,
    expectedVersion: number
  ): Promise<Result<CalibrationChange, AppError>> {
    try {
      const firestore = db();
      const configRef = firestore.collection(CONFIG_COLLECTION).doc(CONFIG_DOC);
      const logRef = firestore.collection(LOG_COLLECTION).doc();
      const saved: CalibrationChange = { ...change, id: logRef.id };

      const conflict = await firestore.runTransaction(async (tx: any) => {
        const snap = await tx.get(configRef);
        const data = snap.exists ? snap.data() : null;
        if ((Number(data?.version) || 0) !== expectedVersion) return true;
        const current = configFrom(data);
        const multipliers = { ...current.multipliers };
        let shopLoad = current.shopLoad ?? null;
        if (change.action === 'shop_load') shopLoad = change.next;
        else if (change.next === null) delete multipliers[change.key];
        else multipliers[change.key] = change.next;
        tx.set(configRef, {
          multipliers,
          shopLoad,
          version: expectedVersion + 1,
          updatedAt: change.appliedAt,
          updatedBy: change.appliedBy,
        });
        tx.set(logRef, saved);
        return false;
      });

      if (conflict) {
        return err(
          new AppError({
            code: ErrorCode.VALIDATION_FAILED,
            message: 'Pricing calibration changed while you were looking. Refresh and try again.',
            statusCode: 409,
          })
        );
      }
      cache = null;
      logger.info({ event: 'PricingCalibration: change recorded', key: change.key, action: change.action, to: change.to });
      return ok(saved);
    } catch (e: any) {
      logger.error({ event: 'PricingCalibration: change failed', error: e?.message, key: change.key });
      return err(internalError('Could not save the pricing calibration'));
    }
  },

  /** Test hook: forget cached multipliers */
  clearCache(): void {
    cache = null;
  },
};
