import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateCncQuote } from './pricing-engine';
import { legacyLaserQuote } from './__fixtures__/legacy-laser-quote';
import { bracketAnalysis } from './__fixtures__/cnc-analysis';
import { ok, err } from '@/utils/result';
import { ErrorCode, internalError, notFoundError } from '@/utils/errors';
import type { AnyQuoteResult, CncQuoteRequest, SheetAnalysis, SheetQuoteRequest } from '@/types/quoting';

// Firestore is never touched — every repository is an in-memory mock.
const saveQuote = vi.fn();
const getQuoteByRef = vi.fn();
const saveOrder = vi.fn();
vi.mock('@/lib/firebase/repositories/quotes', () => ({
  QuotesRepository: {
    saveQuote: (...args: unknown[]) => saveQuote(...args),
    getQuoteByRef: (...args: unknown[]) => getQuoteByRef(...args),
  },
}));
vi.mock('@/repositories/order.repository', () => ({
  OrderRepository: { saveOrder: (...args: unknown[]) => saveOrder(...args) },
}));
vi.mock('@/repositories/project.repository', () => ({ ProjectRepository: {} }));
const getCalibrationConfig = vi.fn();
vi.mock('@/repositories/pricing-calibration.repository', () => ({
  PricingCalibrationRepository: { getConfig: (...args: unknown[]) => getCalibrationConfig(...args) },
}));
const getOwnedSheetAnalysis = vi.fn();
vi.mock('@/services/part-analysis.service', () => ({
  PartAnalysisService: { getOwnedSheetAnalysis: (...args: unknown[]) => getOwnedSheetAnalysis(...args) },
}));

// ═══════════════════════════════════════════════════
// Quote persistence: refs, share lookup, checkout re-validation, client API
// ═══════════════════════════════════════════════════

/** 200 × 100 × 2 mm plate with 4 × Ø4.2 holes, as the converter measured it */
const sheetAnalysis: SheetAnalysis = {
  version: 'sheet-1',
  units: 'mm',
  thicknessMm: 2,
  volumeMm3: 39889.2,
  surfaceAreaMm2: 41194.8,
  flatAreaMm2: 19944.6,
  cutLengthMm: 652.8,
  pierces: 5,
  holes: [{ diameterMm: 4.2, count: 4 }],
  bends: [],
  boundingBox: { x: 200, y: 100, z: 2 },
  isFlat: true,
  bodyCount: 1,
  analysisMs: 40,
};

const laserRequest: SheetQuoteRequest = {
  materialId: 'ms-crca',
  thicknessMm: 2,
  finishType: 'none',
  quantity: 5,
  turnaround: 'standard_3d',
};

const cncRequest: CncQuoteRequest = {
  materialId: 'al_6061',
  finishType: 'none',
  quantity: 10,
  turnaround: 'standard_3d',
};

/** A stored laser quote in the pre-converter format; share links and checkout must keep handling them */
function laserQuote(overrides: Partial<AnyQuoteResult> = {}): AnyQuoteResult {
  return { ...legacyLaserQuote(), ...overrides } as AnyQuoteResult;
}

function cncQuote(): AnyQuoteResult {
  const q = generateCncQuote(bracketAnalysis, cncRequest);
  if (!q.success) throw new Error('fixture CNC quote failed');
  return { ...q.data, quoteRef: 'MH-CNCQUOTE23' };
}

const address = {
  fullName: 'Test Buyer',
  phone: '9876543210',
  addressLine1: '12 Industrial Area',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560001',
  isGstInvoicing: false,
};

function orderInput(items: Array<{ id: string; fileName: string; quote: Record<string, unknown> }>) {
  return {
    userId: 'user_1',
    // C2 fix: idempotencyKey is now required by orderCreateSchema.
    // Tests use a deterministic stub value so snapshot comparisons stay stable.
    idempotencyKey: 'test-idem-key-0001',
    items,
    shopItems: [],
    shippingAddress: address,
    shippingOptionId: 'std_ground',
  };
}

