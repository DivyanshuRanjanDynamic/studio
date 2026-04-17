import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest, forbiddenResponse, checkVerification, authorizeRoles } from '@/lib/auth-middleware';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { logger } from '@/utils/logger';
import {
  CANONICAL_PROJECT_STATUSES,
  canTransitionStatus,
  normalizeWorkflowStatus,
  toLegacyStatus,
  workflowTransitionError,
  type CanonicalProjectStatus,
} from '@/lib/project-workflow';

const UpdateStatusSchema = z.object({
  nextStatus: z.enum(CANONICAL_PROJECT_STATUSES),
  note: z.string().max(500).optional(),
});

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

    const roleBlock = authorizeRoles(auth, 'admin', 'mechmaster');
    if (roleBlock) return roleBlock;

    const { adminFirestore } = getFirebaseAdmin();
    if (!adminFirestore) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
    }

    const isAdmin = auth.role === 'admin';
    const isVendor = auth.role === 'mechmaster' && auth.status === 'active';

    const parsed = UpdateStatusSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 });
    }
    const { nextStatus, note } = parsed.data;

    const { projectId } = await params;
    const projectRef = adminFirestore.collection('projectRFQs').doc(projectId);
    const nowIso = new Date().toISOString();

    const txResult = await adminFirestore.runTransaction(async (tx: any) => {
      const snap = await tx.get(projectRef);
      if (!snap.exists) {
        return { ok: false as const, code: 404, message: 'Project not found' };
      }

      const project = snap.data() || {};
      const currentStatus = normalizeWorkflowStatus(project.workflowStatus, project.status);
      if (!currentStatus) {
        return { ok: false as const, code: 409, message: 'Project status not initialized for workflow transitions' };
      }

      if (!canTransitionStatus(currentStatus, nextStatus)) {
        return { ok: false as const, code: 409, message: workflowTransitionError(currentStatus, nextStatus) };
      }

      // Vendors can only move execution-stage statuses on their own assigned projects.
      const vendorAllowedStatuses: CanonicalProjectStatus[] = [
        'IN_PRODUCTION',
        'QUALITY_CHECK',
        'DISPATCHED',
        'DELIVERED',
      ];
      if (isVendor) {
        if (project.assignedVendorId !== auth.uid) {
          return { ok: false as const, code: 403, message: 'Only assigned vendor can update this project' };
        }
        if (!vendorAllowedStatuses.includes(nextStatus)) {
          return { ok: false as const, code: 403, message: 'Vendor cannot set this status' };
        }
      }

      const timelineEvents = Array.isArray(project.timelineEvents) ? project.timelineEvents : [];
      timelineEvents.push({
        type: nextStatus,
        actorType: isAdmin ? 'admin' : 'vendor',
        actorId: auth.uid,
        content: note || `Status updated to ${nextStatus}`,
        timestamp: nowIso,
      });

      tx.update(projectRef, {
        workflowStatus: nextStatus,
        status: toLegacyStatus(nextStatus),
        updatedAt: nowIso,
        timelineEvents,
      });

      return { ok: true as const };
    });

    if (!txResult.ok) {
      return NextResponse.json({ error: txResult.message, ...txResult }, { status: txResult.code });
    }

    return NextResponse.json({
      success: true,
      projectId,
      workflowStatus: nextStatus,
      status: toLegacyStatus(nextStatus),
    });
  } catch (error: any) {
    logger.error({
      event: 'project_status_update_failed',
      error: error?.message || String(error),
    });
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
