import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { ok, err } from '@/utils/result';
import { internalError } from '@/utils/errors';
import type { AuthResult } from '@/lib/auth-middleware';

// ═══════════════════════════════════════════════════
// File access comes from server-recorded ownership, not customer-made parts
// ═══════════════════════════════════════════════════

const repo = {
  getUploadRecord: vi.fn(),
  getPartsReferencing: vi.fn(),
  getProject: vi.fn(),
  recordUpload: vi.fn(),
  attachToProject: vi.fn(),
};
vi.mock('@/repositories/file-access.repository', () => ({ FileAccessRepository: repo }));

const KEY = 'cad-files/abcd1234/bracket.step';
const user = (uid: string, role: AuthResult['role'] = 'customer'): AuthResult => ({
  success: true,
  uid,
  emailVerified: true,
  role,
  status: 'active',
});
const record = (overrides: Record<string, unknown> = {}) => ({
  fileId: 'file_1',
  fileKey: KEY,
  userId: 'alice',
  fileName: 'bracket.step',
  fileSize: 10,
  kind: 'cad',
  source: 'server',
  createdAt: '2026-01-01T00:00:00Z',
  ...overrides,
});
const projects: Record<string, unknown> = {
  alice_proj: { userId: 'alice', assignedVendorId: 'vendor_1', shortlistedVendorIds: ['vendor_2'] },
  mallory_proj: { userId: 'mallory', assignedVendorId: 'vendor_3' },
};

beforeEach(() => {
  Object.values(repo).forEach((m) => m.mockReset());
  repo.getProject.mockImplementation(async (id: string) => ok(projects[id] ?? null));
  repo.getPartsReferencing.mockResolvedValue(ok([]));
});
afterEach(() => vi.unstubAllEnvs());

async function decide(auth: AuthResult) {
  const { FileAccessService } = await import('@/services/file-access.service');
  const result = await FileAccessService.authorize(auth, KEY);
  if (!result.success) throw result.error;
  return result.data;
}

describe('FileAccessService with an upload record', () => {
  beforeEach(() => repo.getUploadRecord.mockResolvedValue(ok(record())));

  it('lets the uploader and admins in', async () => {
    expect(await decide(user('alice'))).toEqual({ allowed: true, reason: 'uploader' });
    expect(await decide(user('root', 'admin'))).toEqual({ allowed: true, reason: 'admin' });
  });

  it("ignores a part someone else created pointing at the uploader's key", async () => {
    repo.getPartsReferencing.mockResolvedValue(
      ok([{ userId: 'mallory', projectId: 'mallory_proj', createdAt: '2026-02-01' }])
    );
    expect((await decide(user('mallory'))).allowed).toBe(false);
    // Mallory's own vendor can't get in that way either
    expect((await decide(user('vendor_3', 'vendor'))).allowed).toBe(false);
  });

  it("shares through the uploader's own project with its vendors", async () => {
    repo.getPartsReferencing.mockResolvedValue(ok([{ userId: 'alice', projectId: 'alice_proj' }]));
    expect(await decide(user('vendor_1', 'vendor'))).toEqual({ allowed: true, reason: 'project_vendor' });
    expect(await decide(user('vendor_2', 'mechmaster'))).toEqual({ allowed: true, reason: 'project_vendor' });
    expect((await decide(user('stranger'))).allowed).toBe(false);
  });

  it("doesn't share through a part the uploader put in someone else's project", async () => {
    repo.getPartsReferencing.mockResolvedValue(ok([{ userId: 'alice', projectId: 'mallory_proj' }]));
    expect((await decide(user('mallory'))).allowed).toBe(false);
  });

  it('shares an artifact with the project owner when the vendor uploaded it', async () => {
    repo.getUploadRecord.mockResolvedValue(ok(record({ userId: 'vendor_1', projectIds: ['alice_proj'] })));
    projects.alice_proj = {
      ...(projects.alice_proj as object),
      artifacts: [{ fileKey: KEY, uploadedBy: 'vendor_1' }],
    };
    expect(await decide(user('alice'))).toEqual({ allowed: true, reason: 'artifact' });
    expect((await decide(user('mallory'))).allowed).toBe(false);
  });

  it('reports storage errors instead of guessing', async () => {
    repo.getUploadRecord.mockResolvedValue(err(internalError('down')));
    const { FileAccessService } = await import('@/services/file-access.service');
    expect((await FileAccessService.authorize(user('alice'), KEY)).success).toBe(false);
  });
});

