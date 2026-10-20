import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok } from '@/utils/result';

// ═══════════════════════════════════════════════════
// Project advance/balance payments are priced from the project, not the browser
// ═══════════════════════════════════════════════════

const getProjectRfqById = vi.fn();
const saveOrder = vi.fn();
vi.mock('@/repositories/project.repository', () => ({
  ProjectRepository: { getProjectRfqById: (...a: unknown[]) => getProjectRfqById(...a) },
}));
vi.mock('@/repositories/order.repository', () => ({
  OrderRepository: { saveOrder: (...a: unknown[]) => saveOrder(...a) },
}));
vi.mock('@/repositories/product.repository', () => ({ ProductRepository: { getProductsByIds: vi.fn() } }));
vi.mock('@/lib/firebase/repositories/quotes', () => ({ QuotesRepository: { getQuoteByRef: vi.fn() } }));

const address = {
  fullName: 'Test Buyer',
  phone: '9876543210',
  addressLine1: '12 Industrial Area',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560001',
  isGstInvoicing: false,
};

// What the project page sends: a client-made per-part spread with no quoteRef
const pageRequest = (overrides: Record<string, unknown> = {}) => ({
  userId: 'owner_1',
  projectId: 'proj_1',
  isAdvance: true,
  isBalance: false,
  advancePercentage: 0.5,
  shippingAddress: address,
  shippingOptionId: 'std_ground',
  items: [{ id: 'p1', fileName: 'bracket.step', quote: { totalPrice: 1 } }],
  shopItems: [],
  ...overrides,
});

beforeEach(() => {
  getProjectRfqById.mockReset();
  saveOrder.mockReset();
  saveOrder.mockImplementation(async (o: { id: string }) => ok(o.id));
});

describe('project payments', () => {
  it('charges 50% of the agreed price, ignoring the totals the browser sent', async () => {
    getProjectRfqById.mockResolvedValue(ok({ id: 'proj_1', userId: 'owner_1', status: 'accepted', quotedPrice: 10000 }));
    const { CheckoutService } = await import('@/services/checkout.service');
    const { calculateProjectFinances } = await import('@/utils/finance');

    const result = await CheckoutService.createOrder(pageRequest() as never);

    expect(result.success).toBe(true);
    if (!result.success) return;
    const expected = calculateProjectFinances(10000, 150);
    expect(result.data.total).toBe(expected.advance);
    expect(result.data.subtotal).toBe(10000);
    expect(result.data.items).toEqual([]);
  });

  it('refuses other people’s projects, unpriced projects and the wrong stage', async () => {
    const { CheckoutService } = await import('@/services/checkout.service');
    const cases: Array<[string, object, Record<string, unknown>, RegExp]> = [
      ['not owner', { userId: 'someone_else', status: 'accepted', quotedPrice: 10000 }, {}, /not found/],
      ['no price', { userId: 'owner_1', status: 'accepted' }, {}, /no agreed price/],
      ['advance too early', { userId: 'owner_1', status: 'quotation_sent', quotedPrice: 10000 }, {}, /after you accept/],
      [
        'advance twice',
        { userId: 'owner_1', status: 'accepted', quotedPrice: 10000, paymentStatus: { advance: { paid: true } } },
        {},
        /already paid/,
      ],
      [
        'balance before shipping',
        { userId: 'owner_1', status: 'in_production', quotedPrice: 10000 },
        { isAdvance: false, isBalance: true },
        /once the order has shipped/,
      ],
    ];
    for (const [label, project, overrides, message] of cases) {
      getProjectRfqById.mockResolvedValueOnce(ok({ id: 'proj_1', ...project }));
      const result = await CheckoutService.priceOrder(pageRequest(overrides) as never, 'owner_1');
      expect(result.success === false && result.error.message, label).toMatch(message);
    }
  });

  it('charges the balance once shipped', async () => {
    getProjectRfqById.mockResolvedValue(ok({ id: 'proj_1', userId: 'owner_1', status: 'shipped', finalPrice: 8000 }));
    const { CheckoutService } = await import('@/services/checkout.service');
    const { calculateProjectFinances } = await import('@/utils/finance');

    const result = await CheckoutService.priceOrder(pageRequest({ isAdvance: false, isBalance: true }) as never, 'owner_1');
    expect(result.success && result.data.total).toBe(calculateProjectFinances(8000, 150).balance);
  });
});
