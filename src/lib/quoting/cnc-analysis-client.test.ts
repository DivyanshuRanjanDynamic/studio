import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { bracketAnalysis } from './__fixtures__/cnc-analysis';
import { ErrorCode } from '@/utils/errors';

// ═══════════════════════════════════════════════════
// Converter client (server → converter) and browser upload flow
// fetch is stubbed — no converter, S3 or network.
// ═══════════════════════════════════════════════════

const fetchMock = vi.fn();
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('analyzeCncFromUrl (server → converter)', () => {
  const S3_URL = 'https://mechhub-cad.s3.amazonaws.com/cnc-analysis/u/k/p.step?sig=1';

  it('calls the internal endpoint with the service token and validates the analysis', async () => {
    vi.stubEnv('CONVERTER_SERVICE_TOKEN', 'svc-token');
    vi.stubEnv('CONVERTER_INTERNAL_URL', 'https://converter.internal/');
    fetchMock.mockResolvedValue(json(200, bracketAnalysis));
    const { analyzeCncFromUrl } = await import('@/lib/converter-client');

    const result = await analyzeCncFromUrl(S3_URL, 'p.step');

    expect(result.success && result.data.version).toBe(bracketAnalysis.version);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://converter.internal/internal/analyze-cnc');
    expect(init.headers.Authorization).toBe('Bearer svc-token');
    expect(JSON.parse(init.body)).toEqual({ fileUrl: S3_URL, fileName: 'p.step' });
  });

  it('fails closed without a configured token', async () => {
    vi.stubEnv('CONVERTER_SERVICE_TOKEN', '');
    const { analyzeCncFromUrl } = await import('@/lib/converter-client');

    const result = await analyzeCncFromUrl(S3_URL, 'p.step');
    expect(result.success === false && result.error.code).toBe(ErrorCode.SERVICE_UNAVAILABLE);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("hides the converter's auth errors but passes geometry errors to the customer", async () => {
    vi.stubEnv('CONVERTER_SERVICE_TOKEN', 'svc-token');
    const { analyzeCncFromUrl } = await import('@/lib/converter-client');

    fetchMock.mockResolvedValueOnce(json(401, { detail: 'Invalid service credentials.' }));
    const denied = await analyzeCncFromUrl(S3_URL, 'p.step');
    expect(denied.success === false && denied.error.code).toBe(ErrorCode.SERVICE_UNAVAILABLE);
    expect(denied.success === false && denied.error.message).not.toMatch(/credential/i);

    fetchMock.mockResolvedValueOnce(json(422, { detail: 'STEP file contains no solid bodies.' }));
    const broken = await analyzeCncFromUrl(S3_URL, 'p.step');
    expect(broken.success === false && broken.error.code).toBe(ErrorCode.PARSE_FAILED);
    expect(broken.success === false && broken.error.message).toBe('STEP file contains no solid bodies.');
  });

  it('rejects responses that are not a valid analysis', async () => {
    vi.stubEnv('CONVERTER_SERVICE_TOKEN', 'svc-token');
    fetchMock.mockResolvedValue(json(200, { ...bracketAnalysis, machiningTime: undefined }));
    const { analyzeCncFromUrl } = await import('@/lib/converter-client');

    const result = await analyzeCncFromUrl(S3_URL, 'p.step');
    expect(result.success === false && result.error.code).toBe(ErrorCode.PARSE_FAILED);
  });
});

describe('analyzeCncPart (browser → MechHub → S3)', () => {
  const file = new File(['ISO-10303-21;'], 'bracket.step');
  const intent = {
    uploadUrl: 'https://s3.example/put?sig=1',
    fileKey: 'cnc-analysis/user_1/abcdefghijkl/bracket.step',
    contentType: 'application/octet-stream',
    expiresInSeconds: 900,
  };

  it('uploads to S3 then asks MechHub to analyse — never the converter', async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, intent))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(json(200, { analysisId: 'cnca_0123456789abcdef', analysis: bracketAnalysis }));
    const { analyzeCncPart } = await import('@/services/quoteApi.service');

    const result = await analyzeCncPart(file);

    expect(result.success && result.data.analysisId).toBe('cnca_0123456789abcdef');
    const [intentCall, putCall, analyzeCall] = fetchMock.mock.calls;
    expect(intentCall[0]).toBe('/api/v1/quote/cnc/upload-intent');
    expect(JSON.parse(intentCall[1].body)).toEqual({ fileName: 'bracket.step', fileSize: file.size });
    expect(putCall[0]).toBe(intent.uploadUrl);
    expect(putCall[1]).toMatchObject({ method: 'PUT', body: file, headers: { 'Content-Type': intent.contentType } });
    expect(analyzeCall[0]).toBe('/api/v1/quote/cnc/analyze');
    expect(JSON.parse(analyzeCall[1].body)).toEqual({ fileKey: intent.fileKey });
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('8080'))).toBe(false);
  });

  it('stops when the S3 upload fails', async () => {
    fetchMock.mockResolvedValueOnce(json(200, intent)).mockResolvedValueOnce(new Response(null, { status: 403 }));
    const { analyzeCncPart } = await import('@/services/quoteApi.service');

    const result = await analyzeCncPart(file);
    expect(result.success === false && result.error.message).toMatch(/upload/i);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('surfaces sign-in errors from the upload intent', async () => {
    fetchMock.mockResolvedValueOnce(json(401, { error: 'Please sign in to get instant quotes', code: 'UNAUTHORIZED' }));
    const { analyzeCncPart } = await import('@/services/quoteApi.service');

    const result = await analyzeCncPart(file);
    expect(result.success === false && result.error.statusCode).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
