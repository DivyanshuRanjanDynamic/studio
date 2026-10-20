import type { CncAnalysis } from '@/types/quoting';
import { cncAnalysisSchema } from '@/lib/validation/quoting';
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
 * POST {converter}/internal/analyze-cnc — the converter downloads the STEP file
 * from `fileUrl` (a short-lived presigned S3 URL) and returns the CNC analysis.
 */
export async function analyzeCncFromUrl(
  fileUrl: string,
  fileName: string
): Promise<Result<CncAnalysis, AppError>> {
  const token = process.env.CONVERTER_SERVICE_TOKEN;
  if (!token) {
    logger.error({ event: 'Converter: CONVERTER_SERVICE_TOKEN is not set' });
    return err(unavailable('CNC analysis is not configured on this server.', { fileName }));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${converterBaseUrl()}/internal/analyze-cnc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ fileUrl, fileName }),
      signal: controller.signal,
      cache: 'no-store',
    });
  } catch (e) {
    const timedOut = e instanceof Error && e.name === 'AbortError';
    logger.error({ event: 'Converter: request failed', fileName, timedOut });
    return err(
      unavailable(
        timedOut
          ? 'CNC analysis timed out. Try a simpler or smaller STEP file.'
          : 'The CAD analysis service is unavailable. Please try again shortly.',
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
    if (res.status === 401 || res.status === 503) {
      logger.error({ event: 'Converter: rejected service call', status: res.status, detail });
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
        message: detail ?? `CNC analysis failed (${res.status})`,
        statusCode: res.status >= 500 ? 502 : res.status,
        context: { fileName },
      })
    );
  }

  const parsed = cncAnalysisSchema.safeParse(await res.json().catch(() => null));
  if (!parsed.success) {
    logger.error({ event: 'Converter: unexpected analysis shape', fileName });
    return err(
      new AppError({
        code: ErrorCode.PARSE_FAILED,
        message: 'CAD analysis service returned an unexpected response',
        statusCode: 502,
        context: { fileName },
      })
    );
  }
  return ok(parsed.data as CncAnalysis);
}
