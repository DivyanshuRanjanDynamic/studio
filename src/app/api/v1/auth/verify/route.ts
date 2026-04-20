import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { isAdmin } from '@/lib/auth-utils';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIdentifier } from '@/lib/auth-safety';
import { UserService } from '@/services/user.service';
import { logger } from '@/utils/logger';
import crypto from 'crypto';

/**
 * Verification API route called from email links.
 * Orchestrates Firebase Auth status update and Firestore profile sync.
 *
 * IMPORTANT: The send-verification route stores the token document under
 * SHA256(rawToken), so we must hash the incoming raw token before lookup.
 */
export async function GET(req: Request) {
  const ip = getClientIdentifier(req.headers);
  const limiter = await rateLimit(`auth-verify-attempt:${ip}`, 5, 60000);

  if (!limiter.success) {
    return rateLimitResponse(limiter.reset);
  }

  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  const loginUrl = `${APP_URL}/login`;

  if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
    return NextResponse.redirect(`${loginUrl}?error=invalid_token`);
  }

  try {
    const { adminFirestore, adminAuth } = getFirebaseAdmin();
    if (!adminFirestore || !adminAuth) throw new Error('Firebase Admin uninitialized');

    // 1. Resolve Token — hash it to match how send-verification stored it
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const tokenRef = adminFirestore.collection('verification_tokens').doc(tokenHash);
    const tokenDoc = await tokenRef.get();

    if (!tokenDoc.exists || tokenDoc.data()?.used) {
      return NextResponse.redirect(`${loginUrl}?error=token_unavailable`);
    }

    const tokenData = tokenDoc.data()!;
    if (new Date() > new Date(tokenData.expiresAt)) {
      return NextResponse.redirect(`${loginUrl}?error=expired_token`);
    }

    const { uid, email, name } = tokenData;

    // 2. Update Auth Status
    await adminAuth.updateUser(uid, { emailVerified: true });

    // 3. Sync Profile & Roles via UserService
    // This now handles admin elevation and claims internally.
    const syncResult = await UserService.syncUserFromAuth({
      uid,
      email,
      fullName: name,
      emailVerified: true,
      allowCreation: true,
    });

    if (!syncResult.success) throw new Error(syncResult.error.message);

    // 5. Cleanup Token
    await tokenRef.update({
      used: true,
      verifiedAt: new Date().toISOString(),
    });

    // 6. Generate a Custom Token so the login page can auto-sign-in
    // We include the email_verified claim specifically to avoid propagation delays
    // between the adminAuth.updateUser call and the client-side sign-in.
    const customToken = await adminAuth.createCustomToken(uid, { email_verified: true });
    const destination = encodeURIComponent('/dashboard?tab=projects');
    return NextResponse.redirect(
      `${APP_URL}/login?token=${customToken}&redirect=${destination}&verified=true`
    );

  } catch (error: any) {
    logger.error({ event: 'API: Auth verification failed', error: error.message, token });
    return NextResponse.redirect(`${loginUrl}?error=verification_failed`);
  }
}
