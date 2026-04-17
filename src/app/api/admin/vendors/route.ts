import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, forbiddenResponse, checkVerification, authorizeRoles } from '@/lib/auth-middleware';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const roleBlock = authorizeRoles(auth, 'admin');
  if (roleBlock) return roleBlock;

  const { adminFirestore } = getFirebaseAdmin();
  if (!adminFirestore) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
  }

  const statusParam = req.nextUrl.searchParams.get('status');
  const allowedStatuses = new Set(['pending', 'approved', 'rejected']);
  const status = statusParam && allowedStatuses.has(statusParam) ? statusParam : null;

  const baseQuery = adminFirestore.collection('vendorApplications');
  const snapshot = await baseQuery.get();

  const applications = snapshot.docs
    .map((doc: any): Record<string, any> => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((application: any) => (status ? application.status === status : true))
    .sort((a: any, b: any) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')));

  return NextResponse.json({
    applications,
  });
}
