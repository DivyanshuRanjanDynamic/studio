import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';

// ═══════════════════════════════════════════════════
// Razorpay webhook: raw-body signature, idempotent fulfilment shared with the
// browser verify routes, failures and refunds.
// ═══════════════════════════════════════════════════

import { collectionData as col, failNextFakeTransaction, fakeDb, resetFakeFirestore } from './fake-firestore';

vi.mock('@/lib/firebase-admin', () => ({ getFirebaseAdmin: () => ({ adminFirestore: fakeDb }) }));
vi.mock('@/firebase/config', () => ({ db: {} }));
const sendAllAsync = vi.fn();
vi.mock('@/services/notification.service', () => ({ NotificationService: { sendAllAsync: (...a: unknown[]) => sendAllAsync(...a) } }));

// ── Helpers ──────────────────────────────────────────────────────────
const SECRET = 'whsec_test_0123456789abcdef';
const sign = (body: string, secret = SECRET) => createHmac('sha256', secret).update(body).digest('hex');

let eventSeq = 0;
function paymentEvent(event: string, payment: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  return { entity: 'event', event, contains: ['payment'], payload: { payment: { entity: payment }, ...extra }, created_at: 1 };
}

async function deliver(body: unknown, opts: { eventId?: string; signature?: string; raw?: string } = {}) {
  const raw = opts.raw ?? JSON.stringify(body);
  const req = new NextRequest('https://www.mechhub.in/api/v1/payment/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-razorpay-signature': opts.signature ?? sign(raw),
      'x-razorpay-event-id': opts.eventId ?? `evt_${++eventSeq}`,
    },
    body: raw,
  });
  const { POST } = await import('@/app/api/v1/payment/webhook/route');
  const res = await POST(req);
  return { status: res.status, json: await res.json() };
}

const payments = () => [...col('payments').values()];

beforeEach(() => {
  resetFakeFirestore();
  sendAllAsync.mockReset();
  process.env.RAZORPAY_WEBHOOK_SECRET = SECRET;
  process.env.RAZORPAY_KEY_SECRET = 'rzp_key_secret_test';
});
afterEach(() => {
  delete process.env.RAZORPAY_WEBHOOK_SECRET;
});

// ── Signature helpers ────────────────────────────────────────────────
describe('razorpay-signature', () => {
  it('verifies the webhook signature over the exact raw body', async () => {
    const { verifyWebhookSignature } = await import('@/lib/razorpay-signature');
    const raw = '{"event":"payment.captured","payload":{}}';
    expect(verifyWebhookSignature(raw, sign(raw), SECRET)).toBe(true);
    // Re-serialised JSON (different whitespace) is different bytes
    expect(verifyWebhookSignature('{"event": "payment.captured", "payload": {}}', sign(raw), SECRET)).toBe(false);
    expect(verifyWebhookSignature(raw, sign(raw, 'other-secret'), SECRET)).toBe(false);
    expect(verifyWebhookSignature(raw, 'not-hex', SECRET)).toBe(false);
    expect(verifyWebhookSignature(raw, null, SECRET)).toBe(false);
    expect(verifyWebhookSignature(raw, sign(raw), '')).toBe(false);
  });

  it('verifies checkout signatures (order_id|payment_id with the key secret)', async () => {
    const { verifyPaymentSignature } = await import('@/lib/razorpay-signature');
    const sig = createHmac('sha256', 'k').update('order_1|pay_1').digest('hex');
    expect(verifyPaymentSignature('order_1', 'pay_1', sig, 'k')).toBe(true);
    expect(verifyPaymentSignature('order_2', 'pay_1', sig, 'k')).toBe(false);
    expect(verifyPaymentSignature('order_1', 'pay_1', sig, '')).toBe(false);
  });
});

