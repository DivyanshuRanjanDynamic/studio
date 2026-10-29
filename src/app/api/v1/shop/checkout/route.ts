import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { z } from 'zod';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIdentifier } from '@/lib/auth-safety';
import { authenticateRequest, forbiddenResponse, checkVerification, authorizeRoles } from '@/lib/auth-middleware';
import { logger } from '@/utils/logger';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const AddressSchema = z.object({
  fullName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  street: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().min(6).max(10),
  country: z.string().default('India'),
});

const CheckoutSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1).max(128),
        quantity: z.number().int().min(1).max(1000),
      })
    )
    .min(1)
    .max(50),
  shippingAddress: AddressSchema,
  /**
   * C2 fix: now required — prevents duplicate orders on double-click / network
   * retry. Must be 16-64 URL-safe characters (UUID v4 or nanoid works).
   */
  idempotencyKey: z
    .string()
    .regex(
      /^[A-Za-z0-9_-]{16,64}$/,
      'idempotencyKey must be 16–64 URL-safe characters'
    ),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip = getClientIdentifier(req.headers);
    const limiter = await rateLimit(`shop-checkout:${ip}`, 5, 60000, { onStoreError: 'allow' });
    if (!limiter.success) {
      return rateLimitResponse(limiter.reset);
    }

    // 2. Authenticate the request
    const auth = await authenticateRequest(req);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const verifyBlock = checkVerification(auth);
    if (verifyBlock) return verifyBlock;

    const roleBlock = authorizeRoles(auth, 'customer', 'admin');
    if (roleBlock) return roleBlock;

    // 3. Data Validation
    const body = await req.json();
    const result = CheckoutSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid checkout data' },
        { status: 400 }
      );
    }

    const { items, shippingAddress, idempotencyKey } = result.data;

    // Use authenticated userId instead of trusting request body
    const userId = auth.uid;

    // De-duplicate item ids — repeated ids would skip the combined stock check
    const deduped = new Map<string, number>();
    for (const item of items) {
      deduped.set(item.id, (deduped.get(item.id) ?? 0) + item.quantity);
    }

    const { adminFirestore: db } = getFirebaseAdmin();
    if (!db) throw new Error('Firebase Admin not initialized');

    // ── C2 fix: Idempotency guard — always active (key is required by schema) ──
    // Prevents duplicate orders on double-click / network retry.  A duplicate
    // immediately returns the cached result without touching stock or Razorpay.
    const idemRef = db.collection('idempotency_keys').doc(`shop_${idempotencyKey}`);
    const idemResult = await db.runTransaction(async (tx: any) => {
      const snap = await tx.get(idemRef);
      if (snap.exists) return snap.data();
      tx.set(idemRef, {
        userId,
        status: 'processing',
        createdAt: new Date().toISOString(),
      });
      return null;
    });

    if (idemResult) {
      if (idemResult.status === 'completed' && idemResult.result) {
        logger.info({ event: 'shop-checkout: returning cached idempotent result', idempotencyKey });
        return NextResponse.json(idemResult.result);
      }
      // Still processing from another concurrent request
      return NextResponse.json(
        { error: 'This order is already being processed. Please wait.' },
        { status: 409 }
      );
    }


    // ── BUG-1 fix: Razorpay order is created AFTER validating prices but BEFORE committing
    // any writes, so a Razorpay API failure leaves no orphaned stock decrement.
    //
    // Step A: read-only transaction — validate stock and compute the total.
    // Step B: razorpay.orders.create() (external).
    // Step C: second transaction — re-check stock, decrement, create order doc with the
    //         Razorpay order ID already embedded (atomically consistent).
    //
    // Previously the order was: decrement stock → razorpay.create() → link razorpayOrderId.
    // If Razorpay failed, stock was permanently lost with no payable order.

    // Step A — read-only validation (no writes)
    const priceData = await db.runTransaction(async (tx: any) => {
      let subtotal = 0;
      const validatedItems: Array<{
        id: string; name: string; sku: string; quantity: number; price: number;
      }> = [];

      for (const [id, quantity] of deduped) {
        const productRef = db.collection('products').doc(id);
        const productSnap = await tx.get(productRef);
        if (!productSnap.exists) throw new Error('Product not found');
        const product = productSnap.data()!;
        const price = Number(product.salePrice);
        if (product.isActive === false || !Number.isFinite(price) || price <= 0) {
          throw new Error('An item in your cart is currently unavailable');
        }
        const currentStock = Number(product.inventory) || 0;
        if (currentStock < quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${currentStock}`);
        }
        subtotal += price * quantity;
        validatedItems.push({ id, name: product.name, sku: product.sku, quantity, price });
      }

      const gst = Math.round(subtotal * 0.18);
      const finalTotal = subtotal + gst;
      return { subtotal, gst, finalTotal, amountPaise: Math.round(finalTotal * 100), validatedItems };
    });

    // Step B — create Razorpay order before touching stock
    const razorpayOrder = await razorpay.orders.create({
      amount: priceData.amountPaise,
      currency: 'INR',
      receipt: `shop_${Date.now()}`,
      notes: { userId, type: 'shop_order' },
    });

    // Step C — atomic: re-check stock + decrement + create order WITH razorpayOrderId
    // Re-reading inside this transaction catches any concurrent checkout that slipped
    // through between Step A and now.
    const now = new Date().toISOString();
    const shopOrderId = await db.runTransaction(async (tx: any) => {
      for (const [id, quantity] of deduped) {
        const productRef = db.collection('products').doc(id);
        const snap = await tx.get(productRef);
        const currentStock = Number(snap.data()?.inventory ?? 0);
        if (!snap.exists || currentStock < quantity) {
          throw new Error(`Insufficient stock for ${snap.data()?.name ?? id}. Available: ${currentStock}`);
        }
        tx.update(productRef, { inventory: FieldValue.increment(-quantity), updatedAt: now });
      }
      const orderRef = db.collection('orders').doc();
      tx.set(orderRef, {
        userId,
        items: priceData.validatedItems,
        pricing: { subtotal: priceData.subtotal, gst: priceData.gst, shipping: 0, total: priceData.finalTotal },
        shippingAddress,
        status: 'pending',
        paymentStatus: 'unpaid',
        razorpayOrderId: razorpayOrder.id,
        createdAt: now,
        updatedAt: now,
      });
      return orderRef.id;
    });

    const responsePayload = {
      orderId: razorpayOrder.id,
      shopOrderId,
      amount: priceData.amountPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
    };

    // Cache the result for the idempotency key so retries get the cached response.
    await db.collection('idempotency_keys').doc(`shop_${idempotencyKey}`).update({
      status: 'completed',
      result: responsePayload,
      completedAt: new Date().toISOString(),
    }).catch((e: any) => {
      logger.warn({ event: 'shop-checkout: idempotency key update failed', error: e?.message });
    });

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    logger.error({ event: 'shop-checkout: error', error: err?.message });
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
