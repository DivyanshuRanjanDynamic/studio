import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { ok } from '@/utils/result';

// Instant CNC / laser pricing is for registered users — no Firestore, no real auth.
const authenticateRequest = vi.fn();
const processStoredSheetQuoteRequest = vi.fn();
const processCncQuoteRequest = vi.fn();
const getQuote = vi.fn();
vi.mock('@/lib/auth-middleware', () => ({
  authenticateRequest: (...args: unknown[]) => authenticateRequest(...args),
}));
// Per-account quote limits (Firestore-backed in production)
const rateLimit = vi.fn();
vi.mock('@/lib/rate-limit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/rate-limit')>()),
  rateLimit: (...args: unknown[]) => rateLimit(...args),
}));
vi.mock('@/services/quoting.service', () => ({
  QuotingService: {
    processStoredSheetQuoteRequest: (...args: unknown[]) => processStoredSheetQuoteRequest(...args),
    processCncQuoteRequest: (...args: unknown[]) => processCncQuoteRequest(...args),
    getQuote: (...args: unknown[]) => getQuote(...args),
  },
}));

const post = (path: string, body: unknown) =>
  new NextRequest(`http://localhost${path}`, { method: 'POST', body: JSON.stringify(body) });

const laserBody = {
  analysisId: 'sma_0123456789abcdef',
  request: { materialId: 'ms-crca', thicknessMm: 2, finishType: 'none', quantity: 1, turnaround: 'standard_3d' },
};

beforeEach(() => {
  authenticateRequest.mockReset();
  processStoredSheetQuoteRequest.mockReset();
  processCncQuoteRequest.mockReset();
  getQuote.mockReset();
  rateLimit.mockReset();
  rateLimit.mockResolvedValue({ success: true, remaining: 10, reset: Date.now() + 60_000 });
});

describe('QuoteController requires a registered user', () => {
  it('rejects signed-out callers on every quote route before pricing', async () => {
    authenticateRequest.mockResolvedValue({ success: false, error: 'Authentication required', status: 401 });
    const { QuoteController } = await import('@/controllers/quote.controller');

    const laser = await QuoteController.createQuote(post('/api/v1/quote', laserBody));
    const cnc = await QuoteController.createCncQuote(post('/api/v1/quote/cnc', {}));
    const share = await QuoteController.getSharedQuote(
      new NextRequest('http://localhost/api/v1/quote/share/MH-ABCDEFGH23'),
      'MH-ABCDEFGH23'
    );

    for (const res of [laser, cnc, share]) {
      expect(res.status).toBe(401);
      expect(await res.json()).toMatchObject({ code: 'UNAUTHORIZED' });
    }
    expect(processStoredSheetQuoteRequest).not.toHaveBeenCalled();
    expect(processCncQuoteRequest).not.toHaveBeenCalled();
    expect(getQuote).not.toHaveBeenCalled();
  });

  it('blocks suspended accounts', async () => {
    authenticateRequest.mockResolvedValue({ success: true, uid: 'u1', role: 'customer', status: 'suspended' });
    const { QuoteController } = await import('@/controllers/quote.controller');

    const res = await QuoteController.createQuote(post('/api/v1/quote', laserBody));
    expect(res.status).toBe(403);
    expect(processStoredSheetQuoteRequest).not.toHaveBeenCalled();
  });

  it('saves the quote against the signed-in user', async () => {
    authenticateRequest.mockResolvedValue({ success: true, uid: 'user_42', role: 'customer', status: 'active' });
    processStoredSheetQuoteRequest.mockResolvedValue(ok({ quoteRef: 'MH-ABCDEFGH23', totalPrice: 100 }));
    const { QuoteController } = await import('@/controllers/quote.controller');

    const res = await QuoteController.createQuote(post('/api/v1/quote', laserBody));
    expect(res.status).toBe(200);
    expect(processStoredSheetQuoteRequest).toHaveBeenCalledWith(
      'sma_0123456789abcdef',
      expect.objectContaining({ materialId: 'ms-crca', thicknessMm: 2 }),
      'user_42'
    );
  });

  it('refuses laser quotes priced from client-supplied geometry', async () => {
    authenticateRequest.mockResolvedValue({ success: true, uid: 'user_42', role: 'customer', status: 'active' });
    const { QuoteController } = await import('@/controllers/quote.controller');

    const legacy = {
      materialId: 'ms_a36', thicknessMm: 2, finishType: 'none', quantity: 1, turnaround: 'standard_3d',
      geometry: { cutLengthMm: 1, areaMm2: 1, boundingBox: { widthMm: 1, heightMm: 1, aspectRatio: 1 } },
    };
    const res = await QuoteController.createQuote(post('/api/v1/quote', legacy));
    expect(res.status).toBe(400);
    expect(processStoredSheetQuoteRequest).not.toHaveBeenCalled();
  });

  it('limits quote saves per account', async () => {
    authenticateRequest.mockResolvedValue({ success: true, uid: 'user_1', role: 'customer', status: 'active' });
    rateLimit.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() + 60_000 });
    const { QuoteController } = await import('@/controllers/quote.controller');

    const res = await QuoteController.createQuote(post('/api/v1/quote', laserBody));
    expect(res.status).toBe(429);
    expect(rateLimit).toHaveBeenCalledWith('quote-quote:user_1', expect.any(Number), expect.any(Number));
    expect(processStoredSheetQuoteRequest).not.toHaveBeenCalled();
  });
});
