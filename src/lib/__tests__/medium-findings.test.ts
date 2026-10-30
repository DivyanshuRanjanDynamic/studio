import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { collectionData as col, fakeDb, resetFakeFirestore } from './fake-firestore';

// ═══════════════════════════════════════════════════
// Audit medium findings, through the real route handlers:
//   M1 vendor claim needs an invite · M5 cron fails closed · M7 no login token
//   in the verification redirect · M4 vendor directory returns card fields only
// ═══════════════════════════════════════════════════

const adminAuth = { updateUser: vi.fn(), createCustomToken: vi.fn() };
vi.mock('@/lib/firebase-admin', () => ({ getFirebaseAdmin: () => ({ adminFirestore: fakeDb, adminAuth }) }));
vi.mock('@/firebase/db', () => ({ db: {} }));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: async () => ({ success: true, remaining: 10, reset: Date.now() + 60_000 }),
  rateLimitResponse: () => new Response(null, { status: 429 }),
}));

let caller: { uid: string; role: string; status: string };
vi.mock('@/lib/auth-middleware', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth-middleware')>()),
  authenticateRequest: async () => ({ success: true, emailVerified: true, ...caller }),
}));

const runVendorReminderCron = vi.fn(async () => ({ sent: 1 }));
vi.mock('@/lib/cron/vendorReminderCron', () => ({ runVendorReminderCron: () => runVendorReminderCron() }));
vi.mock('@/services/user.service', () => ({
  UserService: { syncUserFromAuth: async () => ({ success: true, data: undefined }) },
}));

beforeEach(() => {
  resetFakeFirestore();
  runVendorReminderCron.mockClear();
  adminAuth.updateUser.mockReset();
  adminAuth.createCustomToken.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

// ── M1 ───────────────────────────────────────────────────────────────
describe('M1: vendors claim only projects they were invited to', () => {
  const VENDOR = { uid: 'vend_1', role: 'mechmaster', status: 'active' };
  async function claim(projectId: string) {
    caller = VENDOR;
    const { POST } = await import('@/app/api/v1/projects/[projectId]/accept/route');
    const res = await POST(new NextRequest(`https://www.mechhub.in/api/v1/projects/${projectId}/accept`, { method: 'POST' }), {
      params: Promise.resolve({ projectId }),
    });
    return res.status;
  }

  it('refuses a project with no invite list (used to let any vendor in)', async () => {
    col('projectRFQs').set('p_open', { userId: 'cust_1', status: 'quote_requested', workflowStatus: 'RFQ_SENT' });
    expect(await claim('p_open')).toBe(403);
    expect(col('projectRFQs').get('p_open')!.assignedVendorId).toBeUndefined();
  });

  it("refuses a project whose status isn't an open RFQ, even when invited", async () => {
    col('projectRFQs').set('p_odd', { userId: 'cust_1', status: 'weird_legacy', invitedVendorIds: ['vend_1'] });
    expect(await claim('p_odd')).toBe(409);
  });

  it('lets a shortlisted vendor claim even when invitedVendorIds is empty', async () => {
    col('projectRFQs').set('p_ok', {
      userId: 'cust_1',
      workflowStatus: 'RFQ_SENT',
      invitedVendorIds: [],
      shortlistedVendorIds: ['vend_1'],
    });
    expect(await claim('p_ok')).toBe(200);
    expect(col('projectRFQs').get('p_ok')!.assignedVendorId).toBe('vend_1');
  });
});

// ── M5 ───────────────────────────────────────────────────────────────
describe('M5: vendor reminder cron fails closed', () => {
  async function trigger(method: 'GET' | 'POST', headers: Record<string, string> = {}) {
    const route = await import('@/app/api/vendors/reminders/route');
    const req = new NextRequest('https://www.mechhub.in/api/vendors/reminders', { method, headers });
    return (await route[method](req)).status;
  }

  it('refuses everyone when no secret is configured', async () => {
    vi.stubEnv('CRON_SECRET', '');
    expect(await trigger('POST')).toBe(503);
    expect(await trigger('GET', { authorization: 'Bearer anything' })).toBe(503);
    expect(runVendorReminderCron).not.toHaveBeenCalled();
  });

  it('Vercel Cron: GET with Authorization: Bearer <CRON_SECRET>', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-secret-123');
    expect(await trigger('GET')).toBe(401);
    expect(await trigger('GET', { authorization: 'Bearer cron-secret-12' })).toBe(401);
    expect(await trigger('GET', { authorization: 'cron-secret-123' })).toBe(401); // no "Bearer "
    expect(runVendorReminderCron).not.toHaveBeenCalled();
    expect(await trigger('GET', { authorization: 'Bearer cron-secret-123' })).toBe(200);
    expect(runVendorReminderCron).toHaveBeenCalledTimes(1);
  });

  it('other schedulers: POST with x-cron-secret', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-secret-123');
    expect(await trigger('POST', { 'x-cron-secret': 'wrong' })).toBe(401);
    expect(await trigger('POST', { 'x-cron-secret': 'cron-secret-123' })).toBe(200);
    expect(runVendorReminderCron).toHaveBeenCalledTimes(1);
  });
});

