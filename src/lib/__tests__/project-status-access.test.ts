import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { collectionData as col, fakeDb, resetFakeFirestore } from './fake-firestore';

// ═══════════════════════════════════════════════════
// Audit H1: POST /api/v1/projects/[id]/status — only admins and the project's
// active assigned MechMaster may move it, and vendors only through execution stages.
// ═══════════════════════════════════════════════════

vi.mock('@/lib/firebase-admin', () => ({ getFirebaseAdmin: () => ({ adminFirestore: fakeDb }) }));
vi.mock('@/firebase/config', () => ({ db: {} }));

let caller: { uid: string; role: string; status: string };
vi.mock('@/lib/auth-middleware', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth-middleware')>()),
  authenticateRequest: async () => ({ success: true, emailVerified: true, ...caller }),
}));

async function setStatus(as: typeof caller, nextStatus: string, projectId = 'proj_1') {
  caller = as;
  const { POST } = await import('@/app/api/v1/projects/[projectId]/status/route');
  const res = await POST(
    new NextRequest(`https://www.mechhub.in/api/v1/projects/${projectId}/status`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nextStatus }),
    }),
    { params: Promise.resolve({ projectId }) }
  );
  return res.status;
}

beforeEach(() => {
  resetFakeFirestore();
  col('projectRFQs').set('proj_1', {
    userId: 'cust_1',
    assignedVendorId: 'vend_1',
    workflowStatus: 'QUALITY_CHECK',
    status: 'in_production',
  });
});

describe('H1: project status changes', () => {
  it('blocks a suspended MechMaster — even the assigned one', async () => {
    for (const status of ['suspended', 'inactive', 'pending']) {
      expect(await setStatus({ uid: 'vend_1', role: 'mechmaster', status }, 'DISPATCHED')).toBe(403);
      expect(await setStatus({ uid: 'vend_9', role: 'mechmaster', status }, 'DISPATCHED')).toBe(403);
    }
    expect(col('projectRFQs').get('proj_1')!.workflowStatus).toBe('QUALITY_CHECK');
  });

  it("blocks an active MechMaster on someone else's project", async () => {
    expect(await setStatus({ uid: 'vend_9', role: 'mechmaster', status: 'active' }, 'DISPATCHED')).toBe(403);
    expect(col('projectRFQs').get('proj_1')!.workflowStatus).toBe('QUALITY_CHECK');
  });

  it('blocks customers', async () => {
    expect(await setStatus({ uid: 'cust_1', role: 'customer', status: 'active' }, 'DISPATCHED')).toBe(403);
  });

  it('lets the active assigned MechMaster dispatch, and admins move it on', async () => {
    expect(await setStatus({ uid: 'vend_1', role: 'mechmaster', status: 'active' }, 'DISPATCHED')).toBe(200);
    expect(col('projectRFQs').get('proj_1')).toMatchObject({ workflowStatus: 'DISPATCHED', status: 'shipped' });
    expect(await setStatus({ uid: 'adm_1', role: 'admin', status: 'active' }, 'DELIVERED')).toBe(200);
  });
});
