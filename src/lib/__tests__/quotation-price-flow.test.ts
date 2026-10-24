import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { collectionData as col, fakeDb, resetFakeFirestore } from './fake-firestore';

// ═══════════════════════════════════════════════════
// Audit C1, end to end through the real route handlers:
//   PATCH  /api/v1/projects/[id]/quotations/[qid]          (counter-offer)
//   POST   /api/v1/projects/[id]/quotations/[qid]/accept   (accept)
//   POST   /api/v1/payment/create-order                    (Razorpay amount)
// A customer must never be able to set the price they are charged.
// ═══════════════════════════════════════════════════

vi.mock('@/lib/firebase-admin', () => ({ getFirebaseAdmin: () => ({ adminFirestore: fakeDb }) }));
vi.mock('@/firebase/config', () => ({ db: {} }));

// Signed-in caller for the next request
let caller: { uid: string; role: string; status: string };
vi.mock('@/lib/auth-middleware', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth-middleware')>()),
  authenticateRequest: async () => ({ success: true, emailVerified: true, email: `${caller.uid}@x.test`, ...caller }),
}));

const razorpayOrders: Array<{ amount: number }> = [];
vi.mock('razorpay', () => ({
  default: class {
    orders = {
      create: async (o: { amount: number }) => {
        razorpayOrders.push(o);
        return { id: `order_rzp_${razorpayOrders.length}`, ...o };
      },
    };
  },
}));

const CUSTOMER = { uid: 'cust_1', role: 'customer', status: 'active' };
const VENDOR = { uid: 'vend_1', role: 'mechmaster', status: 'active' };
const OTHER_VENDOR = { uid: 'vend_2', role: 'mechmaster', status: 'active' };