describe('FileAccessService for legacy files (no upload record)', () => {
  beforeEach(() => repo.getUploadRecord.mockResolvedValue(ok(null)));

  it('treats the earliest part as the owner — a later forged part does not count', async () => {
    repo.getPartsReferencing.mockResolvedValue(
      ok([
        { userId: 'mallory', projectId: 'mallory_proj', createdAtMs: Date.parse('2026-03-01T00:00:00Z') },
        { userId: 'alice', projectId: 'alice_proj', createdAtMs: Date.parse('2025-12-01T00:00:00Z') },
      ])
    );
    expect(await decide(user('alice'))).toEqual({ allowed: true, reason: 'legacy_part' });
    expect(await decide(user('vendor_1', 'vendor'))).toEqual({ allowed: true, reason: 'legacy_part' });
    expect((await decide(user('mallory'))).allowed).toBe(false);
  });

  it('ignores the client-written createdAt — a back-dated forged part does not win', async () => {
    repo.getPartsReferencing.mockResolvedValue(
      ok([
        // Mallory's part claims 1970, but Firestore created it after Alice's
        { userId: 'mallory', projectId: 'mallory_proj', createdAt: '1970-01-01T00:00:00Z', createdAtMs: Date.parse('2026-03-01T00:00:00Z') },
        { userId: 'alice', projectId: 'alice_proj', createdAt: '2025-12-01T00:00:00Z', createdAtMs: Date.parse('2025-12-01T00:00:00Z') },
      ])
    );
    expect((await decide(user('mallory'))).allowed).toBe(false);
    expect(await decide(user('alice'))).toEqual({ allowed: true, reason: 'legacy_part' });
  });

  it('denies when no part has a server create time', async () => {
    repo.getPartsReferencing.mockResolvedValue(ok([{ userId: 'mallory', projectId: 'mallory_proj', createdAt: '1970-01-01' }]));
    expect((await decide(user('mallory'))).allowed).toBe(false);
  });

  it('denies everything once the backfill has run and the fallback is off', async () => {
    vi.stubEnv('FILE_ACCESS_LEGACY_FALLBACK', 'false');
    repo.getPartsReferencing.mockResolvedValue(ok([{ userId: 'alice', projectId: 'alice_proj', createdAtMs: Date.parse('2025-01-01') }]));
    expect((await decide(user('alice'))).allowed).toBe(false);
  });
});

describe('POST /api/v1/files/upload-intent records ownership', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('records the uploader, and issues no URL if the record fails', async () => {
    vi.doMock('@/lib/auth-middleware', () => ({
      authenticateRequest: async () => user('alice'),
      checkVerification: () => null,
      authorizeRoles: () => null,
    }));
    const signed: Array<{ input: Record<string, unknown> }> = [];
    vi.doMock('@aws-sdk/s3-request-presigner', () => ({
      getSignedUrl: async (_c: unknown, command: { input: Record<string, unknown> }) => {
        signed.push(command);
        return 'https://s3.example/put';
      },
    }));
    vi.doMock('@/lib/s3-client', () => ({ s3Client: {} }));
    let allow = true;
    vi.doMock('@/lib/rate-limit', () => ({
      rateLimit: async () => ({ success: allow, remaining: 0, reset: Date.now() + 1000 }),
      rateLimitResponse: () => new Response(null, { status: 429 }),
    }));
    const { POST } = await import('@/app/api/v1/files/upload-intent/route');
    const req = () =>
      new NextRequest('http://localhost/api/v1/files/upload-intent', {
        method: 'POST',
        body: JSON.stringify({ fileName: 'bracket.step', fileSize: 1000, contentType: 'model/step' }),
      });

    repo.recordUpload.mockResolvedValueOnce(ok(undefined));
    const res = await POST(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(repo.recordUpload).toHaveBeenCalledWith(
      expect.objectContaining({ fileKey: body.fileKey, userId: 'alice', source: 'server', kind: 'cad' })
    );

    // The declared size is signed into the PUT, so S3 refuses any other length
    expect(signed[0].input).toMatchObject({ ContentLength: 1000, Key: body.fileKey });

    repo.recordUpload.mockResolvedValueOnce(err(internalError('down')));
    expect((await POST(req())).status).toBe(503);

    // Per-account limit
    allow = false;
    expect((await POST(req())).status).toBe(429);
  });
});
