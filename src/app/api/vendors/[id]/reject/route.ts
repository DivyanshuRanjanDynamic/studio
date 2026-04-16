import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, forbiddenResponse } from '@/lib/auth-middleware';
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

  const requester = await adminFirestore.collection('users').doc(auth.uid).get();
  if (requester.data()?.role !== 'admin') {
    return forbiddenResponse('Admin access required');
  }

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

  // 2. Perform cleanup in Firestore and Auth
  const batch = adminFirestore.batch();

  // Delete the application
  batch.delete(appRef);

  // If a user was created, remove them entirely
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
        // We continue anyway to ensure the DB is cleaned up even if Auth deletion fails (e.g. already gone)
      }
    }
  }

  await batch.commit();

  return NextResponse.json({ success: true, status: 'deleted' });
}
