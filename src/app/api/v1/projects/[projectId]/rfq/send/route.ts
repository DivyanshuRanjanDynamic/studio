import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest, forbiddenResponse, checkVerification, authorizeRoles } from '@/lib/auth-middleware';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { logger } from '@/utils/logger';
import { toLegacyStatus } from '@/lib/project-workflow';

const SendRfqSchema = z.object({
  invitedVendorIds: z.array(z.string().min(1)).min(1).max(20),
});

type VendorRecord = {
  id: string;
  uid?: string;
  role?: string;
  status?: string;
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const verifyBlock = checkVerification(auth);
    if (verifyBlock) return verifyBlock;

    const roleBlock = authorizeRoles(auth, 'admin');
    if (roleBlock) return roleBlock;

    const { adminFirestore } = getFirebaseAdmin();
    if (!adminFirestore) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
    }

    const parsed = SendRfqSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 });
    }

    const { projectId } = await params;
    const projectRef = adminFirestore.collection('projectRFQs').doc(projectId);
    const projectSnap = await projectRef.get();
    if (!projectSnap.exists) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const invitedIds = Array.from(new Set(parsed.data.invitedVendorIds));
    const vendorChunks = chunk(invitedIds, 10);
    const foundVendors: VendorRecord[] = [];

    for (const ids of vendorChunks) {
      const snap = await adminFirestore.collection('users').where('uid', 'in', ids).get();
      snap.forEach((doc: any) => foundVendors.push({ id: doc.id, ...doc.data() }));
    }

    const eligibleVendorIds = foundVendors
      .filter((v) => v.role === 'mechmaster' && v.status === 'active')
      .map((v) => v.uid || v.id)
      .filter(Boolean) as string[];

    if (eligibleVendorIds.length === 0) {
      return NextResponse.json({ error: 'No eligible active MechMasters found' }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const existing = projectSnap.data() || {};
    const timelineEvents = Array.isArray(existing.timelineEvents) ? existing.timelineEvents : [];
    timelineEvents.push({
      type: 'RFQ_SENT',
      actorType: 'admin',
      actorId: auth.uid,
      content: `RFQ sent to ${eligibleVendorIds.length} vendor(s).`,
      timestamp: nowIso,
    });

    await projectRef.set(
      {
        invitedVendorIds: eligibleVendorIds,
        invitedAt: nowIso,
        assignmentState: 'OPEN',
        workflowStatus: 'RFQ_SENT',
        status: existing.status || toLegacyStatus('RFQ_SENT'),
        timelineEvents,
        updatedAt: nowIso,
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      projectId,
      invitedVendorIds: eligibleVendorIds,
      workflowStatus: 'RFQ_SENT',
    });
  } catch (error: any) {
    logger.error({
      event: 'project_rfq_send_failed',
      error: error?.message || String(error),
    });
    return NextResponse.json({ error: 'Failed to send RFQ' }, { status: 500 });
  }
}
