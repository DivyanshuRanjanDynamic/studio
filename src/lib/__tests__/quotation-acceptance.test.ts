import { describe, it, expect } from 'vitest';
import { counterOfferFields, decideAcceptance, type AcceptableQuotation } from '../quotation-acceptance';

const PROJECT_ID = 'proj_big';
const project = { userId: 'cust_1' };

function quote(overrides: Partial<AcceptableQuotation> = {}): AcceptableQuotation {
  return {
    rfqId: PROJECT_ID,
    userId: 'cust_1',
    vendorId: 'vend_1',
    quotedPrice: 200000,
    leadTimeDays: 21,
    status: 'pending',
    negotiationHistory: [],
    ...overrides,
  };
}

const customerCounter = {
  party: 'customer' as const,
  price: 1,
  leadTime: 1,
  message: 'ok',
  createdAt: '2026-10-24T00:00:00.000Z',
};

describe('counterOfferFields', () => {
  it("never lets a customer's counter-offer change the binding price", () => {
    expect(counterOfferFields('customer', 1, 1)).toEqual({});
  });

  it('applies vendor and admin counter-offers', () => {
    expect(counterOfferFields('vendor', 180000, 18)).toEqual({ quotedPrice: 180000, leadTimeDays: 18 });
    expect(counterOfferFields('admin', 150000, 14)).toEqual({ quotedPrice: 150000, leadTimeDays: 14 });
  });
});

describe('decideAcceptance', () => {
  it("customer accepts the vendor's price", () => {
    expect(decideAcceptance(PROJECT_ID, project, quote(), 'customer')).toEqual({
      ok: true,
      price: 200000,
      leadTimeDays: 21,
    });
  });

  it('customer cannot accept their own counter-offer (the ₹1 attack)', () => {
    const decision = decideAcceptance(
      PROJECT_ID,
      project,
      quote({ status: 'revised', negotiationHistory: [customerCounter] }),
      'customer'
    );
    expect(decision).toMatchObject({ ok: false, code: 409 });
  });

  it("vendor accepting a counter-offer locks the customer's proposed price", () => {
    const decision = decideAcceptance(
      PROJECT_ID,
      project,
      quote({ status: 'revised', negotiationHistory: [{ ...customerCounter, price: 175000, leadTime: 20 }] }),
      'vendor'
    );
    expect(decision).toEqual({ ok: true, price: 175000, leadTimeDays: 20 });
  });

  it('vendor cannot accept its own price', () => {
    expect(decideAcceptance(PROJECT_ID, project, quote(), 'vendor')).toMatchObject({ ok: false, code: 409 });
    const ownCounter = { ...customerCounter, party: 'vendor' as const, price: 190000 };
    expect(
      decideAcceptance(PROJECT_ID, project, quote({ negotiationHistory: [customerCounter, ownCounter] }), 'vendor')
    ).toMatchObject({ ok: false, code: 409 });
  });

  it('rejects a quotation from another project', () => {
    const cheapBidElsewhere = quote({ rfqId: 'proj_small', quotedPrice: 500 });
    expect(decideAcceptance(PROJECT_ID, project, cheapBidElsewhere, 'customer')).toMatchObject({ ok: false, code: 404 });
    expect(decideAcceptance(PROJECT_ID, project, cheapBidElsewhere, 'admin')).toMatchObject({ ok: false, code: 404 });
  });

  it("rejects a quotation for another customer's project", () => {
    expect(decideAcceptance(PROJECT_ID, project, quote({ userId: 'cust_2' }), 'customer')).toMatchObject({
      ok: false,
      code: 404,
    });
  });

  it('rejects closed quotations', () => {
    for (const status of ['declined', 'cancelled', 'accepted']) {
      expect(decideAcceptance(PROJECT_ID, project, quote({ status }), 'customer')).toMatchObject({ ok: false, code: 409 });
    }
  });

  it('rejects missing or non-positive prices', () => {
    for (const quotedPrice of [0, -5, 'abc', undefined, Number.NaN]) {
      expect(decideAcceptance(PROJECT_ID, project, quote({ quotedPrice }), 'customer')).toMatchObject({ ok: false });
    }
  });

  it("admin accepts at the vendor's price even after a customer counter-offer", () => {
    expect(
      decideAcceptance(PROJECT_ID, project, quote({ status: 'revised', negotiationHistory: [customerCounter] }), 'admin')
    ).toEqual({ ok: true, price: 200000, leadTimeDays: 21 });
  });
});
