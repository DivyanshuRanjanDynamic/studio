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
    await adminFirestore.collection('users').doc(appData.userId).set(
      {
        role: 'mechmaster',
        status: 'active',
        onboarded: true,
        updatedAt: nowIso,
      },
      { merge: true }
    );
  }

  NotificationService.sendAsync({
    type: 'vendor_approved',
    vendorName: appData.ownerName || 'Partner',
    vendorEmail: appData.email,
    loginUrl: `${APP_URL}/login?redirect=/vendor`,
  });

  return NextResponse.json({ success: true, status: 'approved' });
}
