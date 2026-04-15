/**
 * Payment Order Creation API  —  POST /api/v1/payment/create-order
 *
 * WHAT THIS DOES:
 * When a customer clicks "Pay Advance" or "Pay Balance" on the dashboard,
 * this API is called. It creates a Razorpay order (like a payment request)
 * that the frontend then uses to open the Razorpay checkout popup.
 *
 * FLOW:
 * 1. Customer clicks "Pay" on the frontend
 * 2. Frontend sends { rfqId, paymentType, userId } to this API
 * 3. This API validates everything, calculates the amount, creates a Razorpay order
 * 4. Returns the order details so the frontend can open the Razorpay popup
 * 5. After the customer pays, the frontend calls /api/v1/payment/verify
 */

import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { logger } from '@/utils/logger';
import { calculateProjectFinances } from '@/utils/finance';
import { authenticateRequest, forbiddenResponse } from '@/lib/auth-middleware';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

const CreateOrderSchema = z.object({
  rfqId: z.string().min(1).max(200),
  paymentType: z.enum(['advance', 'completion']),
});

// ── Initialize the Razorpay SDK with your API credentials ───────────────────
// These keys come from your Razorpay Dashboard → Settings → API Keys
// The "!" tells TypeScript "trust me, these values exist"
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * Handles POST requests to create a new Razorpay payment order.
 *
 * @param req - The incoming HTTP request containing { rfqId, paymentType, userId }
 *   - rfqId: The Firestore document ID of the project (RFQ = Request for Quotation)
 *   - paymentType: Either 'advance' (first 50%) or 'completion' (remaining 50%)
 *   - userId: The Firebase Auth UID of the customer making the payment
 */
export async function POST(req: NextRequest) {
  let currentRfqId = 'unknown';

  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const limiter = await rateLimit(`payment-create-order:${ip}`, 8, 60000);
    if (!limiter.success) {
      return rateLimitResponse(limiter.reset);
    }

    // ── Step 1: Authenticate the request ─────────────────────────────────
    const auth = await authenticateRequest(req);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // ── Step 2: Parse and validate the request body ─────────────────────
    const parseResult = CreateOrderSchema.safeParse(await req.json());
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }
    const { rfqId, paymentType } = parseResult.data;
    currentRfqId = rfqId;

    // Use authenticated userId instead of trusting request body
    const userId = auth.uid;

    // ── Step 2: Fetch the project (RFQ) from Firestore ──────────────────
    // We use Firebase Admin SDK here because this runs on the server,
    // not in the browser. Admin SDK has full access to Firestore.
    const { adminFirestore: db } = getFirebaseAdmin();
    if (!db) throw new Error('Firebase Admin not initialized');

    const rfqSnap = await db.collection('projectRFQs').doc(rfqId).get();

    // If the project doesn't exist, return a 404 error
    if (!rfqSnap.exists) {
      return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });
    }

    // Get the project data from Firestore
    const rfq = rfqSnap.data()!;

    // ── Step 3: Security check — make sure this user owns the project ───
    // Prevents someone from paying for (or tampering with) another user's project
    if (rfq.userId !== userId) {
      logger.warn({ event: 'API: Unauthorized payment attempt', rfqId, authUid: userId, rfqOwner: rfq.userId });
      return forbiddenResponse('You do not own this project');
    }

    // ── Step 4: Validate the project is in the correct status ────────────
    // Advance payment is only allowed when the project status is "accepted"
    if (paymentType === 'advance' && rfq.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Advance payment only available after order is accepted' },
        { status: 400 }
      );
    }

    // Completion payment is only allowed when parts have been shipped/delivered
    if (
      paymentType === 'completion' &&
      rfq.status !== 'shipped' &&
      rfq.status !== 'delivered' &&
      rfq.status !== 'shipping'
    ) {
      return NextResponse.json(
        { error: 'Completion payment only available after order is shipped' },
        { status: 400 }
      );
    }

    // ── Step 5: Prevent double payments ──────────────────────────────────
    // If advance is already marked as paid, don't allow paying again
    if (paymentType === 'advance' && rfq.paymentStatus?.advance?.paid) {
      return NextResponse.json({ error: 'Advance already paid' }, { status: 400 });
    }

    if (paymentType === 'completion' && rfq.paymentStatus?.completion?.paid) {
      return NextResponse.json({ error: 'Completion already paid' }, { status: 400 });
    }

    // ── Step 6: Calculate the payment amount ─────────────────────────────
    // finalPrice is the agreed-upon manufacturing cost set by the admin
    let finalPrice: number = rfq.finalPrice || rfq.quotedPrice || 0;

    if (finalPrice <= 0) {
      // Fallback: calculate subtotal from associated parts if neither finalPrice nor quotedPrice exist
      const partsSnap = await db.collection('projectParts').where('projectId', '==', rfqId).get();
      let partsSubtotal = 0;
      partsSnap.forEach((doc: any) => {
        const p = doc.data();
        partsSubtotal += (p.unitCost || 0) * (p.quantity || 0);
      });
      finalPrice = partsSubtotal;
    }

    if (finalPrice <= 0) {
      return NextResponse.json({ error: 'Invalid order amount' }, { status: 400 });
    }

    // Use the unified finance utility to calculate GST, shipping, and 50/50 split
    const finances = calculateProjectFinances(finalPrice);

    // Pick the correct amount based on payment type
    const amount = paymentType === 'advance' ? finances.advance : finances.balance;

    // Razorpay requires amounts in the smallest currency unit (paise for INR)
    // ₹100 = 10000 paise, so we multiply by 100
    const amountPaise = Math.round(amount * 100);

    // ── Step 7: Create the Razorpay order ────────────────────────────────
    // This tells Razorpay "a customer wants to pay X amount"
    // Razorpay returns an order ID that we use to open the checkout popup
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `${rfqId}_${paymentType}`, // A reference string for your records
      notes: {
        rfqId,
        paymentType,
        userId,
        projectName: rfq.projectName || 'MechHub Order',
        customerName: rfq.userName || rfq.contactName || '',
      },
    });

    // ── Step 8: Save the pending order ID in Firestore ───────────────────
    // We store this so we can verify the payment later in /api/v1/payment/verify
    await db
      .collection('projectRFQs')
      .doc(rfqId)
      .update({
        [`paymentStatus.${paymentType}.razorpayOrderId`]: order.id,
        [`paymentStatus.${paymentType}.paid`]: false, // Not paid yet — just created
        updatedAt: new Date().toISOString(),
      });

    // ── Step 9: Return the order details to the frontend ─────────────────
    // The frontend uses these to open the Razorpay checkout popup
    return NextResponse.json({
      orderId: order.id,
      amount: amountPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID, // Public key for the popup
      projectName: rfq.projectName || 'MechHub Order',
      customerEmail: rfq.contactEmail || '', // Pre-fills the checkout form
      customerName: rfq.contactName || '',
      customerPhone: rfq.contactPhone || '',
    });
  } catch (err: any) {
    // ── Error handling ───────────────────────────────────────────────────
    // Log the error for debugging and return a generic error message
    logger.error({
      event: 'payment_order_creation_failed',
      error: err.message,
      rfqId: currentRfqId,
    });
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
