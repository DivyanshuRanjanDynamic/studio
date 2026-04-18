import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { UserRepository } from '@/repositories/user.repository';
import { UserService } from '@/services/user.service';
import { logger } from '@/utils/logger';
import { UserRole } from '@/models/user.model';

/**
 * POST /api/v1/auth/register
 * Atomic registration endpoint that ensures synchronization between Firebase Auth and Firestore.
 */
export async function POST(req: NextRequest) {
  const { adminAuth } = getFirebaseAdmin();
  if (!adminAuth) {
    return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { email, password, fullName, role } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    logger.info({ event: 'RegisterAPI: Starting atomic registration', email, role });

    // 1. Pre-validation: Check Firestore for existing profile
    const existingProfile = await UserRepository.getUserByEmail(email);
    if (existingProfile.success) {
      return NextResponse.json({
        error: 'This email is already registered. Please sign in.'
      }, { status: 409 });
    }

    // 2. Ghost Check & Purge: Check Firebase Auth for existing account without profile
    try {
      const authUser = await adminAuth.getUserByEmail(email);
      if (authUser) {
        logger.warn({ event: 'RegisterAPI: Ghost account detected - Purging before fresh registration', email, uid: authUser.uid });
        await adminAuth.deleteUser(authUser.uid);
      }
    } catch (authError: any) {
      // If error is 'user-not-found', it's good! Otherwise log it.
      if (authError.code !== 'auth/user-not-found' && authError.code !== 'auth/invalid-email') {
        logger.warn({ event: 'RegisterAPI: Non-critical Auth error during ghost check', code: authError.code, error: authError.message });
      }
    }

    // 3. Atomic Auth Creation
    let newUid: string | undefined;
    try {
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: fullName,
        emailVerified: false,
      });
      newUid = userRecord.uid;
      logger.info({ event: 'RegisterAPI: Firebase Auth user created', uid: newUid });
    } catch (creationError: any) {
      logger.error({ event: 'RegisterAPI: Auth creation failed', error: creationError.message });
      return NextResponse.json({ error: creationError.message || 'Authentication creation failed' }, { status: 400 });
    }

    // 4. Firestore Provisioning
    if (newUid) {
      const provisionResult = await UserService.provisionNewUser({
        uid: newUid,
        email,
        fullName,
        role: role as UserRole,
        emailVerified: false, // Initial state for new registrations
      });

      if (!provisionResult.success) {
        logger.error({ event: 'RegisterAPI: Firestore provisioning failed - ROLLING BACK AUTH', uid: newUid, error: provisionResult.error.message });

        // ROLLBACK: Delete the newly created Auth user to maintain atomicity
        await adminAuth.deleteUser(newUid).catch((e: any) => {
          logger.error({ event: 'RegisterAPI: Rollback failed! Manual cleanup required', uid: newUid, error: e.message });
        });

        return NextResponse.json({ error: 'Profile creation failed. Please try again.' }, { status: 500 });
      }
    }

    // 5. Generate Custom Token for client sign-in
    const customToken = await adminAuth.createCustomToken(newUid!);

    logger.info({ event: 'RegisterAPI: Atomic registration successful', email, uid: newUid });

    return NextResponse.json({
      status: 'success',
      customToken,
      uid: newUid,
      email
    });

  } catch (error: any) {
    logger.error({ event: 'RegisterAPI: Unexpected registration error', error: error.message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
