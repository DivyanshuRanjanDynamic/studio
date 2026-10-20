import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ═══════════════════════════════════════════════════
// Rate limiting can't be dodged with a forged header, and fails closed
// ═══════════════════════════════════════════════════

const firestore = { collection: vi.fn(), runTransaction: vi.fn() };
let adminAvailable = true;
vi.mock('@/lib/firebase-admin', () => ({
  getFirebaseAdmin: () => ({ adminFirestore: adminAvailable ? firestore : null }),
}));

const headers = (h: Record<string, string>) => new Headers(h);

afterEach(() => vi.unstubAllEnvs());

describe('getClientIdentifier', () => {
  it('ignores client-supplied X-Forwarded-For entries', async () => {
    const { getClientIdentifier } = await import('@/lib/auth-safety');
    // <client-sent junk>, <client-ip>, <load-balancer-ip>
    for (const spoof of ['1.1.1.1', '9.9.9.9', 'random-value-123']) {
      expect(getClientIdentifier(headers({ 'x-forwarded-for': `${spoof}, 203.0.113.7, 130.211.0.1` }))).toBe(
        '203.0.113.7'
      );
    }
    expect(getClientIdentifier(headers({ 'x-forwarded-for': '203.0.113.7, 130.211.0.1' }))).toBe('203.0.113.7');
  });

  it('returns "unknown" instead of guessing', async () => {
    const { getClientIdentifier } = await import('@/lib/auth-safety');
    expect(getClientIdentifier(headers({}))).toBe('unknown');
    expect(getClientIdentifier(headers({ 'x-forwarded-for': '203.0.113.7' }))).toBe('unknown');
    expect(getClientIdentifier(headers({ 'x-forwarded-for': '<script>, 130.211.0.1' }))).toBe('unknown');
  });

  it('honours the hop count and an opt-in platform header', async () => {
    const { getClientIdentifier } = await import('@/lib/auth-safety');
    vi.stubEnv('TRUSTED_PROXY_HOPS', '1');
    expect(getClientIdentifier(headers({ 'x-forwarded-for': '1.1.1.1, 203.0.113.7' }))).toBe('203.0.113.7');

    // Not trusted unless configured
    vi.stubEnv('TRUSTED_PROXY_HOPS', '2');
    expect(getClientIdentifier(headers({ 'x-fah-client-ip': '6.6.6.6' }))).toBe('unknown');
    vi.stubEnv('TRUSTED_CLIENT_IP_HEADER', 'x-fah-client-ip');
    expect(getClientIdentifier(headers({ 'x-fah-client-ip': '198.51.100.4' }))).toBe('198.51.100.4');
  });
});

describe('rateLimit', () => {
  beforeEach(() => {
    adminAvailable = true;
    firestore.collection.mockReset();
    firestore.runTransaction.mockReset();
    firestore.collection.mockReturnValue({ doc: (id: string) => ({ id }) });
  });

  it('fails closed by default when the store errors or is missing', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');
    firestore.runTransaction.mockRejectedValue(new Error('deadline exceeded'));
    expect((await rateLimit('ai-insights:203.0.113.7', 5, 60_000)).success).toBe(false);

    adminAvailable = false;
    expect((await rateLimit('contact:203.0.113.7', 3, 60_000)).success).toBe(false);
  });

  it('can be told to fail open for payment-critical routes', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');
    firestore.runTransaction.mockRejectedValue(new Error('unavailable'));
    expect((await rateLimit('payment-verify:u1', 10, 60_000, { onStoreError: 'allow' })).success).toBe(true);
  });

  it('stores limits under a hashed id, whatever the identifier contains', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');
    const docIds: string[] = [];
    firestore.collection.mockReturnValue({
      doc: (id: string) => {
        docIds.push(id);
        return { id };
      },
    });
    firestore.runTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({ get: async () => ({ data: () => undefined }), set: vi.fn() })
    );

    const result = await rateLimit('contact:../../users/admin', 3, 60_000);
    expect(result.success).toBe(true);
    expect(docIds[0]).toMatch(/^contact_[0-9a-f]{40}$/);
  });

  it('blocks once the window is full', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');
    const now = Date.now();
    firestore.runTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({ get: async () => ({ data: () => ({ requests: [now - 10, now - 5, now - 1] }) }), set: vi.fn() })
    );
    expect((await rateLimit('contact:x', 3, 60_000)).success).toBe(false);
  });
});
