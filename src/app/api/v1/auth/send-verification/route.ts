import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { logger } from '@/utils/logger';
import crypto from 'crypto';
import { getClientIdentifier, normalizeEmail, escapeHtml } from '@/lib/auth-safety';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { NotificationService } from '@/services/notification.service';
import { authenticateRequest } from '@/lib/auth-middleware';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIdentifier(req.headers);
    const limiter = await rateLimit(`auth-verify:${ip}`, 3, 60000);
    if (!limiter.success) {
      return rateLimitResponse(limiter.reset);
    }

    const auth = await authenticateRequest(req);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let payload: any;
    try {
      payload = await req.json();
    } catch {
      payload = {};
    }

    const email = payload?.email;
    const name = payload?.name;
    const normalizedEmail = normalizeEmail(email);
    const normalizedUid = auth.uid; // Trust the authenticated UID

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { adminFirestore, adminAuth } = getFirebaseAdmin();

    if (!adminFirestore || !adminAuth) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    let firebaseUser;
    try {
      firebaseUser = await adminAuth.getUser(normalizedUid);
    } catch (error: any) {
      if (error?.code === 'auth/user-not-found') {
        return NextResponse.json({
          success: true,
          message: 'If an account needs verification, an email has been sent.',
        });
      }
      throw error;
    }

    if ((firebaseUser.email || '').toLowerCase() !== normalizedEmail) {
      return NextResponse.json({
        success: true,
        message: 'If an account needs verification, an email has been sent.',
      });
    }

    if (firebaseUser.emailVerified) {
      return NextResponse.json({ success: true, message: 'Email already verified' });
    }

    // 1. Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    // 2. Save token to Firestore
    const safeName = typeof name === 'string' ? name.trim() : 'there';
    await adminFirestore.collection('verification_tokens').doc(tokenHash).set({
      uid: normalizedUid,
      email: normalizedEmail,
      name: safeName,
      tokenHash,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      used: false,
    });

    // 3. Send email using NotificationService
    const verificationUrl = `${APP_URL}/api/v1/auth/verify?token=${token}`;
    
    await NotificationService.send({
      type: 'verification',
      customer: {
        email: normalizedEmail,
        name: typeof name === 'string' ? name.trim() : 'there',
      },
      verificationUrl,
    });

    return NextResponse.json({ success: true, message: 'Verification email sent' });
  } catch (error: any) {
    logger.error({
      event: 'verification_email_process_failed',
      error: error.message,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