// ── Route ────────────────────────────────────────────────────────────
describe('POST /api/v1/payment/webhook', () => {
  it('refuses to run without a webhook secret', async () => {
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    const { status } = await deliver(paymentEvent('payment.captured', { id: 'pay_1', order_id: 'order_rzp_1', amount: 100 }));
    expect(status).toBe(503);
  });

  it('rejects a bad signature and writes nothing', async () => {
    col('orders').set('order_q1', { userId: 'u1', razorpayOrderId: 'order_rzp_1', total: 1180, paymentStatus: 'pending' });
    const { status } = await deliver(
      paymentEvent('payment.captured', { id: 'pay_1', order_id: 'order_rzp_1', amount: 118000 }),
      { signature: sign('something else') }
    );
    expect(status).toBe(401);
    expect(col('orders').get('order_q1')!.paymentStatus).toBe('pending');
    expect(col('razorpay_webhook_events').size).toBe(0);
  });

  it('marks a quote order paid, syncs its project milestone, and is idempotent', async () => {
    col('orders').set('order_q1', {
      userId: 'u1',
      razorpayOrderId: 'order_rzp_1',
      total: 1180,
      paymentStatus: 'pending',
      status: 'quoted',
      projectId: 'proj_1',
      isAdvance: true,
    });
    col('projectRFQs').set('proj_1', { userId: 'u1', status: 'accepted' });

    const event = paymentEvent('payment.captured', { id: 'pay_1', order_id: 'order_rzp_1', amount: 118000 });
    const first = await deliver(event, { eventId: 'evt_A' });
    expect(first).toEqual({ status: 200, json: { received: true, outcome: 'paid' } });

    const order = col('orders').get('order_q1')!;
    expect(order).toMatchObject({ paymentStatus: 'paid', status: 'paid', razorpayPaymentId: 'pay_1' });
    const project = col('projectRFQs').get('proj_1')!;
    // A real nested path — not a literal "paymentStatus.advance" field
    expect(project.paymentStatus.advance).toMatchObject({ paid: true, razorpayPaymentId: 'pay_1', amount: 1180 });
    expect(project['paymentStatus.advance']).toBeUndefined();
    expect(project.status).toBe('in_production');
    expect(payments()).toHaveLength(1);
    expect(payments()[0]).toMatchObject({ orderId: 'order_q1', amount: 1180 });

    // Razorpay retries the same event, then sends order.paid for the same payment
    expect((await deliver(event, { eventId: 'evt_A' })).json.outcome).toBe('duplicate');
    const orderPaid = paymentEvent(
      'order.paid',
      { id: 'pay_1', order_id: 'order_rzp_1', amount: 118000 },
      { order: { entity: { id: 'order_rzp_1', amount: 118000, status: 'paid' } } }
    );
    expect((await deliver(orderPaid)).json.outcome).toBe('already_paid');
    expect(payments()).toHaveLength(1);
  });

  it('webhook after the browser verify route records nothing twice', async () => {
    col('orders').set('order_q1', { userId: 'u1', razorpayOrderId: 'order_rzp_1', total: 500, paymentStatus: 'pending' });
    const { PaymentFulfilmentService } = await import('@/services/payment-fulfilment.service');

    const viaVerify = await PaymentFulfilmentService.markQuoteOrderPaid('order_q1', {
      razorpayOrderId: 'order_rzp_1',
      razorpayPaymentId: 'pay_1',
    });
    expect(viaVerify.success && viaVerify.data.outcome).toBe('paid');

    const viaWebhook = await deliver(paymentEvent('payment.captured', { id: 'pay_1', order_id: 'order_rzp_1', amount: 50000 }));
    expect(viaWebhook.json.outcome).toBe('already_paid');
    expect(payments()).toHaveLength(1);
  });

  it('does not mark paid when the captured amount differs from the order', async () => {
    col('orders').set('order_q1', { userId: 'u1', razorpayOrderId: 'order_rzp_1', total: 1180, paymentStatus: 'pending' });
    const { json } = await deliver(paymentEvent('payment.captured', { id: 'pay_1', order_id: 'order_rzp_1', amount: 100 }));
    expect(json.outcome).toBe('amount_mismatch');
    const order = col('orders').get('order_q1')!;
    expect(order.paymentStatus).toBe('pending');
    expect(order.paymentAnomaly).toMatchObject({ capturedPaise: 100, expectedPaise: 118000 });
    expect(payments()).toHaveLength(0);
  });

  it('acknowledges payments for Razorpay orders we never created', async () => {
    const { status, json } = await deliver(paymentEvent('payment.captured', { id: 'pay_x', order_id: 'order_unknown', amount: 100 }));
    expect(status).toBe(200);
    expect(json.outcome).toBe('unmatched');
  });

  it('asks Razorpay to retry on a transient database error, then applies the retry', async () => {
    col('orders').set('order_q1', { userId: 'u1', razorpayOrderId: 'order_rzp_1', total: 10, paymentStatus: 'pending' });
    const event = paymentEvent('payment.captured', { id: 'pay_1', order_id: 'order_rzp_1', amount: 1000 });

    failNextFakeTransaction();
    const failed = await deliver(event, { eventId: 'evt_R' });
    expect(failed.status).toBe(500);
    expect(col('razorpay_webhook_events').get('evt_R')!.status).toBe('failed');

    const retried = await deliver(event, { eventId: 'evt_R' });
    expect(retried.json.outcome).toBe('paid');
    expect(col('orders').get('order_q1')!.paymentStatus).toBe('paid');
  });

  it('finalises a shop order and decrements stock once', async () => {
    col('products').set('prod_1', { name: 'Bolt kit', inventory: 10 });
    col('orders').set('shop_1', {
      userId: 'u1',
      razorpayOrderId: 'order_rzp_s',
      items: [{ id: 'prod_1', name: 'Bolt kit', quantity: 3, price: 100 }],
      pricing: { subtotal: 300, gst: 54, shipping: 0, total: 354 },
      paymentStatus: 'unpaid',
      status: 'pending',
    });

    const event = paymentEvent('payment.captured', { id: 'pay_s', order_id: 'order_rzp_s', amount: 35400 });
    expect((await deliver(event)).json.outcome).toBe('paid');
    expect((await deliver(event)).json.outcome).toBe('already_paid');

    expect(col('products').get('prod_1')!.inventory).toBe(7);
    expect(col('orders').get('shop_1')).toMatchObject({ paymentStatus: 'paid', status: 'paid' });
    expect(payments()).toHaveLength(1);
  });

  it('records a paid shop order as a stock conflict instead of leaving it unpaid', async () => {
    col('products').set('prod_1', { name: 'Bolt kit', inventory: 1 });
    col('orders').set('shop_1', {
      userId: 'u1',
      razorpayOrderId: 'order_rzp_s',
      items: [{ id: 'prod_1', quantity: 3 }],
      pricing: { total: 354 },
      paymentStatus: 'unpaid',
    });
    expect((await deliver(paymentEvent('payment.captured', { id: 'pay_s', order_id: 'order_rzp_s', amount: 35400 }))).json.outcome).toBe('paid');
    expect(col('orders').get('shop_1')).toMatchObject({ paymentStatus: 'paid', status: 'stock_conflict' });
    expect(col('products').get('prod_1')!.inventory).toBe(1);
  });

  it('marks a project milestone paid and emails once', async () => {
    col('users').set('u2', { email: 'buyer.account@example.com', fullName: 'Buyer' });
    col('projectRFQs').set('proj_2', {
      userId: 'u2',
      userEmail: 'buyer@example.com',
      projectName: 'Gearbox housing',
      quotedPrice: 10000,
      status: 'accepted',
      paymentStatus: { advance: { razorpayOrderId: 'order_rzp_m', amountPaise: 597500, paid: false } },
    });

    const event = paymentEvent('payment.captured', { id: 'pay_m', order_id: 'order_rzp_m', amount: 597500 });
    expect((await deliver(event)).json.outcome).toBe('paid');
    expect((await deliver(event)).json.outcome).toBe('already_paid');

    const project = col('projectRFQs').get('proj_2')!;
    expect(project.paymentStatus.advance).toMatchObject({ paid: true, razorpayPaymentId: 'pay_m', amountPaise: 597500 });
    expect(project.status).toBe('in_progress');
    expect(payments()).toEqual([expect.objectContaining({ rfqId: 'proj_2', paymentType: 'advance', amount: 5975 })]);
    expect(sendAllAsync).toHaveBeenCalledTimes(1);
    expect(sendAllAsync.mock.calls[0][0][0]).toMatchObject({
      type: 'payment_advance_confirmed',
      customer: { email: 'buyer.account@example.com' }, // account email, not the project's userEmail
    });
  });

  it('records payment failures without undoing a payment', async () => {
    col('orders').set('order_q1', { userId: 'u1', razorpayOrderId: 'order_rzp_1', total: 10, paymentStatus: 'pending' });
    const failed = paymentEvent('payment.failed', {
      id: 'pay_f',
      order_id: 'order_rzp_1',
      amount: 1000,
      status: 'failed',
      error_code: 'BAD_REQUEST_ERROR',
      error_description: 'Card declined',
    });
    expect((await deliver(failed)).json.outcome).toBe('failure_recorded');
    expect(col('orders').get('order_q1')).toMatchObject({
      paymentStatus: 'pending',
      lastPaymentFailure: { razorpayPaymentId: 'pay_f', errorDescription: 'Card declined' },
    });

    await deliver(paymentEvent('payment.captured', { id: 'pay_ok', order_id: 'order_rzp_1', amount: 1000 }));
    await deliver({ ...failed, payload: { payment: { entity: { ...failed.payload.payment.entity, id: 'pay_f2' } } } });
    const order = col('orders').get('order_q1')!;
    expect(order.paymentStatus).toBe('paid');
    expect(order.lastPaymentFailure.razorpayPaymentId).toBe('pay_f');
  });

  it('tracks partial then full refunds, idempotently per refund id', async () => {
    col('orders').set('order_q1', { userId: 'u1', razorpayOrderId: 'order_rzp_1', total: 1000, paymentStatus: 'paid' });
    const refundEvent = (id: string, amount: number, event = 'refund.processed') => ({
      entity: 'event',
      event,
      contains: ['refund', 'payment'],
      payload: {
        refund: { entity: { id, payment_id: 'pay_1', amount, status: 'processed' } },
        payment: { entity: { id: 'pay_1', order_id: 'order_rzp_1', amount: 100000 } },
      },
    });

    expect((await deliver(refundEvent('rfnd_1', 40000))).json.outcome).toBe('refund_recorded');
    expect(col('orders').get('order_q1')).toMatchObject({ paymentStatus: 'partially_refunded', refundedPaise: 40000 });

    await deliver(refundEvent('rfnd_1', 40000)); // same refund again, new event id
    expect(col('orders').get('order_q1')!.refundedPaise).toBe(40000);

    await deliver(refundEvent('rfnd_2', 1, 'refund.failed'));
    expect(col('orders').get('order_q1')!.refundedPaise).toBe(40000);

    await deliver(refundEvent('rfnd_3', 60000));
    expect(col('orders').get('order_q1')).toMatchObject({ paymentStatus: 'refunded', refundedPaise: 100000 });
    expect(col('orders').get('order_q1')!.refunds.rfnd_2.status).toBe('failed');
  });

  it('ignores events it does not handle', async () => {
    const { status, json } = await deliver({ entity: 'event', event: 'payment.authorized', payload: {} });
    expect(status).toBe(200);
    expect(json.outcome).toBe('ignored');
  });
});

