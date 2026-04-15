import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { isAdmin } from '@/lib/auth-utils';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIdentifier } from '@/lib/auth-safety';
import { UserService } from '@/services/user.service';
import { logger } from '@/utils/logger';

/**
 * Verification API route called from email links.
 * Orchestrates Firebase Auth status update and Firestore profile sync.
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

    // 1. Resolve Token
    const tokenRef = adminFirestore.collection('verification_tokens').doc(token);
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
    const userRole = isAdmin(email) ? 'admin' : 'customer';
    
    const syncResult = await UserService.syncUserFromAuth({
      uid,
      email,
      fullName: name,
      role: userRole as any,
      emailVerified: true
    });

    if (!syncResult.success) throw new Error(syncResult.error.message);

    // 4. Set Custom Claims for Admins
    if (userRole === 'admin') {
      await adminAuth.setCustomUserClaims(uid, { admin: true });
    }

    // 5. Cleanup Token
    await tokenRef.update({
      used: true,
      verifiedAt: new Date().toISOString(),
    });

    return NextResponse.redirect(`${loginUrl}?verified=true`);

  } catch (error: any) {
    logger.error({ event: 'API: Auth verification failed', error: error.message, token });
    return NextResponse.redirect(`${loginUrl}?error=verification_failed`);
  }
}
