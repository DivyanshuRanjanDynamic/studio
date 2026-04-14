// ═══════════════════════════════════════════════════
// NotificationService — Centralized Email Dispatch
// ═══════════════════════════════════════════════════
//
// Single entry point for ALL notification emails in MechHub.
// Uses Resend SDK with fire-and-forget semantics — never
// blocks the calling API route or controller.

import { Resend } from 'resend';
import { logger } from '@/utils/logger';
import type { NotificationEvent, EmailPayload } from '@/types/notification';
import * as templates from './email-templates';

// ─── Constants ───────────────────────────────────────────────

const FROM_ADDRESS = 'MechHub <outreach@mechhub.in>';

const ADMIN_EMAILS = [
  'outreach@mechhub.in',
  'divyanshu.work914124@gmail.com',
  'ujjwal.roverx@gmail.com',
];

// ─── Singleton Resend Client ─────────────────────────────────

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error('RESEND_API_KEY environment variable is not configured');
    }
    resendInstance = new Resend(key);
  }
  return resendInstance;
}

// ─── Email Composer ──────────────────────────────────────────

function composeEmail(event: NotificationEvent): EmailPayload {
  switch (event.type) {
    // ── Auth Emails ────────────────────────────────────────

    case 'verification':
      return {
        to: event.customer.email,
        subject: 'Verify your email address for MechHub',
        html: templates.verificationEmail(event.customer.name, event.verificationUrl),
      };

    case 'password_reset':
      return {
        to: event.customer.email,
        subject: 'Reset Your MechHub Password',
        html: templates.passwordResetEmail(event.customer.name, event.resetUrl),
      };

    // ── Customer Emails ────────────────────────────────────

    case 'welcome':
      return {
        to: event.customer.email,
        subject: 'Welcome to MechHub — Your Manufacturing Hub',
        html: templates.welcomeEmail(event.customer.name),
      };

    case 'rfq_submitted_customer':
      return {
        to: event.customer.email,
        subject: `Quote Requested: ${event.projectName}`,
        html: templates.rfqSubmittedCustomerEmail(
          event.customer.name,
          event.projectName,
          event.projectId,
          event.partCount
        ),
      };

    case 'quotation_received':
      return {
        to: event.customer.email,
        subject: `Quotation Ready: ${event.projectName} — ₹${event.quotedPrice.toLocaleString('en-IN')}`,
        html: templates.quotationReceivedEmail(
          event.customer.name,
          event.projectName,
          event.projectId,
          event.quotedPrice,
          event.leadTimeDays
        ),
      };

    case 'negotiation_admin_reply':
      return {
        to: event.customer.email,
        subject: `MechHub replied to your negotiation: ${event.projectName}`,
        html: templates.negotiationAdminReplyEmail(
          event.customer.name,
          event.projectName,
          event.projectId,
          event.adminMessage,
          event.proposedPrice
        ),
      };

    case 'quote_accepted':
      return {
        to: event.customer.email,
        subject: `Quote Accepted: ${event.projectName} — Pay Advance to Start`,
        html: templates.quoteAcceptedEmail(
          event.customer.name,
          event.projectName,
          event.projectId,
          event.finalPrice
        ),
      };

    case 'payment_advance_confirmed':
      return {
        to: event.customer.email,
        subject: `Payment Confirmed: 50% Advance for ${event.projectName}`,
        html: templates.paymentAdvanceConfirmedEmail(
          event.customer.name,
          event.projectName,
          event.projectId,
          event.amountPaid,
          event.balanceDue
        ),
      };

    case 'status_in_production':
      return {
        to: event.customer.email,
        subject: `In Production: ${event.projectName}`,
        html: templates.statusInProductionEmail(
          event.customer.name,
          event.projectName,
          event.projectId
        ),
      };

    case 'status_shipped':
      return {
        to: event.customer.email,
        subject: `Shipped! ${event.projectName} — Balance Payment Due`,
        html: templates.statusShippedEmail(
          event.customer.name,
          event.projectName,
          event.projectId,
          event.balanceDue
        ),
      };

    case 'payment_balance_confirmed':
      return {
        to: event.customer.email,
        subject: `Final Payment Confirmed: ${event.projectName} — Fully Paid`,
        html: templates.paymentBalanceConfirmedEmail(
          event.customer.name,
          event.projectName,
          event.projectId,
          event.amountPaid,
          event.totalPaid
        ),
      };

    case 'status_delivered':
      return {
        to: event.customer.email,
        subject: `Delivered: ${event.projectName} — Thank You!`,
        html: templates.statusDeliveredEmail(
          event.customer.name,
          event.projectName,
          event.projectId
        ),
      };

    // ── Admin Emails ───────────────────────────────────────

    case 'admin_new_user':
      return {
        to: ADMIN_EMAILS,
        subject: `New User: ${event.userName} (${event.userEmail})`,
        html: templates.adminNewUserEmail(event.userName, event.userEmail),
      };

    case 'admin_new_rfq':
      return {
        to: ADMIN_EMAILS,
        subject: `New RFQ: "${event.projectName}" from ${event.customerName} — ${event.partCount} parts`,
        html: templates.adminNewRfqEmail(
          event.customerName,
          event.customerEmail,
          event.projectName,
          event.projectId,
          event.partCount
        ),
      };

    case 'admin_negotiation_customer_reply':
      return {
        to: ADMIN_EMAILS,
        subject: `Negotiation Reply: ${event.customerName} on "${event.projectName}"`,
        html: templates.adminNegotiationCustomerReplyEmail(
          event.customerName,
          event.customerEmail,
          event.projectName,
          event.projectId,
          event.customerMessage,
          event.proposedPrice
        ),
      };

    case 'admin_contact_query':
      return {
        to: ADMIN_EMAILS,
        subject: `New Contact Query from ${event.fullName}`,
        html: templates.adminContactQueryEmail(
          event.fullName,
          event.email,
          event.message,
          event.phone,
          event.company
        ),
      };

    case 'admin_consultation_booked':
      return {
        to: ADMIN_EMAILS,
        subject: `Consultation Booked: ${event.customerName} — Callback Required`,
        html: templates.adminConsultationBookedEmail(
          event.customerName,
          event.customerEmail,
          event.customerPhone,
          event.message,
          event.quoteRef
        ),
      };

    case 'admin_payment_received':
      return {
        to: ADMIN_EMAILS,
        subject: `Payment Received: ₹${event.amount.toLocaleString('en-IN')} (${event.paymentType}) — ${event.projectName}`,
        html: templates.adminPaymentReceivedEmail(
          event.customerName,
          event.customerEmail,
          event.projectName,
          event.projectId,
          event.paymentType,
          event.amount,
          event.customerPhone
        ),
      };

    case 'admin_quote_accepted':
      return {
        to: ADMIN_EMAILS,
        subject: `Quote Accepted: "${event.projectName}" by ${event.customerName} — ₹${event.acceptedPrice.toLocaleString('en-IN')}`,
        html: templates.adminQuoteAcceptedEmail(
          event.customerName,
          event.customerEmail,
          event.projectName,
          event.projectId,
          event.acceptedPrice
        ),
      };

    case 'vendor_approved':
      return {
        to: event.vendorEmail,
        subject: "Welcome to MechHub — You're now a MechMaster!",
        html: templates.vendorApprovedEmail(event.vendorName, event.loginUrl),
      };

    case 'vendor_rejected':
      return {
        to: event.vendorEmail,
        subject: 'Your MechHub vendor application update',
        html: templates.vendorRejectedEmail(event.vendorName, event.reapplyUrl),
      };

    case 'admin_vendor_pending_reminder':
      return {
        to: event.recipients,
        subject: `Action required — ${event.pendingCount} vendor application(s) pending review on MechHub`,
        html: templates.adminVendorPendingReminderEmail(
          event.pendingCount,
          event.vendors,
          event.reviewUrl
        ),
      };

    default: {
      // TypeScript exhaustive check — if this errors, we missed an event type
      const _exhaustive: never = event;
      throw new Error(`Unknown notification event type: ${(_exhaustive as any).type}`);
    }
  }
}

