import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { z } from 'zod';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { authenticateRequest, forbiddenResponse, checkVerification, authorizeRoles } from '@/lib/auth-middleware';

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
        id: z.string(),
        quantity: z.number().min(1),
      })
    )
    .min(1),
  shippingAddress: AddressSchema,
});

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const limiter = await rateLimit(`shop-checkout:${ip}`, 5, 60000);
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
        { error: 'Invalid checkout data', details: result.error.format() },
        { status: 400 }
      );
    }

    const { items, shippingAddress } = result.data;

    // Use authenticated userId instead of trusting request body
    const userId = auth.uid;

    const { adminFirestore: db } = getFirebaseAdmin();
    if (!db) throw new Error('Firebase Admin not initialized');

    // 1. Re-calculate and validate on backend (Security & Inventory Check)
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const productSnap = await db.collection('products').doc(item.id).get();
      if (!productSnap.exists) {
        return NextResponse.json({ error: `Product ${item.id} not found` }, { status: 404 });
      }

      const product = productSnap.data()!;

      // Check Inventory
      if (product.inventory < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name}. Available: ${product.inventory}`,
          },
          { status: 400 }
        );
      }

      const price = product.salePrice || 0;
      subtotal += price * item.quantity;

      validatedItems.push({
        id: item.id,
        name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        price: price,
      });
    }

    const gst = Math.round(subtotal * 0.18);
    const shipping = 0; // Integrated into product pricing
    const finalTotal = subtotal + gst + shipping;

    // 2. Create Razorpay Order
    const amountPaise = Math.round(finalTotal * 100);
    const razorpayOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `shop_${Date.now()}`,
      notes: {
        userId,
        type: 'shop_order',
      },
    });

    // 3. Create Pending Order in Firestore
    const orderRef = await db.collection('orders').add({
      userId,
      items: validatedItems,
      pricing: {
        subtotal,
        gst,
        shipping,
        total: finalTotal,
      },
      shippingAddress,
      status: 'pending',
      paymentStatus: 'unpaid',
      razorpayOrderId: razorpayOrder.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      orderId: razorpayOrder.id,
      shopOrderId: orderRef.id,
      amount: amountPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    console.error('[shop-checkout] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
