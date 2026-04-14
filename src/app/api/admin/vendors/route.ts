import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, forbiddenResponse } from '@/lib/auth-middleware';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
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

  const statusParam = req.nextUrl.searchParams.get('status');
  const allowedStatuses = new Set(['pending', 'approved', 'rejected']);
  const status = statusParam && allowedStatuses.has(statusParam) ? statusParam : null;

  const baseQuery = adminFirestore.collection('vendorApplications');
  const snapshot = await baseQuery.get();

  const applications = snapshot.docs
    .map((doc): Record<string, any> => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((application) => (status ? application.status === status : true))
    .sort((a, b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')));

  return NextResponse.json({
    applications,
  });
}
