import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, forbiddenResponse } from '@/lib/auth-middleware';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { logger } from '@/utils/logger';
import { normalizeWorkflowStatus, toLegacyStatus } from '@/lib/project-workflow';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { adminFirestore } = getFirebaseAdmin();
    if (!adminFirestore) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
    }

    const requester = await adminFirestore.collection('users').doc(auth.uid).get();
    const requesterData = requester.data() || {};
    if (!['mechmaster', 'vendor', 'vendor_pending'].includes(requesterData.role)) {
      return forbiddenResponse('Vendor access required');
    }
    if (requesterData.role === 'vendor_pending' || requesterData.status !== 'active') {
      return forbiddenResponse('Vendor is not active');
    }

    const { projectId } = await params;
    const projectRef = adminFirestore.collection('projectRFQs').doc(projectId);
    const nowIso = new Date().toISOString();

    const txResult = await adminFirestore.runTransaction(async (tx: any) => {
      const snap = await tx.get(projectRef);
      if (!snap.exists) {
        return { ok: false as const, code: 404, message: 'Project not found' };
      }

      const project = snap.data() || {};
      const alreadyAssigned = project.assignedVendorId;
      if (alreadyAssigned) {
        return {
          ok: false as const,
          code: 409,
          message: 'Project already assigned',
          assignedVendorId: alreadyAssigned,
        };
      }

      const invited: string[] =
        project.invitedVendorIds || project.shortlistedVendorIds || project.selectedVendorIds || [];
      if (Array.isArray(invited) && invited.length > 0 && !invited.includes(auth.uid)) {
        return { ok: false as const, code: 403, message: 'You are not invited for this project' };
      }

      const normalized = normalizeWorkflowStatus(project.workflowStatus, project.status);
      if (normalized && normalized !== 'RFQ_SENT') {
        return {
          ok: false as const,
          code: 409,
          message: `Project is not open for acceptance (${normalized})`,
        };
      }

      const timelineEvents = Array.isArray(project.timelineEvents) ? project.timelineEvents : [];
      timelineEvents.push({
        type: 'ACCEPTED',
        actorType: 'vendor',
        actorId: auth.uid,
        content: 'Vendor accepted the project.',
        timestamp: nowIso,
      });

      tx.update(projectRef, {
        assignedVendorId: auth.uid,
        assignedAt: nowIso,
        acceptedAt: nowIso,
        assignmentState: 'ASSIGNED',
        workflowStatus: 'ACCEPTED',
        status: 'accepted',
        timelineEvents,
        updatedAt: nowIso,
      });

      return { ok: true as const };
    });

    if (!txResult.ok) {
      return NextResponse.json({ error: txResult.message, ...txResult }, { status: txResult.code });
    }

    return NextResponse.json({
      success: true,
      projectId,
      assignedVendorId: auth.uid,
      workflowStatus: 'ACCEPTED',
      status: toLegacyStatus('ACCEPTED'),
    });
  } catch (error: any) {
    logger.error({
      event: 'project_accept_failed',
      error: error?.message || String(error),
    });
    return NextResponse.json({ error: 'Failed to accept project' }, { status: 500 });
  }
}
