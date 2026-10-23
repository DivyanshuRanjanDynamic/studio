import { z } from 'zod';
import { ProjectRepository } from '@/repositories/project.repository';
import { FileAccessRepository } from '@/repositories/file-access.repository';
import { PartRepository } from '@/repositories/part.repository';
import { QuotingService, issueQuoteRef } from '@/services/quoting.service';
import { PartAnalysisService } from '@/services/part-analysis.service';
import {
  buildCncQuoteRequest,
  buildPrintQuoteRequest,
  buildSheetQuoteRequest,
  fitSheetRequestToAnalysis,
} from '@/lib/quoting/wizard-pricing';
import { wizardQuoteKind } from '@/lib/quoting/wizard-quote';
import { generateSheetQuote } from '@/lib/quoting/sheet-metal';
import { generatePrintQuote } from '@/lib/quoting/printing';
import { PricingCalibrationRepository } from '@/repositories/pricing-calibration.repository';
import { calibrateQuote, resolveMultiplier } from '@/lib/quoting/pricing-calibration';
import { formatCncStock } from '@/lib/quoting/cnc-materials';
import { isPartNameValid } from '@/lib/validation/part-name';
import type { MechanicalPart, PartInstantQuote } from '@/models/project.model';
import { Result, ok, err } from '@/utils/result';
import { AppError, ErrorCode, notFoundError, validationError } from '@/utils/errors';
import { logger } from '@/utils/logger';

// ═══════════════════════════════════════════════════
// PartService — add a part to a project, priced by the server
//
// The wizard shows a live estimate computed in the browser from the same engine,
// but the stored price always comes from here: the stored analysis (never the
// client's numbers) + the customer's selections.
// ═══════════════════════════════════════════════════

const MAX_PREVIEW_BYTES = 600_000; // keep the part document well under Firestore's 1 MiB

const vec3 = z.object({ x: z.number().finite(), y: z.number().finite(), z: z.number().finite() });

export const addPartSchema = z.object({
  partName: z.string().trim().min(1).max(120).refine(isPartNameValid, 'Part name must include a letter'),
  service: z.enum(['cnc_machining', 'sheet_metal_cutting', '3d_printing', 'wire_edm', 'cnc_turning']),
  cadFile: z.object({
    fileName: z.string().min(1).max(255),
    fileKey: z.string().min(1).max(512),
    fileSize: z.number().int().nonnegative().max(200 * 1024 * 1024),
  }),
  material: z.object({
    id: z.string().min(1).max(60),
    name: z.string().min(1).max(120),
    grade: z.string().max(60).optional(),
    thickness: z.number().positive().max(500).optional(),
  }),
  secondaryProcesses: z
    .array(
      z.enum([
        'powder_coating',
        'bending',
        'anodizing',
        'zinc_plating',
        'chrome_plating',
        'sand_blasting',
        'heat_treatment',
        'nickel_plating',
        'tapping',
      ])
    )
    .max(9)
    .default([]),
  coatingColor: z.string().max(30).optional(),
  taps: z
    .array(z.object({ holeIndex: z.number().int().nonnegative().max(10_000), tapType: z.string().min(1).max(20) }))
    .max(500)
    .default([]),
  tappingNotes: z.string().max(2000).optional(),
  quantity: z.number().int().min(1).max(10_000),
  discountTier: z.string().max(40).nullable().optional(),
  dimensions: vec3.optional(),
  /** Preview geometry from /convert — display only, never used for pricing */
  preview: z.record(z.any()).optional(),
  /** Server-stored CNC analysis to price from (POST /api/v1/quote/cnc/analyze) */
  analysisId: z.string().max(64).optional(),
});

export type AddPartInput = z.infer<typeof addPartSchema>;

const forbidden = (message: string) =>
  new AppError({ code: ErrorCode.FORBIDDEN, message, statusCode: 403 });

type PricedPart = { quote: PartInstantQuote | null; note?: string };

const engineerNote = (message: string) =>
  /engineer/i.test(message) ? message : `${message} — an engineer will price this part.`;

const dfmSnapshot = (issues: ReadonlyArray<{ code: string; message: string; blocking: boolean }>) =>
  issues.map((i) => ({ code: i.code, message: i.message, blocking: i.blocking }));

/** The stored instant price for any service with an instant-quote engine */
async function pricePart(userId: string, input: AddPartInput): Promise<Result<PricedPart, AppError>> {
  const kind = wizardQuoteKind(input.service);
  if (kind === 'cnc') return priceCncPart(userId, input);
  if (kind === 'sheet') return priceSheetPart(userId, input);
  if (kind === 'print') return pricePrintPart(userId, input);
  return ok({ quote: null, note: 'Our engineers price this service when you send the RFQ.' });
}

