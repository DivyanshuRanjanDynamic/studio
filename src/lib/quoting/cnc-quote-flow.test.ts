import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCncQuote, getCncTierTable, isCncQuote } from './pricing-engine';
import { legacyLaserQuote } from './__fixtures__/legacy-laser-quote';
import { formatCncStock } from './cnc-materials';
import { bracketAnalysis, shaftFlatAnalysis } from './__fixtures__/cnc-analysis';
import { cncAnalysisSchema, cncQuoteCreateSchema } from '@/lib/validation/quoting';
import { ok } from '@/utils/result';
import type { CncQuoteRequest } from '@/types/quoting';

// Firestore is not available in unit tests — capture what would be saved.
const saveQuote = vi.fn();
vi.mock('@/lib/firebase/repositories/quotes', () => ({
  QuotesRepository: { saveQuote: (...args: unknown[]) => saveQuote(...args) },
}));

// ═══════════════════════════════════════════════════
// CNC instant-quote flow: tiers, persistence, request validation
// ═══════════════════════════════════════════════════

const request: CncQuoteRequest = {
  materialId: 'al_6061',
  finishType: 'none',
  quantity: 10,
  turnaround: 'standard_3d',
};

describe('getCncTierTable', () => {
  it('re-prices each tier so setup amortisation drives the unit price down', () => {
    const tiers = getCncTierTable(bracketAnalysis, request);

    expect(tiers.map((t) => t.quantity)).toEqual([1, 5, 10, 25, 50, 100, 250, 500, 1000]);
    expect(tiers[0].savingsPercent).toBe(0);
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i].pricePerPart).toBeLessThanOrEqual(tiers[i - 1].pricePerPart);
    }

    const direct = generateCncQuote(bracketAnalysis, { ...request, quantity: 25 });
    expect(direct.success && direct.data.pricePerPart).toBe(tiers[3].pricePerPart);
  });

  it('returns no tiers when the material cannot be machined', () => {
    expect(getCncTierTable(bracketAnalysis, { ...request, materialId: 'nope' })).toEqual([]);
  });
});

describe('isCncQuote / formatCncStock', () => {
  it('tells CNC quotes from laser quotes', () => {
    const cnc = generateCncQuote(bracketAnalysis, request);
    if (!cnc.success) throw new Error('fixture quote failed');

    expect(isCncQuote(cnc.data)).toBe(true);
    expect(isCncQuote(legacyLaserQuote())).toBe(false);
  });

  it('formats block and bar stock', () => {
    expect(formatCncStock(bracketAnalysis.stock)).toBe('105 × 65 × 25 mm block');
    expect(formatCncStock(shaftFlatAnalysis.stock)).toMatch(/^Ø\d+(\.\d)? × \d+(\.\d)? mm bar$/);
    expect(formatCncStock(null)).toBe('Non-standard');
  });
});

describe('cncAnalysisSchema / cncQuoteCreateSchema', () => {
  it('accepts real /analyze-cnc responses', () => {
    for (const analysis of [bracketAnalysis, shaftFlatAnalysis]) {
      expect(cncAnalysisSchema.safeParse(analysis).success).toBe(true);
    }
  });

  it('rejects tampered machining times and unknown processes', () => {
    const negative = {
      ...bracketAnalysis,
      machiningTime: {
        ...bracketAnalysis.machiningTime,
        aluminium: { ...bracketAnalysis.machiningTime.aluminium, cycleMin: -5 },
      },
    };
    expect(cncAnalysisSchema.safeParse(negative).success).toBe(false);
    expect(
      cncQuoteCreateSchema.safeParse({
        analysisId: 'cnca_0123456789abcdef',
        request: { ...request, process: 'laser_cut_fiber' },
      }).success
    ).toBe(false);
  });

  it('quotes reference a stored analysis — a client-supplied analysis is not accepted', () => {
    expect(
      cncQuoteCreateSchema.safeParse({ analysisId: 'cnca_0123456789abcdef', request }).success
    ).toBe(true);
    expect(cncQuoteCreateSchema.safeParse({ analysis: bracketAnalysis, request }).success).toBe(false);
  });
});

describe('QuotingService.processCncQuoteRequest', () => {
  beforeEach(() => {
    saveQuote.mockReset();
  });

  it('re-prices server-side and persists the CNC quote', async () => {
    saveQuote.mockImplementation(async (q: { quoteRef: string }) => ok(q.quoteRef));
    const { QuotingService } = await import('@/services/quoting.service');

    const result = await QuotingService.processCncQuoteRequest(bracketAnalysis, request, 'user_1');

    expect(result.success).toBe(true);
    if (!result.success) return;
    const expected = generateCncQuote(bracketAnalysis, request);
    expect(expected.success && expected.data.totalPrice).toBe(result.data.totalPrice);
    expect(saveQuote).toHaveBeenCalledWith(result.data, 'user_1');
  });

  it('does not persist when pricing fails', async () => {
    const { QuotingService } = await import('@/services/quoting.service');

    const result = await QuotingService.processCncQuoteRequest(bracketAnalysis, {
      ...request,
      process: 'cnc_turning',
    });

    expect(result.success).toBe(false);
    expect(saveQuote).not.toHaveBeenCalled();
  });
});