const params = (projectId: string, quotationId: string) => ({ params: Promise.resolve({ projectId, quotationId }) });
const jsonReq = (url: string, method: string, body?: unknown) =>
  new NextRequest(`https://www.mechhub.in${url}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

async function counter(as: typeof caller, quotationId: string, price: number, projectId = 'proj_big') {
  caller = as;
  const { PATCH } = await import('@/app/api/v1/projects/[projectId]/quotations/[quotationId]/route');
  const res = await PATCH(
    jsonReq(`/api/v1/projects/${projectId}/quotations/${quotationId}`, 'PATCH', { price, leadTime: 10, message: 'offer' }),
    params(projectId, quotationId)
  );
  return { status: res.status, json: await res.json() };
}

async function accept(as: typeof caller, quotationId: string, projectId = 'proj_big') {
  caller = as;
  const { POST } = await import('@/app/api/v1/projects/[projectId]/quotations/[quotationId]/accept/route');
  const res = await POST(jsonReq(`/api/v1/projects/${projectId}/quotations/${quotationId}/accept`, 'POST'), params(projectId, quotationId));
  return { status: res.status, json: await res.json() };
}

async function payAdvance(projectId = 'proj_big') {
  caller = CUSTOMER;
  const { POST } = await import('@/app/api/v1/payment/create-order/route');
  const res = await POST(jsonReq('/api/v1/payment/create-order', 'POST', { rfqId: projectId, paymentType: 'advance' }));
  return { status: res.status, json: await res.json() };
}

beforeEach(() => {
  resetFakeFirestore();
  razorpayOrders.length = 0;
  process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
  process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret';

  // A large project open for bids, and a cheap one, both owned by the customer
  for (const [id, name] of [['proj_big', 'Gearbox housing x500'], ['proj_small', 'One bracket']]) {
    col('projectRFQs').set(id, {
      userId: CUSTOMER.uid,
      projectName: name,
      status: 'quote_requested',
      workflowStatus: 'RFQ_SENT',
      invitedVendorIds: [VENDOR.uid, OTHER_VENDOR.uid],
    });
  }
  col('quotations').set('q_big', {
    id: 'q_big', rfqId: 'proj_big', userId: CUSTOMER.uid, vendorId: VENDOR.uid, vendorName: 'Vendor One',
    quotedPrice: 200000, leadTimeDays: 21, status: 'pending', negotiationHistory: [],
  });
  col('quotations').set('q_small', {
    id: 'q_small', rfqId: 'proj_small', userId: CUSTOMER.uid, vendorId: OTHER_VENDOR.uid, vendorName: 'Vendor Two',
    quotedPrice: 500, leadTimeDays: 3, status: 'pending', negotiationHistory: [],
  });
});

describe('C1: customer cannot set their own price', () => {
  it('the ₹1 counter-offer attack fails at every step', async () => {
    const countered = await counter(CUSTOMER, 'q_big', 1);
    expect(countered.status).toBe(200);
    // Recorded as a proposal only — the binding price is unchanged
    const quote = col('quotations').get('q_big')!;
    expect(quote.quotedPrice).toBe(200000);
    expect(quote.negotiationHistory.at(-1)).toMatchObject({ party: 'customer', price: 1 });

    const accepted = await accept(CUSTOMER, 'q_big');
    expect(accepted.status).toBe(409);
    expect(col('projectRFQs').get('proj_big')!.quotedPrice).toBeUndefined();

    const paid = await payAdvance();
    expect(paid.status).toBe(400); // project never reached "accepted"
    expect(razorpayOrders).toHaveLength(0);
  });

  it("can't accept a cheap bid from another project onto this one", async () => {
    const res = await accept(CUSTOMER, 'q_small', 'proj_big');
    expect(res.status).toBe(404);
    expect(col('projectRFQs').get('proj_big')!.assignedVendorId).toBeUndefined();
    expect(col('quotations').get('q_small')!.status).toBe('pending');
  });

  it("vendor accepting the customer's counter-offer makes that the price charged", async () => {
    expect((await counter(CUSTOMER, 'q_big', 175000)).status).toBe(200);
    expect((await accept(CUSTOMER, 'q_big')).status).toBe(409); // customer can't accept their own offer

    const res = await accept(VENDOR, 'q_big');
    expect(res.status).toBe(200);
    expect(col('projectRFQs').get('proj_big')).toMatchObject({
      quotedPrice: 175000,
      assignedVendorId: VENDOR.uid,
      acceptedQuotationId: 'q_big',
      status: 'accepted',
    });
    expect(col('quotations').get('q_big')).toMatchObject({ status: 'accepted', quotedPrice: 175000 });

    const paid = await payAdvance();
    expect(paid.status).toBe(200);
    const { calculateProjectFinances } = await import('@/utils/finance');
    const expectedPaise = Math.round(calculateProjectFinances(175000).advance * 100);
    expect(paid.json.amount).toBe(expectedPaise);
    expect(razorpayOrders[0].amount).toBe(expectedPaise);
    expect(col('projectRFQs').get('proj_big')!.paymentStatus.advance.amountPaise).toBe(expectedPaise);
  });

  it("customer accepts the vendor's revised price", async () => {
    await counter(CUSTOMER, 'q_big', 150000);
    expect((await counter(VENDOR, 'q_big', 190000)).status).toBe(200);
    expect(col('quotations').get('q_big')!.quotedPrice).toBe(190000);

    expect((await accept(VENDOR, 'q_big')).status).toBe(409); // vendor can't accept its own price
    expect((await accept(CUSTOMER, 'q_big')).status).toBe(200);
    expect(col('projectRFQs').get('proj_big')!.quotedPrice).toBe(190000);
  });

  it('another vendor, or a suspended quoting vendor, cannot accept', async () => {
    await counter(CUSTOMER, 'q_big', 175000);
    expect((await accept(OTHER_VENDOR, 'q_big')).status).toBe(403);
    expect((await accept({ ...VENDOR, status: 'suspended' }, 'q_big')).status).toBe(403);
    expect(col('projectRFQs').get('proj_big')!.quotedPrice).toBeUndefined();
  });

  it('a declined quotation cannot be revived', async () => {
    col('quotations').get('q_big')!.status = 'declined';
    expect((await accept(CUSTOMER, 'q_big')).status).toBe(409);
  });
});
