import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { NotificationService } from '@/services/notification.service';
import { projectOwnerContact } from '@/lib/project-contact';
import { calculateProjectFinances } from '@/utils/finance';
import { Result, ok, err } from '@/utils/result';
import { AppError, ErrorCode, internalError, notFoundError } from '@/utils/errors';
import { logger } from '@/utils/logger';

// ═══════════════════════════════════════════════════
// PaymentFulfilmentService — records a Razorpay payment against what it paid for.
//
// Called both by the browser's verify routes (after checkout) and by the Razorpay
// webhook, in either order and any number of times, so every write is a Firestore
// transaction that is a no-op once the record is paid. A payment only counts for a
// record whose stored razorpayOrderId is the one Razorpay paid — the checkout
// signature proves *a* payment happened, not which record it was for.
//
// Three kinds of record take payments:
//   quote_order        orders/{order_…}       /api/v1/order/create  (quotes, project via cart)
//   shop_order         orders/{auto id}       /api/v1/shop/checkout (has `pricing`)
//   project_milestone  projectRFQs/{id}.paymentStatus.{advance|completion}  /api/v1/payment/create-order
// ═══════════════════════════════════════════════════

export type MilestoneType = 'advance' | 'completion';

export type PaymentTarget =
  | { readonly kind: 'quote_order'; readonly orderId: string }
  | { readonly kind: 'shop_order'; readonly orderId: string }
  | { readonly kind: 'project_milestone'; readonly rfqId: string; readonly paymentType: MilestoneType };

export interface CapturedPayment {
  readonly razorpayOrderId: string;
  readonly razorpayPaymentId: string;
  /** What Razorpay captured, in paise. Checked against the record when both are known. */
  readonly amountPaise?: number;
}

export interface FulfilmentResult {
  /** paid: this call recorded it · already_paid: an earlier call did · amount_mismatch: not recorded */
  readonly outcome: 'paid' | 'already_paid' | 'amount_mismatch';
  readonly paidAt: string | null;
}

export interface PaymentFailure {
  readonly razorpayOrderId: string;
  readonly razorpayPaymentId: string;
  readonly errorCode?: string | null;
  readonly errorDescription?: string | null;
}

export interface RefundUpdate {
  readonly refundId: string;
  readonly razorpayPaymentId: string;
  readonly amountPaise: number;
  readonly status: 'processed' | 'failed';
}

const ORDERS = 'orders';
const PROJECTS = 'projectRFQs';
const PAYMENTS = 'payments';
const PAID_STATES = ['paid', 'refunded', 'partially_refunded'];

const toPaise = (rupees: unknown): number | null => {
  const n = Number(rupees);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
};

function unavailable(): AppError {
  return new AppError({
    code: ErrorCode.SERVICE_UNAVAILABLE,
    message: 'Payment records are unavailable. Please try again shortly.',
    statusCode: 503,
  });
}

function orderMismatch(context: Record<string, unknown>): AppError {
  return new AppError({
    code: ErrorCode.PAYMENT_VERIFICATION_FAILED,
    message: 'Payment order does not match this record',
    statusCode: 403,
    context,
  });
}

/** Shop orders carry `pricing.total`; quote orders carry `total` */
function orderKind(order: Record<string, any>): 'shop_order' | 'quote_order' {
  return typeof order?.pricing?.total === 'number' ? 'shop_order' : 'quote_order';
}

function expectedOrderPaise(order: Record<string, any>): number | null {
  return orderKind(order) === 'shop_order' ? toPaise(order.pricing.total) : toPaise(order.total);
}

/** Runs `fn` in a transaction; AppErrors thrown inside come back as err() */
async function inTransaction<T>(
  event: string,
  fn: (db: any, tx: any) => Promise<T>
): Promise<Result<T, AppError>> {
  const { adminFirestore: db } = getFirebaseAdmin();
  if (!db) return err(unavailable());
  try {
    return ok(await db.runTransaction((tx: any) => fn(db, tx)));
  } catch (e: any) {
    if (e instanceof AppError) return err(e);
    logger.error({ event, error: e?.message ?? String(e) });
    return err(internalError('Failed to update payment status'));
  }
}

