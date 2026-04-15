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

console.log(`[stepConverter] Using CAD Service URL: ${CONVERT_URL}`);

export async function convertStepFile(file: File): Promise<ConversionResult> {
  const form = new FormData();
  form.append('file', file);

  let res: Response;
  try {
    res = await fetch(CONVERT_URL, {
      method: 'POST',
      body: form,
      // No Content-Type header — browser sets it automatically with the
      // correct multipart boundary for FormData.
    });
  } catch (networkErr) {
    throw new Error(
      'Could not reach the CAD conversion service. ' +
      'Check your internet connection or service URL.'
    );
  }

  if (!res.ok) {
    // The FastAPI service returns { "detail": "..." } on errors (422/4xx/5xx).
    // The legacy Firebase function returns { "error": "..." }.
    // We handle both shapes here.
    const body = await res.json().catch(() => ({})) as Record<string, string>;
    const message = body.detail ?? body.error ?? `Conversion failed (${res.status})`;
    throw new Error(message);
  }

  return res.json() as Promise<ConversionResult>;
}


// ── Utility: convert base64 STL → ArrayBuffer (consumed by Three.js) ────────
export function stlBase64ToBuffer(base64: string): ArrayBuffer {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer as ArrayBuffer;
}