async function priceSheetPart(userId: string, input: AddPartInput): Promise<Result<PricedPart, AppError>> {
  if (!input.analysisId) {
    return ok({ quote: null, note: 'Sheet metal analysis was not available, so an engineer will price this part.' });
  }
  const built = buildSheetQuoteRequest({
    materialId: input.material.id,
    thicknessMm: input.material.thickness,
    secondaryProcesses: input.secondaryProcesses,
    coatingColor: input.coatingColor as never,
    taps: input.taps,
    quantity: input.quantity,
  });
  if (!built.priceable) return ok({ quote: null, note: built.reason });

  const analysis = await PartAnalysisService.getOwnedSheetAnalysis(userId, input.analysisId);
  if (!analysis.success) return err(analysis.error);

  const { request, unpriced } = fitSheetRequestToAnalysis(analysis.data, built.request, built.unpriced);
  const calibration = await PricingCalibrationRepository.getConfig();
  const priced = generateSheetQuote(analysis.data, request, calibration.shopLoad);
  if (!priced.success) return ok({ quote: null, note: engineerNote(priced.error.message) });

  const q = calibrateQuote(priced.data, resolveMultiplier(calibration, 'sheet', request.materialId));
  return ok({
    quote: {
      kind: 'sheet',
      quoteRef: issueQuoteRef(),
      analysisId: input.analysisId,
      currency: 'INR',
      pricePerPart: q.pricePerPart,
      totalPrice: q.totalPrice,
      quantity: input.quantity,
      leadTimeDays: q.leadTimeDays,
      materialId: request.materialId,
      finishType: request.finishType,
      thicknessMm: request.thicknessMm,
      breakdown: q.breakdown,
      hasBlockingIssues: q.hasBlockingIssues,
      dfmIssues: dfmSnapshot(q.dfmIssues),
      unpricedProcesses: unpriced,
      pricedAt: new Date().toISOString(),
      expiresAt: q.expiresAt,
    },
  });
}

async function pricePrintPart(userId: string, input: AddPartInput): Promise<Result<PricedPart, AppError>> {
  if (!input.analysisId) {
    return ok({ quote: null, note: '3D print analysis was not available, so an engineer will price this part.' });
  }
  const built = buildPrintQuoteRequest({
    materialId: input.material.id,
    secondaryProcesses: input.secondaryProcesses,
    coatingColor: input.coatingColor as never,
    quantity: input.quantity,
  });
  if (!built.priceable) return ok({ quote: null, note: built.reason });

  const analysis = await PartAnalysisService.getOwnedPrintAnalysis(userId, input.analysisId);
  if (!analysis.success) return err(analysis.error);

  const calibration = await PricingCalibrationRepository.getConfig();
  const priced = generatePrintQuote(analysis.data, built.request, calibration.shopLoad);
  if (!priced.success) return ok({ quote: null, note: engineerNote(priced.error.message) });

  const q = calibrateQuote(priced.data, resolveMultiplier(calibration, 'print', built.request.materialId));
  return ok({
    quote: {
      kind: 'print',
      quoteRef: issueQuoteRef(),
      analysisId: input.analysisId,
      currency: 'INR',
      pricePerPart: q.pricePerPart,
      totalPrice: q.totalPrice,
      quantity: input.quantity,
      leadTimeDays: q.leadTimeDays,
      materialId: built.request.materialId,
      finishType: built.request.finishType,
      breakdown: q.breakdown,
      hasBlockingIssues: q.hasBlockingIssues,
      dfmIssues: dfmSnapshot(q.dfmIssues),
      unpricedProcesses: built.unpriced,
      pricedAt: new Date().toISOString(),
      expiresAt: q.expiresAt,
    },
  });
}

