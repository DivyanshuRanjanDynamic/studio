import { ProjectRepository } from '@/repositories/project.repository';
import { PartRepository } from '@/repositories/part.repository';
import { summarizeProjectCost } from '@/lib/quoting/project-costing';
import { buildQuotationPdf, type QuotationLineInput, type QuotationPdfInput } from '@/lib/quoting/quotation-pdf';
import { SERVICE_DISPLAY_NAMES } from '@/models/project.model';
import { calculateProjectFinances } from '@/utils/finance';
import { Result, ok, err } from '@/utils/result';
import { AppError, internalError, notFoundError } from '@/utils/errors';
import { logger } from '@/utils/logger';

// ═══════════════════════════════════════════════════
// QuotationService — build the downloadable quotation PDF for a project
//
// Estimate before engineering review (instant rollup of the parts), final once
// an engineer sends the official quote (the agreed finalPrice/quotedPrice).
// ═══════════════════════════════════════════════════

const VALIDITY_DAYS = 7;
/** Statuses where the admin has set an agreed price → the PDF is the final quotation */
const FINAL_STATUSES = new Set(['quotation_sent', 'negotiation', 'accepted', 'deposit_pending', 'in_production', 'shipping', 'shipped', 'delivered', 'completed']);

export interface GeneratedQuotation {
  readonly pdf: Uint8Array;
  readonly fileName: string;
  readonly kind: 'estimate' | 'final';
}

/** `MH-Q-<year>-<project suffix>` — stable across re-downloads */
function quotationNumber(projectId: string, createdAt: string): string {
  const year = new Date(createdAt || Date.now()).getFullYear();
  const suffix = projectId.replace(/[^A-Za-z0-9]/g, '').slice(-6).toUpperCase() || 'XXXXXX';
  return `MH-Q-${year}-${suffix}`;
}

export const QuotationService = {
  /**
   * Builds the project's quotation PDF. `isAdmin` lets staff download any
   * project's quotation; otherwise only the owner may.
   */
  async generate(
    userId: string,
    projectId: string,
    isAdmin = false
  ): Promise<Result<GeneratedQuotation, AppError>> {
    const projectResult = await ProjectRepository.getProjectRfqById(projectId);
    if (!projectResult.success) return err(notFoundError('Project', projectId));
    const project = projectResult.data as typeof projectResult.data & {
      quotedPrice?: number;
      finalPrice?: number;
      deliveryLocation?: string;
    };
    if (!isAdmin && project.userId !== userId) return err(notFoundError('Project', projectId));

    const partsResult = await PartRepository.getPartsByProjectId(projectId);
    if (!partsResult.success) return err(partsResult.error);
    const parts = partsResult.data;

    const summary = summarizeProjectCost(parts);
    const agreed = Number(project.finalPrice || project.quotedPrice || 0);
    const isFinal = FINAL_STATUSES.has(project.status) && Number.isFinite(agreed) && agreed > 0;

    const finances = isFinal ? calculateProjectFinances(agreed, summary.finances.shipping) : summary.finances;
    const subtotal = isFinal ? agreed : summary.partsSubtotal;

    const lines: QuotationLineInput[] = parts.map((part, i) => {
      const line = summary.lines[i];
      const serviceLabel = SERVICE_DISPLAY_NAMES[part.service] ?? part.service;
      const detail = [line.materialName, serviceLabel].filter(Boolean).join(' · ');
      return {
        partName: line.partName,
        detail,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
        // In a final quote, every part is covered by the agreed price.
        pending: !isFinal && line.status === 'pending',
      };
    });

    const now = new Date();
    const input: QuotationPdfInput = {
      quotationNumber: quotationNumber(projectId, project.createdAt),
      issuedAt: now,
      validUntil: new Date(now.getTime() + VALIDITY_DAYS * 24 * 60 * 60 * 1000),
      kind: isFinal ? 'final' : 'estimate',
      projectName: project.projectName,
      customer: {
        name: project.userName || 'Customer',
        email: project.userEmail || undefined,
        location: project.deliveryLocation || undefined,
      },
      lines,
      subtotal,
      gst: finances.gst,
      shipping: finances.shipping,
      total: finances.total,
      maxLeadTimeDays: isFinal ? Number(project.leadTimeDays) || summary.maxLeadTimeDays : summary.maxLeadTimeDays,
      pendingPartCount: isFinal ? 0 : summary.pendingPartCount,
    };

    try {
      const pdf = await buildQuotationPdf(input);
      logger.info({ event: 'QuotationService: PDF generated', projectId, kind: input.kind, bytes: pdf.length });
      return ok({ pdf, fileName: `${input.quotationNumber}.pdf`, kind: input.kind });
    } catch (e: any) {
      logger.error({ event: 'QuotationService: PDF build failed', projectId, error: e?.message });
      return err(internalError('Could not generate the quotation PDF'));
    }
  },
};