beforeEach(() => {
  saveQuote.mockReset();
  getQuoteByRef.mockReset();
  saveOrder.mockReset();
  getOwnedSheetAnalysis.mockReset();
  getCalibrationConfig.mockReset();
  getCalibrationConfig.mockResolvedValue({ multipliers: {} });
});

describe('QuotingService refs and share lookup', () => {
  it('gives every saved quote a distinct, non-sequential ref', async () => {
    saveQuote.mockImplementation(async (q: { quoteRef: string }) => ok(q.quoteRef));
    const { QuotingService, QUOTE_REF_PATTERN } = await import('@/services/quoting.service');

    const a = await QuotingService.processSheetQuoteRequest(sheetAnalysis, laserRequest);
    const b = await QuotingService.processSheetQuoteRequest(sheetAnalysis, laserRequest);
    const c = await QuotingService.processCncQuoteRequest(bracketAnalysis, cncRequest);

    if (!a.success || !b.success || !c.success) throw new Error('quotes failed');
    const refs = [a.data.quoteRef, b.data.quoteRef, c.data.quoteRef];
    refs.forEach((ref) => expect(ref).toMatch(QUOTE_REF_PATTERN));
    expect(new Set(refs).size).toBe(3);
    // The returned quote is exactly what was persisted.
    expect(saveQuote).toHaveBeenNthCalledWith(1, a.data, undefined);
  });

  it('surfaces save failures instead of returning an unsaved quote', async () => {
    saveQuote.mockResolvedValue(err(internalError('db down')));
    const { QuotingService } = await import('@/services/quoting.service');

    const result = await QuotingService.processSheetQuoteRequest(sheetAnalysis, laserRequest);
    expect(result.success).toBe(false);
  });

  it('saves laser and CNC quotes with the admin-applied correction, material before service', async () => {
    saveQuote.mockImplementation(async (q: { quoteRef: string }) => ok(q.quoteRef));
    const { QuotingService } = await import('@/services/quoting.service');

    const plain = await QuotingService.processSheetQuoteRequest(sheetAnalysis, laserRequest);
    getCalibrationConfig.mockResolvedValue({ multipliers: { sheet: 1.2, 'sheet · ms-crca': 1.1, cnc: 0.9 } });
    const corrected = await QuotingService.processSheetQuoteRequest(sheetAnalysis, laserRequest);
    const cnc = await QuotingService.processCncQuoteRequest(bracketAnalysis, cncRequest);
    if (!plain.success || !corrected.success || !cnc.success) throw new Error('quotes failed');

    expect(corrected.data.totalPrice).toBe(Math.round(plain.data.totalPrice * 1.1));
    expect(corrected.data.breakdown.calibrationMultiplier).toBe(1.1);
    expect(cnc.data.breakdown.calibrationMultiplier).toBe(0.9);
    // What is saved is what the customer is charged
    expect(saveQuote).toHaveBeenCalledWith(corrected.data, undefined);
  });

  it('prices Rush quotes at the admin-set shop load', async () => {
    saveQuote.mockImplementation(async (q: { quoteRef: string }) => ok(q.quoteRef));
    const { QuotingService } = await import('@/services/quoting.service');
    const rush = { ...laserRequest, quantity: 100, turnaround: 'rush_1d' as const };

    const calm = await QuotingService.processSheetQuoteRequest(sheetAnalysis, rush);
    getCalibrationConfig.mockResolvedValue({ multipliers: {}, shopLoad: 1 });
    const busy = await QuotingService.processSheetQuoteRequest(sheetAnalysis, rush);
    if (!calm.success || !busy.success) throw new Error('quotes failed');

    expect(calm.data.breakdown.rushMultiplier).toBe(1.75);
    expect(busy.data.breakdown.rushMultiplier).toBe(2.275);
    expect(busy.data.totalPrice).toBeGreaterThan(calm.data.totalPrice);
  });

  it("prices laser quotes from the caller's stored analysis only", async () => {
    saveQuote.mockImplementation(async (q: { quoteRef: string }) => ok(q.quoteRef));
    getOwnedSheetAnalysis.mockResolvedValue(ok(sheetAnalysis));
    const { QuotingService } = await import('@/services/quoting.service');

    const priced = await QuotingService.processStoredSheetQuoteRequest('sma_0123456789abcdef', laserRequest, 'user_1');
    expect(getOwnedSheetAnalysis).toHaveBeenCalledWith('user_1', 'sma_0123456789abcdef');
    if (!priced.success) throw new Error('laser quote failed');
    expect(priced.data.kind).toBe('sheet');
    expect(priced.data.analysis.cutLengthMm).toBe(652.8);
    expect(saveQuote).toHaveBeenCalledWith(priced.data, 'user_1');

    getOwnedSheetAnalysis.mockResolvedValue(err(notFoundError('Part analysis', 'sma_foreign')));
    saveQuote.mockClear();
    const foreign = await QuotingService.processStoredSheetQuoteRequest('sma_foreign', laserRequest, 'user_2');
    expect(foreign.success === false && foreign.error.code).toBe(ErrorCode.NOT_FOUND);
    expect(saveQuote).not.toHaveBeenCalled();
  });

  it('returns shared quotes without the owner id', async () => {
    getQuoteByRef.mockResolvedValue(ok({ ...laserQuote(), userId: 'owner_9' }));
    const { QuotingService } = await import('@/services/quoting.service');

    const result = await QuotingService.getQuote('MH-ABCDEFGH23');
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).not.toHaveProperty('userId');
    expect(result.data.quoteRef).toBe('MH-ABCDEFGH23');
  });

  it('rejects malformed refs without a database read', async () => {
    const { QuotingService } = await import('@/services/quoting.service');

    for (const ref of ['', 'MH-short', '../orders/x', 'mh-abcdefgh23']) {
      const result = await QuotingService.getQuote(ref);
      expect(result.success === false && result.error.code).toBe(ErrorCode.NOT_FOUND);
    }
    expect(getQuoteByRef).not.toHaveBeenCalled();
  });
});

