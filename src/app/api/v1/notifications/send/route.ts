/**
 * POST /api/v1/notifications/send
 *
 * Internal API endpoint for client components to trigger notifications.
 * Authenticated, rate-limited, accepts a typed notification event payload.
 *
 * This exists because client components (project detail page, admin panel,
 * consultation page) cannot call Resend directly from the browser.
 */
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { NotificationService } from '@/services/notification.service';
import { logger } from '@/utils/logger';
import type { NotificationEvent } from '@/types/notification';

// Allowed event types that can be triggered from client components
const CLIENT_ALLOWED_EVENTS = new Set([
  'rfq_submitted_customer',
  'admin_new_rfq',
  'admin_negotiation_customer_reply',
  'quote_accepted',
  'admin_quote_accepted',
  'quotation_received',
  'negotiation_admin_reply',
  'admin_consultation_booked',
  'status_in_production',
  'status_shipped',
  'status_delivered',
]);

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limit
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const limiter = await rateLimit(`notifications:${ip}`, 20, 60000);
    if (!limiter.success) {
      return rateLimitResponse(limiter.reset);
    }

    // 2. Authenticate
    const auth = await authenticateRequest(req);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // 3. Parse payload
    const body = await req.json();
    const events: NotificationEvent[] = Array.isArray(body.events) ? body.events : [body];

    if (events.length === 0 || events.length > 5) {
      return NextResponse.json(
        { error: 'Provide 1-5 notification events per request' },
        { status: 400 }
      );
    }

    // 4. Validate event types
    for (const event of events) {
      if (!event.type || !CLIENT_ALLOWED_EVENTS.has(event.type)) {
        return NextResponse.json(
          { error: `Event type "${event.type}" is not allowed from client` },
          { status: 403 }
        );
      }
    }

    // 5. Fire-and-forget — send emails without blocking the response
    NotificationService.sendAllAsync(events);

    logger.info({
      event: 'notification_api_dispatched',
      uid: auth.uid,
      eventTypes: events.map((e) => e.type),
    });

    return NextResponse.json({ success: true, queued: events.length });
  } catch (err: any) {
    logger.error({
      event: 'notification_api_error',
      error: err.message || String(err),
    });
    return NextResponse.json(
      { error: 'Failed to process notification request' },
      { status: 500 }
    );
  }
}
