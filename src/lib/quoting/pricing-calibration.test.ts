import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { ok } from '@/utils/result';
import {
  COOLDOWN_DAYS,
  NO_CALIBRATION,
  buildCalibrationReport,
  calibrateQuote,
  calibrateTiers,
  proposeMultiplier,
  resolveMultiplier,
  samplesFromParts,
  type CalibrationChange,
  type CalibrationContext,
  type CalibrationSample,
} from './pricing-calibration';
import type { MechanicalPart } from '@/models/project.model';

// ═══════════════════════════════════════════════════
// Pricing calibration: engineer-agreed prices vs instant prices, and the
// admin-applied correction multipliers with their safety limits
// ═══════════════════════════════════════════════════

const authenticateRequest = vi.fn();
const getInstantPricedParts = vi.fn();
const getVersionedConfig = vi.fn();
const listChanges = vi.fn();
const recordChange = vi.fn();
vi.mock('@/lib/auth-middleware', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth-middleware')>()),
  authenticateRequest: (...a: unknown[]) => authenticateRequest(...a),
}));
vi.mock('@/repositories/part.repository', () => ({
  PartRepository: { getInstantPricedParts: (...a: unknown[]) => getInstantPricedParts(...a) },
}));
vi.mock('@/repositories/pricing-calibration.repository', () => ({
  PricingCalibrationRepository: {
    getVersionedConfig: (...a: unknown[]) => getVersionedConfig(...a),
    listChanges: (...a: unknown[]) => listChanges(...a),
    recordChange: (...a: unknown[]) => recordChange(...a),
    getConfig: async () => NO_CALIBRATION,
  },
}));

beforeEach(() => {
  for (const f of [authenticateRequest, getInstantPricedParts, getVersionedConfig, listChanges, recordChange]) f.mockReset();
  getVersionedConfig.mockResolvedValue(ok({ multipliers: {}, version: 0 }));
  listChanges.mockResolvedValue(ok([]));
  recordChange.mockImplementation(async (c: Omit<CalibrationChange, 'id'>) => ok({ ...c, id: 'log_1' }));
});

const NOW = Date.parse('2026-10-23T10:00:00Z');

const sample = (overrides: Partial<CalibrationSample>): CalibrationSample => ({
  service: 'sheet',
  materialId: 'ms-crca',
  quantity: 10,
  instantPricePerPart: 100,
  agreedPricePerPart: 100,
  multiplierAtPricing: 1,
  ...overrides,
});
const many = (n: number, overrides: Partial<CalibrationSample>) => Array.from({ length: n }, () => sample(overrides));
const ctx = (overrides: Partial<CalibrationContext> = {}): CalibrationContext => ({
  config: NO_CALIBRATION,
  changes: [],
  now: NOW,
  ...overrides,
});
const change = (overrides: Partial<CalibrationChange>): CalibrationChange => ({
  id: 'c1',
  key: 'sheet',
  action: 'apply',
  from: 1,
  to: 1.1,
  previous: null,
  next: 1.1,
  samples: 12,
  targetMultiplier: 1.2,
  appliedBy: 'admin@mechhub.in',
  appliedAt: new Date(NOW - 86_400_000).toISOString(),
  ...overrides,
});

function part(overrides: Partial<MechanicalPart> & { instant?: Record<string, unknown> | null }): MechanicalPart {
  const { instant, ...rest } = overrides;
  return {
    id: 'p1',
    quantity: 10,
    unitCost: 120,
    instantQuote:
      instant === null
        ? null
        : { kind: 'sheet', materialId: 'ms-crca', quantity: 10, pricePerPart: 100, breakdown: {}, ...(instant ?? {}) },
    ...rest,
  } as unknown as MechanicalPart;
}

describe('samplesFromParts', () => {
  it('pairs the agreed unit price with the instant price, and the multiplier that price included', () => {
    expect(samplesFromParts([part({})])).toEqual([
      { service: 'sheet', materialId: 'ms-crca', quantity: 10, instantPricePerPart: 100, agreedPricePerPart: 120, multiplierAtPricing: 1 },
    ]);
    expect(samplesFromParts([part({ instant: { breakdown: { calibrationMultiplier: 1.1 } } })])[0].multiplierAtPricing).toBe(1.1);
  });

  it('skips parts without both prices, or whose quantity changed since the instant quote', () => {
    expect(samplesFromParts([part({ unitCost: undefined }), part({ unitCost: 0 }), part({ instant: null }), part({ quantity: 25 })])).toEqual([]);
  });

  it('reads CNC quotes saved before quotes had a kind', () => {
    expect(samplesFromParts([part({ instant: { kind: undefined, materialId: 'al_6061' } })])[0].service).toBe('cnc');
  });
});