describe('CheckoutService re-validates cart quotes', () => {
  it('prices the order from saved quotes and stores them on the order', async () => {
    const laser = laserQuote();
    const cnc = cncQuote();
    getQuoteByRef.mockImplementation(async (ref: string) =>
      ref === laser.quoteRef ? ok({ ...laser, userId: null }) : ok({ ...cnc, userId: 'u' })
    );
    saveOrder.mockImplementation(async (o: { id: string }) => ok(o.id));
    const { CheckoutService } = await import('@/services/checkout.service');

    const result = await CheckoutService.createOrder({
      ...orderInput([
        { id: 'c1', fileName: 'plate.dxf', quote: { ...laser } },
        { id: 'c2', fileName: 'bracket.step', quote: { ...cnc } },
      ]),
      razorpayOrderId: 'order_rzp_1',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.subtotal).toBeCloseTo(laser.totalPrice + cnc.totalPrice, 2);
    expect(result.data.razorpayOrderId).toBe('order_rzp_1');
    expect(result.data.items[1].quote).toEqual(cnc);
    expect(result.data.items[1].quote).not.toHaveProperty('userId');
    expect(saveOrder).toHaveBeenCalledTimes(1);
  });

  it('rejects a cart total that was edited in localStorage', async () => {
    const laser = laserQuote();
    getQuoteByRef.mockResolvedValue(ok({ ...laser, userId: null }));
    const { CheckoutService } = await import('@/services/checkout.service');

    const result = await CheckoutService.createOrder(
      orderInput([{ id: 'c1', fileName: 'plate.dxf', quote: { ...laser, totalPrice: 1 } }])
    );

    expect(result.success === false && result.error.code).toBe(ErrorCode.VALIDATION_FAILED);
    expect(result.success === false && result.error.message).toMatch(/no longer matches/);
    expect(saveOrder).not.toHaveBeenCalled();
  });

  it('rejects expired, unknown and ref-less quotes', async () => {
    const { CheckoutService } = await import('@/services/checkout.service');

    const expired = laserQuote({ expiresAt: Date.now() - 1000 });
    getQuoteByRef.mockResolvedValueOnce(ok({ ...expired, userId: null }));
    const a = await CheckoutService.priceOrder(
      orderInput([{ id: 'c1', fileName: 'old.dxf', quote: { ...expired } }])
    );
    expect(a.success === false && a.error.code).toBe(ErrorCode.QUOTE_EXPIRED);

    getQuoteByRef.mockResolvedValueOnce(err(notFoundError('Quote', 'MH-GONEGONE23')));
    const b = await CheckoutService.priceOrder(
      orderInput([{ id: 'c1', fileName: 'gone.dxf', quote: { ...laserQuote(), quoteRef: 'MH-GONEGONE23' } }])
    );
    expect(b.success === false && b.error.message).toMatch(/not found/);

    const c = await CheckoutService.priceOrder(
      orderInput([{ id: 'c1', fileName: 'local.dxf', quote: { totalPrice: 10 } }])
    );
    expect(c.success === false && c.error.message).toMatch(/no saved quote/);
  });

  it('rejects quotes saved with blocking DFM issues', async () => {
    const blocked = laserQuote({ hasBlockingIssues: true });
    getQuoteByRef.mockResolvedValue(ok({ ...blocked, userId: null }));
    const { CheckoutService } = await import('@/services/checkout.service');

    const result = await CheckoutService.priceOrder(
      orderInput([{ id: 'c1', fileName: 'thin.dxf', quote: { ...blocked } }])
    );
    expect(result.success === false && result.error.message).toMatch(/blocking DFM/);
  });

  it('passes database failures through as errors', async () => {
    getQuoteByRef.mockResolvedValue(err(internalError('Failed to fetch quote from database')));
    const { CheckoutService } = await import('@/services/checkout.service');

    const result = await CheckoutService.priceOrder(
      orderInput([{ id: 'c1', fileName: 'plate.dxf', quote: { ...laserQuote() } }])
    );
    expect(result.success === false && result.error.code).toBe(ErrorCode.INTERNAL_ERROR);
  });
});

describe('quoteApi.service', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  it('posts CNC quotes as { analysisId, request } — never the analysis itself', async () => {
    const saved = cncQuote();
    fetchMock.mockResolvedValue(json(200, saved));
    const { saveQuote: save } = await import('@/services/quoteApi.service');

    const result = await save({ kind: 'cnc', analysisId: 'cnca_0123456789abcdef', request: cncRequest });

    expect(result.success && result.data.quoteRef).toBe(saved.quoteRef);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/quote/cnc');
    expect(JSON.parse(init.body)).toEqual({ analysisId: 'cnca_0123456789abcdef', request: cncRequest });
  });

  it('posts laser quotes to the laser route as { analysisId, request } — never geometry', async () => {
    fetchMock.mockResolvedValue(json(200, laserQuote()));
    const { saveQuote: save } = await import('@/services/quoteApi.service');

    await save({ kind: 'laser', analysisId: 'sma_0123456789abcdef', request: laserRequest });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/quote');
    expect(JSON.parse(init.body)).toEqual({ analysisId: 'sma_0123456789abcdef', request: laserRequest });
  });

  it('maps share-route errors and network failures to Results', async () => {
    const { fetchSharedQuote } = await import('@/services/quoteApi.service');

    fetchMock.mockResolvedValueOnce(json(404, { error: 'Quote not found', code: 'NOT_FOUND' }));
    const missing = await fetchSharedQuote('MH-GONEGONE23');
    expect(missing.success === false && missing.error.code).toBe(ErrorCode.NOT_FOUND);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/quote/share/MH-GONEGONE23');

    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const offline = await fetchSharedQuote('MH-ABCDEFGH23');
    expect(offline.success === false && offline.error.code).toBe(ErrorCode.SERVICE_UNAVAILABLE);

    fetchMock.mockResolvedValueOnce(json(200, { hello: 'world' }));
    const garbage = await fetchSharedQuote('MH-ABCDEFGH23');
    expect(garbage.success).toBe(false);
  });
});
