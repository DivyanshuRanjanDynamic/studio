import { ProjectRepository } from '@/repositories/project.repository';
import { PartRepository } from '@/repositories/part.repository';
import { NotificationService } from '@/services/notification.service';
import { projectOwnerContact } from '@/lib/project-contact';
import { summarizeProjectCost, type ProjectCostSummary } from '@/lib/quoting/project-costing';
import type { NegotiationMessage, ProjectRFQ, TimelineEvent } from '@/models/project.model';
import { Result, ok, err } from '@/utils/result';
import { AppError, ErrorCode, internalError, notFoundError, validationError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { nanoid } from 'nanoid';

// ═══════════════════════════════════════════════════
// ProjectRfqService — customer-driven RFQ actions, server-side
//
// Moves these off the browser's direct Firestore writes so that:
//  • a snapshot of the instant costs is attached to the RFQ for the admin,
//  • status transitions are validated and authoritative, and
//  • negotiation messages are always recorded as role:'user' (a customer can
//    no longer forge admin replies or rewrite the thread).
// ═══════════════════════════════════════════════════

const MAX_NEGOTIATION_MESSAGE = 2000;

const forbidden = (message: string) =>
  new AppError({ code: ErrorCode.FORBIDDEN, message, statusCode: 403 });

/** Compact, admin-facing snapshot of what the instant engine priced this project at */
export interface RfqCostSnapshot {
  readonly currency: 'INR';
  readonly partsSubtotal: number;
  readonly gst: number;
  readonly shipping: number;
  readonly total: number;
  readonly partCount: number;
  readonly pricedPartCount: number;
  readonly pendingPartCount: number;
  readonly maxLeadTimeDays: number;
  readonly capturedAt: string;
}

function snapshot(summary: ProjectCostSummary): RfqCostSnapshot {
  return {
    currency: 'INR',
    partsSubtotal: summary.partsSubtotal,
    gst: summary.finances.gst,
    shipping: summary.finances.shipping,
    total: summary.finances.total,
    partCount: summary.partCount,
    pricedPartCount: summary.pricedPartCount,
    pendingPartCount: summary.pendingPartCount,
    maxLeadTimeDays: summary.maxLeadTimeDays,
    capturedAt: new Date().toISOString(),
  };
}

async function ownedProject(
  userId: string,
  projectId: string
): Promise<Result<ProjectRFQ, AppError>> {
  const result = await ProjectRepository.getProjectRfqById(projectId);
  if (!result.success) return err(notFoundError('Project', projectId));
  // Don't reveal that a project exists to a non-owner.
  if (result.data.userId !== userId) return err(notFoundError('Project', projectId));
  return ok(result.data);
}

export interface RequestQuoteResult {
  readonly status: 'quote_requested';
  readonly costSnapshot: RfqCostSnapshot;
  readonly partCount: number;
}

export const ProjectRfqService = {
  /**
   * Customer sends the RFQ: validates the project is a draft with parts, captures
   * the instant-cost snapshot, moves it to `quote_requested`, and notifies admin.
   */
  async requestQuote(userId: string, projectId: string): Promise<Result<RequestQuoteResult, AppError>> {
    const project = await ownedProject(userId, projectId);
    if (!project.success) return err(project.error);

    if (project.data.status !== 'draft') {
      return err(forbidden('This project has already been sent for a quote.'));
    }

    const partsResult = await PartRepository.getPartsByProjectId(projectId);
    if (!partsResult.success) return err(partsResult.error);
    const parts = partsResult.data;
    if (parts.length === 0) {
      return err(validationError('Add at least one part before requesting a quote.'));
    }

    const summary = summarizeProjectCost(parts);
    const costSnapshot = snapshot(summary);
    const nowIso = costSnapshot.capturedAt;

    const event: TimelineEvent = {
      id: `evt_${nanoid(9)}`,
      type: 'RFQ_REQUESTED',
      projectId,
      actorType: 'customer',
      actorId: userId,
      content: `Customer requested a quote for ${parts.length} part(s).`,
      channel: 'internal',
      timestamp: nowIso,
    };
    const timelineEvents = [...(project.data.timelineEvents ?? []), event];

    const saved = await ProjectRepository.saveProjectRfq({
      id: projectId,
      status: 'quote_requested',
      quoteRequestedAt: nowIso,
      instantCostSnapshot: costSnapshot,
      timelineEvents,
      updatedAt: nowIso,
    });
    if (!saved.success) return err(saved.error);

    // Admin + customer emails (fire-and-forget; failures don't fail the request).
    // The customer copy goes to the account email, never the project's editable userEmail.
    const contact = await projectOwnerContact(project.data);
    NotificationService.sendAllAsync([
      ...(contact
        ? [{
            type: 'rfq_submitted_customer' as const,
            customer: contact,
            projectName: project.data.projectName,
            projectId,
            partCount: parts.length,
          }]
        : []),
      {
        type: 'admin_new_rfq',
        customerName: contact?.name || project.data.userName || 'Customer',
        customerEmail: contact?.email || '',
        projectName: project.data.projectName,
        projectId,
        partCount: parts.length,
      },
    ]);

    logger.info({ event: 'ProjectRfq: Quote requested', projectId, userId, total: costSnapshot.total });
    return ok({ status: 'quote_requested', costSnapshot, partCount: parts.length });
  },

  /**
   * Customer counter-offer: appends a role:'user' message (server-stamped) and
   * moves the project to `negotiation`. Only valid once a quote has been sent.
   */
  async negotiate(
    userId: string,
    projectId: string,
    message: string,
    proposedPrice?: number
  ): Promise<Result<{ status: 'negotiation'; message: NegotiationMessage }, AppError>> {
    const trimmed = (message ?? '').trim();
    if (!trimmed) return err(validationError('Enter a message for the negotiation.'));
    if (trimmed.length > MAX_NEGOTIATION_MESSAGE) {
      return err(validationError('Your message is too long.'));
    }
    if (proposedPrice !== undefined && (!Number.isFinite(proposedPrice) || proposedPrice < 0 || proposedPrice > 1e9)) {
      return err(validationError('Enter a valid proposed price.'));
    }

    const project = await ownedProject(userId, projectId);
    if (!project.success) return err(project.error);

    if (!['quotation_sent', 'negotiation'].includes(project.data.status)) {
      return err(forbidden('You can negotiate only after a quotation has been sent.'));
    }

    const nowIso = new Date().toISOString();
    const entry: NegotiationMessage = {
      role: 'user',
      message: trimmed,
      timestamp: nowIso,
      ...(proposedPrice !== undefined ? { proposedPrice: Math.round(proposedPrice) } : {}),
    };
    const negotiationHistory = [...(project.data.negotiationHistory ?? []), entry];

    const saved = await ProjectRepository.saveProjectRfq({
      id: projectId,
      status: 'negotiation',
      negotiationHistory,
      updatedAt: nowIso,
    } as Partial<ProjectRFQ> & { id: string });
    if (!saved.success) return err(saved.error);

    const contact = await projectOwnerContact(project.data);
    NotificationService.sendAsync({
      type: 'admin_negotiation_customer_reply',
      customerName: contact?.name || project.data.userName || 'Customer',
      customerEmail: contact?.email || '',
      projectName: project.data.projectName,
      projectId,
      customerMessage: trimmed,
      ...(proposedPrice !== undefined ? { proposedPrice: Math.round(proposedPrice) } : {}),
    });

    logger.info({ event: 'ProjectRfq: Negotiation message', projectId, userId });
    return ok({ status: 'negotiation', message: entry });
  },
};