describe('report verdicts and proposals', () => {
  it('proposes a correction once there is enough evidence, capped at ±15% per change', () => {
    const [g] = buildCalibrationReport(many(12, { agreedPricePerPart: 125 }), ctx()).byService;
    expect(g).toMatchObject({ key: 'sheet', samples: 12, medianRatio: 1.25, currentMultiplier: 1, targetMultiplier: 1.25, verdict: 'adjust' });
    expect(g.canApply).toBe(true);
    expect(g.proposedMultiplier).toBe(1.15); // capped from 1.25
  });

  it('shows a direction from 5 samples but needs 10 to apply', () => {
    const [g] = buildCalibrationReport(many(6, { agreedPricePerPart: 120 }), ctx()).byService;
    expect(g.verdict).toBe('adjust');
    expect(g.canApply).toBe(false);
    expect(g.blockedReason).toMatch(/needs 10/);

    const [thin] = buildCalibrationReport(many(3, { agreedPricePerPart: 120 }), ctx()).byService;
    expect(thin).toMatchObject({ verdict: 'insufficient_data', canApply: false });
  });

  it('judges samples against the multiplier they were priced with, so a correction is not counted twice', () => {
    // Engineers charge ₹121 for parts the engine quoted ₹110 *after* a ×1.10 correction:
    // the right multiplier is 1.21, and with ×1.10 in force the next step is to 1.21, not 1.10 × 1.10 × …
    const priced = many(12, { instantPricePerPart: 110, agreedPricePerPart: 121, multiplierAtPricing: 1.1 });
    const [g] = buildCalibrationReport(priced, ctx({ config: { multipliers: { sheet: 1.1 } } })).byService;
    expect(g.targetMultiplier).toBe(1.21);
    expect(g.currentMultiplier).toBe(1.1);
    expect(g.proposedMultiplier).toBe(1.21);

    // Once the setting matches, the same evidence says "on target"
    const [settled] = buildCalibrationReport(priced, ctx({ config: { multipliers: { sheet: 1.21 } } })).byService;
    expect(settled.verdict).toBe('on_target');
  });

  it('never leaves the 0.70–1.50 bounds', () => {
    expect(proposeMultiplier(1.45, 2)).toBe(1.5);
    expect(proposeMultiplier(0.75, 0.3)).toBe(0.7);
    const [atLimit] = buildCalibrationReport(many(12, { agreedPricePerPart: 300 }), ctx({ config: { multipliers: { sheet: 1.5 } } })).byService;
    expect(atLimit.canApply).toBe(false);
    expect(atLimit.blockedReason).toMatch(/limit/);
  });

  it(`waits ${COOLDOWN_DAYS} days between changes to a group`, () => {
    const samples = many(12, { agreedPricePerPart: 125 });
    const recent = buildCalibrationReport(samples, ctx({ changes: [change({ appliedAt: new Date(NOW - 2 * 86_400_000).toISOString() })] })).byService[0];
    expect(recent.canApply).toBe(false);
    expect(recent.blockedReason).toMatch(/Changed recently/);
    expect(recent.canRevert).toBe(true);

    const old = buildCalibrationReport(samples, ctx({ changes: [change({ appliedAt: new Date(NOW - 8 * 86_400_000).toISOString() })] })).byService[0];
    expect(old.canApply).toBe(true);
  });

  it('never applies batch-size groups automatically', () => {
    const [g] = buildCalibrationReport(many(12, { agreedPricePerPart: 125 }), ctx()).byQuantity;
    expect(g).toMatchObject({ view: 'quantity', verdict: 'adjust', canApply: false, canRevert: false });
    expect(g.blockedReason).toMatch(/by hand/);
  });

  it("uses a material's own multiplier when it has one, else its service's", () => {
    const config = { multipliers: { sheet: 1.1, 'sheet · ss-304': 0.95 } };
    const report = buildCalibrationReport([sample({}), sample({ materialId: 'ss-304' })], ctx({ config }));
    const current = Object.fromEntries(report.byMaterial.map((g) => [g.key, g.currentMultiplier]));
    expect(current).toEqual({ 'sheet · ms-crca': 1.1, 'sheet · ss-304': 0.95 });
  });
});

