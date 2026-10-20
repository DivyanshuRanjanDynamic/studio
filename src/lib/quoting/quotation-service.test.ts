import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok } from '@/utils/result';
import { ErrorCode } from '@/utils/errors';
import type { MechanicalPart, PartInstantQuote, ProjectRFQ } from '@/models/project.model';

// ═══════════════════════════════════════════════════
// QuotationService — estimate vs final, ownership, real PDF bytes
// ═══════════════════════════════════════════════════

const getProjectRfqById = vi.fn();
const getPartsByProjectId = vi.fn();

vi.mock('@/repositories/project.repository', () => ({
  ProjectRepository: { getProjectRfqById: (...a: unknown[]) => getProjectRfqById(...a) },
}));
vi.mock('@/repositories/part.repository', () => ({
  PartRepository: { getPartsByProjectId: (...a: unknown[]) => getPartsByProjectId(...a) },
}));

const project = (overrides: Partial<ProjectRFQ> = {}): ProjectRFQ =>
  ({
    id: 'proj_ABCDEF',
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

const part = (id: string, quote: PartInstantQuote | null): MechanicalPart =>
  ({
    id,
    projectId: 'proj_ABCDEF',
    userId: 'user_1',
    partName: `Part ${id}`,
    service: 'cnc_machining',
    cadFile: { fileName: `${id}.step`, fileUrl: `k/${id}`, fileSize: 1, uploadedAt: '2026-10-20T00:00:00Z' },
    material: { id: 'al_6061', name: 'Aluminium 6061' },
    secondaryProcesses: [],
    quantity: 1,
    status: 'ready_for_quote',
    instantQuote: quote,
    createdAt: '2026-10-20T00:00:00Z',
    updatedAt: '2026-10-20T00:00:00Z',
  }) as MechanicalPart;

const quote = (total: number): PartInstantQuote =>
  ({ totalPrice: total, pricePerPart: total, quantity: 1, leadTimeDays: 3, expiresAt: Date.now() + 9e5 }) as PartInstantQuote;

const header = (pdf: Uint8Array) => new TextDecoder().decode(pdf.slice(0, 5));

beforeEach(() => {
  getProjectRfqById.mockReset();
  getPartsByProjectId.mockReset();
});

describe('QuotationService.generate', () => {
  it('builds an estimate PDF for a draft project', async () => {
    getProjectRfqById.mockResolvedValue(ok(project()));
    getPartsByProjectId.mockResolvedValue(ok([part('a', quote(5000))]));
    const { QuotationService } = await import('@/services/quotation.service');

    const result = await QuotationService.generate('user_1', 'proj_ABCDEF');

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.kind).toBe('estimate');
    expect(result.data.fileName).toBe('MH-Q-2026-ABCDEF.pdf');
    expect(header(result.data.pdf)).toBe('%PDF-');
  });

  it('builds a final PDF from the agreed price once quoted', async () => {
    getProjectRfqById.mockResolvedValue(ok(project({ status: 'quotation_sent', quotedPrice: 12000, leadTimeDays: 7 } as Partial<ProjectRFQ>)));
    getPartsByProjectId.mockResolvedValue(ok([part('a', quote(5000))]));
    const { QuotationService } = await import('@/services/quotation.service');

    const result = await QuotationService.generate('user_1', 'proj_ABCDEF');
    expect(result.success && result.data.kind).toBe('final');
  });

  it('lets an admin download any project but blocks other customers', async () => {
    getProjectRfqById.mockResolvedValue(ok(project({ userId: 'someone_else' })));
    getPartsByProjectId.mockResolvedValue(ok([part('a', quote(5000))]));
    const { QuotationService } = await import('@/services/quotation.service');

    const denied = await QuotationService.generate('user_1', 'proj_ABCDEF');
    expect(denied.success === false && denied.error.code).toBe(ErrorCode.NOT_FOUND);

    const asAdmin = await QuotationService.generate('admin_1', 'proj_ABCDEF', true);
    expect(asAdmin.success).toBe(true);
  });

  it('404s an unknown project', async () => {
    getProjectRfqById.mockResolvedValue({ success: false, error: { code: ErrorCode.NOT_FOUND } });
    const { QuotationService } = await import('@/services/quotation.service');
    const result = await QuotationService.generate('user_1', 'nope');
    expect(result.success === false && result.error.code).toBe(ErrorCode.NOT_FOUND);
  });
});
