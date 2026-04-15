import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { logger } from '@/utils/logger';
import { getClientIdentifier, normalizeEmail, escapeHtml } from '@/lib/auth-safety';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { NotificationService } from '@/services/notification.service';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

export async function POST(req: Request) {
  let currentEmail = 'unknown';
  try {
    const ip = getClientIdentifier(req.headers);
    const limiter = await rateLimit(`auth-forgot:${ip}`, 3, 60000);
    if (!limiter.success) {
      return rateLimitResponse(limiter.reset);
    }

    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    const rawEmail = (payload as { email?: unknown })?.email;
    const email = normalizeEmail(rawEmail);
    currentEmail = typeof rawEmail === 'string' ? rawEmail : 'unknown';

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { adminAuth } = getFirebaseAdmin();

    if (!adminAuth) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    // 1. Check if user exists
    let firebaseUser;
    try {
      firebaseUser = await adminAuth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json({
          success: true,
          message: 'If an account exists, a reset link has been sent.',
        });
      }
      throw error;
    }

    // 2. Generate a secure password reset link pointing to our custom page
    const resetLink = await adminAuth.generatePasswordResetLink(email, {
      url: `${APP_URL}/reset-password`,
      handleCodeInApp: false,
    });

    const urlObj = new URL(resetLink);
    const oobCode = urlObj.searchParams.get('oobCode');

    if (!oobCode) {
      throw new Error('Failed to extract reset code from Firebase.');
    }

    const customResetUrl = `${APP_URL}/reset-password?oobCode=${oobCode}`;

    // 3. Send email using NotificationService
    const name = firebaseUser.displayName || email.split('@')[0] || 'there';
    
    NotificationService.sendAsync({
      type: 'password_reset',
      customer: {
        email,
        name,
      },
      resetUrl: customResetUrl,
    });

    return NextResponse.json({
      success: true,
      message: 'If an account exists, a reset link has been sent.',
    });
  } catch (error: any) {
    logger.error({
      event: 'forgot_password_process_failed',
      error: error.message,
      email: currentEmail,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
