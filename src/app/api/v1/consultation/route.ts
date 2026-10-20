import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { authenticateRequest } from '@/lib/auth-middleware';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIdentifier } from '@/lib/auth-safety';
import { NotificationService } from '@/services/notification.service';
import { logger } from '@/utils/logger';

/**
 * POST /api/v1/consultation — Book a free consultation (signed-in users).
 * Replaces the browser's direct Firestore write, so requests are validated,
 * rate-limited and attributed to the authenticated user; the admin email is
 * sent from here (customers can't call /api/v1/notifications/send).
 */
const ConsultationSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Valid email is required').max(254),
  phone: z
    .string()
    .trim()
    .max(20)
    .refine((v) => {
      const digits = v.replace(/\D/g, '').length;
      return digits >= 10 && digits <= 15;
    }, 'Enter a valid phone number (10 to 15 digits).'),
  message: z
    .string()
    .max(5000)
    .refine((v) => v.replace(/\s+/g, ' ').trim().length >= 20, 'Please describe your issue in at least 20 characters.'),
  quoteRef: z.string().max(40).optional().default(''),
  material: z.string().max(100).optional().default(''),
  process: z.string().max(100).optional().default(''),
  quantity: z.string().max(20).optional().default(''),
  estimate: z.string().max(40).optional().default(''),
});

export async function POST(req: NextRequest) {
  try {
    const ipLimiter = await rateLimit(`consultation-ip:${getClientIdentifier(req.headers)}`, 10, 60 * 60 * 1000);
    if (!ipLimiter.success) return rateLimitResponse(ipLimiter.reset);

    const auth = await authenticateRequest(req);
    if (!auth.success) {
      return NextResponse.json({ error: 'Please sign in to book a consultation' }, { status: auth.status });
    }

    const userLimiter = await rateLimit(`consultation:${auth.uid}`, 3, 60 * 60 * 1000);
    if (!userLimiter.success) return rateLimitResponse(userLimiter.reset);

    const parsed = ConsultationSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { adminFirestore } = getFirebaseAdmin();
    if (!adminFirestore) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const data = parsed.data;
    const id = `cons_${nanoid(12)}`;
    await adminFirestore.collection('consultationRequests').doc(id).set({
      id,
      userId: auth.uid,
      name: data.name,
      phone: data.phone,
      email: data.email,
      message: data.message.trim(),
      quoteRef: data.quoteRef,
      material: data.material,
      process: data.process,
      quantity: data.quantity,
      estimate: data.estimate,
      status: 'new',
      requestDate: new Date().toISOString(),
    });

    NotificationService.sendAsync({
      type: 'admin_consultation_booked',
      customerName: data.name,
      customerEmail: data.email,
      customerPhone: data.phone,
      message: data.message.trim(),
      quoteRef: data.quoteRef || undefined,
    });

    logger.info({ event: 'API: Consultation booked', id, uid: auth.uid });
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    logger.error({ event: 'API: Consultation booking failed', error: error?.message });
    return NextResponse.json({ error: 'Failed to book your consultation. Please try again.' }, { status: 500 });
  }
}
