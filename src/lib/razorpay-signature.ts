import { createHmac, timingSafeEqual } from 'crypto';

// ═══════════════════════════════════════════════════
// razorpay-signature — HMAC-SHA256 checks for Razorpay callbacks
//   checkout:  hex(HMAC(key_secret, "<order_id>|<payment_id>"))  — from the browser
//   webhook:   hex(HMAC(webhook_secret, <raw request body>))     — X-Razorpay-Signature
// Compared in constant time; a missing secret never verifies.
// ═══════════════════════════════════════════════════

function hmacHexEquals(secret: string | undefined, payload: string, signature: unknown): boolean {
  if (!secret || typeof signature !== 'string' || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  const expected = createHmac('sha256', secret).update(payload).digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}

/** Signature Razorpay Checkout returns after a successful payment */
export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: unknown,
  keySecret: string | undefined = process.env.RAZORPAY_KEY_SECRET
): boolean {
  return hmacHexEquals(keySecret, `${razorpayOrderId}|${razorpayPaymentId}`, signature);
}

/** X-Razorpay-Signature over the exact bytes Razorpay sent (never re-serialised JSON) */
export function verifyWebhookSignature(
  rawBody: string,
  signature: unknown,
  webhookSecret: string | undefined = process.env.RAZORPAY_WEBHOOK_SECRET
): boolean {
  return hmacHexEquals(webhookSecret, rawBody, signature);
}
