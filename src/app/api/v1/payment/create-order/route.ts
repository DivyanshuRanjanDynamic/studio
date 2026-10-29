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
import { authenticateRequest, forbiddenResponse, checkVerification, authorizeRoles } from '@/lib/auth-middleware';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIdentifier } from '@/lib/auth-safety';

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
    const ip = getClientIdentifier(req.headers);
    const limiter = await rateLimit(`payment-create-order:${ip}`, 8, 60000, { onStoreError: 'allow' });
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

    // ── Step 2: Parse and validate the request body ─────────────────────
    const parseResult = CreateOrderSchema.safeParse(await req.json());
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }
    const { rfqId, paymentType } = parseResult.data;
    currentRfqId = rfqId;

    // Use authenticated userId instead of trusting request body
    const userId = auth.uid;

    // ── Step 2: Fetch the project and validate atomically ─────────────
    // Use a transaction to read-then-write so two concurrent requests
    // can't both create a Razorpay order and overwrite each other's ID.
    const { adminFirestore: db } = getFirebaseAdmin();
    if (!db) throw new Error('Firebase Admin not initialized');

    const rfqRef = db.collection('projectRFQs').doc(rfqId);

    // Phase 1: Transactional validation — check status, ownership, double-pay
    // and see if an unpaid Razorpay order already exists (idempotent return).
    const txResult = await db.runTransaction(async (tx: any) => {
      const snap = await tx.get(rfqRef);
      if (!snap.exists) return { error: 'RFQ not found', status: 404 } as const;
      const rfq = snap.data()!;

      // Ownership check
      if (rfq.userId !== userId) {
        logger.warn({ event: 'API: Unauthorized payment attempt', rfqId, authUid: userId, rfqOwner: rfq.userId });
        return { error: 'FORBIDDEN', status: 403 } as const;
      }

      // Status checks
      if (paymentType === 'advance' && rfq.status !== 'accepted') {
        return { error: 'Advance payment only available after order is accepted', status: 400 } as const;
      }
      if (paymentType === 'completion' && !['shipped', 'delivered', 'shipping'].includes(rfq.status)) {
        return { error: 'Completion payment only available after order is shipped', status: 400 } as const;
      }

      // Already paid
      if (rfq.paymentStatus?.[paymentType]?.paid) {
        return { error: `${paymentType === 'advance' ? 'Advance' : 'Completion'} already paid`, status: 400 } as const;
      }

      // If an unpaid Razorpay order already exists, return it (idempotent)
      const stored = rfq.paymentStatus?.[paymentType];
      if (stored?.razorpayOrderId && !stored.paid) {
        return {
          existing: true as const,
          razorpayOrderId: stored.razorpayOrderId as string,
          amountPaise: stored.amountPaise as number,
          rfq,
        };
      }

      // Calculate amount
      let finalPrice: number = rfq.finalPrice || rfq.quotedPrice || 0;
      if (finalPrice <= 0) {
        // Fallback: calculate subtotal from associated parts
        const partsSnap = await db.collection('projectParts').where('projectId', '==', rfqId).get();
        let partsSubtotal = 0;
        partsSnap.forEach((doc: any) => {
          const p = doc.data();
          partsSubtotal += (p.unitCost || 0) * (p.quantity || 0);
        });
        finalPrice = partsSubtotal;
      }
      if (finalPrice <= 0) {
        return { error: 'Invalid order amount', status: 400 } as const;
      }

      const finances = calculateProjectFinances(finalPrice);
      const amount = paymentType === 'advance' ? finances.advance : finances.balance;
      const amountPaise = Math.round(amount * 100);

      // Claim the slot with a placeholder — we'll fill in the real ID after
      // creating the Razorpay order. This prevents a concurrent request from
      // also reaching this point.
      tx.update(rfqRef, {
        [`paymentStatus.${paymentType}.claimedAt`]: new Date().toISOString(),
        [`paymentStatus.${paymentType}.amountPaise`]: amountPaise,
        [`paymentStatus.${paymentType}.paid`]: false,
        updatedAt: new Date().toISOString(),
      });

      return {
        existing: false as const,
        amountPaise,
        rfq,
      };
    });

    // Handle transaction validation errors
    if ('error' in txResult) {
      if (txResult.error === 'FORBIDDEN') return forbiddenResponse('You do not own this project');
      return NextResponse.json({ error: txResult.error }, { status: txResult.status });
    }

    // If an unpaid Razorpay order already exists, return it (idempotent)
    if (txResult.existing) {
      return NextResponse.json({
        orderId: txResult.razorpayOrderId,
        amount: txResult.amountPaise,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        projectName: txResult.rfq.projectName || 'MechHub Order',
        customerEmail: txResult.rfq.contactEmail || '',
        customerName: txResult.rfq.contactName || '',
        customerPhone: txResult.rfq.contactPhone || '',
      });
    }

    // Phase 2: Create the Razorpay order (external API — outside transaction)
    const order = await razorpay.orders.create({
      amount: txResult.amountPaise,
      currency: 'INR',
      receipt: `${rfqId}_${paymentType}`,
      notes: {
        rfqId,
        paymentType,
        userId,
        projectName: txResult.rfq.projectName || 'MechHub Order',
        customerName: txResult.rfq.userName || txResult.rfq.contactName || '',
      },
    });

    // Phase 3: Conditional write — store the Razorpay order ID only if no
    // other request has stored one in the meantime.
    // CRITICAL: capture the winning ID so the response always carries the
    // ID that was actually stored — not the orphaned one created here.
    let storedRazorpayOrderId = order.id;
    await db.runTransaction(async (tx: any) => {
      const snap = await tx.get(rfqRef);
      const current = snap.data()?.paymentStatus?.[paymentType];
      // If another request already stored a different Razorpay order ID, keep theirs
      // and return THEIR id to the client (ours is orphaned — never stored).
      if (current?.razorpayOrderId && current.razorpayOrderId !== order.id) {
        logger.warn({
          event: 'API: Razorpay order race — keeping existing',
          rfqId,
          existing: current.razorpayOrderId,
          orphaned: order.id,
        });
        storedRazorpayOrderId = current.razorpayOrderId;
        return;
      }
      tx.update(rfqRef, {
        [`paymentStatus.${paymentType}.razorpayOrderId`]: order.id,
        updatedAt: new Date().toISOString(),
      });
    });

    // ── Return the order details to the frontend ─────────────────────
    return NextResponse.json({
      orderId: storedRazorpayOrderId,
      amount: txResult.amountPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      projectName: txResult.rfq.projectName || 'MechHub Order',
      customerEmail: txResult.rfq.contactEmail || '',
      customerName: txResult.rfq.contactName || '',
      customerPhone: txResult.rfq.contactPhone || '',
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
