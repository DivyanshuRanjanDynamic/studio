import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { UserService } from '@/services/user.service';
import { logger } from '@/utils/logger';

/**
 * PATCH /api/v1/user/profile
 * Securely updates the authenticated user's profile information.
 */
export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { adminAuth } = getFirebaseAdmin();
  if (!adminAuth) {
    return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 });
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(session, true);
    const uid = decodedClaims.uid;
    const body = await request.json();

    logger.info({ event: 'API: Updating user profile', uid });

    // 1. Utilize Service Layer for Validation and Persistence
    const result = await UserService.updateProfile(uid, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.statusCode || 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    logger.error({ event: 'API: Profile update failed', error: error.message });
    return NextResponse.json(
      { error: 'An unexpected error occurred while updating your profile.' },
      { status: 500 }
    );
  }
}
