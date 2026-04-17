import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, forbiddenResponse, unauthorizedResponse } from '@/lib/auth-middleware';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { logger } from '@/utils/logger';
import { nanoid } from 'nanoid';
import { normalizeWorkflowStatus, toLegacyStatus } from '@/lib/project-workflow';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; quotationId: string }> }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.success) return unauthorizedResponse();

    const { projectId, quotationId } = await params;
    const { adminFirestore } = getFirebaseAdmin();
    if (!adminFirestore) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });

    const isAdmin = auth.role === 'admin';

    // 1. Transaction context
    const txResult = await adminFirestore.runTransaction(async (tx: any) => {
      const projectRef = adminFirestore.collection('projectRFQs').doc(projectId);
      const quoteRef = adminFirestore.collection('quotations').doc(quotationId);

      const [pSnap, qSnap] = await Promise.all([tx.get(projectRef), tx.get(quoteRef)]);

      if (!pSnap.exists) return { ok: false, code: 404, message: 'Project not found' };
      if (!qSnap.exists) return { ok: false, code: 404, message: 'Quotation not found' };

      const project = pSnap.data() || {};
      const quote = qSnap.data() || {};

      // Authority check: Only owner or admin
      if (!isAdmin && project.userId !== auth.uid) {
        return { ok: false, code: 403, message: 'Permission denied' };
      }

      // Project state check
      const canonical = normalizeWorkflowStatus(project.workflowStatus, project.status);
      if (canonical !== 'RFQ_SENT' && canonical !== 'ACCEPTED') {
        return { ok: false, code: 409, message: `Project is not in a state to accept bids (${canonical})` };
      }

      if (project.assignedVendorId) {
        return { ok: false, code: 409, message: 'Project already has an assigned vendor' };
      }

      const nowIso = new Date().toISOString();

      // Update project
      const timelineEvents = project.timelineEvents || [];
      timelineEvents.push({
        id: `evt_${nanoid(9)}`,
        type: 'ACCEPTED',
        actorType: (isAdmin ? 'admin' : 'customer') as any,
        actorId: auth.uid,
        content: `Quotation from ${quote.vendorName} accepted. Project assigned.`,
        channel: 'internal' as const,
        timestamp: nowIso,
      });

      tx.update(projectRef, {
        assignedVendorId: quote.vendorId,
        workflowStatus: 'ACCEPTED',
        status: toLegacyStatus('ACCEPTED'),
        quotedPrice: quote.quotedPrice, // Lock in the price
        leadTimeDays: quote.leadTimeDays,
        updatedAt: nowIso,
        timelineEvents,
      });

      // Update winning quote
      tx.update(quoteRef, {
        status: 'accepted',
        updatedAt: nowIso,
      });

      // Decline all other pending quotes for this project
      const others = await adminFirestore.collection('quotations')
        .where('rfqId', '==', projectId)
        .where('status', 'in', ['pending', 'revised'])
        .get();

      others.forEach((doc: any) => {
        if (doc.id !== quotationId) {
          tx.update(doc.ref, {
            status: 'declined',
            updatedAt: nowIso,
          });
        }
      });

      return { ok: true };
    });

    if (!txResult.ok) {
      return NextResponse.json({ error: txResult.message }, { status: txResult.code });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error({ event: 'API: POST Accept Quotation failed', error: error.message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
