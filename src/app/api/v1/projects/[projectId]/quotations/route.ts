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

    // 3. Check for existing bid
    const existingBid = await QuotationRepository.getVendorQuotationForRfq(projectId, auth.uid);
    if (existingBid.success && existingBid.data) {
      return NextResponse.json({ error: 'You have already submitted a bid for this project' }, { status: 409 });
    }

    // 4. Parse request body
    const body = await req.json();
    const parsed = QuotationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid bid data', details: parsed.error.flatten() }, { status: 400 });
    }

    // 5. Create Quotation
    const quotationId = `q_${nanoid(12)}`;
    const nowIso = new Date().toISOString();
    
    // We update project status to 'quotations_received' if it's currently 'submitted' or 'quote_requested'
    // but in canonical terms, we stay in 'RFQ_SENT' or 'ACCEPTED'.
    // Actually, Phase 2-A plan says: "Create a quotations document, push a timeline event".

    const quotation = {
      id: quotationId,
      rfqId: projectId,
      userId: project.userId,
      vendorId: auth.uid,
      vendorName: userData.displayName || userData.businessName || 'Verified MechMaster',
      quotedPrice: parsed.data.quotedPrice,
      leadTimeDays: parsed.data.leadTimeDays,
      notes: parsed.data.notes,
      status: 'pending' as const,
      negotiationHistory: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const saveResult = await QuotationRepository.saveQuotation(quotation);
    if (!saveResult.success) return NextResponse.json({ error: 'Failed to save bid' }, { status: 500 });

    // 6. Push Timeline Event to Project
    const timelineEvent = {
      id: `evt_${nanoid(9)}`,
      type: 'QUOTATION_SUBMITTED',
      projectId: projectId,
      actorType: 'vendor' as const,
      actorId: auth.uid,
      content: `MechMaster submitted a bid of ₹${parsed.data.quotedPrice} with ${parsed.data.leadTimeDays} days lead time.`,
      channel: 'internal' as const,
      timestamp: nowIso,
    };

    await ProjectRepository.saveProjectRfq({
      id: projectId,
      workflowStatus: 'QUOTATION_SENT',
      status: 'quotation_sent',
      timelineEvents: [...(project.timelineEvents || []), timelineEvent],
    });

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
