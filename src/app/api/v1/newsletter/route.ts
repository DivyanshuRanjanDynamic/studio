import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIdentifier, normalizeEmail } from '@/lib/auth-safety';
import { logger } from '@/utils/logger';

/**
 * POST /api/v1/newsletter — Subscribe an email (public).
 * Replaces the browser's direct Firestore write. One document per address
 * (id = hash of the email), so repeats are idempotent and the response never
 * reveals whether an address was already subscribed.
 */
const NewsletterSchema = z.object({
  email: z.string().max(254),
  source: z
    .string()
    .max(40)
    .regex(/^[a-z0-9_-]*$/i)
    .optional()
    .default('website'),
});

export async function POST(req: NextRequest) {
  try {
    const limiter = await rateLimit(`newsletter:${getClientIdentifier(req.headers)}`, 5, 60 * 60 * 1000);
    if (!limiter.success) return rateLimitResponse(limiter.reset);

    const parsed = NewsletterSchema.safeParse(await req.json().catch(() => null));
    const email = parsed.success ? normalizeEmail(parsed.data.email) : null;
    if (!parsed.success || !email) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const { adminFirestore } = getFirebaseAdmin();
    if (!adminFirestore) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const id = createHash('sha256').update(email).digest('hex').slice(0, 40);
    const ref = adminFirestore.collection('newsletter_subscribers').doc(id);
    await adminFirestore.runTransaction(async (tx: any) => {
      const existing = await tx.get(ref);
      if (!existing.exists) {
        tx.set(ref, { email, source: parsed.data.source, subscribedAt: new Date().toISOString() });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error({ event: 'API: Newsletter signup failed', error: error?.message });
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
