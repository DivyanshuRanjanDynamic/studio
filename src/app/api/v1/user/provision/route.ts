import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { UserService } from '@/services/user.service';
import { logger } from '@/utils/logger';
import { authenticateRequest } from '@/lib/auth-middleware';

/**
 * POST /api/v1/user/provision
 * Proactively creates a user document in Firestore.
 * Expects a Bearer token in Authorization header.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json().catch(() => ({}));
    const { fullName, email, role } = body;

    logger.info({ event: 'API: Provisioning user doc', uid: auth.uid, email });

    const result = await UserService.provisionNewUser({
      uid: auth.uid,
      email: email || '',
      fullName: fullName,
      role: role,
      emailVerified: false, // Will be updated during verification callback properly
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    logger.error({ event: 'API: Provisioning failed', error: error.message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
