import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ═══════════════════════════════════════════════════
// Consultation + newsletter go through validated, rate-limited server routes
// ═══════════════════════════════════════════════════

const writes: Array<{ collection: string; id: string; data: Record<string, unknown> }> = [];
const existingDocs = new Set<string>();
const firestore = {
  collection: (name: string) => ({
    doc: (id: string) => ({
      __path: `${name}/${id}`,
      set: async (data: Record<string, unknown>) => {
        writes.push({ collection: name, id, data });
      },
    }),
  }),
  runTransaction: async (fn: (tx: unknown) => unknown) =>
    fn({
      get: async (ref: { __path: string }) => ({ exists: existingDocs.has(ref.__path) }),
      set: (ref: { __path: string }, data: Record<string, unknown>) => {
        const [collection, id] = ref.__path.split('/');
        writes.push({ collection, id, data });
      },
    }),
};
const authenticateRequest = vi.fn();
const sendAsync = vi.fn();
let limited = false;

vi.mock('@/lib/firebase-admin', () => ({ getFirebaseAdmin: () => ({ adminFirestore: firestore }) }));
vi.mock('@/lib/auth-middleware', () => ({
  authenticateRequest: (...a: unknown[]) => authenticateRequest(...a),
}));
vi.mock('@/services/notification.service', () => ({ NotificationService: { sendAsync } }));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: async () => ({ success: !limited, remaining: 0, reset: Date.now() + 1000 }),
  rateLimitResponse: () => new Response(null, { status: 429 }),
}));

const post = (path: string, body: unknown) =>
  new NextRequest(`http://localhost${path}`, { method: 'POST', body: JSON.stringify(body) });

beforeEach(() => {
  writes.length = 0;
  existingDocs.clear();
  authenticateRequest.mockReset();
  sendAsync.mockReset();
  limited = false;
});

const consultation = {
  name: 'Asha',
  email: 'asha@example.in',
  phone: '+91 98765 43210',
  message: 'Need help reducing the machining cost of a bracket.',
  quoteRef: 'MH-ABCDEFGH23',
};

describe('POST /api/v1/consultation', () => {
  it('requires sign-in and attributes the request to the token user', async () => {
    const { POST } = await import('@/app/api/v1/consultation/route');

    authenticateRequest.mockResolvedValueOnce({ success: false, error: 'Authentication required', status: 401 });
    expect((await POST(post('/api/v1/consultation', consultation))).status).toBe(401);
    expect(writes).toHaveLength(0);

    authenticateRequest.mockResolvedValueOnce({ success: true, uid: 'user_7', role: 'customer', status: 'active' });
    const res = await POST(post('/api/v1/consultation', { ...consultation, userId: 'someone_else' }));
    expect(res.status).toBe(200);
    expect(writes[0]).toMatchObject({ collection: 'consultationRequests', data: { userId: 'user_7', status: 'new' } });
    expect(sendAsync).toHaveBeenCalledWith(expect.objectContaining({ type: 'admin_consultation_booked' }));
  });

  it('validates input and enforces the rate limit', async () => {
    authenticateRequest.mockResolvedValue({ success: true, uid: 'user_7', role: 'customer', status: 'active' });
    const { POST } = await import('@/app/api/v1/consultation/route');

    expect((await POST(post('/api/v1/consultation', { ...consultation, phone: '123' }))).status).toBe(400);
    expect((await POST(post('/api/v1/consultation', { ...consultation, message: 'too short' }))).status).toBe(400);

    limited = true;
    expect((await POST(post('/api/v1/consultation', consultation))).status).toBe(429);
    expect(writes).toHaveLength(0);
  });
});

describe('POST /api/v1/newsletter', () => {
  it('stores one normalised document per address', async () => {
    const { POST } = await import('@/app/api/v1/newsletter/route');

    expect((await POST(post('/api/v1/newsletter', { email: ' Asha@Example.in ' }))).status).toBe(200);
    expect(writes[0]).toMatchObject({ collection: 'newsletter_subscribers', data: { email: 'asha@example.in' } });
    expect(writes[0].id).toMatch(/^[0-9a-f]{40}$/);

    // Same address again: still 200 (no enumeration), nothing new written
    existingDocs.add(`newsletter_subscribers/${writes[0].id}`);
    expect((await POST(post('/api/v1/newsletter', { email: 'asha@example.in' }))).status).toBe(200);
    expect(writes).toHaveLength(1);
  });

  it('rejects bad input and floods', async () => {
    const { POST } = await import('@/app/api/v1/newsletter/route');
    expect((await POST(post('/api/v1/newsletter', { email: 'not-an-email' }))).status).toBe(400);
    expect((await POST(post('/api/v1/newsletter', { email: 'a@b.in', source: '<script>' }))).status).toBe(400);
    limited = true;
    expect((await POST(post('/api/v1/newsletter', { email: 'a@b.in' }))).status).toBe(429);
  });
});
