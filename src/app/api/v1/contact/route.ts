import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { NotificationService } from '@/services/notification.service';

const ContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Valid email is required'),
  phone: z.string().max(20).optional().default(''),
  company: z.string().max(200).optional().default(''),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
});

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const limiter = await rateLimit(`contact:${ip}`, 3, 60000);
    if (!limiter.success) {
      return rateLimitResponse(limiter.reset);
    }

    // 2. Validate
    const body = await request.json();
    const result = ContactSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;

    // 3. Save to Firestore
    const { adminFirestore } = getFirebaseAdmin();
    if (!adminFirestore) {
      throw new Error('Database connection failed');
    }

    const docRef = adminFirestore.collection('contactQueries').doc();
    const contactData = {
      id: docRef.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      company: data.company,
      message: data.message,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(contactData);

    // 4. Send admin notification via NotificationService (fire-and-forget)
    NotificationService.sendAsync({
      type: 'admin_contact_query',
      fullName: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone || undefined,
      company: data.company || undefined,
      message: data.message,
    });

    return NextResponse.json({ success: true, queryId: docRef.id });
  } catch (error: any) {
    console.error('Contact form submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit your query. Please try again later.' },
      { status: 500 }
    );
  }
}
