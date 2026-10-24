/**
 * Payment Verification API  —  POST /api/v1/payment/verify
 *
 * WHAT THIS DOES:
 * After a customer successfully pays through the Razorpay popup, Razorpay
 * sends back a signature. This API verifies that signature to confirm the
 * payment is genuine (not tampered with), then updates the project status.
 *
 * WHY VERIFICATION IS NEEDED:
 * Anyone could fake a "payment successful" response on the frontend.
 * The HMAC signature check ensures the payment actually went through Razorpay.
 * Think of it like a wax seal on a letter — only Razorpay can create it,
 * and we can verify it using our secret key.
 *
 * FLOW:
 * 1. Customer pays via Razorpay popup (handled by create-order API)
 * 2. Razorpay sends { order_id, payment_id, signature } back to the frontend
 * 3. Frontend forwards those to this API
 * 4. This API verifies the signature using HMAC-SHA256
 * 5. If valid → marks payment as "paid" and updates project status
 * 6. Also creates an audit record in the "payments" collection
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { logger } from '@/utils/logger';
import { authenticateRequest, forbiddenResponse, checkVerification, authorizeRoles } from '@/lib/auth-middleware';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIdentifier } from '@/lib/auth-safety';
import { verifyPaymentSignature } from '@/lib/razorpay-signature';
import { PaymentFulfilmentService } from '@/services/payment-fulfilment.service';

const VerifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  rfqId: z.string().min(1),
  paymentType: z.enum(['advance', 'completion']),
});

/**
 * Handles POST requests to verify a completed Razorpay payment.
 *
 * @param req - The incoming HTTP request containing Razorpay's response data:
 *   - razorpay_order_id: The order ID we created in create-order
 *   - razorpay_payment_id: Razorpay's unique ID for this payment
 *   - razorpay_signature: HMAC signature to prove payment is genuine
 *   - rfqId: Our project's Firestore document ID
 *   - paymentType: 'advance' or 'completion'
 *   - userId: The Firebase Auth UID of the paying customer
 */
export async function POST(req: NextRequest) {
  let razorpayOrderId = 'unknown';

  try {
    const ip = getClientIdentifier(req.headers);
    const limiter = await rateLimit(`payment-verify:${ip}`, 10, 60000, { onStoreError: 'allow' });
    if (!limiter.success) {
      return rateLimitResponse(limiter.reset);
    }

    // ── Step 1: Authenticate the request ─────────────────────────────────
    const auth = await authenticateRequest(req);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const verifyBlock = checkVerification(auth);
    if (verifyBlock) return verifyBlock;

    const roleBlock = authorizeRoles(auth, 'customer', 'admin');
    if (roleBlock) return roleBlock;

    // ── Step 2: Parse the request body ───────────────────────────────────
    const parseResult = VerifyPaymentSchema.safeParse(await req.json());
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, rfqId, paymentType } =
      parseResult.data;
    razorpayOrderId = razorpay_order_id;

    // Use authenticated userId instead of trusting request body
    const userId = auth.uid;

    // ── Step 2: Verify the HMAC-SHA256 signature ─────────────────────────
    // HOW THIS WORKS:
    // Razorpay creates a signature by hashing "order_id|payment_id" with our
    // secret key. We do the same calculation and compare. If they match,
    // the payment is genuine. If not, someone is trying to fake it.
    // Compare our calculated signature with what Razorpay sent (constant time)
    if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      logger.warn({
        event: 'payment_signature_mismatch',
        orderId: razorpay_order_id,
        userId,
      });
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // ── Step 4: Verify that this user actually owns the project ──────────
    const { adminFirestore: db } = getFirebaseAdmin();
    if (!db) throw new Error('Firebase Admin not initialized');

    const rfqSnap = await db.collection('projectRFQs').doc(rfqId).get();

    if (!rfqSnap.exists) {
      return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });
    }

    const rfq = rfqSnap.data()!;

    // Security: make sure the person verifying the payment is the project owner
    if (rfq.userId !== userId) {
      logger.warn({ event: 'API: Unauthorized payment verification', rfqId, authUid: userId, rfqOwner: rfq.userId });
      return forbiddenResponse('You do not own this project');
    }

    // ── Step 5: Record the payment ───────────────────────────────────────
    // Only counts if this milestone's stored Razorpay order is the one paid.
    // Same idempotent transaction as the Razorpay webhook — whichever arrives
    // first marks it paid, updates the project status and sends the emails.
    const fulfilled = await PaymentFulfilmentService.markMilestonePaid(rfqId, paymentType, {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });
    if (!fulfilled.success) {
      logger.warn({
        event: 'payment_milestone_not_recorded',
        rfqId,
        paymentType,
        code: fulfilled.error.code,
        uid: userId,
      });
      return NextResponse.json({ error: fulfilled.error.message }, { status: fulfilled.error.statusCode });
    }

    // ── Step 6: Return success ───────────────────────────────────────────
    return NextResponse.json({ success: true, paymentType, paidAt: fulfilled.data.paidAt });
  } catch (err: any) {
    // ── Error handling ───────────────────────────────────────────────────
    logger.error({
      event: 'payment_verification_error',
      error: err.message,
      orderId: razorpayOrderId,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
