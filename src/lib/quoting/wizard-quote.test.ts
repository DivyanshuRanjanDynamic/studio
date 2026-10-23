import { describe, it, expect } from 'vitest';
import { isPrintQuote, isSheetQuote, priceWizardPart, wizardQuoteKind } from './wizard-quote';
import { bracketAnalysis } from './__fixtures__/cnc-analysis';
import type { PrintAnalysis, SheetAnalysis } from '@/types/quoting';

// ═══════════════════════════════════════════════════
// The part wizard's live price for every instant-quote service
// ═══════════════════════════════════════════════════

const sheet: SheetAnalysis = {
  version: 'sheet-1', units: 'mm', thicknessMm: 1.5, volumeMm3: 30_000, surfaceAreaMm2: 41_000,
  flatAreaMm2: 20_000, cutLengthMm: 700, pierces: 3, holes: [], bends: [],
  boundingBox: { x: 200, y: 100, z: 1.5 }, isFlat: true, bodyCount: 1, analysisMs: 50,
};

const print: PrintAnalysis = {
  version: 'print-1', units: 'mm', volumeMm3: 27_000, surfaceAreaMm2: 5_400, triangleCount: 12,
  orientations: [{ up: '+z', sizeMm: { x: 30, y: 30, z: 30 }, supportVolumeMm3: 0 }], analysisMs: 5,
};

const selections = (materialId: string, thickness?: number) => ({
  material: { id: materialId, thickness },
  secondaryProcesses: [] as const,
  quantity: 4,
});

describe('priceWizardPart', () => {
  it('maps wizard services to their engines', () => {
    expect(wizardQuoteKind('cnc_turning')).toBe('cnc');
    expect(wizardQuoteKind('sheet_metal_cutting')).toBe('sheet');
    expect(wizardQuoteKind('3d_printing')).toBe('print');
    expect(wizardQuoteKind('wire_edm')).toBeNull();
  });

  it('prices sheet, print and CNC parts with a tier table', () => {
    const s = priceWizardPart({ kind: 'sheet', analysis: sheet }, selections('ms-crca', 1.5));
    expect(s.quote && isSheetQuote(s.quote)).toBe(true);
    expect(s.tiers).toHaveLength(9);

    const p = priceWizardPart({ kind: 'print', analysis: print }, selections('pla'));
    expect(p.quote && isPrintQuote(p.quote)).toBe(true);
    expect(p.quote?.parameters.quantity).toBe(4);

    const c = priceWizardPart({ kind: 'cnc', analysis: bracketAnalysis }, selections('al_6061'));
    expect(c.quote?.totalPrice).toBeGreaterThan(0);
  });

  it('explains when a part needs an engineer', () => {
    const noThickness = priceWizardPart({ kind: 'sheet', analysis: sheet }, selections('ms-crca'));
    expect(noThickness).toMatchObject({ quote: null, reason: expect.stringMatching(/thickness/) });
    const tooThick = priceWizardPart({ kind: 'sheet', analysis: sheet }, selections('balsa', 12));
    expect(tooThick.quote).toBeNull();
    expect(tooThick.reason).toMatch(/engineers/);
  });
});
