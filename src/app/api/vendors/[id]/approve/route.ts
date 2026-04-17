import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, forbiddenResponse, checkVerification, authorizeRoles } from '@/lib/auth-middleware';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { NotificationService } from '@/services/notification.service';
import { logger } from '@/utils/logger';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { adminAuth, adminFirestore } = getFirebaseAdmin();
  if (!adminAuth || !adminFirestore) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
  }

  const roleBlock = authorizeRoles(auth, 'admin');
  if (roleBlock) return roleBlock;

  const { id } = await params;
  const appRef = adminFirestore.collection('vendorApplications').doc(id);
  const appSnap = await appRef.get();

  if (!appSnap.exists) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  const appData = appSnap.data()!;
  if (appData.status === 'approved') {
    return NextResponse.json({ success: true, status: 'approved' });
  }

  const nowIso = new Date().toISOString();

  await appRef.update({
    status: 'approved',
    reviewedAt: nowIso,
    reviewedBy: auth.uid,
    updatedAt: nowIso,
  });

  if (appData.userId) {
    const batch = adminFirestore.batch();
    batch.set(
      adminFirestore.collection('users').doc(appData.userId),
      {
        role: 'mechmaster',
        status: 'active',
        onboarded: true,
        // Sync onboarding data
        teamName: appData.companyName,
        fullName: appData.ownerName,
        phone: appData.contactNumber,
        location: appData.workshopAddress,
        specializations: appData.capabilities || [],
        gstNumber: appData.gstNumber || null,
        monthlyRevenue: appData.monthlyRevenue || null,
        portfolio: appData.otherCapability || null,
        updatedAt: nowIso,
      },
      { merge: true }
    );
    await batch.commit();

    // Mark user as verified in Auth so they can log in directly
    try {
      await adminAuth.updateUser(appData.userId, { emailVerified: true });
    } catch (authError: any) {
      logger.error({ event: 'approve_vendor_auth_update_failed', uid: appData.userId, error: authError.message });
    }
  }

  NotificationService.sendAsync({
    type: 'vendor_approved',
    vendorName: appData.ownerName || 'Partner',
    vendorEmail: appData.email,
    loginUrl: `${APP_URL}/login?redirect=/vendor`,
  });

  return NextResponse.json({ success: true, status: 'approved' });
}
