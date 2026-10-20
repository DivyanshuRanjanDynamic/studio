import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/user.service';
import { UserRepository } from '@/repositories/user.repository';
import { logger } from '@/utils/logger';
import { authenticateRequest } from '@/lib/auth-middleware';

/**
 * POST /api/v1/user/provision
 * Creates the caller's user document in Firestore right after sign-up.
 * Expects a Bearer token in Authorization header.
 *
 * Security: the email comes from the verified token (never the body), the role is
 * always a self-service one (customer), and an existing profile is never overwritten —
 * otherwise a signed-in user could re-provision themselves with a different role.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const email = (auth.email || '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'Account has no email address' }, { status: 400 });
    }

    const existing = await UserRepository.getUserById(auth.uid);
    if (existing.success) {
      logger.info({ event: 'API: Provision skipped, profile exists', uid: auth.uid });
      return NextResponse.json({ status: 'success' });
    }

    const body = await req.json().catch(() => ({}));
    const fullName = typeof body?.fullName === 'string' ? body.fullName.trim().slice(0, 100) : undefined;

    logger.info({ event: 'API: Provisioning user doc', uid: auth.uid, email });

    const result = await UserService.provisionNewUser({
      uid: auth.uid,
      email,
      fullName,
      role: 'customer',
      emailVerified: auth.emailVerified ?? false,
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