// ── M7 ───────────────────────────────────────────────────────────────
describe('M7: email verification puts no login credential in the URL', () => {
  it('verifies, then sends the user to sign in without a token', async () => {
    const raw = 'a'.repeat(64);
    const hash = createHash('sha256').update(raw).digest('hex');
    col('verification_tokens').set(hash, {
      uid: 'u1',
      email: 'u1@x.test',
      name: 'U1',
      used: false,
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    });
    const { GET } = await import('@/app/api/v1/auth/verify/route');
    const res = await GET(new Request(`https://www.mechhub.in/api/v1/auth/verify?token=${raw}`));

    const location = res.headers.get('location') ?? '';
    expect(res.status).toBe(307);
    expect(location).toContain('/login?verified=true');
    expect(location).not.toMatch(/[?&]token=/);
    expect(adminAuth.createCustomToken).not.toHaveBeenCalled();
    expect(adminAuth.updateUser).toHaveBeenCalledWith('u1', { emailVerified: true });
    expect(col('verification_tokens').get(hash)!.used).toBe(true);
  });
});

// ── M4 ───────────────────────────────────────────────────────────────
describe('M4: vendor directory exposes card fields only', () => {
  it('lists active vendors without contact, GST, revenue or street address', async () => {
    col('users').set('vend_1', {
      role: 'mechmaster',
      isActive: true,
      fullName: 'Ravi',
      teamName: 'Ravi Precision',
      email: 'ravi@private.test',
      phone: '9876543210',
      gstNumber: '27ABCDE1234F1Z5',
      monthlyRevenue: '50L',
      location: 'Plot 12, MIDC Bhosari, Pune, Maharashtra',
      specializations: ['CNC'],
      rating: 4.8,
      isVerified: true,
      imageUrl: 'javascript:alert(1)',
    });
    col('users').set('vend_2', { role: 'vendor', isActive: false, fullName: 'Inactive' });
    col('users').set('cust_1', { role: 'customer', isActive: true, fullName: 'Buyer' });

    const { GET } = await import('@/app/api/v1/vendors/directory/route');
    const res = await GET(new NextRequest('https://www.mechhub.in/api/v1/vendors/directory'));
    const { vendors } = await res.json();

    expect(vendors).toHaveLength(1);
    const [card] = vendors;
    expect(card).toMatchObject({ id: 'vend_1', teamName: 'Ravi Precision', location: 'Pune, Maharashtra', rating: 4.8 });
    expect(card.imageUrl).toBeNull(); // only https images
    const json = JSON.stringify(card);
    for (const secret of ['ravi@private.test', '9876543210', '27ABCDE1234F1Z5', '50L', 'Plot 12', 'MIDC']) {
      expect(json).not.toContain(secret);
    }
  });
});
