import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, forbiddenResponse, checkVerification, authorizeRoles } from '@/lib/auth-middleware';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { NotificationService } from '@/services/notification.service';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { adminFirestore } = getFirebaseAdmin();
  if (!adminFirestore) {
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
  if (appData.status === 'rejected') {
    return NextResponse.json({ success: true, status: 'rejected' });
  }

  // 1. Send the rejection email first while we still have all data
  await NotificationService.sendAsync({
    type: 'vendor_rejected',
    vendorName: appData.ownerName || 'Partner',
    vendorEmail: appData.email,
    reapplyUrl: `${APP_URL}/onboard`,
  });

  // 2. Perform cleanup and status update
  const batch = adminFirestore.batch();

  const nowIso = new Date().toISOString();

  // Archive the application as rejected (do not delete)
  batch.update(appRef, {
    status: 'rejected',
    reviewedAt: nowIso,
    reviewedBy: auth.uid,
    updatedAt: nowIso,
  });

  // If a user was created, remove them entirely to clear credentials
  if (appData.userId) {
    const { adminAuth } = getFirebaseAdmin();
    // Delete from Firestore users collection
    batch.delete(adminFirestore.collection('users').doc(appData.userId));

    // Delete from Firebase Auth if auth provider is available
    if (adminAuth) {
      try {
        await adminAuth.deleteUser(appData.userId);
      } catch (authError: any) {
        console.error(`[Reject] Failed to delete Auth user ${appData.userId}:`, authError.message);
      }
    }
  }

  await batch.commit();

  return NextResponse.json({ success: true, status: 'rejected' });
}
