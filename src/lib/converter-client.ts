import type { ZodType } from 'zod';
import type { CncAnalysis, PrintAnalysis, SheetAnalysis } from '@/types/quoting';
import { cncAnalysisSchema, printAnalysisSchema, sheetAnalysisSchema } from '@/lib/validation/quoting';
import { Result, ok, err } from '@/utils/result';
import { AppError, ErrorCode } from '@/utils/errors';
import { logger } from '@/utils/logger';

// ═══════════════════════════════════════════════════
// converter-client — server-to-server calls to the CAD converter
// Authenticated with a shared service token that browsers never see.
// ═══════════════════════════════════════════════════

const ANALYZE_TIMEOUT_MS = 180_000; // OCCT analysis of a large STEP file

/** CONVERTER_INTERNAL_URL, or the root of the public converter URL for local dev */
function converterBaseUrl(): string {
  const explicit = process.env.CONVERTER_INTERNAL_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  const publicUrl = process.env.NEXT_PUBLIC_CONVERT_SERVICE_URL ?? 'http://localhost:8080/convert';
  return publicUrl.replace(/\/$/, '').replace(/\/convert$/, '');
}

function unavailable(message: string, context: Record<string, unknown>): AppError {
  return new AppError({ code: ErrorCode.SERVICE_UNAVAILABLE, message, statusCode: 503, context });
}

/**
 * POST {converter}{path} — the converter downloads the file from `fileUrl`
 * (a short-lived presigned S3 URL) and returns its analysis, validated here.
 */
async function postAnalysis<T>(
  path: string,
  fileUrl: string,
  fileName: string,
  schema: ZodType<unknown>,
  label: string,
  hint: string
): Promise<Result<T, AppError>> {
  const token = process.env.CONVERTER_SERVICE_TOKEN;
  if (!token) {
    logger.error({ event: 'Converter: CONVERTER_SERVICE_TOKEN is not set' });
    return err(unavailable(`${label} is not configured on this server.`, { fileName }));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${converterBaseUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ fileUrl, fileName }),
      signal: controller.signal,
      cache: 'no-store',
    });
  } catch (e) {
    const timedOut = e instanceof Error && e.name === 'AbortError';
    logger.error({ event: 'Converter: request failed', path, fileName, timedOut });
    return err(
      unavailable(
        timedOut ? `${label} timed out. ${hint}` : 'The CAD analysis service is unavailable. Please try again shortly.',
        { fileName }
      )
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { detail?: unknown };
    const detail = typeof body.detail === 'string' ? body.detail : null;

    // Auth/config problems are ours, not the customer's — don't echo them.
    // 404/405 = this converter build lacks the route (deployed image older than the app).
    if (res.status === 401 || res.status === 503 || res.status === 404 || res.status === 405) {
      logger.error({ event: 'Converter: rejected service call', path, status: res.status, detail });
      return err(unavailable('The CAD analysis service is unavailable. Please try again shortly.', { fileName }));
    }

    const code =
      res.status === 413
        ? ErrorCode.FILE_TOO_LARGE
        : res.status === 400
          ? ErrorCode.UNSUPPORTED_FORMAT
          : res.status === 422
            ? ErrorCode.PARSE_FAILED
            : ErrorCode.SERVICE_UNAVAILABLE;
    return err(
      new AppError({
        code,
        message: detail ?? `${label} failed (${res.status})`,
        statusCode: res.status >= 500 ? 502 : res.status,
        context: { fileName },
      })
    );
  }

  const parsed = schema.safeParse(await res.json().catch(() => null));
  if (!parsed.success) {
    logger.error({ event: 'Converter: unexpected analysis shape', path, fileName });
    return err(
      new AppError({
        code: ErrorCode.PARSE_FAILED,
        message: 'CAD analysis service returned an unexpected response',
        statusCode: 502,
        context: { fileName },
      })
    );
  }
  return ok(parsed.data as T);
}

/** CNC: stock, setups, machining times and holes from a STEP file */
export function analyzeCncFromUrl(fileUrl: string, fileName: string): Promise<Result<CncAnalysis, AppError>> {
  return postAnalysis<CncAnalysis>(
    '/internal/analyze-cnc',
    fileUrl,
    fileName,
    cncAnalysisSchema,
    'CNC analysis',
    'Try a simpler or smaller STEP file.'
  );
}

/** Sheet metal: thickness, flat blank, cut length, pierces, holes and bends from a STEP file */
export async function analyzeSheetFromUrl(fileUrl: string, fileName: string): Promise<Result<SheetAnalysis, AppError>> {
  const result = await postAnalysis<SheetAnalysis>(
    '/internal/analyze-sheet',
    fileUrl,
    fileName,
    sheetAnalysisSchema,
    'Sheet metal analysis',
    'Try a simpler or smaller STEP file.'
  );
  // The converter rejects machined blocks etc. with "... doesn't look like sheet metal".
  // Tag those so the wizard can point to another service instead of offering a retry.
  if (!result.success && result.error.statusCode === 422 && NOT_SHEET_DETAIL.test(result.error.message)) {
    return err(
      new AppError({
        code: ErrorCode.NOT_SHEET_METAL,
        message: result.error.message,
        statusCode: 422,
        context: { fileName },
      })
    );
  }
  return result;
}

const NOT_SHEET_DETAIL = /look like sheet metal/i;

/** FDM printing: volume, area and per-orientation bed size + support from STEP/STL/OBJ */
export function analyzePrintFromUrl(fileUrl: string, fileName: string): Promise<Result<PrintAnalysis, AppError>> {
  return postAnalysis<PrintAnalysis>(
    '/internal/analyze-print',
    fileUrl,
    fileName,
    printAnalysisSchema,
    '3D print analysis',
    'Try a lighter mesh or a smaller file.'
  );
}
