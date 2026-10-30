import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { collectionData as col, fakeDb, resetFakeFirestore } from './fake-firestore';

// ═══════════════════════════════════════════════════
// Audit H2: no MechHub-branded email to arbitrary addresses, and no HTML
// injection through names / project names / messages.
// ═══════════════════════════════════════════════════

vi.mock('@/lib/firebase-admin', () => ({ getFirebaseAdmin: () => ({ adminFirestore: fakeDb }) }));
vi.mock('@/firebase/db', () => ({ db: {} }));

let caller: { uid: string; role: string; status: string };
vi.mock('@/lib/auth-middleware', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth-middleware')>()),
  authenticateRequest: async () => ({ success: true, emailVerified: true, ...caller }),
}));

const sent: Array<{ to: string[]; subject: string; html: string }> = [];
vi.mock('resend', () => ({
  Resend: class {
    emails = {
      send: async (mail: { to: string[]; subject: string; html: string }) => {
        sent.push(mail);
        return { data: { id: `email_${sent.length}` }, error: null };
      },
    };
  },
}));

const ADMIN = { uid: 'adm_1', role: 'admin', status: 'active' };
const OWNER = { uid: 'cust_1', role: 'customer', status: 'active' };
const VENDOR = { uid: 'vend_1', role: 'mechmaster', status: 'active' };

async function notify(as: typeof caller, body: Record<string, unknown>) {
  caller = as;
  const { POST } = await import('@/app/api/v1/notifications/send/route');
  const res = await POST(
    new NextRequest('https://www.mechhub.in/api/v1/notifications/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
  // sendAllAsync is fire-and-forget; let it run
  await new Promise((r) => setTimeout(r, 0));
  return res.status;
}

beforeEach(() => {
  resetFakeFirestore();
  sent.length = 0;
  process.env.RESEND_API_KEY = 're_test';
  col('users').set('cust_1', { email: 'owner@customer.test', fullName: 'Priya' });
  col('projectRFQs').set('proj_1', {
    userId: 'cust_1',
    // Client-writable fields an attacker controls
    userEmail: 'victim@elsewhere.test',
    projectName: 'Bracket <a href="https://evil.test/login">Pay now</a>',
    quotedPrice: 10000,
    status: 'shipped',
  });
});

describe('H2: POST /api/v1/notifications/send', () => {
  it('vendors can no longer send email at all', async () => {
    for (const type of ['status_shipped', 'quotation_received', 'quote_accepted']) {
      expect(await notify(VENDOR, { type, projectId: 'proj_1' })).toBe(403);
    }
    expect(sent).toHaveLength(0);
  });

  it('ignores any recipient or content in the body; emails the account owner only', async () => {
    const status = await notify(ADMIN, {
      type: 'status_shipped',
      projectId: 'proj_1',
      customer: { email: 'anyone@victim.test', name: 'x' },
      balanceDue: 1,
    });
    expect(status).toBe(200);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toEqual(['owner@customer.test']); // not the project's userEmail, not the body
    // Balance due computed on the server from the agreed price
    const { calculateProjectFinances } = await import('@/utils/finance');
    expect(sent[0].html).toContain(calculateProjectFinances(10000).balance.toLocaleString('en-IN'));
  });

  it('customers cannot send admin updates, nor announce acceptance of a project not accepted', async () => {
    expect(await notify(OWNER, { type: 'status_shipped', projectId: 'proj_1' })).toBe(403);
    expect(await notify(OWNER, { type: 'quote_accepted', projectId: 'proj_1' })).toBe(403); // status is shipped
    expect(await notify({ ...OWNER, uid: 'cust_2' }, { type: 'quote_accepted', projectId: 'proj_1' })).toBe(403);
    expect(sent).toHaveLength(0);
  });

  it('the owner announces their acceptance to themselves and the admins', async () => {
    col('projectRFQs').get('proj_1')!.status = 'accepted';
    expect(await notify(OWNER, { type: 'quote_accepted', projectId: 'proj_1' })).toBe(200);
    expect(sent).toHaveLength(2);
    expect(sent[0].to).toEqual(['owner@customer.test']);
    expect(sent[1].to).not.toContain('victim@elsewhere.test');
  });

  it('rejects unknown event types and malformed bodies', async () => {
    expect(await notify(ADMIN, { type: 'password_reset', projectId: 'proj_1' })).toBe(400);
    expect(await notify(ADMIN, { events: [{ type: 'status_shipped' }] })).toBe(400);
  });
});

describe('H2: email templates escape every interpolated value', () => {
  it('renders attacker markup as text, and keeps subjects to one line', async () => {
    const { NotificationService } = await import('@/services/notification.service');
    const result = await NotificationService.send({
      type: 'negotiation_admin_reply',
      customer: { email: 'owner@customer.test', name: '<img src=x onerror=alert(1)>' },
      projectName: 'Bracket\r\nBcc: everyone@x.test <a href="https://evil.test">Pay</a>',
      projectId: 'p1" onclick="steal()',
      adminMessage: '<script>alert(1)</script>',
    });
    expect(result.success).toBe(true);
    const mail = sent[0];
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).not.toContain('<img src=x');
    expect(mail.html).not.toContain('<a href="https://evil.test">');
    expect(mail.html).not.toContain('" onclick="');
    expect(mail.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(mail.subject).not.toMatch(/[\r\n]/);
  });
});
