import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { authenticateRequest, forbiddenResponse, checkVerification, authorizeRoles } from '@/lib/auth-middleware';
import { logger } from '@/utils/logger';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIdentifier } from '@/lib/auth-safety';
import { verifyPaymentSignature } from '@/lib/razorpay-signature';
import { PaymentFulfilmentService } from '@/services/payment-fulfilment.service';

const ShopVerifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  shopOrderId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIdentifier(req.headers);
    const limiter = await rateLimit(`shop-verify:${ip}`, 10, 60000, { onStoreError: 'allow' });
    if (!limiter.success) {
      return rateLimitResponse(limiter.reset);
    }

    // 1. Authenticate the request
    const auth = await authenticateRequest(req);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const verifyBlock = checkVerification(auth);
    if (verifyBlock) return verifyBlock;

    const roleBlock = authorizeRoles(auth, 'customer', 'admin');
    if (roleBlock) return roleBlock;

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

    // 3. Verify HMAC-SHA256 signature
    if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      logger.warn({ event: 'API: Shop payment signature mismatch', shopOrderId });
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // 4. Mark paid + decrement stock atomically — only if this order's stored
    //    Razorpay order is the one paid (same idempotent path as the webhook)
    const fulfilled = await PaymentFulfilmentService.markShopOrderPaid(shopOrderId, {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });
    if (!fulfilled.success) {
      logger.warn({ event: 'API: Shop payment not recorded', shopOrderId, code: fulfilled.error.code });
      return NextResponse.json({ error: fulfilled.error.message }, { status: fulfilled.error.statusCode });
    }
    const { paidAt } = fulfilled.data;

    return NextResponse.json({ success: true, shopOrderId, paidAt });
  } catch (err: any) {
    logger.error({ event: 'API: Shop payment verification failed', error: err?.message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