function amountMismatch(
  tx: any,
  ref: any,
  field: string,
  payment: CapturedPayment,
  expectedPaise: number | null,
  now: string
): FulfilmentResult {
  logger.error({
    event: 'PaymentFulfilment: captured amount does not match the record',
    razorpayOrderId: payment.razorpayOrderId,
    razorpayPaymentId: payment.razorpayPaymentId,
    capturedPaise: payment.amountPaise,
    expectedPaise,
  });
  tx.update(ref, {
    [field]: {
      razorpayPaymentId: payment.razorpayPaymentId,
      capturedPaise: payment.amountPaise ?? null,
      expectedPaise,
      at: now,
    },
    updatedAt: now,
  });
  return { outcome: 'amount_mismatch', paidAt: null };
}

const differs = (captured: number | undefined, expected: number | null) =>
  typeof captured === 'number' && expected !== null && captured !== expected;

export const PaymentFulfilmentService = {
  /** Which record a Razorpay order paid for, from the ids stored when it was created */
  async findTarget(razorpayOrderId: string): Promise<Result<PaymentTarget | null, AppError>> {
    const { adminFirestore: db } = getFirebaseAdmin();
    if (!db) return err(unavailable());
    try {
      const orders = await db.collection(ORDERS).where('razorpayOrderId', '==', razorpayOrderId).limit(2).get();
      if (orders.size > 1) {
        logger.error({ event: 'PaymentFulfilment: Razorpay order on several orders', razorpayOrderId });
        return err(internalError('Razorpay order is linked to more than one order'));
      }
      if (orders.size === 1) {
        const doc = orders.docs[0];
        return ok({ kind: orderKind(doc.data()), orderId: doc.id });
      }

      for (const paymentType of ['advance', 'completion'] as const) {
        const projects = await db
          .collection(PROJECTS)
          .where(`paymentStatus.${paymentType}.razorpayOrderId`, '==', razorpayOrderId)
          .limit(1)
          .get();
        if (projects.size === 1) {
          return ok({ kind: 'project_milestone', rfqId: projects.docs[0].id, paymentType });
        }
      }
      return ok(null);
    } catch (e: any) {
      logger.error({ event: 'PaymentFulfilment: target lookup failed', razorpayOrderId, error: e?.message });
      return err(internalError('Failed to look up the payment record'));
    }
  },

  /** Records a payment for its target */
  async fulfil(target: PaymentTarget, payment: CapturedPayment): Promise<Result<FulfilmentResult, AppError>> {
    switch (target.kind) {
      case 'quote_order':
        return PaymentFulfilmentService.markQuoteOrderPaid(target.orderId, payment);
      case 'shop_order':
        return PaymentFulfilmentService.markShopOrderPaid(target.orderId, payment);
      case 'project_milestone':
        return PaymentFulfilmentService.markMilestonePaid(target.rfqId, target.paymentType, payment);
    }
  },

  /** Quote order paid; a linked project's advance/balance milestone with it */
  async markQuoteOrderPaid(orderId: string, payment: CapturedPayment): Promise<Result<FulfilmentResult, AppError>> {
    return inTransaction('PaymentFulfilment: quote order failed', async (db, tx) => {
      const orderRef = db.collection(ORDERS).doc(orderId);
      const snap = await tx.get(orderRef);
      if (!snap.exists) throw notFoundError('Order', orderId);
      const order = snap.data();

      if (!order.razorpayOrderId || order.razorpayOrderId !== payment.razorpayOrderId) {
        throw orderMismatch({ orderId, razorpayOrderId: payment.razorpayOrderId });
      }
      if (PAID_STATES.includes(order.paymentStatus)) {
        return { outcome: 'already_paid', paidAt: order.paidAt ?? null } as FulfilmentResult;
      }

      // Reads before writes: the linked project, if any.
      const projectRef = order.projectId ? db.collection(PROJECTS).doc(order.projectId) : null;
      const projectSnap = projectRef ? await tx.get(projectRef) : null;

      const now = new Date().toISOString();
      const expected = expectedOrderPaise(order);
      if (differs(payment.amountPaise, expected)) {
        return amountMismatch(tx, orderRef, 'paymentAnomaly', payment, expected, now);
      }

      tx.update(orderRef, {
        paymentStatus: 'paid',
        status: 'paid',
        razorpayPaymentId: payment.razorpayPaymentId,
        paidAt: now,
        updatedAt: now,
      });

      const milestone: MilestoneType | null = order.isAdvance ? 'advance' : order.isBalance ? 'completion' : null;
      if (projectRef && projectSnap?.exists && milestone) {
        // update() reads dotted keys as field paths (set+merge would store a literal
        // "paymentStatus.advance" field and leave the double-pay check blind).
        tx.update(projectRef, {
          status: milestone === 'advance' ? 'in_production' : 'delivered',
          [`paymentStatus.${milestone}`]: {
            paid: true,
            paidAt: now,
            razorpayOrderId: payment.razorpayOrderId,
            razorpayPaymentId: payment.razorpayPaymentId,
            amount: order.total,
          },
          updatedAt: now,
        });
      }

      tx.set(db.collection(PAYMENTS).doc(), {
        orderId,
        userId: order.userId ?? null,
        type: 'quote_order',
        projectId: order.projectId ?? null,
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: payment.razorpayPaymentId,
        amount: (payment.amountPaise ?? expected ?? 0) / 100,
        currency: 'INR',
        paidAt: now,
        createdAt: now,
      });

      return { outcome: 'paid', paidAt: now } as FulfilmentResult;
    });
  },

  /**
   * Shop order paid; stock decremented. Money already taken is always recorded:
   * if stock ran out meanwhile the order is flagged `stock_conflict` for an admin
   * (refund or restock) instead of being left unpaid.
   */
  async markShopOrderPaid(orderId: string, payment: CapturedPayment): Promise<Result<FulfilmentResult, AppError>> {
    return inTransaction('PaymentFulfilment: shop order failed', async (db, tx) => {
      const orderRef = db.collection(ORDERS).doc(orderId);
      const snap = await tx.get(orderRef);
      if (!snap.exists) throw notFoundError('Order', orderId);
      const order = snap.data();

      if (!order.razorpayOrderId || order.razorpayOrderId !== payment.razorpayOrderId) {
        throw orderMismatch({ orderId, razorpayOrderId: payment.razorpayOrderId });
      }
      if (PAID_STATES.includes(order.paymentStatus)) {
        return { outcome: 'already_paid', paidAt: order.paidAt ?? null } as FulfilmentResult;
      }

      const items: Array<{ id: string; name?: string; quantity: number }> = Array.isArray(order.items) ? order.items : [];

      const now = new Date().toISOString();
      const expected = expectedOrderPaise(order);
      if (differs(payment.amountPaise, expected)) {
        // Still need product refs for the amount-mismatch path
        await Promise.all(items.map((item) => tx.get(db.collection('products').doc(item.id))));
        return amountMismatch(tx, orderRef, 'paymentAnomaly', payment, expected, now);
      }

      // BUG-3 fix: when stock was reserved atomically at order creation, skip the
      // decrement here — it was already done. Only legacy orders (shopStockReserved
      // absent/false) still need the read-check-decrement path.
      let orderStatus: string;
      if (order.shopStockReserved) {
        orderStatus = 'paid';
      } else {
        const products = await Promise.all(items.map((item) => tx.get(db.collection('products').doc(item.id))));
        const short = items.filter((item, i) => !products[i].exists || Number(products[i].data()?.inventory ?? 0) < item.quantity);
        if (short.length === 0) {
          // C6 fix: use FieldValue.increment for atomic decrement
          items.forEach((item, i) => {
            tx.update(products[i].ref, { inventory: FieldValue.increment(-item.quantity), updatedAt: now });
          });
          orderStatus = 'paid';
        } else {
          logger.error({
            event: 'PaymentFulfilment: shop order paid but out of stock',
            orderId,
            productIds: short.map((item) => item.id),
          });
          orderStatus = 'stock_conflict';
        }
      }

      tx.update(orderRef, {
        status: orderStatus,
        paymentStatus: 'paid',
        razorpayPaymentId: payment.razorpayPaymentId,
        paidAt: now,
        updatedAt: now,
      });

      tx.set(db.collection(PAYMENTS).doc(), {
        orderId,
        userId: order.userId ?? null,
        type: 'shop_purchase',
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: payment.razorpayPaymentId,
        amount: (payment.amountPaise ?? expected ?? 0) / 100,
        currency: 'INR',
        paidAt: now,
        createdAt: now,
      });

      return { outcome: 'paid', paidAt: now } as FulfilmentResult;
    });
  },

  /** Project advance/balance paid (payment/create-order flow); emails go out once */
  async markMilestonePaid(
    rfqId: string,
    paymentType: MilestoneType,
    payment: CapturedPayment
  ): Promise<Result<FulfilmentResult, AppError>> {
    let project: Record<string, any> | null = null;

    const result = await inTransaction('PaymentFulfilment: milestone failed', async (db, tx) => {
      const rfqRef = db.collection(PROJECTS).doc(rfqId);
      const snap = await tx.get(rfqRef);
      if (!snap.exists) throw notFoundError('ProjectRFQ', rfqId);
      const rfq = snap.data();
      const stored = rfq.paymentStatus?.[paymentType];

      if (!stored?.razorpayOrderId || stored.razorpayOrderId !== payment.razorpayOrderId) {
        throw orderMismatch({ rfqId, paymentType, razorpayOrderId: payment.razorpayOrderId });
      }
      if (stored.paid) {
        return { outcome: 'already_paid', paidAt: stored.paidAt ?? null } as FulfilmentResult;
      }

      const now = new Date().toISOString();
      const expected = typeof stored.amountPaise === 'number' ? stored.amountPaise : null;
      if (differs(payment.amountPaise, expected)) {
        return amountMismatch(tx, rfqRef, `paymentStatus.${paymentType}.anomaly`, payment, expected, now);
      }

      tx.update(rfqRef, {
        [`paymentStatus.${paymentType}.paid`]: true,
        [`paymentStatus.${paymentType}.razorpayPaymentId`]: payment.razorpayPaymentId,
        [`paymentStatus.${paymentType}.paidAt`]: now,
        // Advance paid → manufacturing can begin; final payment → order complete
        status: paymentType === 'advance' ? 'in_progress' : 'completed',
        updatedAt: now,
      });

      const finances = calculateProjectFinances(rfq.finalPrice || rfq.quotedPrice || 0);
      const fallbackAmount = paymentType === 'advance' ? finances.advance : finances.balance;
      tx.set(db.collection(PAYMENTS).doc(), {
        rfqId,
        userId: rfq.userId ?? null,
        paymentType,
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: payment.razorpayPaymentId,
        amount: (payment.amountPaise ?? expected ?? Math.round(fallbackAmount * 100)) / 100,
        currency: 'INR',
        paidAt: now,
        createdAt: now,
      });

      project = rfq;
      return { outcome: 'paid', paidAt: now } as FulfilmentResult;
    });

    if (result.success && result.data.outcome === 'paid' && project) {
      await notifyMilestonePaid(rfqId, paymentType, project);
    }
    return result;
  },

  /** A failed attempt: noted on the record (the customer may retry the same order) */
  async recordFailure(target: PaymentTarget, failure: PaymentFailure): Promise<Result<void, AppError>> {
    return inTransaction('PaymentFulfilment: failure record failed', async (db, tx) => {
      const isOrder = target.kind !== 'project_milestone';
      const ref = db.collection(isOrder ? ORDERS : PROJECTS).doc(isOrder ? target.orderId : target.rfqId);
      const snap = await tx.get(ref);
      if (!snap.exists) return;
      const data = snap.data();
      const alreadyPaid = isOrder
        ? PAID_STATES.includes(data.paymentStatus)
        : Boolean(data.paymentStatus?.[(target as { paymentType: MilestoneType }).paymentType]?.paid);
      if (alreadyPaid) return; // a later failed retry doesn't undo a payment

      const now = new Date().toISOString();
      const field = isOrder
        ? 'lastPaymentFailure'
        : `paymentStatus.${(target as { paymentType: MilestoneType }).paymentType}.lastFailure`;
      tx.update(ref, {
        [field]: {
          razorpayOrderId: failure.razorpayOrderId,
          razorpayPaymentId: failure.razorpayPaymentId,
          errorCode: failure.errorCode ?? null,
          errorDescription: failure.errorDescription ?? null,
          at: now,
        },
        updatedAt: now,
      });
    });
  },

  /**
   * Refund outcome, keyed by refund id (repeat events overwrite the same entry).
   * Orders move to partially_refunded / refunded; milestones keep `paid` and gain
   * `refunded` once the whole amount is back.
   */
  async recordRefund(target: PaymentTarget, refund: RefundUpdate): Promise<Result<void, AppError>> {
    return inTransaction('PaymentFulfilment: refund record failed', async (db, tx) => {
      const isOrder = target.kind !== 'project_milestone';
      const ref = db.collection(isOrder ? ORDERS : PROJECTS).doc(isOrder ? target.orderId : target.rfqId);
      const snap = await tx.get(ref);
      if (!snap.exists) throw notFoundError(isOrder ? 'Order' : 'ProjectRFQ', ref.id);
      const data = snap.data();

      const paymentType = isOrder ? null : (target as { paymentType: MilestoneType }).paymentType;
      const holder = isOrder ? data : data.paymentStatus?.[paymentType as MilestoneType] ?? {};
      const prefix = isOrder ? '' : `paymentStatus.${paymentType}.`;

      const now = new Date().toISOString();
      const entry = {
        razorpayPaymentId: refund.razorpayPaymentId,
        amountPaise: refund.amountPaise,
        status: refund.status,
        at: now,
      };
      const refunds: Record<string, { amountPaise: number; status: string }> = {
        ...(holder.refunds ?? {}),
        [refund.refundId]: entry,
      };
      const refundedPaise = Object.values(refunds)
        .filter((r) => r.status === 'processed')
        .reduce((sum, r) => sum + Number(r.amountPaise || 0), 0);

      const paidPaise = isOrder
        ? expectedOrderPaise(data)
        : typeof holder.amountPaise === 'number'
          ? holder.amountPaise
          : null;
      const fully = paidPaise !== null && refundedPaise >= paidPaise;

      const updates: Record<string, unknown> = {
        [`${prefix}refunds.${refund.refundId}`]: entry,
        [`${prefix}refundedPaise`]: refundedPaise,
        updatedAt: now,
      };
      if (refundedPaise > 0) {
        if (isOrder) updates.paymentStatus = fully ? 'refunded' : 'partially_refunded';
        else updates[`${prefix}refunded`] = fully;
      }
      tx.update(ref, updates);
    });
  },
};

