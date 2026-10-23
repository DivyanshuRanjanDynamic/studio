import type { QuoteResult } from '@/types/quoting';

/**
 * A laser quote in the pre-converter format (priced from DXF geometry by the
 * retired legacy engine). Such quotes are still stored and must keep opening
 * from share links and checking out until they expire.
 */
export function legacyLaserQuote(overrides: Partial<QuoteResult> = {}): QuoteResult {
  return {
    pricePerPart: 580,
    totalPrice: 2900,
    leadTimeDays: 3,
    breakdown: {
      materialCost: 41.2,
      cutCost: 38.4,
      setupCost: 240,
      finishCost: 0,
      quantityMultiplier: 0.92,
      rushMultiplier: 1,
      marginPct: 0.42,
    },
    dfmIssues: [],
    hasBlockingIssues: false,
    expiresAt: Date.now() + 15 * 60 * 1000,
    quoteRef: 'MH-ABCDEFGH23',
    parameters: { materialId: 'ms_a36', thicknessMm: 2, finishType: 'none', quantity: 5, turnaround: 'standard_3d' },
    geometry: {
      cutLengthMm: 600,
      areaMm2: 10000,
      boundingBox: { widthMm: 100, heightMm: 100, aspectRatio: 1 },
      holeCount: 2,
      complexityScore: 2,
      nodeCount: 20,
      minFeatureSizeMm: 5,
      minSlotWidthMm: 5,
      edgeToHoleDistanceMm: 5,
      hasOpenPaths: false,
    },
    ...overrides,
  };
}
