import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest, forbiddenResponse, checkVerification, authorizeRoles, unauthorizedResponse } from '@/lib/auth-middleware';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { QuotationRepository } from '@/repositories/quotation.repository';
import { ProjectRepository } from '@/repositories/project.repository';
import { logger } from '@/utils/logger';
import { nanoid } from 'nanoid';
import { normalizeWorkflowStatus } from '@/lib/project-workflow';

const QuotationSchema = z.object({
  quotedPrice: z.number().positive(),
  leadTimeDays: z.number().int().positive(),
  notes: z.string().max(1000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const verifyBlock = checkVerification(auth);
    if (verifyBlock) return verifyBlock;

    const roleBlock = authorizeRoles(auth, 'mechmaster');
    if (roleBlock) return roleBlock;

    const { projectId } = await params;
    const { adminFirestore } = getFirebaseAdmin();
    if (!adminFirestore) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });

    if (auth.status !== 'active') {
      return forbiddenResponse('Active MechMaster account required');
    }

    // 2. Resolve vendor profile for naming
    const userDoc = await adminFirestore.collection('users').doc(auth.uid).get();
    const userData = userDoc.data() || {};

    // 3. Validate Project existence and eligibility
    const projectResult = await ProjectRepository.getProjectRfqById(projectId);
    if (!projectResult.success) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    const project = projectResult.data;

    // Check if vendor is invited
    const invitedIds = project.invitedVendorIds || project.shortlistedVendorIds || [];
    if (!invitedIds.includes(auth.uid)) {
      return forbiddenResponse('You are not invited to bid on this project');
    }

    // Check workflow status
    const canonical = normalizeWorkflowStatus(project.workflowStatus, project.status);
    if (canonical !== 'RFQ_SENT' && canonical !== 'ACCEPTED') {
      return forbiddenResponse(`Project is not accepting bids (Status: ${canonical})`);
    }

    // 4. Parse request body (before entering the transaction)
    const body = await req.json();
    const parsed = QuotationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid bid data', details: parsed.error.flatten() }, { status: 400 });
    }

    // ── N1 fix: atomic bid creation ─────────────────────────────────────
    // The duplicate-bid check, quotation doc creation, and project timeline
    // append are all inside a single Firestore transaction.  Two concurrent
    // submissions from the same vendor now serialize: the second transaction
    // re-reads the sentinel doc and sees the first bid.
    const quotationId = `q_${nanoid(12)}`;
    const nowIso = new Date().toISOString();
    const projectRef = adminFirestore.collection('projectRFQs').doc(projectId);

    // Use a deterministic sentinel doc to detect duplicate bids atomically
    const sentinelId = `bid_${projectId}_${auth.uid}`;
    const sentinelRef = adminFirestore.collection('quotation_bids').doc(sentinelId);

    const txResult = await adminFirestore.runTransaction(async (tx: any) => {
      // Check for existing bid from this vendor (atomic read)
      const sentinelSnap = await tx.get(sentinelRef);
      if (sentinelSnap.exists) {
        return { ok: false as const, code: 409, message: 'You have already submitted a bid for this project' };
      }

      // Re-read the project inside the transaction for the timeline append
      const pSnap = await tx.get(projectRef);
      if (!pSnap.exists) return { ok: false as const, code: 404, message: 'Project not found' };
      const projectData = pSnap.data() || {};

      const timelineEvent = {
        id: `evt_${nanoid(9)}`,
        type: 'QUOTATION_SUBMITTED',
        projectId,
        actorType: 'vendor' as const,
        actorId: auth.uid,
        content: `MechMaster submitted a bid of ₹${parsed.data.quotedPrice} with ${parsed.data.leadTimeDays} days lead time.`,
        channel: 'internal' as const,
        timestamp: nowIso,
      };
      const timelineEvents = [...(projectData.timelineEvents || []), timelineEvent];

      // Claim the bid slot (sentinel)
      tx.set(sentinelRef, { rfqId: projectId, vendorId: auth.uid, quotationId, createdAt: nowIso });

      // Create the quotation document
      const quoteRef = adminFirestore.collection('quotations').doc(quotationId);
      tx.set(quoteRef, {
        id: quotationId,
        rfqId: projectId,
        userId: project.userId,
        vendorId: auth.uid,
        vendorName: userData.displayName || userData.businessName || 'Verified MechMaster',
        quotedPrice: parsed.data.quotedPrice,
        leadTimeDays: parsed.data.leadTimeDays,
        notes: parsed.data.notes,
        status: 'pending',
        negotiationHistory: [],
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      // Update the project timeline and status atomically
      tx.update(projectRef, {
        workflowStatus: 'QUOTATION_SENT',
        status: 'quotation_sent',
        timelineEvents,
        updatedAt: nowIso,
      });

      return { ok: true as const };
    });

    if (!txResult.ok) {
      return NextResponse.json({ error: txResult.message }, { status: txResult.code });
    }

    return NextResponse.json({ success: true, quotationId });
  } catch (error: any) {
    logger.error({ event: 'API: POST Quotation failed', error: error.message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.success) return unauthorizedResponse();

    const { projectId } = await params;
    const { adminFirestore } = getFirebaseAdmin();
    if (!adminFirestore) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });

    // Verify access: Admin, Project Owner, or Vendor (Filtered)
    const projectResult = await ProjectRepository.getProjectRfqById(projectId);
    if (!projectResult.success) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    const project = projectResult.data;

    const isAdmin = auth.role === 'admin';
    const isOwner = project.userId === auth.uid;
    const isVendor = auth.role === 'mechmaster' || auth.role === 'vendor';

    if (!isAdmin && !isOwner && !isVendor) {
      return forbiddenResponse('Access denied');
    }

    const quotesResult = await QuotationRepository.getQuotationsByRfqId(projectId);
    if (!quotesResult.success) return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 });
    
    let quotes = quotesResult.data;

    // "MechMasters can only see their own bids"
    if (isVendor && !isAdmin) {
      quotes = quotes.filter(q => q.vendorId === auth.uid);
    }

    return NextResponse.json({ success: true, quotations: quotes });
  } catch (error: any) {
    logger.error({ event: 'API: GET Quotations failed', error: error.message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
