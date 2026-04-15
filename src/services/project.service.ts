import { ProjectRepository } from '@/repositories/project.repository';
import { rfqCreateSchema, RfqCreateInput } from '@/validators/project.validator';
import { ProjectRFQ } from '@/models/project.model';
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
};
