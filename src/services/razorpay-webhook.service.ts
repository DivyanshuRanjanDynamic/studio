import { createHash } from 'crypto';
import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { PaymentFulfilmentService, type PaymentTarget } from '@/services/payment-fulfilment.service';
import { Result, ok, err } from '@/utils/result';
import { AppError, ErrorCode, internalError } from '@/utils/errors';
import { logger } from '@/utils/logger';

// ═══════════════════════════════════════════════════
// RazorpayWebhookService — applies a verified Razorpay webhook event.
//
// Razorpay delivers at least once and retries on any non-2xx, so:
//   • each event id is logged in razorpay_webhook_events; a processed id is skipped
//   • every handler is idempotent anyway (PaymentFulfilmentService no-ops once paid)
//   • an event for a payment we never created is acknowledged (200), not retried
// Only the signature makes an event trustworthy; the route checks it first.
// ═══════════════════════════════════════════════════

const EVENTS = 'razorpay_webhook_events';

export const HANDLED_EVENTS = [
  'payment.captured',
  'order.paid',
  'payment.failed',
  'refund.processed',
  'refund.failed',
] as const;

const paymentEntity = z
  .object({
    id: z.string().min(1),
    order_id: z.string().min(1).nullish(),
    amount: z.number().int().nonnegative(),
    currency: z.string().optional(),
    status: z.string().optional(),
    error_code: z.string().nullish(),
    error_description: z.string().nullish(),
  })
  .passthrough();

const refundEntity = z
  .object({
    id: z.string().regex(/^[A-Za-z0-9_]{1,64}$/),
    payment_id: z.string().min(1),
    amount: z.number().int().nonnegative(),
    status: z.string().optional(),
  })
  .passthrough();

export const webhookEventSchema = z
  .object({
    event: z.string().min(1),
    payload: z
      .object({
        payment: z.object({ entity: paymentEntity }).optional(),
        order: z.object({ entity: z.object({ id: z.string().min(1) }).passthrough() }).optional(),
        refund: z.object({ entity: refundEntity }).optional(),
      })
      .passthrough(),
  })
  .passthrough();

export type RazorpayWebhookEvent = z.infer<typeof webhookEventSchema>;

export type WebhookOutcome =
  | 'paid'
  | 'already_paid'
  | 'amount_mismatch'
  | 'failure_recorded'
  | 'refund_recorded'
  | 'unmatched'
  | 'rejected'
  | 'ignored'
  | 'duplicate';

/** Stable id for dedupe: Razorpay's x-razorpay-event-id, else a hash of the body */
export function webhookEventId(headerValue: string | null, rawBody: string): string {
  if (headerValue && /^[A-Za-z0-9_-]{1,128}$/.test(headerValue)) return headerValue;
  return `sha256_${createHash('sha256').update(rawBody).digest('hex')}`;
}

async function resolveTarget(
  razorpayOrderId: string | null | undefined
): Promise<Result<PaymentTarget | null, AppError>> {
  if (!razorpayOrderId) return ok(null);
  return PaymentFulfilmentService.findTarget(razorpayOrderId);
}

async function applyEvent(event: RazorpayWebhookEvent): Promise<Result<WebhookOutcome, AppError>> {
  const payment = event.payload.payment?.entity;

  switch (event.event) {
    case 'payment.captured':
    case 'order.paid': {
      if (!payment) return ok('ignored');
      const razorpayOrderId = payment.order_id ?? event.payload.order?.entity.id;
      const target = await resolveTarget(razorpayOrderId);
      if (!target.success) return err(target.error);
      if (!target.data) return ok('unmatched');
      const result = await PaymentFulfilmentService.fulfil(target.data, {
        razorpayOrderId: razorpayOrderId as string,
        razorpayPaymentId: payment.id,
        amountPaise: payment.amount,
      });
      return result.success ? ok(result.data.outcome) : err(result.error);
    }

    case 'payment.failed': {
      if (!payment) return ok('ignored');
      const target = await resolveTarget(payment.order_id);
      if (!target.success) return err(target.error);
      if (!target.data) return ok('unmatched');
      const result = await PaymentFulfilmentService.recordFailure(target.data, {
        razorpayOrderId: payment.order_id as string,
        razorpayPaymentId: payment.id,
        errorCode: payment.error_code,
        errorDescription: payment.error_description,
      });
      return result.success ? ok('failure_recorded') : err(result.error);
    }

    case 'refund.processed':
    case 'refund.failed': {
      const refund = event.payload.refund?.entity;
      if (!refund) return ok('ignored');
      // The refund names its payment; the payment names the order we stored.
      const target = await resolveTarget(payment?.id === refund.payment_id ? payment.order_id : null);
      if (!target.success) return err(target.error);
      if (!target.data) return ok('unmatched');
      const result = await PaymentFulfilmentService.recordRefund(target.data, {
        refundId: refund.id,
        razorpayPaymentId: refund.payment_id,
        amountPaise: refund.amount,
        status: event.event === 'refund.processed' ? 'processed' : 'failed',
      });
      return result.success ? ok('refund_recorded') : err(result.error);
    }

    default:
      return ok('ignored');
  }
}

export const RazorpayWebhookService = {
  /**
   * Applies `event` once per `eventId`. An error result means "not applied — let
   * Razorpay retry" (the route answers 5xx).
   */
  async process(eventId: string, event: RazorpayWebhookEvent): Promise<Result<WebhookOutcome, AppError>> {
    const { adminFirestore: db } = getFirebaseAdmin();
    if (!db) {
      return err(
        new AppError({ code: ErrorCode.SERVICE_UNAVAILABLE, message: 'Payment records unavailable', statusCode: 503 })
      );
    }

    const logRef = db.collection(EVENTS).doc(eventId);
    try {
      const logged = await logRef.get();
      if (logged.exists && logged.data()?.status === 'processed') return ok('duplicate');
    } catch (e: any) {
      logger.error({ event: 'RazorpayWebhook: event log read failed', eventId, error: e?.message });
      return err(internalError('Webhook event log unavailable'));
    }

    let result = await applyEvent(event);
    if (!result.success && result.error.statusCode < 500) {
      // Permanent (record mismatch / missing): retrying can't fix it, and Razorpay
      // disables webhooks that keep failing. Log it loudly and acknowledge.
      logger.error({ event: 'RazorpayWebhook: event rejected', eventId, type: event.event, error: result.error.message });
      result = ok('rejected');
    }
    const now = new Date().toISOString();
    const payment = event.payload.payment?.entity;

    try {
      await logRef.set(
        {
          event: event.event,
          razorpayOrderId: payment?.order_id ?? event.payload.order?.entity.id ?? null,
          razorpayPaymentId: payment?.id ?? null,
          refundId: event.payload.refund?.entity.id ?? null,
          status: result.success ? 'processed' : 'failed',
          outcome: result.success ? result.data : null,
          error: result.success ? null : result.error.message,
          receivedAt: now,
        },
        { merge: true }
      );
    } catch (e: any) {
      // The event itself was applied (or not) idempotently; a retry is harmless.
      logger.error({ event: 'RazorpayWebhook: event log write failed', eventId, error: e?.message });
    }

    if (result.success && (result.data === 'unmatched' || result.data === 'amount_mismatch' || result.data === 'rejected')) {
      logger.warn({ event: `RazorpayWebhook: ${result.data}`, eventId, type: event.event });
    }
    return result;
  },
};
