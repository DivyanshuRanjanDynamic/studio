import { NextRequest, NextResponse } from 'next/server';
import type { QuoteOrder } from '@/models/order.model';
import { orderCreateSchema as checkoutSchema } from '@/validators/order.validator';
import { Result, ok, err } from '@/utils/result';
import { AppError, validationError, internalError, ErrorCode } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { CheckoutService } from '@/services/checkout.service';
import { authenticateRequest, forbiddenResponse } from '@/lib/auth-middleware';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import Razorpay from 'razorpay';
import { verifyPaymentSignature } from '@/lib/razorpay-signature';
import { PaymentFulfilmentService } from '@/services/payment-fulfilment.service';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIdentifier } from '@/lib/auth-safety';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * OrderController handles all API requests related to ordering and payments.
 */
export const OrderController = {
  /**
   * Creates a new order and a Razorpay order.
   */
  async createOrder(req: NextRequest) {
    const requestId = req.headers.get('x-request-id') || 'req_internal';
    // Set only once this request holds the idempotency lock, so the catch block
    // never releases a lock owned by a concurrent request.
    let lockedIdempotencyKey: string | undefined;

    try {
      const ip = getClientIdentifier(req.headers);
      const limiter = await rateLimit(`order-create:${ip}`, 8, 60000, { onStoreError: 'allow' });
      if (!limiter.success) {
        return rateLimitResponse(limiter.reset);
      }

      // 1. Authenticate the request
      const auth = await authenticateRequest(req);
      if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }

      const body = await req.json();
      logger.info({ event: 'API: Order creation request', requestId, uid: auth.uid });

      // 2. Validation
      const validation = checkoutSchema.safeParse(body);
      if (!validation.success) {
        logger.warn({
          event: 'API: Order validation failed',
          requestId,
          errors: validation.error.flatten(),
        });
        const firstError = validation.error.errors[0]?.message || 'Invalid order data';
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ErrorCode.VALIDATION_FAILED,
              message: firstError,
              details: validation.error.flatten(),
            },
          },
          { status: 400 }
        );
      }

      const {
        items,
        shopItems,
        shippingAddress,
        shippingOptionId,
        projectId,
        isAdvance,
        isBalance,
        advancePercentage,
        // C2 fix: key is now required by orderCreateSchema — always present.
        idempotencyKey,
      } = validation.data;

      // 3. Security: Use authenticated userId, reject body userId tampering
      const userId = auth.uid;

      // ── C2 fix: Idempotency guard when idempotencyKey is supplied ──
      // Prevents duplicate Razorpay orders and internal orders when the browser
      // double-clicks or retries a timed-out request.
      if (idempotencyKey) {
        const { adminFirestore: idemDb } = getFirebaseAdmin();
        if (!idemDb) {
          // Firestore unavailable at idempotency check — fail safe: block the request.
          logger.error({ event: 'API: Firestore unavailable for idempotency check', requestId });
          return NextResponse.json(
            { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable' } },
            { status: 503 }
          );
        }
        const idemRef = idemDb.collection('idempotency_keys').doc(`order_${idempotencyKey}`);
        const idemResult = await idemDb.runTransaction(async (tx: any) => {
          const snap = await tx.get(idemRef);
          if (!snap.exists) {
            tx.set(idemRef, { userId, status: 'processing', createdAt: new Date().toISOString() });
            return null;
          }
          const data = snap.data();
          // A previously failed attempt left status='failed': allow the retry to proceed.
          if (data?.status === 'failed') {
            tx.update(idemRef, { status: 'processing', retriedAt: new Date().toISOString() });
            return null;
          }
          return data;
        });

        if (idemResult) {
          if (idemResult.status === 'completed' && idemResult.result) {
            logger.info({ event: 'API: Returning cached idempotent order', requestId });
            return NextResponse.json({
              success: true,
              data: idemResult.result,
              razorpayKey: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY,
            });
          }
          // status === 'processing': another request is actively creating the order
          return NextResponse.json(
            { success: false, error: { code: 'CONFLICT', message: 'Order is being processed' } },
            { status: 409 }
          );
        }
        lockedIdempotencyKey = idempotencyKey;
      }

      let projectName = 'MechHub Order';
      let customerDetails = { name: '', email: '', phone: '' };

      // 4. If projectId is provided, verify ownership
      if (projectId) {
        const { adminFirestore } = getFirebaseAdmin();
        if (adminFirestore) {
          const projectSnap = await adminFirestore.collection('projectRFQs').doc(projectId).get();
          if (projectSnap.exists) {
            const projectData = projectSnap.data()!;
            if (projectData.userId !== userId) {
              logger.warn({ event: 'API: Unauthorized project access attempt', requestId, projectId, authUid: userId, projectOwner: projectData.userId });
              return forbiddenResponse('You do not own this project');
            }
            projectName = projectData.projectName || 'MechHub Order';
            customerDetails = {
              name: projectData.userName || projectData.contactName || '',
              email: projectData.userEmail || projectData.contactEmail || '',
              phone: projectData.userPhone || projectData.contactPhone || '',
            };
          }
        }
      }

      // If no project, try to get customer details from the user profile
      if (!customerDetails.name) {
        const { adminFirestore } = getFirebaseAdmin();
        if (adminFirestore) {
          const userSnap = await adminFirestore.collection('users').doc(userId).get();
          if (userSnap.exists) {
            const userData = userSnap.data()!;
            customerDetails = {
              name: userData.fullName || userData.displayName || '',
              email: userData.email || '',
              phone: userData.phone || '',
            };
          }
        }
      }

      // ── BUG-2 fix: internal order is created BEFORE the Razorpay order.
      // Previously the order was: priceOrder → razorpay.create() → saveFirestoreOrder.
      // If Firestore failed after Razorpay succeeded, the Razorpay order was stranded and
      // any webhook payment returned 'unmatched'. Now, if Razorpay fails, the internal
      // record is still cleanly recoverable (no money has been taken).
      //
      // createOrder re-validates all prices internally, so the upfront priceOrder call
      // is no longer needed.

      // 5. Create internal order first (razorpayOrderId will be added in step 7)
      const result = await CheckoutService.createOrder({
        userId,
        items: items as any,
        shopItems: shopItems as any,
        shippingAddress: shippingAddress as any,
        shippingOptionId: shippingOptionId,
        projectId,
        advancePercentage,
        isBalance,
        isAdvance,
        idempotencyKey,
        razorpayOrderId: undefined,
      });

      if (!result.success) {
        const error = result.error;
        logger.warn({ event: 'API: Order creation failed', requestId, code: error.code, message: error.message });
        return NextResponse.json(
          { success: false, error: { code: error.code, message: error.message } },
          { status: error.statusCode }
        );
      }

      const internalOrderId = result.data.id;
      const amountPaise = Math.round(result.data.total * 100);

      // 6. Create Razorpay Order — after the internal record exists
      const razorpayOrder = await razorpay.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: `quote_${internalOrderId}`,
        notes: {
          userId,
          orderId: internalOrderId,
          type: isBalance ? 'project_balance' : projectId ? 'project_advance' : 'quote_order',
          projectId: projectId || '',
          projectName,
          customerName: customerDetails.name,
        },
      });

      // 7. Link the Razorpay order ID to the internal record.
      // If this write fails both IDs are logged so an admin can reconcile manually
      // (the internal order is already persisted; the client retries via idempotency key).
      await getFirebaseAdmin().adminFirestore?.collection('orders')
        .doc(internalOrderId)
        .update({ razorpayOrderId: razorpayOrder.id, updatedAt: new Date().toISOString() })
        .catch((e: any) => {
          logger.error({
            event: 'API: CRITICAL: Failed to link razorpayOrderId — manual reconciliation needed',
            requestId,
            orderId: internalOrderId,
            razorpayOrderId: razorpayOrder.id,
            error: e?.message,
          });
        });

      logger.info({ event: 'API: Order successfully created', requestId, orderId: internalOrderId });

      // Cache the result for the idempotency key so retries get the cached response.
      if (idempotencyKey) {
        await getFirebaseAdmin().adminFirestore?.collection('idempotency_keys')
          .doc(`order_${idempotencyKey}`)
          .update({
            status: 'completed',
            result: { ...result.data, razorpayOrderId: razorpayOrder.id },
            completedAt: new Date().toISOString(),
          })
          .catch((e: any) => {
            logger.warn({ event: 'API: Idempotency key completion update failed', requestId, error: e?.message });
          });
      }

      return NextResponse.json({
        success: true,
        data: { ...result.data, razorpayOrderId: razorpayOrder.id },
        razorpayKey: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY,
        projectName,
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
        customerPhone: customerDetails.phone,
      }, { status: 201 });
    } catch (e) {
      logger.error({
        event: 'API: Fatal error in OrderController.createOrder',
        requestId,
        error: e,
      });
      // Release the idempotency lock so the client can retry with the same key.
      if (lockedIdempotencyKey) {
        const { adminFirestore: failDb } = getFirebaseAdmin();
        failDb?.collection('idempotency_keys')
          .doc(`order_${lockedIdempotencyKey}`)
          .update({ status: 'failed', failedAt: new Date().toISOString() })
          .catch(() => {});
      }
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.INTERNAL_ERROR, message: 'Failed to process order' },
        },
        { status: 500 }
      );
    }
  },

  /**
   * Verifies a Razorpay payment and marks the order as paid.
   */
  async verifyOrder(req: NextRequest) {
    const requestId = req.headers.get('x-request-id') || 'req_verify';

    try {
      const ip = getClientIdentifier(req.headers);
      const limiter = await rateLimit(`order-verify:${ip}`, 10, 60000, { onStoreError: 'allow' });
      if (!limiter.success) {
        return rateLimitResponse(limiter.reset);
      }

      // 1. Authenticate the request
      const auth = await authenticateRequest(req);
      if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } =
        (await req.json()) as {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
          orderId: string;
        };

      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature ||
        !orderId
      ) {
        return NextResponse.json(
          {
            success: false,
            error: { code: ErrorCode.VALIDATION_FAILED, message: 'Missing verification fields' },
          },
          { status: 400 }
        );
      }

      // 2. Verify the order belongs to the authenticated user (no records → no verification)
      const { adminFirestore } = getFirebaseAdmin();
      if (!adminFirestore) {
        return NextResponse.json(
          { success: false, error: { code: ErrorCode.SERVICE_UNAVAILABLE, message: 'Service unavailable' } },
          { status: 503 }
        );
      }
      const orderSnap = await adminFirestore.collection('orders').doc(orderId).get();
      if (!orderSnap.exists) {
        return NextResponse.json(
          { success: false, error: { code: ErrorCode.NOT_FOUND, message: 'Order not found' } },
          { status: 404 }
        );
      }
      const orderData = orderSnap.data()!;
      if (orderData.userId !== auth.uid) {
        logger.warn({ event: 'API: Unauthorized order verification', requestId, orderId, authUid: auth.uid, orderOwner: orderData.userId });
        return forbiddenResponse('You do not own this order');
      }

      // 3. Signature Verification
      if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
        logger.warn({ event: 'API: Payment signature verification failed', requestId, orderId });
        return NextResponse.json(
          {
            success: false,
            error: { code: ErrorCode.VALIDATION_FAILED, message: 'Invalid payment signature' },
          },
          { status: 400 }
        );
      }

      // 4. Record it — only if this order's stored Razorpay order is the one paid
      //    (same idempotent path as the Razorpay webhook)
      const result = await PaymentFulfilmentService.markQuoteOrderPaid(orderId, {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      });

      if (!result.success) {
        const error = result.error;
        logger.error({
          event: 'API: Post-payment processing service failed',
          requestId,
          orderId,
          error,
        });
        return NextResponse.json(
          { success: false, error: { code: error.code, message: error.message } },
          { status: error.statusCode }
        );
      }

      logger.info({ event: 'API: Order verification successful', requestId, orderId });
      return NextResponse.json({ success: true, orderId });
    } catch (err: any) {
      logger.error({
        event: 'API: Fatal error in OrderController.verifyOrder',
        requestId,
        error: err,
      });
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.INTERNAL_ERROR, message: 'Verification failed' },
        },
        { status: 500 }
      );
    }
  },
};
