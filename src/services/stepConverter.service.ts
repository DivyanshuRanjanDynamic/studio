import { ConversionResult, BendAnalysisResult } from '@/types/viewer';

/**
 * CAD Conversion Service
 *
 * Points at the CadQuery/FastAPI microservice on Railway.
 * Falls back to the old Firebase Function URL if the new var is not set,
 * so local dev continues to work without any changes.
 *
 * To switch environments, set ONE of these in .env.local:
 *   NEXT_PUBLIC_CONVERT_SERVICE_URL=https://your-app.up.railway.app/convert
 *   NEXT_PUBLIC_CONVERT_FUNCTION_URL=http://127.0.0.1:5001/.../convertStep  (legacy)
 */
const BASE_URL =
  process.env.NEXT_PUBLIC_CONVERT_SERVICE_URL ??
  process.env.NEXT_PUBLIC_CONVERT_FUNCTION_URL ??
  'http://localhost:8080/convert';

// Ensure we always hit the /convert endpoint even if the env var is just the base domain
const CONVERT_URL = BASE_URL.endsWith('/convert') || BASE_URL.endsWith('convertStep')
  ? BASE_URL
  : `${BASE_URL.replace(/\/$/, '')}/convert`;

const SERVICE_BASE_ROOT = CONVERT_URL.replace(/\/convert$/, '').replace(/\/convertStep$/, '');

interface JobStatusResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'done' | 'failed';
  fileName?: string;
  fileSize?: number;
  resultUrl?: string | null;
  result?: ConversionResult | null;
  error?: string | null;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The converter only accepts uploads carrying a short-lived ticket that MechHub
 * issues to signed-in users (see /api/v1/cad/convert-ticket).
 */
async function getConvertTicket(): Promise<string> {
  let res: Response;
  try {
    res = await fetch('/api/v1/cad/convert-ticket', { method: 'POST' });
  } catch {
    throw new Error('Could not reach MechHub. Check your internet connection.');
  }
  const body = (await res.json().catch(() => ({}))) as { ticket?: string; error?: string };
  if (!res.ok || !body.ticket) {
    throw new Error(body.error ?? `Could not start the conversion (${res.status})`);
  }
  return body.ticket;
}

export async function convertStepFile(
  file: File,
  onStatusUpdate?: (status: string) => void
): Promise<ConversionResult> {
  const ticket = await getConvertTicket();

  const form = new FormData();
  form.append('file', file);

  let res: Response;
  try {
    res = await fetch(CONVERT_URL, {
      method: 'POST',
      body: form,
      headers: { Authorization: `Bearer ${ticket}` },
      // No Content-Type header — browser sets it automatically with the
      // correct multipart boundary for FormData.
    });
  } catch (networkErr) {
    throw new Error(
      'Could not reach the CAD conversion service. ' +
      'Check your internet connection or service URL.'
    );
  }

  if (!res.ok && res.status !== 202) {
    // The FastAPI service returns { "detail": "..." } on errors (422/4xx/5xx).
    // The legacy Firebase function returns { "error": "..." }.
    const body = await res.json().catch(() => ({})) as Record<string, string>;
    const message = body.detail ?? body.error ?? `Conversion failed (${res.status})`;
    throw new Error(message);
  }

  const responseData = await res.json();

  // If async job started (returns jobId)
  if (responseData && responseData.jobId) {
    const jobId = responseData.jobId as string;
    onStatusUpdate?.('queued');

    const maxAttempts = 200; // ~5 minutes timeout with 1500ms delay
    let attempt = 0;

    while (attempt < maxAttempts) {
      await sleep(1500);
      attempt++;

      const statusUrl = `${SERVICE_BASE_ROOT}/status/${jobId}`;
      let statusRes: Response;
      try {
        statusRes = await fetch(statusUrl);
      } catch (err) {
        console.warn(`[stepConverter] Status check attempt ${attempt} network glitch:`, err);
        continue;
      }

      if (!statusRes.ok) {
        console.warn(`[stepConverter] Status check attempt ${attempt} returned ${statusRes.status}`);
        continue;
      }

      const job: JobStatusResponse = await statusRes.json();
      onStatusUpdate?.(job.status);

      if (job.status === 'done') {
        if (job.result) {
          return job.result;
        }
        throw new Error('Async job completed without result data.');
      }

      if (job.status === 'failed') {
        throw new Error(job.error || 'CAD conversion failed in background worker.');
      }
    }

    throw new Error('CAD conversion timed out. Please try uploading a smaller STEP file.');
  }

  // Direct synchronous fallback result
  return responseData as ConversionResult;
}


// ── Utility: convert base64 STL → ArrayBuffer (consumed by Three.js) ────────
export function stlBase64ToBuffer(base64: string): ArrayBuffer {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer as ArrayBuffer;
}

