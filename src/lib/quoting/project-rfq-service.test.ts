import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok } from '@/utils/result';
import { ErrorCode } from '@/utils/errors';
import type { MechanicalPart, PartInstantQuote, ProjectRFQ } from '@/models/project.model';

// ═══════════════════════════════════════════════════
// ProjectRfqService — customer RFQ send + negotiation, server-side
// Repositories and notifications mocked; costing is the real pure helper.
// ═══════════════════════════════════════════════════

const getProjectRfqById = vi.fn();
const saveProjectRfq = vi.fn();
const getPartsByProjectId = vi.fn();
const sendAllAsync = vi.fn();
const sendAsync = vi.fn();

vi.mock('@/repositories/project.repository', () => ({
  ProjectRepository: {
    getProjectRfqById: (...a: unknown[]) => getProjectRfqById(...a),
    saveProjectRfq: (...a: unknown[]) => saveProjectRfq(...a),
  },
}));
vi.mock('@/repositories/part.repository', () => ({
  PartRepository: { getPartsByProjectId: (...a: unknown[]) => getPartsByProjectId(...a) },
}));
vi.mock('@/services/notification.service', () => ({
  NotificationService: {
    sendAllAsync: (...a: unknown[]) => sendAllAsync(...a),
    sendAsync: (...a: unknown[]) => sendAsync(...a),
  },
}));

const project = (overrides: Partial<ProjectRFQ> = {}): ProjectRFQ =>
  ({
    id: 'proj_1',
    userId: 'user_1',
    userName: 'Asha',
    userEmail: 'asha@example.in',
    projectName: 'Gearbox',
    parts: [],
    status: 'draft',
    createdAt: '2026-10-20T00:00:00Z',
    updatedAt: '2026-10-20T00:00:00Z',
    ...overrides,
  }) as ProjectRFQ;

const quote = (total: number): PartInstantQuote =>
  ({ totalPrice: total, pricePerPart: total, quantity: 1, leadTimeDays: 3, expiresAt: Date.now() + 9e5 }) as PartInstantQuote;

const part = (id: string, instantQuote: PartInstantQuote | null): MechanicalPart =>
  ({
    id,
    projectId: 'proj_1',
    userId: 'user_1',
    partName: `Part ${id}`,
    service: 'cnc_machining',
    cadFile: { fileName: `${id}.step`, fileUrl: `k/${id}`, fileSize: 1, uploadedAt: '2026-10-20T00:00:00Z' },
    material: { id: 'al_6061', name: 'Aluminium 6061' },
    secondaryProcesses: [],
    quantity: 1,
    status: 'ready_for_quote',
    instantQuote,
    quoteStatus: instantQuote ? 'instant' : 'manual_review',
    createdAt: '2026-10-20T00:00:00Z',
    updatedAt: '2026-10-20T00:00:00Z',
  }) as MechanicalPart;

beforeEach(() => {
  [getProjectRfqById, saveProjectRfq, getPartsByProjectId, sendAllAsync, sendAsync].forEach((m) => m.mockReset());
  saveProjectRfq.mockResolvedValue(ok('proj_1'));
});