describe('applying multipliers to prices', () => {
  const quote = {
    pricePerPart: 139,
    totalPrice: 1389,
    parameters: { quantity: 10 },
    breakdown: { materialCost: 28.17 },
  };

  it('resolves material, then service, then 1.00', () => {
    const config = { multipliers: { sheet: 1.1, 'sheet · ss-304': 0.95 } };
    expect(resolveMultiplier(config, 'sheet', 'ss-304')).toBe(0.95);
    expect(resolveMultiplier(config, 'sheet', 'ms-crca')).toBe(1.1);
    expect(resolveMultiplier(config, 'cnc', 'al_6061')).toBe(1);
  });

  it('scales the final price and records the factor, leaving cost lines alone', () => {
    const c = calibrateQuote(quote, 1.1);
    expect(c.totalPrice).toBe(1528);
    expect(c.pricePerPart).toBe(153);
    expect(c.breakdown).toEqual({ materialCost: 28.17, calibrationMultiplier: 1.1 });
    expect(calibrateQuote(quote, 1)).toBe(quote);
  });

  it('scales tier tables the same way', () => {
    const tiers = [{ quantity: 1, multiplier: 1, pricePerPart: 1000, totalPrice: 1000, savingsPercent: 0 }];
    expect(calibrateTiers(tiers, 1.1)[0]).toMatchObject({ pricePerPart: 1100, totalPrice: 1100, savingsPercent: 0 });
  });
});

describe('PricingCalibrationService', () => {
  const twelve = (unitCost: number, kind = 'sheet', materialId = 'ms-crca') =>
    Array.from({ length: 12 }, () => part({ unitCost, instant: { kind, materialId } }));

  it('applies the proposal against the settings version it read, and logs the evidence', async () => {
    getInstantPricedParts.mockResolvedValue(ok(twelve(125)));
    getVersionedConfig.mockResolvedValue(ok({ multipliers: {}, version: 4 }));
    const { PricingCalibrationService } = await import('@/services/pricing-calibration.service');

    const result = await PricingCalibrationService.apply('sheet', 'admin@mechhub.in', NOW);

    expect(result.success).toBe(true);
    expect(recordChange).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'sheet', action: 'apply', from: 1, to: 1.15, previous: null, next: 1.15,
        samples: 12, targetMultiplier: 1.25, appliedBy: 'admin@mechhub.in',
      }),
      4
    );
  });

  it('refuses with the reason when a limit blocks the change', async () => {
    getInstantPricedParts.mockResolvedValue(ok(twelve(125).slice(0, 6)));
    const { PricingCalibrationService } = await import('@/services/pricing-calibration.service');

    const result = await PricingCalibrationService.apply('sheet', 'admin', NOW);
    expect(result.success === false && result.error.statusCode).toBe(409);
    expect(result.success === false && result.error.message).toMatch(/needs 10/);
    expect(recordChange).not.toHaveBeenCalled();

    const unknown = await PricingCalibrationService.apply('sheet · 1 pc', 'admin', NOW);
    expect(unknown.success === false && unknown.error.statusCode).toBe(404);
  });

  it('undoes the latest apply by restoring exactly what was stored before it', async () => {
    getInstantPricedParts.mockResolvedValue(ok([]));
    getVersionedConfig.mockResolvedValue(ok({ multipliers: { sheet: 1.1, 'sheet · ss-304': 1.05 }, version: 7 }));
    listChanges.mockResolvedValue(ok([change({ key: 'sheet · ss-304', from: 1.1, to: 1.05, previous: null, next: 1.05 })]));
    const { PricingCalibrationService } = await import('@/services/pricing-calibration.service');

    const result = await PricingCalibrationService.revert('sheet · ss-304', 'admin', NOW);
    expect(result.success).toBe(true);
    // The override is removed, so SS 304 falls back to the sheet multiplier again
    expect(recordChange).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'sheet · ss-304', action: 'revert', from: 1.05, to: 1.1, previous: 1.05, next: null }),
      7
    );
  });

  it('has nothing to undo when the latest change was already an undo', async () => {
    getInstantPricedParts.mockResolvedValue(ok([]));
    listChanges.mockResolvedValue(ok([change({ action: 'revert' })]));
    const { PricingCalibrationService } = await import('@/services/pricing-calibration.service');

    const result = await PricingCalibrationService.revert('sheet', 'admin', NOW);
    expect(result.success === false && result.error.statusCode).toBe(409);
  });
});

