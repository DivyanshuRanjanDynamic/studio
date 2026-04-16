import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, forbiddenResponse } from '@/lib/auth-middleware';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function DELETE(
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

  // 1. Verify requester is admin
  const requester = await adminFirestore.collection('users').doc(auth.uid).get();
  if (requester.data()?.role !== 'admin') {
    return forbiddenResponse('Admin access required');
  }

  const { id } = await params;

  try {
    // 2. Start deletion batch
    const batch = adminFirestore.batch();

    // Delete User Doc
    const userRef = adminFirestore.collection('users').doc(id);
    batch.delete(userRef);

    // Delete any Vendor Applications associated with this user
    const appSnapshot = await adminFirestore
      .collection('vendorApplications')
      .where('userId', '==', id)
      .get();

    appSnapshot.forEach((doc: any) => {
      batch.delete(doc.ref);
    });

    // 3. Delete Firebase Auth account
    try {
      await adminAuth.deleteUser(id);
    } catch (authError: any) {
      if (authError.code !== 'auth/user-not-found') {
        throw authError;
      }
      // If user not found in Auth, we still want to finish cleaning up the DB
      console.warn(`[Admin Delete] Auth user ${id} not found, continuing with DB purge.`);
    }

    // 4. Commit Firestore deletions
    await batch.commit();

    return NextResponse.json({ success: true, message: 'Vendor purged successfully' });
  } catch (error: any) {
    console.error(`[Admin Delete] Error purging vendor ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to complete purge', details: error.message },
      { status: 500 }
    );
  }
}
