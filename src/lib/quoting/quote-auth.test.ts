import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { ok } from '@/utils/result';

// Instant CNC / laser pricing is for registered users — no Firestore, no real auth.
const authenticateRequest = vi.fn();
const processQuoteRequest = vi.fn();
const processCncQuoteRequest = vi.fn();
const getQuote = vi.fn();
vi.mock('@/lib/auth-middleware', () => ({
  authenticateRequest: (...args: unknown[]) => authenticateRequest(...args),
}));
vi.mock('@/services/quoting.service', () => ({
  QuotingService: {
    processQuoteRequest: (...args: unknown[]) => processQuoteRequest(...args),
    processCncQuoteRequest: (...args: unknown[]) => processCncQuoteRequest(...args),
    getQuote: (...args: unknown[]) => getQuote(...args),
  },
}));

const post = (path: string, body: unknown) =>
  new NextRequest(`http://localhost${path}`, { method: 'POST', body: JSON.stringify(body) });

const geometry = {
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
const laserBody = {
  materialId: 'ms_a36',
  thicknessMm: 2,
  finishType: 'none',
  quantity: 1,
  turnaround: 'standard_3d',
  geometry,
};

beforeEach(() => {
  authenticateRequest.mockReset();
  processQuoteRequest.mockReset();
  processCncQuoteRequest.mockReset();
  getQuote.mockReset();
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
    expect(processQuoteRequest).not.toHaveBeenCalled();
    expect(processCncQuoteRequest).not.toHaveBeenCalled();
    expect(getQuote).not.toHaveBeenCalled();
  });

  it('blocks suspended accounts', async () => {
    authenticateRequest.mockResolvedValue({ success: true, uid: 'u1', role: 'customer', status: 'suspended' });
    const { QuoteController } = await import('@/controllers/quote.controller');

    const res = await QuoteController.createQuote(post('/api/v1/quote', laserBody));
    expect(res.status).toBe(403);
    expect(processQuoteRequest).not.toHaveBeenCalled();
  });

  it('saves the quote against the signed-in user', async () => {
    authenticateRequest.mockResolvedValue({ success: true, uid: 'user_42', role: 'customer', status: 'active' });
    processQuoteRequest.mockResolvedValue(ok({ quoteRef: 'MH-ABCDEFGH23', totalPrice: 100 }));
    const { QuoteController } = await import('@/controllers/quote.controller');

    const res = await QuoteController.createQuote(post('/api/v1/quote', laserBody));
    expect(res.status).toBe(200);
    expect(processQuoteRequest).toHaveBeenCalledWith(expect.objectContaining({ materialId: 'ms_a36' }), 'user_42');
  });
});