// ─── Public API ──────────────────────────────────────────────

export const NotificationService = {
  /**
   * Sends a notification email. Fire-and-forget: logs errors
   * but never throws so it won't break calling API routes.
   */
  async send(event: NotificationEvent): Promise<void> {
    try {
      const resend = getResend();
      const payload = composeEmail(event);

      const { error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html: payload.html,
        ...(payload.text ? { text: payload.text } : {}),
      });

      if (error) {
        logger.error({
          event: 'notification_send_failed',
          type: event.type,
          error: error.message,
          to: payload.to,
        });
        return;
      }

      logger.info({
        event: 'notification_sent',
        type: event.type,
        to: payload.to,
        subject: payload.subject,
      });
    } catch (err: any) {
      // Never throw — notifications must not break business logic
      logger.error({
        event: 'notification_send_exception',
        type: event.type,
        error: err.message || String(err),
      });
    }
  },

  /**
   * Fire-and-forget: dispatches the email without awaiting the result.
   * Use this in hot paths where response time matters (payments, status changes).
   */
  sendAsync(event: NotificationEvent): void {
    // Intentionally not awaited — runs in background
    NotificationService.send(event).catch(() => {
      // Already logged inside send()
    });
  },

  /**
   * Sends multiple notification events concurrently.
   * Useful when a single action triggers both customer + admin emails.
   */
  async sendAll(events: NotificationEvent[]): Promise<void> {
    await Promise.allSettled(events.map((e) => NotificationService.send(e)));
  },

  /**
   * Fire-and-forget version of sendAll.
   */
  sendAllAsync(events: NotificationEvent[]): void {
    Promise.allSettled(events.map((e) => NotificationService.send(e))).catch(() => { });
  },

  /**
   * Returns the shared Resend instance for legacy routes
   * that still need direct access (auth verification, forgot password).
   */
  getResendClient(): Resend {
    return getResend();
  },
};
