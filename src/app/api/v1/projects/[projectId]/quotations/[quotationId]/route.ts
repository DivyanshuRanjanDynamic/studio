import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest, forbiddenResponse, checkVerification, authorizeRoles, unauthorizedResponse } from '@/lib/auth-middleware';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { logger } from '@/utils/logger';
import { nanoid } from 'nanoid';
import { NegotiationEntry } from '@/models/quotation.model';
import { counterOfferFields } from '@/lib/quotation-acceptance';

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

    // Parse and validate counter-offer before entering the transaction
    const body = await req.json();
    const parsed = NegotiationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid negotiation data', details: parsed.error.flatten() }, { status: 400 });
    }

    // ── P2 fix: atomic counter-offer ─────────────────────────────────────
    // The entire read → status check → history append → write is wrapped in
    // a single Firestore transaction.  Two concurrent counter-offers (e.g.
    // vendor and customer both submit within 200 ms) now serialize: the
    // second transaction re-reads the updated history and appends to it
    // instead of overwriting the first party's message.
    const quoteRef = adminFirestore.collection('quotations').doc(quotationId);
    const projectRef = adminFirestore.collection('projectRFQs').doc(projectId);

    const txResult = await adminFirestore.runTransaction(async (tx: any) => {
      const [qSnap, pSnap] = await Promise.all([tx.get(quoteRef), tx.get(projectRef)]);

      if (!qSnap.exists) return { ok: false, code: 404, message: 'Quotation not found' };
      const quotation = qSnap.data() || {};

      if (quotation.rfqId !== projectId) {
        return { ok: false, code: 400, message: 'Quotation project mismatch' };
      }

      // Identify actor type
      let actorType: 'vendor' | 'customer' | 'admin' | null = null;
      if (auth.role === 'admin') actorType = 'admin';
      else if (quotation.userId === auth.uid) actorType = 'customer';
      else if (quotation.vendorId === auth.uid) actorType = 'vendor';

      if (!actorType) {
        return { ok: false, code: 403, message: 'You do not have permission to negotiate on this quote' };
      }

      // Status guard
      if (['accepted', 'declined', 'cancelled'].includes(quotation.status)) {
        return { ok: false, code: 409, message: `Cannot negotiate on a ${quotation.status} quotation` };
      }

      const nowIso = new Date().toISOString();
      const newEntry: NegotiationEntry = {
        party: actorType,
        price: parsed.data.price,
        leadTime: parsed.data.leadTime,
        message: parsed.data.message,
        createdAt: nowIso,
      };

      const history = quotation.negotiationHistory || [];

      // A customer's counter-offer is only a proposal: quotedPrice (what Razorpay
      // charges once accepted) changes only on a vendor or admin move.
      tx.update(quoteRef, {
        ...counterOfferFields(actorType, parsed.data.price, parsed.data.leadTime),
        status: 'revised',
        negotiationHistory: [...history, newEntry],
        updatedAt: nowIso,
      });

      // Append timeline event to the project (also transactional, preventing
      // lost events when two counter-offers race).
      if (pSnap.exists) {
        const project = pSnap.data() || {};
        const timelineEvents = project.timelineEvents || [];
        timelineEvents.push({
          id: `evt_${nanoid(9)}`,
          type: 'QUOTATION_NEGOTIATED',
          projectId,
          actorType,
          actorId: auth.uid,
          content: `${actorType === 'vendor' ? 'MechMaster' : actorType.toUpperCase()} made a counter-offer: ₹${parsed.data.price} in ${parsed.data.leadTime} days.`,
          channel: 'internal' as const,
          timestamp: nowIso,
        });
        tx.update(projectRef, { timelineEvents, updatedAt: nowIso });
      }

      return { ok: true };
    });

    if (!txResult.ok) {
      return NextResponse.json({ error: txResult.message }, { status: txResult.code });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error({ event: 'API: PATCH Quotation failed', error: error.message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
