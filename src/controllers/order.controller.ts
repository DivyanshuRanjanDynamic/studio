import { NextRequest, NextResponse } from 'next/server';
import type { QuoteOrder } from '@/models/order.model';
import { orderCreateSchema as checkoutSchema } from '@/validators/order.validator';
import { Result, ok, err } from '@/utils/result';
import { AppError, validationError, internalError, ErrorCode } from '@/utils/errors';
import { SHIPPING_OPTIONS } from '@/models/order.model';
import { logger } from '@/utils/logger';
import { CheckoutService } from '@/services/checkout.service';
import { authenticateRequest, forbiddenResponse } from '@/lib/auth-middleware';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { calculateProjectFinances } from '@/utils/finance';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

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

    try {
      const ip = req.headers.get('x-forwarded-for') || 'anonymous';
      const limiter = await rateLimit(`order-create:${ip}`, 8, 60000);
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
      } = validation.data;

      // 3. Security: Use authenticated userId, reject body userId tampering
      const userId = auth.uid;

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

      // 2. Resolve shipping option
      const shippingOption = SHIPPING_OPTIONS.find((o) => o.id === shippingOptionId);
      if (!shippingOption) {
        return NextResponse.json(
          {
            success: false,
            error: { code: ErrorCode.NOT_FOUND, message: 'Invalid shipping option' },
          },
          { status: 400 }
        );
      }

      // 3. Create Razorpay Order
      const quoteSubtotal = (items || []).reduce(
        (sum: number, item: any) => sum + item.quote.totalPrice,
        0
      );
      const shopSubtotal = (shopItems || []).reduce(
        (sum: number, item: any) => sum + item.salePrice * item.quantity,
        0
      );
      const subtotal = quoteSubtotal + shopSubtotal;

      const finances = calculateProjectFinances(subtotal, shippingOption.price);
      let finalTotal = finances.total;

      if (isAdvance) {
        finalTotal = finances.advance;
      } else if (isBalance) {
        finalTotal = finances.balance;
      } else if (projectId && advancePercentage) {
        // Fallback for custom advance percentages
        finalTotal = Math.round(finalTotal * advancePercentage);
      }

      const amountPaise = Math.round(finalTotal * 100);

      const razorpayOrder = await razorpay.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: `quote_${Date.now()}`,
        notes: {
          userId,
          type: isBalance ? 'project_balance' : projectId ? 'project_advance' : 'quote_order',
          projectId: projectId || '',
          projectName,
          customerName: customerDetails.name,
        },
      });

      // 4. Create internal order record via Service
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
      });

      if (!result.success) {
        const error = result.error;
        logger.error({ event: 'API: Checkout service processing failed', requestId, error });
        return NextResponse.json(
          { success: false, error: { code: error.code, message: error.message } },
          { status: error.statusCode }
        );
      }

      logger.info({ event: 'API: Order successfully created', requestId, orderId: result.data.id });

      return NextResponse.json({ 
        success: true, 
        data: result.data,
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
      const ip = req.headers.get('x-forwarded-for') || 'anonymous';
      const limiter = await rateLimit(`order-verify:${ip}`, 10, 60000);
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

      // 2. Verify the order belongs to the authenticated user
      const { adminFirestore } = getFirebaseAdmin();
      if (adminFirestore) {
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
        if (orderData.razorpayOrderId && orderData.razorpayOrderId !== razorpay_order_id) {
          logger.warn({
            event: 'API: Order verify mismatch',
            requestId,
            orderId,
            expectedOrderId: orderData.razorpayOrderId,
            receivedOrderId: razorpay_order_id,
            authUid: auth.uid,
          });
          return forbiddenResponse('Payment order does not match this order');
        }
      }

      // 3. Signature Verification
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        logger.warn({ event: 'API: Payment signature verification failed', requestId, orderId });
        return NextResponse.json(
          {
            success: false,
            error: { code: ErrorCode.VALIDATION_FAILED, message: 'Invalid payment signature' },
          },
          { status: 400 }
        );
      }

      // 4. Business Logic Execution
      const result = await CheckoutService.markAsPaid(orderId, razorpay_payment_id);

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
