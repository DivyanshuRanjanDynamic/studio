/**
 * POST /api/v1/notifications/send
 *
 * Lets the admin panel and the project page trigger a project email:
 *   { projectId, type, quotedPrice?, leadTimeDays?, adminMessage?, proposedPrice? }
 *
 * The server builds the email. The recipient is always the project owner's
 * account email (projectOwnerContact: users/{uid}.email, server-written), and names, project names and
 * amounts come from Firestore, so a caller can't send MechHub-branded mail to
 * arbitrary addresses or inject content. Only admins send admin-side updates;
 * a project owner can only announce their own acceptance.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest, forbiddenResponse, checkVerification } from '@/lib/auth-middleware';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { NotificationService } from '@/services/notification.service';
import { projectOwnerContact } from '@/lib/project-contact';
import { calculateProjectFinances } from '@/utils/finance';
import { logger } from '@/utils/logger';
import type { NotificationEvent } from '@/types/notification';

const ADMIN_EVENTS = [
  'quotation_received',
  'negotiation_admin_reply',
  'status_in_production',
  'status_shipped',
  'status_delivered',
] as const;
const OWNER_EVENTS = ['quote_accepted'] as const;

const money = z.number().positive().max(1e9);

const NotifySchema = z.object({
  projectId: z.string().min(1).max(128),
  type: z.enum([...ADMIN_EVENTS, ...OWNER_EVENTS]),
  // Admin-entered values for the offer being announced
  quotedPrice: money.optional(),
  leadTimeDays: z.number().int().positive().max(3650).optional(),
  adminMessage: z.string().trim().min(1).max(2000).optional(),
  proposedPrice: money.optional(),
});

type NotifyInput = z.infer<typeof NotifySchema>;

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const verifyBlock = checkVerification(auth);
    if (verifyBlock) return verifyBlock;

    const limiter = await rateLimit(`notifications:${auth.uid}`, 20, 60000);
    if (!limiter.success) return rateLimitResponse(limiter.reset);

    const parsed = NotifySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid notification request' }, { status: 400 });
    }
    const input = parsed.data;

    const { adminFirestore: db } = getFirebaseAdmin();
    if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const projectSnap = await db.collection('projectRFQs').doc(input.projectId).get();
    if (!projectSnap.exists) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    const project = projectSnap.data()!;

    const isAdmin = auth.role === 'admin';
    const isOwner = project.userId === auth.uid;
    const allowed = (ADMIN_EVENTS as readonly string[]).includes(input.type)
      ? isAdmin
      : isOwner && project.status === 'accepted'; // announce an acceptance that happened
    if (!allowed) {
      logger.warn({ event: 'notification_api_denied', uid: auth.uid, type: input.type, projectId: input.projectId });
      return forbiddenResponse('You cannot send this notification');
    }

    const contact = await projectOwnerContact(project);
    if (!contact) {
      return NextResponse.json({ error: 'Project owner has no email on file' }, { status: 422 });
    }

    const events = buildEvents(input, project, contact);
    NotificationService.sendAllAsync(events);

    logger.info({ event: 'notification_api_dispatched', uid: auth.uid, projectId: input.projectId, types: events.map((e) => e.type) });
    return NextResponse.json({ success: true, queued: events.length });
  } catch (err: any) {
    logger.error({ event: 'notification_api_error', error: err?.message || String(err) });
    return NextResponse.json({ error: 'Failed to process notification request' }, { status: 500 });
  }
}

/** The email(s) for `input`, from the project record (plus admin-entered offer values) */
function buildEvents(
  input: NotifyInput,
  project: Record<string, any>,
  customer: { email: string; name: string }
): NotificationEvent[] {
  const projectId = input.projectId;
  const projectName = project.projectName || 'MechHub Project';
  const agreedPrice = Number(project.finalPrice || project.quotedPrice || 0);

  switch (input.type) {
    case 'quotation_received':
      return [{
        type: 'quotation_received',
        customer,
        projectName,
        projectId,
        quotedPrice: input.quotedPrice ?? agreedPrice,
        leadTimeDays: input.leadTimeDays ?? Number(project.leadTimeDays || 0),
      }];
    case 'negotiation_admin_reply':
      return [{
        type: 'negotiation_admin_reply',
        customer,
        projectName,
        projectId,
        adminMessage: input.adminMessage ?? '',
        proposedPrice: input.proposedPrice,
      }];
    case 'status_in_production':
    case 'status_delivered':
      return [{ type: input.type, customer, projectName, projectId }];
    case 'status_shipped':
      return [{
        type: 'status_shipped',
        customer,
        projectName,
        projectId,
        balanceDue: calculateProjectFinances(agreedPrice).balance,
      }];
    case 'quote_accepted':
      return [
        { type: 'quote_accepted', customer, projectName, projectId, finalPrice: agreedPrice },
        {
          type: 'admin_quote_accepted',
          customerName: customer.name,
          customerEmail: customer.email,
          projectName,
          projectId,
          acceptedPrice: agreedPrice,
        },
      ];
  }
}
