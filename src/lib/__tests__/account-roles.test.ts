import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { ok, err } from '@/utils/result';
import { notFoundError } from '@/utils/errors';

// ═══════════════════════════════════════════════════
// Nobody can grant themselves a role: sign-up, provisioning and sessions
// No Firebase — Admin SDK, repository and whitelist are mocked.
// ═══════════════════════════════════════════════════

const WHITELISTED = 'boss@mechhub.in';

const adminAuth = {
  getUserByEmail: vi.fn(),
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  createCustomToken: vi.fn(),
  setCustomUserClaims: vi.fn(),
  verifyIdToken: vi.fn(),
  createSessionCookie: vi.fn(),
};
const UserRepository = {
  getUserById: vi.fn(),
  getUserByEmail: vi.fn(),
  saveUser: vi.fn(),
};
const authenticateRequest = vi.fn();

vi.mock('@/lib/firebase-admin', () => ({
  getFirebaseAdmin: () => ({ adminAuth, adminFirestore: null, adminStorage: null }),
}));
vi.mock('@/repositories/user.repository', () => ({ UserRepository }));
vi.mock('@/lib/auth-utils', () => ({
  isAdmin: (email: string | null | undefined) => (email || '').toLowerCase() === WHITELISTED,
}));
vi.mock('@/services/notification.service', () => ({
  NotificationService: { sendAllAsync: vi.fn() },
}));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: async () => ({ success: true, remaining: 9, reset: Date.now() }),
  rateLimitResponse: () => new Response(null, { status: 429 }),
}));
vi.mock('@/lib/auth-middleware', () => ({
  authenticateRequest: (...args: unknown[]) => authenticateRequest(...args),
}));

const json = (body: unknown, headers: Record<string, string> = {}) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...headers },
  body: JSON.stringify(body),
});

beforeEach(() => {
  Object.values(adminAuth).forEach((m) => m.mockReset());
  Object.values(UserRepository).forEach((m) => m.mockReset());
  authenticateRequest.mockReset();
  UserRepository.saveUser.mockResolvedValue(ok(undefined));
});

const savedRole = () => UserRepository.saveUser.mock.calls.at(-1)?.[0]?.role;

describe('UserService.provisionNewUser', () => {
  it('never grants a requested privileged role', async () => {
    const { UserService } = await import('@/services/user.service');

    for (const role of ['admin', 'vendor', 'mechmaster', 'superuser'] as const) {
      await UserService.provisionNewUser({ uid: 'u1', email: 'a@x.in', role: role as never });
      expect(savedRole(), role).toBe('customer');
    }
    expect(adminAuth.setCustomUserClaims).not.toHaveBeenCalled();
  });

  it('keeps the self-service vendor application role', async () => {
    const { UserService } = await import('@/services/user.service');
    await UserService.provisionNewUser({ uid: 'u1', email: 'a@x.in', role: 'vendor_pending' });
    expect(savedRole()).toBe('vendor_pending');
  });

  it('grants a whitelisted admin only once the email is verified', async () => {
    const { UserService } = await import('@/services/user.service');

    await UserService.provisionNewUser({ uid: 'u1', email: WHITELISTED, emailVerified: false });
    expect(savedRole()).toBe('customer');
    expect(adminAuth.setCustomUserClaims).not.toHaveBeenCalled();

    await UserService.provisionNewUser({ uid: 'u1', email: WHITELISTED, emailVerified: true });
    expect(savedRole()).toBe('admin');
    expect(adminAuth.setCustomUserClaims).toHaveBeenCalledWith('u1', { admin: true });
  });
});

describe('UserService.syncUserFromAuth', () => {
  it('does not elevate an unverified whitelisted address on login', async () => {
    UserRepository.getUserById.mockResolvedValue(ok({ id: 'u1', role: 'customer', fullName: 'Boss' }));
    const { UserService } = await import('@/services/user.service');

    await UserService.syncUserFromAuth({ uid: 'u1', email: WHITELISTED, emailVerified: false });
    expect(savedRole()).toBeUndefined();

    await UserService.syncUserFromAuth({ uid: 'u1', email: WHITELISTED, emailVerified: true });
    expect(savedRole()).toBe('admin');
  });
});

describe('POST /api/v1/user/provision', () => {
  const req = (body: unknown) =>
    new NextRequest('http://localhost/api/v1/user/provision', json(body, { Authorization: 'Bearer t' }));

  it('uses the token email and a customer role, whatever the body says', async () => {
    authenticateRequest.mockResolvedValue({
      success: true,
      uid: 'u9',
      email: 'mallory@evil.in',
      emailVerified: true,
      role: 'customer',
      status: 'active',
    });
    UserRepository.getUserById.mockResolvedValue(err(notFoundError('User', 'u9')));
    const { POST } = await import('@/app/api/v1/user/provision/route');

    const res = await POST(req({ email: WHITELISTED, role: 'admin', fullName: 'Mallory' }));

    expect(res.status).toBe(200);
    const saved = UserRepository.saveUser.mock.calls.at(-1)?.[0];
    expect(saved).toMatchObject({ id: 'u9', email: 'mallory@evil.in', role: 'customer' });
    expect(adminAuth.setCustomUserClaims).not.toHaveBeenCalled();
  });

  it('never overwrites an existing profile', async () => {
    authenticateRequest.mockResolvedValue({
      success: true,
      uid: 'u9',
      email: 'vendor@shop.in',
      emailVerified: true,
      role: 'vendor',
      status: 'active',
    });
    UserRepository.getUserById.mockResolvedValue(ok({ id: 'u9', role: 'vendor' }));
    const { POST } = await import('@/app/api/v1/user/provision/route');

    const res = await POST(req({ role: 'customer' }));

    expect(res.status).toBe(200);
    expect(UserRepository.saveUser).not.toHaveBeenCalled();
  });
});

describe('POST /api/v1/auth/session', () => {
  const sessionReq = () =>
    new Request('http://localhost/api/v1/auth/session', json({ idToken: 'id-token', expectedRole: 'customer' }));

  beforeEach(() => {
    UserRepository.getUserById.mockResolvedValue(ok({ id: 'u1', role: 'customer', status: 'active', fullName: 'A' }));
    adminAuth.createSessionCookie.mockResolvedValue('session-cookie');
  });

  it('refuses unverified accounts for every sign-in method, including custom tokens', async () => {
    const { POST } = await import('@/app/api/v1/auth/session/route');

    for (const provider of ['custom', 'password', 'google.com']) {
      adminAuth.verifyIdToken.mockResolvedValueOnce({
        uid: 'u1',
        email: 'a@x.in',
        email_verified: false,
        firebase: { sign_in_provider: provider },
      });
      const res = await POST(sessionReq());
      expect(res.status, provider).toBe(403);
    }
    expect(adminAuth.createSessionCookie).not.toHaveBeenCalled();
  });

  it('issues a session for a verified account', async () => {
    adminAuth.verifyIdToken.mockResolvedValue({
      uid: 'u1',
      email: 'a@x.in',
      email_verified: true,
      firebase: { sign_in_provider: 'custom' },
    });
    const { POST } = await import('@/app/api/v1/auth/session/route');

    const res = await POST(sessionReq());
    expect(res.status).toBe(200);
    expect(adminAuth.createSessionCookie).toHaveBeenCalled();
  });
});
