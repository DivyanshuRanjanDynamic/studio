import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { ok } from '@/utils/result';
import { ErrorCode } from '@/utils/errors';

// ═══════════════════════════════════════════════════
// Quote checkout prices shop items from the catalogue; /convert needs a signed ticket
// All repositories, auth and rate limiting are mocked — no Firestore.
// ═══════════════════════════════════════════════════

const getProductsByIds = vi.fn();
const saveOrder = vi.fn();
const authenticateRequest = vi.fn();

vi.mock('@/repositories/product.repository', () => ({
  ProductRepository: { getProductsByIds: (...a: unknown[]) => getProductsByIds(...a) },
}));
vi.mock('@/repositories/order.repository', () => ({
  OrderRepository: { saveOrder: (...a: unknown[]) => saveOrder(...a) },
}));
vi.mock('@/repositories/project.repository', () => ({ ProjectRepository: {} }));
vi.mock('@/lib/firebase/repositories/quotes', () => ({ QuotesRepository: { getQuoteByRef: vi.fn() } }));
vi.mock('@/lib/auth-middleware', () => ({
  authenticateRequest: (...a: unknown[]) => authenticateRequest(...a),
  checkVerification: (auth: { emailVerified?: boolean }) =>
    auth.emailVerified ? null : NextResponse.json({ code: 'UNVERIFIED' }, { status: 403 }),
}));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: async () => ({ success: true, remaining: 9, reset: Date.now() }),
  rateLimitResponse: () => new Response(null, { status: 429 }),
}));

const address = {
  fullName: 'Test Buyer',
  phone: '9876543210',
  addressLine1: '12 Industrial Area',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560001',
  isGstInvoicing: false,
};

const cartLine = (overrides: Record<string, unknown> = {}) => ({
  id: 'prod_1',
  name: 'M6 Bolt Kit',
  salePrice: 499,
  quantity: 2,
  sku: 'BOLT-M6',
  inventory: 50,
  ...overrides,
});

const catalogue = (overrides: Record<string, unknown> = {}) =>
  ok(
    new Map([
      [
        'prod_1',
        { id: 'prod_1', name: 'M6 Bolt Kit', sku: 'BOLT-M6', salePrice: 499, inventory: 50, isActive: true, ...overrides },
      ],
    ])
  );

const order = (shopItems: unknown[]) => ({
  userId: 'user_1',
  items: [],
  shopItems,
  shippingAddress: address,
  shippingOptionId: 'std_ground',
});

beforeEach(() => {
  getProductsByIds.mockReset();
  saveOrder.mockReset();
  authenticateRequest.mockReset();
  saveOrder.mockImplementation(async (o: { id: string }) => ok(o.id));
});

describe('CheckoutService prices shop items from the catalogue', () => {
  it('charges the catalogue price and stores catalogue details on the order', async () => {
    getProductsByIds.mockResolvedValue(catalogue());
    const { CheckoutService } = await import('@/services/checkout.service');

    const result = await CheckoutService.createOrder(
      order([cartLine({ name: 'Renamed in localStorage', sku: 'FAKE' })]) as never
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.subtotal).toBe(998);
    expect(result.data.shopItems?.[0]).toMatchObject({ name: 'M6 Bolt Kit', sku: 'BOLT-M6', salePrice: 499 });
  });

  it('rejects a cart price edited down to ₹1', async () => {
    getProductsByIds.mockResolvedValue(catalogue());
    const { CheckoutService } = await import('@/services/checkout.service');

    const result = await CheckoutService.priceOrder(order([cartLine({ salePrice: 1 })]) as never);

    expect(result.success === false && result.error.code).toBe(ErrorCode.VALIDATION_FAILED);
    expect(result.success === false && result.error.message).toMatch(/price .* has changed/);
  });

  it('rejects unknown, inactive, unpriced and out-of-stock products', async () => {
    const { CheckoutService } = await import('@/services/checkout.service');
    const cases: Array<[string, unknown, RegExp]> = [
      ['missing', ok(new Map()), /no longer available/],
      ['inactive', catalogue({ isActive: false }), /no longer available/],
      ['no price', catalogue({ salePrice: 0 }), /can't be ordered/],
      ['stock', catalogue({ inventory: 1 }), /Insufficient stock/],
    ];
    for (const [label, products, message] of cases) {
      getProductsByIds.mockResolvedValueOnce(products);
      const result = await CheckoutService.priceOrder(order([cartLine()]) as never);
      expect(result.success === false && result.error.message, label).toMatch(message);
    }
  });

  it('adds up repeated lines before checking stock', async () => {
    getProductsByIds.mockResolvedValue(catalogue({ inventory: 3 }));
    const { CheckoutService } = await import('@/services/checkout.service');

    const result = await CheckoutService.priceOrder(
      order([cartLine({ quantity: 2 }), cartLine({ quantity: 2 })]) as never
    );
    expect(result.success === false && result.error.message).toMatch(/Insufficient stock/);
  });
});

describe('convert tickets', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('matches the converter’s format byte for byte (shared test vector)', async () => {
    const { signConvertTicket } = await import('@/lib/convert-ticket');
    // Same vector as cad-converter/tests/test_convert_access.py
    expect(signConvertTicket({ sub: 'uid_vector', scope: 'convert', exp: 1800000600 }, 'vector-secret')).toBe(
      'v1.eyJzdWIiOiJ1aWRfdmVjdG9yIiwic2NvcGUiOiJjb252ZXJ0IiwiZXhwIjoxODAwMDAwNjAwfQ.whemFXEaecHD18MvPx66V0uf_-BV8djqumevpm-2-NI'
    );
  });

  it('mints a 10-minute ticket for the user, and fails closed without a secret', async () => {
    const { mintConvertTicket } = await import('@/lib/convert-ticket');

    vi.stubEnv('CONVERTER_SERVICE_TOKEN', '');
    expect(mintConvertTicket('u1').success).toBe(false);

    vi.stubEnv('CONVERTER_SERVICE_TOKEN', 'secret');
    const minted = mintConvertTicket('u1', 1_800_000_000_000);
    expect(minted.success).toBe(true);
    if (!minted.success) return;
    expect(minted.data.expiresAt).toBe(1_800_000_600_000);
    const payload = JSON.parse(Buffer.from(minted.data.ticket.split('.')[1], 'base64url').toString());
    expect(payload).toEqual({ sub: 'u1', scope: 'convert', exp: 1_800_000_600 });
  });

  it('only verified, active users get a ticket', async () => {
    vi.stubEnv('CONVERTER_SERVICE_TOKEN', 'secret');
    const { POST } = await import('@/app/api/v1/cad/convert-ticket/route');
    const req = () => new NextRequest('http://localhost/api/v1/cad/convert-ticket', { method: 'POST' });

    authenticateRequest.mockResolvedValueOnce({ success: false, error: 'Authentication required', status: 401 });
    expect((await POST(req())).status).toBe(401);

    authenticateRequest.mockResolvedValueOnce({ success: true, uid: 'u1', emailVerified: false, role: 'customer', status: 'active' });
    expect((await POST(req())).status).toBe(403);

    authenticateRequest.mockResolvedValueOnce({ success: true, uid: 'u1', emailVerified: true, role: 'customer', status: 'suspended' });
    expect((await POST(req())).status).toBe(403);

    authenticateRequest.mockResolvedValueOnce({ success: true, uid: 'u1', emailVerified: true, role: 'customer', status: 'active' });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect((await res.json()).ticket).toMatch(/^v1\.[\w-]+\.[\w-]+$/);
  });
});
