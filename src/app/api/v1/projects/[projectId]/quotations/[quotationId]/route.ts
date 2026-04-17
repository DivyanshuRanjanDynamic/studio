import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest, forbiddenResponse, checkVerification, authorizeRoles, unauthorizedResponse } from '@/lib/auth-middleware';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { QuotationRepository } from '@/repositories/quotation.repository';
import { ProjectRepository } from '@/repositories/project.repository';
import { logger } from '@/utils/logger';
import { nanoid } from 'nanoid';
import { NegotiationEntry } from '@/models/quotation.model';

const NegotiationSchema = z.object({
  price: z.number().positive(),
  leadTime: z.number().int().positive(),
  message: z.string().min(1).max(1000),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; quotationId: string }> }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.success) return unauthorizedResponse();

    const { projectId, quotationId } = await params;
    const { adminFirestore } = getFirebaseAdmin();
    if (!adminFirestore) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });

    // 1. Get existing quotation
    const quoteResult = await QuotationRepository.getQuotationById(quotationId);
    if (!quoteResult.success) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    const quotation = quoteResult.data;

    if (quotation.rfqId !== projectId) {
      return NextResponse.json({ error: 'Quotation project mismatch' }, { status: 400 });
    }

    // 2. Identify actor type
    let actorType: 'vendor' | 'customer' | 'admin' | null = null;
    if (auth.role === 'admin') actorType = 'admin';
    else if (quotation.userId === auth.uid) actorType = 'customer';
    else if (quotation.vendorId === auth.uid) actorType = 'vendor';

    if (!actorType) {
      return forbiddenResponse('You do not have permission to negotiate on this quote');
    }

    // 3. Parse and validate counter-offer
    const body = await req.json();
    const parsed = NegotiationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid negotiation data', details: parsed.error.flatten() }, { status: 400 });
    }

    // 4. Update Quotation
    const nowIso = new Date().toISOString();
    const newEntry: NegotiationEntry = {
      party: actorType,
      price: parsed.data.price,
      leadTime: parsed.data.leadTime,
      message: parsed.data.message,
      createdAt: nowIso,
    };

    const history = quotation.negotiationHistory || [];
    
    // Check if the current status allows negotiation
    if (quotation.status === 'accepted' || quotation.status === 'declined' || quotation.status === 'cancelled') {
      return forbiddenResponse(`Cannot negotiate on a ${quotation.status} quotation`);
    }

    const updatedQuotation = {
      id: quotationId,
      quotedPrice: parsed.data.price,
      leadTimeDays: parsed.data.leadTime,
      status: 'revised' as const,
      negotiationHistory: [...history, newEntry],
      updatedAt: nowIso,
    };

    const saveResult = await QuotationRepository.saveQuotation(updatedQuotation);
    if (!saveResult.success) return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 });

    // 5. Timeline Event on Project
    const timelineEvent = {
      id: `evt_${nanoid(9)}`,
      type: 'QUOTATION_NEGOTIATED',
      projectId: projectId,
      actorType,
      actorId: auth.uid,
      content: `${actorType === 'vendor' ? 'MechMaster' : actorType.toUpperCase()} made a counter-offer: ₹${parsed.data.price} in ${parsed.data.leadTime} days.`,
      channel: 'internal' as const,
      timestamp: nowIso,
    };

    const projectResult = await ProjectRepository.getProjectRfqById(projectId);
    if (projectResult.success) {
      const project = projectResult.data;
      await ProjectRepository.saveProjectRfq({
        id: projectId,
        timelineEvents: [...(project.timelineEvents || []), timelineEvent],
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error({ event: 'API: PATCH Quotation failed', error: error.message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
