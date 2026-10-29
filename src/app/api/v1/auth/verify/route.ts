import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
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
  const limiter = await rateLimit(`auth-verify-attempt:${ip}`, 5, 60000, { onStoreError: 'allow' });

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

    // ── C7 fix: atomic token claim ───────────────────────────────────────
    // The read + mark-as-used is a single Firestore transaction so two
    // concurrent requests (double-click, two browser tabs) can never both
    // consume the same token.  Only the winner of the transaction proceeds;
    // the loser gets `token_unavailable` without any Auth or Firestore
    // side-effects having run.
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const tokenRef = adminFirestore.collection('verification_tokens').doc(tokenHash);

    let tokenData: Record<string, any>;
    try {
      tokenData = await adminFirestore.runTransaction(async (tx: any) => {
        const snap = await tx.get(tokenRef);

        // Token must exist, must not have been used, and must not be expired.
        if (!snap.exists) throw Object.assign(new Error('token_unavailable'), { code: 'token_unavailable' });
        const data = snap.data() as Record<string, any>;
        if (data.used)  throw Object.assign(new Error('token_unavailable'), { code: 'token_unavailable' });
        if (new Date() > new Date(data.expiresAt)) {
          throw Object.assign(new Error('expired_token'), { code: 'expired_token' });
        }

        // Atomically claim the token — any concurrent request now sees used: true.
        tx.update(tokenRef, {
          used: true,
          verifiedAt: new Date().toISOString(),
        });

        return data;
      });
    } catch (txErr: any) {
      const code = txErr?.code ?? 'verification_failed';
      return NextResponse.redirect(`${loginUrl}?error=${code}`);
    }

    const { uid, email, name } = tokenData;

    // 2. Update Auth Status — idempotent, safe to run once token is claimed.
    await adminAuth.updateUser(uid, { emailVerified: true });

    // 3. Sync Profile & Roles via UserService.
    //    Handles admin elevation and custom claims internally.
    const syncResult = await UserService.syncUserFromAuth({
      uid,
      email,
      fullName: name,
      emailVerified: true,
      allowCreation: true,
    });

    if (!syncResult.success) throw new Error(syncResult.error.message);

    // 4. Back to sign-in. No login credential in the URL — it would land in
    //    browser history, logs, analytics and Referer headers, and turn this
    //    link into a magic login link for whoever holds it.
    const destination = encodeURIComponent('/dashboard?tab=projects');
    return NextResponse.redirect(`${APP_URL}/login?verified=true&redirect=${destination}`);

  } catch (error: any) {
    logger.error({ event: 'API: Auth verification failed', error: error.message, token });
    return NextResponse.redirect(`${loginUrl}?error=verification_failed`);
  }
}
