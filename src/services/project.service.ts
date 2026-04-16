import { ProjectRepository } from '@/repositories/project.repository';
import { rfqCreateSchema, RfqCreateInput } from '@/validators/project.validator';
import { ProjectRFQ, VALID_TRANSITIONS, TimelineEvent } from '@/models/project.model';
import { Result, ok, err } from '@/utils/result';
import { AppError, validationError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { nanoid } from 'nanoid';

/**
 * ProjectService manages the high-level business logic for MechHub projects,
 * including RFQ submissions, status transitions, and vendor assignments.
 */
export const ProjectService = {
  /**
   * Submits a new Project RFQ with validation and orchestration.
   */
  async submitProjectRfq(input: RfqCreateInput & { userId: string | null }): Promise<Result<string, AppError>> {
    logger.info({ event: 'ProjectService: Submitting RFQ', projectName: input.projectName });

    // 1. Validation
    const validation = rfqCreateSchema.safeParse(input);
    if (!validation.success) {
      return err(validationError(validation.error.errors[0].message));
    }

    // 2. Data Preparation
    const rfqId = `rfq_${nanoid(12)}`;
    const rfqData: Partial<ProjectRFQ> & { id: string } = {
      ...validation.data,
      id: rfqId,
      userId: input.userId || 'anonymous',
      status: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 3. Persistence via Repository
    const saveResult = await ProjectRepository.saveProjectRfq(rfqData);
    
    if (saveResult.success) {
      logger.info({ event: 'ProjectService: RFQ submitted successfully', rfqId });
    }

    return saveResult;
  },

  /**
   * Retrieves a Project RFQ by its ID.
   */
  async getProjectRfqById(id: string): Promise<Result<ProjectRFQ, AppError>> {
    return ProjectRepository.getProjectRfqById(id);
  },

  /**
   * Fetches all RFQs belonging to a specific user.
   */
  async getUserProjectRfqs(userId: string): Promise<Result<ProjectRFQ[], AppError>> {
    return ProjectRepository.getRfqsByUserId(userId);
  },

  /**
   * Admin explicitly sends an RFQ to shortlisted vendors
   */
  async sendProjectRfq(rfqId: string, vendorIds: string[], adminId: string): Promise<Result<void, AppError>> {
    const rfqResult = await ProjectRepository.getProjectRfqById(rfqId);
    if (!rfqResult.success) return err(rfqResult.error);

    const rfq = rfqResult.data;
    const nextStatus = 'quote_requested';

    if (!VALID_TRANSITIONS[rfq.status]?.includes(nextStatus)) {
      return err(validationError(`Cannot transition from ${rfq.status} to ${nextStatus}`));
    }

    const timestamp = new Date().toISOString();
    const timelineEvent: TimelineEvent = {
        id: `evt_${nanoid(9)}`,
        type: 'rfq_sent',
        projectId: rfqId,
        actorType: 'admin',
        actorId: adminId,
        content: `Admin requested a quote from ${vendorIds.length} vendor(s)`,
        channel: 'internal',
        timestamp
    };

    return ProjectRepository.saveProjectRfq({
      id: rfqId,
      status: nextStatus as any,
      invitedVendorIds: vendorIds,
      timelineEvents: [...(rfq.timelineEvents || []), timelineEvent]
    }).then(res => res.success ? ok(undefined) : err(res.error));
  },

  /**
   * Vendor accepts an RFQ via atomic transaction
   */
  async acceptProjectRfq(rfqId: string, vendorId: string): Promise<Result<void, AppError>> {
    return ProjectRepository.atomicAssignRfq(rfqId, vendorId);
  },

  /**
   * Validated status transition
   */
  async updateRfqStatus(rfqId: string, nextStatus: string, actor: { id: string, type: 'admin'|'customer'|'vendor'|'system' }, note?: string): Promise<Result<void, AppError>> {
    const rfqResult = await ProjectRepository.getProjectRfqById(rfqId);
    if (!rfqResult.success) return err(rfqResult.error);

    const rfq = rfqResult.data;
    if (!VALID_TRANSITIONS[rfq.status]?.includes(nextStatus)) {
        return err(validationError(`Invalid transition: ${rfq.status} -> ${nextStatus}`));
    }

    const timestamp = new Date().toISOString();
    const timelineEvent: TimelineEvent = {
        id: `evt_${nanoid(9)}`,
        type: 'status_changed',
        projectId: rfqId,
        actorType: actor.type,
        actorId: actor.id,
        content: note || `Status changed from ${rfq.status} to ${nextStatus}`,
        channel: 'internal',
        timestamp
    };

    return ProjectRepository.saveProjectRfq({
      id: rfqId,
      status: nextStatus as any,
      timelineEvents: [...(rfq.timelineEvents || []), timelineEvent]
    }).then(res => res.success ? ok(undefined) : err(res.error));
  }
};
