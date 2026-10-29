import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, forbiddenResponse, unauthorizedResponse } from '@/lib/auth-middleware';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { logger } from '@/utils/logger';
import { nanoid } from 'nanoid';
import { normalizeWorkflowStatus, toLegacyStatus } from '@/lib/project-workflow';
import { decideAcceptance, type QuotationActor } from '@/lib/quotation-acceptance';

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

      // Authority check: owner, the quoting vendor (to accept a counter-offer), or admin
      let actor: QuotationActor;
      if (isAdmin) actor = 'admin';
      else if (project.userId === auth.uid) actor = 'customer';
      else if (quote.vendorId === auth.uid && auth.role === 'mechmaster' && auth.status === 'active') actor = 'vendor';
      else return { ok: false, code: 403, message: 'Permission denied' };

      // The quotation must be an open bid on this project, and the price one the
      // other party proposed — it becomes quotedPrice, which payments charge.
      const decision = decideAcceptance(projectId, project, quote, actor);
      if (!decision.ok) return decision;

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
        actorType: actor,
        actorId: auth.uid,
        content: `Quotation from ${quote.vendorName} accepted. Project assigned.`,
        channel: 'internal' as const,
        timestamp: nowIso,
      });

      tx.update(projectRef, {
        assignedVendorId: quote.vendorId,
        workflowStatus: 'ACCEPTED',
        status: toLegacyStatus('ACCEPTED'),
        quotedPrice: decision.price, // Lock in the agreed price
        leadTimeDays: decision.leadTimeDays,
        acceptedQuotationId: quotationId,
        updatedAt: nowIso,
        timelineEvents,
      });

      // Update winning quote (to the agreed terms, if the vendor took a counter-offer)
      tx.update(quoteRef, {
        quotedPrice: decision.price,
        leadTimeDays: decision.leadTimeDays,
        status: 'accepted',
        updatedAt: nowIso,
      });

      return { ok: true, nowIso };
    });

    if (!txResult.ok) {
      return NextResponse.json({ error: txResult.message }, { status: txResult.code });
    }

    // Post-transaction: Decline all other pending/revised quotes for this project
    try {
      const others = await adminFirestore.collection('quotations')
        .where('rfqId', '==', projectId)
        .where('status', 'in', ['pending', 'revised'])
        .get();

      if (!others.empty) {
        const batch = adminFirestore.batch();
        others.forEach((doc: any) => {
          if (doc.id !== quotationId) {
            batch.update(doc.ref, {
              status: 'declined',
              updatedAt: txResult.nowIso || new Date().toISOString(),
            });
          }
        });
        await batch.commit();
      }
    } catch (cleanupErr: any) {
      logger.warn({ event: 'API: Decline other quotations post-tx cleanup failed', error: cleanupErr?.message });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error({ event: 'API: POST Accept Quotation failed', error: error.message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