describe('shop load', () => {
  it('records a change from the default, rounded to a whole percent', async () => {
    getVersionedConfig.mockResolvedValue(ok({ multipliers: { sheet: 1.1 }, version: 3 }));
    const { PricingCalibrationService } = await import('@/services/pricing-calibration.service');

    const result = await PricingCalibrationService.setShopLoad(0.904, 'admin@mechhub.in', NOW);
    expect(result.success).toBe(true);
    expect(recordChange).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'shop_load', action: 'shop_load', from: 0.65, to: 0.9, previous: null, next: 0.9 }),
      3
    );
  });

  it('refuses impossible or unchanged values', async () => {
    getVersionedConfig.mockResolvedValue(ok({ multipliers: {}, shopLoad: 0.9, version: 1 }));
    const { PricingCalibrationService } = await import('@/services/pricing-calibration.service');

    expect((await PricingCalibrationService.setShopLoad(1.2, 'a', NOW)).success).toBe(false);
    const same = await PricingCalibrationService.setShopLoad(0.9, 'a', NOW);
    expect(same.success === false && same.error.message).toMatch(/already 90%/);
    expect(recordChange).not.toHaveBeenCalled();
  });

  it('treats the default as the current load while unset, so 65% → 65% is not logged', async () => {
    getVersionedConfig.mockResolvedValue(ok({ multipliers: {}, version: 1 }));
    const { PricingCalibrationService } = await import('@/services/pricing-calibration.service');

    const noop = await PricingCalibrationService.setShopLoad(0.65, 'a', NOW);
    expect(noop.success === false && noop.error.message).toMatch(/already 65%/);
    expect(recordChange).not.toHaveBeenCalled();
  });

  it('shows in the report, and shop-load changes never block calibration groups', () => {
    const shopLoadChange = change({ key: 'shop_load', action: 'shop_load', from: 0.65, to: 0.9, appliedAt: new Date(NOW).toISOString() });
    const report = buildCalibrationReport(many(12, { agreedPricePerPart: 125 }), ctx({
      config: { multipliers: {}, shopLoad: 0.9 },
      changes: [shopLoadChange],
    }));
    expect(report.shopLoad).toBe(0.9);
    expect(report.byService[0].canApply).toBe(true);
  });
});

describe('admin routes', () => {
  const admin = { success: true, uid: 'a1', email: 'admin@mechhub.in', role: 'admin', status: 'active', emailVerified: true };
  const customer = { ...admin, uid: 'u1', role: 'customer' };
  const post = (path: string, body: unknown) =>
    new NextRequest(`http://localhost${path}`, { method: 'POST', body: JSON.stringify(body) });

  it('lets only admins read, apply or undo', async () => {
    authenticateRequest.mockResolvedValue(customer);
    const report = await import('@/app/api/v1/admin/pricing-calibration/route');
    const apply = await import('@/app/api/v1/admin/pricing-calibration/apply/route');
    const revert = await import('@/app/api/v1/admin/pricing-calibration/revert/route');

    expect((await report.GET(new NextRequest('http://localhost/api/v1/admin/pricing-calibration'))).status).toBe(403);
    expect((await apply.POST(post('/api/v1/admin/pricing-calibration/apply', { key: 'sheet' }))).status).toBe(403);
    expect((await revert.POST(post('/api/v1/admin/pricing-calibration/revert', { key: 'sheet' }))).status).toBe(403);
    expect(recordChange).not.toHaveBeenCalled();
  });

  it('reports engineer-priced parts with the settings in force', async () => {
    authenticateRequest.mockResolvedValue(admin);
    getInstantPricedParts.mockResolvedValue(ok([part({}), part({ unitCost: undefined })]));
    getVersionedConfig.mockResolvedValue(ok({ multipliers: { sheet: 1.05 }, version: 1 }));
    const { GET } = await import('@/app/api/v1/admin/pricing-calibration/route');

    const body = await (await GET(new NextRequest('http://localhost/api/v1/admin/pricing-calibration'))).json();
    expect(body.samples).toBe(1);
    expect(body.multipliers).toEqual({ sheet: 1.05 });
    expect(body.byService[0]).toMatchObject({ key: 'sheet', currentMultiplier: 1.05, verdict: 'insufficient_data' });
  });

  it('applies for an admin, recording who did it', async () => {
    authenticateRequest.mockResolvedValue(admin);
    getInstantPricedParts.mockResolvedValue(ok(Array.from({ length: 12 }, () => part({ unitCost: 125 }))));
    const { POST } = await import('@/app/api/v1/admin/pricing-calibration/apply/route');

    const res = await POST(post('/api/v1/admin/pricing-calibration/apply', { key: 'sheet' }));
    expect(res.status).toBe(200);
    expect((await res.json()).change).toMatchObject({ key: 'sheet', to: 1.15, appliedBy: 'admin@mechhub.in' });

    expect((await POST(post('/api/v1/admin/pricing-calibration/apply', {}))).status).toBe(400);
  });

  it('sets the shop load for admins only, as a whole percentage', async () => {
    const { POST } = await import('@/app/api/v1/admin/pricing-calibration/shop-load/route');

    authenticateRequest.mockResolvedValue(customer);
    expect((await POST(post('/api/v1/admin/pricing-calibration/shop-load', { percent: 90 }))).status).toBe(403);

    authenticateRequest.mockResolvedValue(admin);
    expect((await POST(post('/api/v1/admin/pricing-calibration/shop-load', { percent: 150 }))).status).toBe(400);
    const res = await POST(post('/api/v1/admin/pricing-calibration/shop-load', { percent: 90 }));
    expect(res.status).toBe(200);
    expect((await res.json()).change).toMatchObject({ key: 'shop_load', to: 0.9, appliedBy: 'admin@mechhub.in' });
  });
});
