import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateCncQuote, generateQuote } from './pricing-engine';
import { bracketAnalysis } from './__fixtures__/cnc-analysis';
import { ok, err } from '@/utils/result';
import { ErrorCode, internalError, notFoundError } from '@/utils/errors';
import type { AnyQuoteResult, CncQuoteRequest, ParsedGeometry, QuoteRequest } from '@/types/quoting';

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

// ═══════════════════════════════════════════════════
// Quote persistence: refs, share lookup, checkout re-validation, client API
// ═══════════════════════════════════════════════════

const geometry: ParsedGeometry = {
  cutLengthMm: 600,
  areaMm2: 10000,
  boundingBox: { widthMm: 100, heightMm: 100, aspectRatio: 1 },
  holeCount: 2,
  complexityScore: 2,
  nodeCount: 20,
  minFeatureSizeMm: 5,
  minSlotWidthMm: 5,
  edgeToHoleDistanceMm: 5,
  hasOpenPaths: false,
};

const laserRequest: QuoteRequest = {
  materialId: 'ms_a36',
  thicknessMm: 2,
  finishType: 'none',
  quantity: 5,
  turnaround: 'standard_3d',
  geometry,
};

const cncRequest: CncQuoteRequest = {
  materialId: 'al_6061',
  finishType: 'none',
  quantity: 10,
  turnaround: 'standard_3d',
};

function laserQuote(overrides: Partial<AnyQuoteResult> = {}): AnyQuoteResult {
  const q = generateQuote('ms_a36', 2, 'none', 5, 'standard_3d', geometry);
  if (!q.success) throw new Error('fixture laser quote failed');
  return { ...q.data, quoteRef: 'MH-ABCDEFGH23', ...overrides } as AnyQuoteResult;
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
});

describe('QuotingService refs and share lookup', () => {
  it('gives every saved quote a distinct, non-sequential ref', async () => {
    saveQuote.mockImplementation(async (q: { quoteRef: string }) => ok(q.quoteRef));
    const { QuotingService, QUOTE_REF_PATTERN } = await import('@/services/quoting.service');

    const a = await QuotingService.processQuoteRequest(laserRequest);
    const b = await QuotingService.processQuoteRequest(laserRequest);
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

    const result = await QuotingService.processQuoteRequest(laserRequest);
    expect(result.success).toBe(false);
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

  it('posts laser quotes to the laser route', async () => {
    fetchMock.mockResolvedValue(json(200, laserQuote()));
    const { saveQuote: save } = await import('@/services/quoteApi.service');

    await save({ kind: 'laser', request: laserRequest });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/quote');
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