async function priceCncPart(userId: string, input: AddPartInput): Promise<Result<PricedPart, AppError>> {
  if (!input.analysisId) {
    return ok({ quote: null, note: 'CNC analysis was not available, so an engineer will price this part.' });
  }

  const pricing = buildCncQuoteRequest({
    materialId: input.material.id,
    secondaryProcesses: input.secondaryProcesses,
    coatingColor: input.coatingColor as never,
    taps: input.taps,
    quantity: input.quantity,
  });
  if (!pricing.priceable) return ok({ quote: null, note: pricing.reason });

  const priced = await QuotingService.processStoredCncQuoteRequest(input.analysisId, pricing.request, userId, {
    fitTaps: true,
  });
  if (!priced.success) {
    // Missing/foreign analysis is a client error; geometry the engine can't price
    // (e.g. no standard stock) falls back to an engineer's quote.
    if (priced.error.code === ErrorCode.NOT_FOUND) return err(priced.error);
    if (priced.error.statusCode >= 500) return err(priced.error);
    if (priced.error.code === ErrorCode.INVALID_INPUT || priced.error.code === ErrorCode.INVALID_FINISH) {
      return err(validationError(priced.error.message));
    }
    return ok({ quote: null, note: `${priced.error.message} — an engineer will price this part.` });
  }

  const q = priced.data;
  // Threads the analysed holes couldn't take were left out of the price — flag them.
  const holesWanted = (pricing.request.taps ?? []).reduce((n, t) => n + t.count, 0);
  const holesPriced = (q.parameters.taps ?? []).reduce((n, t) => n + t.count, 0);
  const unpriced =
    holesPriced < holesWanted && !pricing.unpriced.includes('tapping')
      ? [...pricing.unpriced, 'tapping' as const]
      : pricing.unpriced;
  return ok({
    quote: {
      quoteRef: q.quoteRef,
      analysisId: input.analysisId,
      currency: 'INR',
      pricePerPart: q.pricePerPart,
      totalPrice: q.totalPrice,
      quantity: input.quantity,
      leadTimeDays: q.leadTimeDays,
      process: q.process,
      materialId: pricing.request.materialId,
      finishType: pricing.request.finishType,
      breakdown: q.breakdown,
      stock: formatCncStock(q.analysis.stock),
      hasBlockingIssues: q.hasBlockingIssues,
      dfmIssues: q.dfmIssues.map((i) => ({ code: i.code, message: i.message, blocking: i.blocking })),
      unpricedProcesses: unpriced,
      pricedAt: new Date().toISOString(),
      expiresAt: q.expiresAt,
    },
  });
}

export const PartService = {
  async addPart(userId: string, projectId: string, raw: unknown): Promise<Result<MechanicalPart, AppError>> {
    const parsed = addPartSchema.safeParse(raw);
    if (!parsed.success) {
      return err(validationError(parsed.error.errors[0]?.message ?? 'Invalid part', { issues: parsed.error.flatten() }));
    }
    const input = parsed.data;

    if (input.preview && JSON.stringify(input.preview).length > MAX_PREVIEW_BYTES) {
      return err(validationError('Preview data is too large'));
    }

    // 1. Project: the caller's own, still a draft (parts are frozen once quoted)
    const project = await ProjectRepository.getProjectRfqById(projectId);
    if (!project.success) return err(notFoundError('Project', projectId));
    if (project.data.userId !== userId) return err(notFoundError('Project', projectId));
    if (project.data.status !== 'draft') {
      return err(forbidden('Parts can only be added while the project is a draft.'));
    }

    // 2. File: uploaded by the caller (server-recorded), so a part can't point at someone else's file
    const upload = await FileAccessRepository.getUploadRecord(input.cadFile.fileKey);
    if (!upload.success) return err(upload.error);
    if (!upload.data || upload.data.userId !== userId) {
      return err(forbidden('You can only add files you uploaded.'));
    }

    // 3. Instant price (CNC, sheet metal, FDM) from the stored analysis
    const priced = await pricePart(userId, input);
    if (!priced.success) return err(priced.error);

    const nowIso = new Date().toISOString();
    const preview = input.preview as MechanicalPart['analysis'] | undefined;
    const part: MechanicalPart = {
      id: PartRepository.newPartId(),
      projectId,
      userId,
      partName: input.partName,
      service: input.service,
      cadFile: {
        fileName: input.cadFile.fileName,
        fileUrl: input.cadFile.fileKey,
        fileSize: input.cadFile.fileSize,
        uploadedAt: upload.data.createdAt,
      },
      material: input.material,
      secondaryProcesses: input.secondaryProcesses,
      ...(input.coatingColor ? { coatingColor: input.coatingColor as MechanicalPart['coatingColor'] } : {}),
      ...(input.taps.length > 0 ? { taps: input.taps } : {}),
      ...(input.tappingNotes?.trim() ? { tappingNotes: input.tappingNotes.trim() } : {}),
      ...(input.dimensions ? { dimensions: input.dimensions } : {}),
      quantity: input.quantity,
      ...(input.discountTier ? { discountTier: input.discountTier } : {}),
      status: 'ready_for_quote',
      ...(preview ? { analysis: preview } : {}),
      instantQuote: priced.data.quote,
      quoteStatus: priced.data.quote ? 'instant' : 'manual_review',
      ...(priced.data.note ? { quoteNote: priced.data.note } : {}),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const saved = await PartRepository.createPart(part);
    if (!saved.success) return err(saved.error);

    logger.info({
      event: 'PartService: Part added',
      projectId,
      partId: part.id,
      quoteStatus: part.quoteStatus,
      totalPrice: part.instantQuote?.totalPrice,
    });
    return ok(part);
  },
};
