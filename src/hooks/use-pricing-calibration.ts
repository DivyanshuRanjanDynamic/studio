'use client';

// ═══════════════════════════════════════════════════
// use-pricing-calibration — admin-applied price multipliers and shop load for live prices
// Fetched once per page load and shared; until it arrives (or if it fails) the
// browser prices at 1.00 and the server's quote of record is still correct.
// ═══════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { bearerHeader } from '@/lib/auth-header';
import { NO_CALIBRATION, type CalibrationConfig } from '@/lib/quoting/pricing-calibration';

let shared: Promise<CalibrationConfig> | null = null;

async function fetchCalibration(): Promise<CalibrationConfig> {
  try {
    const res = await fetch('/api/v1/quote/calibration', { headers: await bearerHeader() });
    if (!res.ok) return NO_CALIBRATION;
    const body = (await res.json()) as { multipliers?: Record<string, unknown>; shopLoad?: unknown };
    const multipliers: Record<string, number> = {};
    for (const [key, value] of Object.entries(body.multipliers ?? {})) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) multipliers[key] = value;
    }
    const load = body.shopLoad;
    const shopLoad = typeof load === 'number' && Number.isFinite(load) && load >= 0 && load <= 1 ? load : undefined;
    return { multipliers, ...(shopLoad === undefined ? {} : { shopLoad }) };
  } catch {
    return NO_CALIBRATION;
  }
}

export function usePricingCalibration(): CalibrationConfig {
  const [config, setConfig] = useState<CalibrationConfig>(NO_CALIBRATION);
  useEffect(() => {
    let cancelled = false;
    if (!shared) shared = fetchCalibration();
    shared.then((c) => {
      if (!cancelled) setConfig(c);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return config;
}

/** Test hook: forget the shared fetch */
export function resetPricingCalibrationCache(): void {
  shared = null;
}