describe('ProjectRfqService.requestQuote', () => {
  it('snapshots the instant cost, moves to quote_requested and notifies admin', async () => {
    getProjectRfqById.mockResolvedValue(ok(project()));
    getPartsByProjectId.mockResolvedValue(ok([part('a', quote(5000)), part('b', quote(3000))]));
    const { ProjectRfqService } = await import('@/services/project-rfq.service');

    const result = await ProjectRfqService.requestQuote('user_1', 'proj_1');

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.status).toBe('quote_requested');
    expect(result.data.costSnapshot).toMatchObject({ partsSubtotal: 8000, total: 8000 + 1440 + 150, partCount: 2, pendingPartCount: 0 });

    const saved = saveProjectRfq.mock.calls[0][0];
    expect(saved).toMatchObject({ id: 'proj_1', status: 'quote_requested' });
    expect(saved.instantCostSnapshot.total).toBe(9590);
    expect(saved.timelineEvents.at(-1)).toMatchObject({ type: 'RFQ_REQUESTED', actorType: 'customer' });

    const events = sendAllAsync.mock.calls[0][0];
    expect(events.map((e: { type: string }) => e.type)).toEqual(['rfq_submitted_customer', 'admin_new_rfq']);
  });

  it('counts pending parts in the snapshot but prices only the instant ones', async () => {
    getProjectRfqById.mockResolvedValue(ok(project()));
    getPartsByProjectId.mockResolvedValue(ok([part('a', quote(5000)), part('b', null)]));
    const { ProjectRfqService } = await import('@/services/project-rfq.service');

    const result = await ProjectRfqService.requestQuote('user_1', 'proj_1');
    expect(result.success && result.data.costSnapshot).toMatchObject({ partsSubtotal: 5000, partCount: 2, pricedPartCount: 1, pendingPartCount: 1 });
  });

  it('refuses non-owners, already-sent projects and empty projects', async () => {
    const { ProjectRfqService } = await import('@/services/project-rfq.service');

    getProjectRfqById.mockResolvedValueOnce(ok(project({ userId: 'someone_else' })));
    expect(((await ProjectRfqService.requestQuote('user_1', 'proj_1')) as { error?: { code: string } }).error?.code).toBe(ErrorCode.NOT_FOUND);

    getProjectRfqById.mockResolvedValueOnce(ok(project({ status: 'quote_requested' })));
    expect(((await ProjectRfqService.requestQuote('user_1', 'proj_1')) as { error?: { code: string } }).error?.code).toBe(ErrorCode.FORBIDDEN);

    getProjectRfqById.mockResolvedValueOnce(ok(project()));
    getPartsByProjectId.mockResolvedValueOnce(ok([]));
    expect(((await ProjectRfqService.requestQuote('user_1', 'proj_1')) as { error?: { code: string } }).error?.code).toBe(ErrorCode.VALIDATION_FAILED);

    expect(saveProjectRfq).not.toHaveBeenCalled();
  });
});

describe('ProjectRfqService.negotiate', () => {
  it("appends a role:'user' message and moves to negotiation", async () => {
    getProjectRfqById.mockResolvedValue(
      ok(project({ status: 'quotation_sent', negotiationHistory: [{ role: 'admin', message: 'Quoted ₹10,000', timestamp: 't0' }] }))
    );
    const { ProjectRfqService } = await import('@/services/project-rfq.service');

    const result = await ProjectRfqService.negotiate('user_1', 'proj_1', '  Can you do 8500?  ', 8500);

    expect(result.success).toBe(true);
    const saved = saveProjectRfq.mock.calls[0][0];
    expect(saved.status).toBe('negotiation');
    // Existing admin message preserved; new one is forced to role:'user'
    expect(saved.negotiationHistory).toHaveLength(2);
    expect(saved.negotiationHistory[0]).toMatchObject({ role: 'admin', message: 'Quoted ₹10,000' });
    expect(saved.negotiationHistory[1]).toMatchObject({ role: 'user', message: 'Can you do 8500?', proposedPrice: 8500 });
    expect(sendAsync).toHaveBeenCalledWith(expect.objectContaining({ type: 'admin_negotiation_customer_reply' }));
  });

  it('rejects empty messages, the wrong stage and non-owners', async () => {
    const { ProjectRfqService } = await import('@/services/project-rfq.service');

    getProjectRfqById.mockResolvedValue(ok(project({ status: 'quotation_sent' })));
    expect(((await ProjectRfqService.negotiate('user_1', 'proj_1', '   ')) as { error?: { code: string } }).error?.code).toBe(ErrorCode.VALIDATION_FAILED);

    getProjectRfqById.mockResolvedValueOnce(ok(project({ status: 'draft' })));
    expect(((await ProjectRfqService.negotiate('user_1', 'proj_1', 'hello')) as { error?: { code: string } }).error?.code).toBe(ErrorCode.FORBIDDEN);

    getProjectRfqById.mockResolvedValueOnce(ok(project({ status: 'quotation_sent', userId: 'someone_else' })));
    expect(((await ProjectRfqService.negotiate('user_1', 'proj_1', 'hello')) as { error?: { code: string } }).error?.code).toBe(ErrorCode.NOT_FOUND);

    expect(saveProjectRfq).not.toHaveBeenCalled();
  });
});
