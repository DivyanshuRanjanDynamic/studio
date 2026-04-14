import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getClientIdentifier } from '@/lib/auth-safety';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { vendorApplyRequestSchema } from '@/lib/vendor-onboarding';
import { NotificationService } from '@/services/notification.service';
import { logger } from '@/utils/logger';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

export async function POST(req: Request) {
  let createdUid: string | null = null;

  try {
    const ip = getClientIdentifier(req.headers);
    const limiter = await rateLimit(`vendor-apply:${ip}`, 5, 60000);
    if (!limiter.success) {
      return rateLimitResponse(limiter.reset);
    }

    const payload = await req.json();
    const parsed = vendorApplyRequestSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid form data',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const body = parsed.data;
    const { adminAuth, adminFirestore } = getFirebaseAdmin();

    if (!adminAuth || !adminFirestore) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
    }

    try {
      await adminAuth.getUserByEmail(body.email);
      return NextResponse.json(
        {
          error: 'An account with this email already exists. Please login and contact support if needed.',
        },
        { status: 409 }
      );
    } catch (error: any) {
      if (error?.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    const existingApplication = await adminFirestore
      .collection('vendorApplications')
      .where('email', '==', body.email)
      .limit(1)
      .get();

    if (!existingApplication.empty) {
      return NextResponse.json(
        {
          error: 'An application with this email already exists.',
        },
        { status: 409 }
      );
    }

    const capabilities: string[] = body.capabilities.filter((capability) => capability !== 'Other');
    if (body.capabilities.includes('Other') && body.otherCapability) {
      capabilities.push(body.otherCapability);
    }

    const userRecord = await adminAuth.createUser({
      email: body.email,
      password: body.password,
      displayName: body.ownerName,
      emailVerified: false,
    });
    createdUid = userRecord.uid;

    const applicationRef = adminFirestore.collection('vendorApplications').doc();
    const userRef = adminFirestore.collection('users').doc(userRecord.uid);

    const nowIso = new Date().toISOString();

    const batch = adminFirestore.batch();
    batch.set(applicationRef, {
      companyName: body.companyName,
      ownerName: body.ownerName,
      contactNumber: body.contactNumber,
      email: body.email,
      workshopAddress: body.workshopAddress,
      gstNumber: body.gstNumber || null,
      capabilities,
      commissionStructure: body.commissionStructure || null,
      monthlyRevenue: body.monthlyRevenue || null,
      paymentTerms: body.paymentTerms || null,
      ndaAgreed: true,
      status: 'pending',
      submittedAt: nowIso,
      reviewedAt: null,
      reviewedBy: null,
      remindersSent: 0,
      lastReminderAt: null,
      userId: userRecord.uid,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    batch.set(
      userRef,
      {
        uid: userRecord.uid,
        fullName: body.ownerName,
        email: body.email,
        phone: body.contactNumber,
        teamName: body.companyName,
        role: 'vendor_pending',
        onboarded: true,
        status: 'pending_review',
        emailVerified: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      { merge: true }
    );

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    batch.set(adminFirestore.collection('verification_tokens').doc(tokenHash), {
      uid: userRecord.uid,
      email: body.email,
      name: body.ownerName,
      tokenHash,
      expiresAt,
      createdAt: nowIso,
      used: false,
    });

    await batch.commit();

    NotificationService.sendAsync({
      type: 'verification',
      customer: { email: body.email, name: body.ownerName },
      verificationUrl: `${APP_URL}/api/v1/auth/verify?token=${token}`,
    });

    return NextResponse.json({
      success: true,
      applicationId: applicationRef.id,
      message:
        'Your application has been submitted. MechHub will review and contact you. Please verify your email to activate your account.',
    });
  } catch (error: any) {
    if (createdUid) {
      try {
        const { adminAuth } = getFirebaseAdmin();
        if (adminAuth) {
          await adminAuth.deleteUser(createdUid);
        }
      } catch {
        // Best-effort rollback only.
      }
    }

    logger.error({
      event: 'vendor_application_submit_failed',
      error: error?.message || String(error),
    });

    return NextResponse.json({ error: 'Failed to submit vendor application' }, { status: 500 });
  }
}