/** Customer + admin emails for a project milestone, sent by whichever path recorded it */
async function notifyMilestonePaid(rfqId: string, paymentType: MilestoneType, rfq: Record<string, any>): Promise<void> {
  // Account email, never the project's client-editable userEmail/contactEmail
  const contact = await projectOwnerContact(rfq).catch(() => null);
  if (!contact) {
    logger.warn({ event: 'PaymentFulfilment: no account email for payment confirmation', rfqId });
    return;
  }
  const { name: customerName, email: customerEmail } = contact;

  const customerPhone = rfq.userPhone || rfq.contactPhone || rfq.phone || '';
  const projectName = rfq.projectName || 'MechHub Project';
  const finances = calculateProjectFinances(rfq.finalPrice || rfq.quotedPrice || 0);

  if (paymentType === 'advance') {
    NotificationService.sendAllAsync([
      {
        type: 'payment_advance_confirmed',
        customer: { email: customerEmail, name: customerName },
        projectName,
        projectId: rfqId,
        amountPaid: finances.advance,
        balanceDue: finances.balance,
      },
      {
        type: 'admin_payment_received',
        customerName,
        customerEmail,
        projectName,
        projectId: rfqId,
        paymentType: 'advance',
        amount: finances.advance,
        customerPhone,
      },
    ]);
  } else {
    NotificationService.sendAllAsync([
      {
        type: 'payment_balance_confirmed',
        customer: { email: customerEmail, name: customerName },
        projectName,
        projectId: rfqId,
        amountPaid: finances.balance,
        totalPaid: finances.total,
      },
      {
        type: 'admin_payment_received',
        customerName,
        customerEmail,
        projectName,
        projectId: rfqId,
        paymentType: 'completion',
        amount: finances.balance,
        customerPhone,
      },
    ]);
  }
}
