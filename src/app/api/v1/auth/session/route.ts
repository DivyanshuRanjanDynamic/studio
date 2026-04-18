import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { logger } from '@/utils/logger';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIdentifier } from '@/lib/auth-safety';
import { UserService } from '@/services/user.service';
import { UserRole } from '@/models/user.model';

/**
 * SESSION MANAGEMENT API
 * 
 * POST: Exchanges a Firebase ID Token for a server-side HttpOnly session cookie.
 * DELETE: Clears the session cookie (Logout).
 */

export async function POST(req: Request) {
  try {
    const ip = getClientIdentifier(req.headers);
    const limiter = await rateLimit(`auth-session:${ip}`, 5, 60000); // 5 attempts per minute

    if (!limiter.success) {
      return rateLimitResponse(limiter.reset);
    }

    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const idTokenRaw = (payload as { idToken?: unknown })?.idToken;
    const expectedRole = (payload as { expectedRole?: string })?.expectedRole || 'customer';
    const idToken = typeof idTokenRaw === 'string' ? idTokenRaw.trim() : '';

    if (!idToken || idToken.length > 4096) {
      return NextResponse.json({ error: 'ID Token is required' }, { status: 400 });
    }

    const { adminAuth } = getFirebaseAdmin();
    if (!adminAuth) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    // Verify ID token first so we can enforce verification state.
    const decodedToken = await adminAuth.verifyIdToken(idToken, true);
    const signInProvider =
      typeof decodedToken.firebase?.sign_in_provider === 'string'
        ? decodedToken.firebase.sign_in_provider
        : '';

    // RULE: For Google logins, we do NOT allow auto-registration (allowCreation: false).
    // Users must first register via email/password or onboarding.
    const isSocialLogin = signInProvider === 'google.com';
    const allowCreation = !isSocialLogin;

    // ── Profile Sync & Data Resolution ───────────────────────────────
    const syncResult = await UserService.syncUserFromAuth({
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      fullName: (decodedToken.name as string) || (decodedToken.email?.split('@')[0] as string),
      emailVerified: decodedToken.email_verified || false,
      allowCreation,
      expectedRole: expectedRole as UserRole,
    });

    if (!syncResult.success) {
      logger.warn({
        event: 'session_profile_sync_failed',
        uid: decodedToken.uid,
        error: syncResult.error.message
      });

      return NextResponse.json({
        status: 'error',
        message: syncResult.error.message || 'Profile synchronization failed'
      }, { status: 403 });
    }

    // Fetch the actual role/status from Firestore (the source of truth)
    let userRole: UserRole = 'customer';
    let userStatus = 'active';

    const userResult = await UserService.getProfile(decodedToken.uid);
    if (userResult.success) {
      userRole = userResult.data.role;
      userStatus = userResult.data.status;
    }

    // ── Pre-Session Security Checks ──────────────────────────────────

    // Block unverified password-based accounts from obtaining a long-lived session.
    // EXCEPTION: Allow 'vendor_pending' users so they can see their "Under Review" status.
    const isPendingVendor = userRole === 'vendor_pending';

    if (signInProvider === 'password' && !decodedToken.email_verified && !isPendingVendor) {
      return NextResponse.json(
        { error: 'Email verification required before signing in.' },
        { status: 403 }
      );
    }

    // Set session expiration to 5 days.
    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    // Create the session cookie. 
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({
      status: 'success',
      role: userRole,
      accountStatus: userStatus,
      onboarded: userResult.success ? (userResult.data.onboarded ?? false) : false,
      emailVerified: decodedToken.email_verified || false
    }, { status: 200 });

    // Set cookie parameters
    response.cookies.set('session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    return response;
  } catch (error: any) {
    const isAuthError = typeof error?.code === 'string' && error.code.startsWith('auth/');
    logger.error({
      event: 'session_creation_failed',
      error: error.message,
    });
    if (isAuthError) {
      return NextResponse.json({ error: 'Invalid or expired authentication token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ status: 'logged-out' }, { status: 200 });

  // Clear the session cookie
  response.cookies.set('session', '', {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  return response;
}
