// ═══════════════════════════════════════════════════
// quoteApi.service — browser client for the quote persist/share routes
// The server re-prices every request; its result is the quote of record.
// ═══════════════════════════════════════════════════

import type { AnyQuoteResult, CncAnalysis, CncQuoteRequest, QuoteRequest } from '@/types/quoting';
import type { MechanicalPart } from '@/models/project.model';
import { Result, ok, err } from '@/utils/result';
import { AppError, ErrorCode } from '@/utils/errors';

export type SaveQuoteInput =
  | { readonly kind: 'laser'; readonly request: QuoteRequest }
  | { readonly kind: 'cnc'; readonly analysisId: string; readonly request: CncQuoteRequest };

/** A CNC analysis stored server-side; quotes reference it by id */
export interface CncAnalysisHandle {
  readonly analysisId: string;
  readonly analysis: CncAnalysis;
}

// The converter analyses synchronously; large parts can take a while.
const ANALYZE_CNC_TIMEOUT_MS = 200_000;

async function postJson(
  url: string,
  payload: unknown,
  context: Record<string, unknown>,
  timeoutMs?: number
): Promise<Result<unknown, AppError>> {
  const controller = new AbortController();
  const timer = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (e) {
    const timedOut = e instanceof DOMException && e.name === 'AbortError';
    return err(
      new AppError({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: timedOut
          ? 'CNC analysis timed out. Try a simpler or smaller STEP file.'
          : 'Could not reach MechHub. Check your connection and try again.',
        statusCode: 503,
        context,
      })
    );
  } finally {
    if (timer) clearTimeout(timer);
  }

  const body = (await res.json().catch(() => null)) as { error?: unknown; code?: unknown } | null;
  if (!res.ok) {
    const code =
      typeof body?.code === 'string' && body.code in ErrorCode
        ? (body.code as ErrorCode)
        : ErrorCode.INTERNAL_ERROR;
    return err(
      new AppError({
        code,
        message: typeof body?.error === 'string' ? body.error : `Request failed (${res.status})`,
        statusCode: res.status,
        context,
      })
    );
  }
  return ok(body);
}

/**
 * CNC analysis without the browser ever calling the converter:
 * 1. ask MechHub for a presigned S3 upload, 2. PUT the STEP file to S3,
 * 3. MechHub's server has the converter analyse it and stores the result.
 */
export async function analyzeCncPart(file: File): Promise<Result<CncAnalysisHandle, AppError>> {
  const context = { fileName: file.name };

  const intent = await postJson(
    '/api/v1/quote/cnc/upload-intent',
    { fileName: file.name, fileSize: file.size },
    context
  );
  if (!intent.success) return intent;
  const { uploadUrl, fileKey, contentType } = (intent.data ?? {}) as {
    uploadUrl?: string;
    fileKey?: string;
    contentType?: string;
  };
  if (!uploadUrl || !fileKey) {
    return err(
      new AppError({
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Could not prepare the file upload',
        statusCode: 502,
        context,
      })
    );
  }

  let put: Response;
  try {
    // Content-Type must match what the URL was signed with.
    put = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType ?? 'application/octet-stream' },
      body: file,
    });
  } catch {
    put = new Response(null, { status: 503 });
  }
  if (!put.ok) {
    return err(
      new AppError({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Could not upload your STEP file. Check your connection and try again.',
        statusCode: 503,
        context: { ...context, status: put.status },
      })
    );
  }

  return analyzeUploadedStep(fileKey, file.name);
}

/**
 * Server-side CNC analysis of a STEP file already uploaded through MechHub
 * (part wizard or instant quote). Returns the stored analysis id for pricing.
 */
export async function analyzeUploadedStep(
  fileKey: string,
  fileName: string
): Promise<Result<CncAnalysisHandle, AppError>> {
  const context = { fileName };
  const analyzed = await postJson('/api/v1/quote/cnc/analyze', { fileKey }, context, ANALYZE_CNC_TIMEOUT_MS);
  if (!analyzed.success) return analyzed;

  const handle = analyzed.data as Partial<CncAnalysisHandle> | null;
  if (
    !handle ||
    typeof handle.analysisId !== 'string' ||
    !handle.analysis ||
    typeof handle.analysis.version !== 'string' ||
    !handle.analysis.machiningTime
  ) {
    return err(
      new AppError({
        code: ErrorCode.PARSE_FAILED,
        message: 'CAD analysis returned an unexpected response',
        statusCode: 502,
        context,
      })
    );
  }
  return ok({ analysisId: handle.analysisId, analysis: handle.analysis });
}

/** POST /api/v1/projects/[id]/parts — the server prices CNC parts and stores the part */
export async function addPartToProject(
  projectId: string,
  part: Record<string, unknown>
): Promise<Result<MechanicalPart, AppError>> {
  const created = await postJson(`/api/v1/projects/${encodeURIComponent(projectId)}/parts`, part, { projectId });
  if (!created.success) return created;
  const body = created.data as { part?: MechanicalPart } | null;
  if (!body?.part?.id) {
    return err(
      new AppError({
        code: ErrorCode.INTERNAL_ERROR,
        message: 'The server returned an unexpected response',
        statusCode: 502,
        context: { projectId },
      })
    );
  }
  return ok(body.part);
}

function isQuoteResult(value: unknown): value is AnyQuoteResult {
  const q = value as Partial<AnyQuoteResult> | null;
  return (
    !!q &&
    typeof q.quoteRef === 'string' &&
    typeof q.totalPrice === 'number' &&
    typeof q.pricePerPart === 'number' &&
    typeof q.expiresAt === 'number' &&
    !!q.parameters
  );
}

async function requestQuote(
  url: string,
  init: RequestInit,
  context: Record<string, unknown>
): Promise<Result<AnyQuoteResult, AppError>> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    return err(
      new AppError({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Could not reach MechHub. Check your connection and try again.',
        statusCode: 503,
        context,
      })
    );
  }

  const body = (await res.json().catch(() => null)) as
    | (Partial<AnyQuoteResult> & { error?: unknown; code?: unknown })
    | null;

  if (!res.ok) {
    const code =
      typeof body?.code === 'string' && body.code in ErrorCode
        ? (body.code as ErrorCode)
        : res.status === 404
          ? ErrorCode.NOT_FOUND
          : res.status === 400
            ? ErrorCode.VALIDATION_FAILED
            : ErrorCode.INTERNAL_ERROR;
    return err(
      new AppError({
        code,
        message: typeof body?.error === 'string' ? body.error : `Quote request failed (${res.status})`,
        statusCode: res.status,
        context,
      })
    );
  }

  if (!isQuoteResult(body)) {
    return err(
      new AppError({
        code: ErrorCode.INTERNAL_ERROR,
        message: 'The server returned an unexpected quote response',
        statusCode: 502,
        context,
      })
    );
  }
  return ok(body);
}

/** POST /api/v1/quote (laser) or /api/v1/quote/cnc — price server-side and save */
export function saveQuote(input: SaveQuoteInput): Promise<Result<AnyQuoteResult, AppError>> {
  const [url, payload] =
    input.kind === 'laser'
      ? ['/api/v1/quote', input.request]
      : ['/api/v1/quote/cnc', { analysisId: input.analysisId, request: input.request }];

  return requestQuote(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    { kind: input.kind, materialId: input.request.materialId }
  );
}

/** GET /api/v1/quote/share/[ref] */
export function fetchSharedQuote(ref: string): Promise<Result<AnyQuoteResult, AppError>> {
  return requestQuote(`/api/v1/quote/share/${encodeURIComponent(ref)}`, { method: 'GET' }, { ref });
}
