import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { authenticateRequest, forbiddenResponse } from '@/lib/auth-middleware';
import { logger } from '@/utils/logger';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

const ShopVerifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  shopOrderId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const limiter = await rateLimit(`shop-verify:${ip}`, 10, 60000);
    if (!limiter.success) {
      return rateLimitResponse(limiter.reset);
    }

    // 1. Authenticate the request
    const auth = await authenticateRequest(req);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const parseResult = ShopVerifySchema.safeParse(await req.json());
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, shopOrderId } =
      parseResult.data;

    const { adminFirestore: db } = getFirebaseAdmin();
    if (!db) throw new Error('Firebase Admin not initialized');

    // 2. Verify order ownership before processing payment
    const orderSnap = await db.collection('orders').doc(shopOrderId).get();
    if (!orderSnap.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    const orderData = orderSnap.data()!;
    if (orderData.userId !== auth.uid) {
      logger.warn({ event: 'API: Unauthorized shop payment verification', shopOrderId, authUid: auth.uid, orderOwner: orderData.userId });
      return forbiddenResponse('You do not own this order');
    }
    if (orderData.razorpayOrderId && orderData.razorpayOrderId !== razorpay_order_id) {
      logger.warn({
        event: 'shop_payment_order_mismatch',
        shopOrderId,
        expectedOrderId: orderData.razorpayOrderId,
        receivedOrderId: razorpay_order_id,
        uid: auth.uid,
      });
      return forbiddenResponse('Payment order does not match this order');
    }

    // 3. Verify HMAC-SHA256 signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      logger.warn({ event: 'API: Shop payment signature mismatch', shopOrderId });
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // 4. Atomic Transaction: Inventory Reduction & Order Completion
    const paidAt = new Date().toISOString();

    await db.runTransaction(async (transaction: any) => {
      const orderRef = db.collection('orders').doc(shopOrderId);
      const orderDoc = await transaction.get(orderRef);

      if (!orderDoc.exists) throw new Error('Order not found');
      const orderData = orderDoc.data()!;

      if (orderData.paymentStatus === 'paid') {
        return; // Double call prevention
      }

      // Decrement Inventory for each item
      for (const item of orderData.items) {
        const productRef = db.collection('products').doc(item.id);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists) throw new Error(`Product ${item.id} no longer exists`);
        const currentInventory = productDoc.data()?.inventory || 0;

        if (currentInventory < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name} during finalization.`);
        }

        transaction.update(productRef, {
          inventory: currentInventory - item.quantity,
          updatedAt: paidAt,
        });
      }

      // Update Order
      transaction.update(orderRef, {
        status: 'paid',
        paymentStatus: 'paid',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        paidAt: paidAt,
        updatedAt: paidAt,
      });

      // Create Payment Record
      const paymentRef = db.collection('payments').doc();
      transaction.set(paymentRef, {
        orderId: shopOrderId,
        userId: auth.uid,
        type: 'shop_purchase',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        amount: orderData.pricing.total,
        currency: 'INR',
        paidAt,
        createdAt: paidAt,
      });
    });

    return NextResponse.json({ success: true, shopOrderId, paidAt });
  } catch (err: any) {
    console.error('[shop-verify] Transaction Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
