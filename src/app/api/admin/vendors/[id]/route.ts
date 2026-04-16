import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, forbiddenResponse } from '@/lib/auth-middleware';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { logger } from '@/utils/logger';

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

  // 1. Verify requester is admin
  if (auth.role !== 'admin') {
    const requester = await adminFirestore.collection('users').doc(auth.uid).get();
    if (requester.data()?.role !== 'admin') {
      return forbiddenResponse('Admin access required');
    }
  }

  const { id } = await params;
  const body = await req.json();

  try {
    // 2. Validate and sanitize inputs
    // We only allow certain fields to be updated via this endpoint
    const allowedFields = [
      'fullName',
      'teamName',
      'phone',
      'location',
      'specializations',
      'gstNumber',
      'experienceYears',
      'rating',
      'portfolio',
      'isActive',
      'isVerified',
    ];

    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    // 3. Update Firestore
    await adminFirestore.collection('users').doc(id).update(updateData);

    // 4. Update Auth if necessary (e.g., if fullName or phone changed)
    // For now, we mainly sync with the base user doc.
    // If phone changed, we might want to update Auth, but usually phone is for MFA or contact info.
    
    logger.info({ event: 'admin_update_vendor_success', uid: id, by: auth.uid });
    return NextResponse.json({ success: true, message: 'Vendor profile updated' });
  } catch (error: any) {
    logger.error({ event: 'admin_update_vendor_failed', uid: id, error: error.message });
    return NextResponse.json(
      { error: 'Failed to update vendor', details: error.message },
      { status: 500 }
    );
  }
}