// ── Shared fulfilment: the order-id binding (audit finding H3) ───────
describe('PaymentFulfilmentService order binding', () => {
  it("won't mark an order paid with a payment for a different Razorpay order", async () => {
    const { PaymentFulfilmentService } = await import('@/services/payment-fulfilment.service');
    col('orders').set('legacy', { userId: 'u1', total: 500000, paymentStatus: 'pending' }); // no razorpayOrderId
    col('orders').set('order_q1', { userId: 'u1', razorpayOrderId: 'order_rzp_1', total: 500000, paymentStatus: 'pending' });

    for (const orderId of ['legacy', 'order_q1']) {
      const result = await PaymentFulfilmentService.markQuoteOrderPaid(orderId, {
        razorpayOrderId: 'order_rzp_cheap',
        razorpayPaymentId: 'pay_cheap',
      });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.statusCode).toBe(403);
      expect(col('orders').get(orderId)!.paymentStatus).toBe('pending');
    }
  });

  it('acknowledges (does not retry) a webhook whose record no longer matches', async () => {
    col('orders').set('order_q1', { userId: 'u1', razorpayOrderId: 'order_rzp_1', total: 10, paymentStatus: 'pending' });
    // Same Razorpay order, but the stored record changed between lookup and fulfilment
    const { PaymentFulfilmentService } = await import('@/services/payment-fulfilment.service');
    const spy = vi
      .spyOn(PaymentFulfilmentService, 'findTarget')
      .mockResolvedValueOnce({ success: true, data: { kind: 'quote_order', orderId: 'missing_order' } } as never);
    const { status, json } = await deliver(paymentEvent('payment.captured', { id: 'pay_1', order_id: 'order_rzp_1', amount: 1000 }));
    spy.mockRestore();
    expect(status).toBe(200);
    expect(json.outcome).toBe('rejected');
  });
});
