import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay-signature';
import {
  RazorpayWebhookService,
  webhookEventId,
  webhookEventSchema,
} from '@/services/razorpay-webhook.service';
import { logger } from '@/utils/logger';

/**
 * POST /api/v1/payment/webhook — Razorpay webhook (payment.captured, order.paid,
 * payment.failed, refund.processed, refund.failed).
 *
 * Authenticated only by X-Razorpay-Signature: HMAC-SHA256 of the raw body with
 * RAZORPAY_WEBHOOK_SECRET (set in the Razorpay dashboard; not the API key secret).
 * 2xx = done, so Razorpay stops retrying; 5xx = not applied, Razorpay retries.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 256 * 1024; // Razorpay events are a few KB

export async function POST(req: NextRequest) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    logger.error({ event: 'RazorpayWebhook: RAZORPAY_WEBHOOK_SECRET is not set' });
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const declaredLength = Number(req.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  // The signature covers the exact bytes sent, so read the body as text — never
  // req.json() and re-stringify.
  const rawBody = await req.text();
  if (Buffer.byteLength(rawBody) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  if (!verifyWebhookSignature(rawBody, req.headers.get('x-razorpay-signature'))) {
    logger.warn({ event: 'RazorpayWebhook: invalid signature' });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = webhookEventSchema.safeParse(json);
  if (!parsed.success) {
    // Signed by Razorpay but not a shape we act on: acknowledge so it isn't retried.
    logger.warn({ event: 'RazorpayWebhook: unexpected payload shape' });
    return NextResponse.json({ received: true, outcome: 'ignored' });
  }

  const eventId = webhookEventId(req.headers.get('x-razorpay-event-id'), rawBody);
  const result = await RazorpayWebhookService.process(eventId, parsed.data);

  if (!result.success) {
    logger.error({ event: 'RazorpayWebhook: event not applied', eventId, type: parsed.data.event, error: result.error.message });
    return NextResponse.json({ error: 'Not processed' }, { status: result.error.statusCode >= 500 ? result.error.statusCode : 500 });
  }

  logger.info({ event: 'RazorpayWebhook: event applied', eventId, type: parsed.data.event, outcome: result.data });
  return NextResponse.json({ received: true, outcome: result.data });
}
