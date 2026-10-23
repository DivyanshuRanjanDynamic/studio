import { describe, it, expect } from 'vitest';
import { generateCncQuote } from './pricing-engine';
import {
  findTapCandidates,
  findTappableHoleGroups,
  fitTapsToAnalysis,
  mergeCoaxialHoles,
  tapMajorDiameterMm,
  tapPitchMm,
  tapRequestsFromPicks,
  findTap,
  calcTappingCost,
} from './tapping';
import { bracketAnalysis } from './__fixtures__/cnc-analysis';
import { cncQuoteRequestSchema } from '@/lib/validation/quoting';
import type { CncAnalysis, CncQuoteRequest } from '@/types/quoting';
import type { HoleFeature } from '@/types/viewer';

// ═══════════════════════════════════════════════════
// Tapping: which holes can be threaded, and what it adds to a CNC quote
// ═══════════════════════════════════════════════════

/** The bracket, but with four Ø5.0 holes — the M6 tap drill — and two Ø6.0 clearance holes */
const tappableBracket: CncAnalysis = {
  ...bracketAnalysis,
  features: {
    ...bracketAnalysis.features,
    holes: [
      { diameterMm: 5.0, depthMm: 12, through: false, depthToDiameter: 2.4, count: 4 },
      { diameterMm: 6.0, depthMm: 20, through: true, depthToDiameter: 3.33, count: 2 },
    ],
    holeCount: 6,
  },
};

const request: CncQuoteRequest = {
  materialId: 'al_6061',
  finishType: 'none',
  quantity: 10,
  turnaround: 'standard_3d',
};

const hole = (diameterMm: number, depth = 10): HoleFeature => ({
  center: { x: 1, y: 2, z: 3 },
  radius: diameterMm / 2,
  depth,
  normal: { x: 0, y: 0, z: 1 },
});

function quote(overrides: Partial<CncQuoteRequest> = {}, analysis: CncAnalysis = tappableBracket) {
  const result = generateCncQuote(analysis, { ...request, ...overrides });
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}

describe('findTapCandidates', () => {
  it('flags holes drilled for a standard tap and suggests the closest thread', () => {
    const candidates = findTapCandidates([hole(5.0), hole(6.0), hole(3.3), hole(10.3)]);

    expect(candidates.map((c) => [c.holeIndex, c.suggestedTapId])).toEqual([
      [0, 'M6x1.0'],
      [2, 'M4x0.7'],
      [3, 'M12x1.75'],
    ]);
    // Positions come through so the viewer can highlight them
    expect(candidates[0].center).toEqual({ x: 1, y: 2, z: 3 });
    expect(candidates[0].matchingTapIds).toContain('1/4-20'); // Ø5.1 imperial drill also fits
  });

  it('finds nothing on parts without tap-drill holes', () => {
    expect(findTapCandidates([hole(6.0), hole(20)])).toEqual([]);
    expect(findTapCandidates(undefined)).toEqual([]);
  });

  it('derives thread geometry for metric and imperial taps', () => {
    expect(tapPitchMm(findTap('M6x1.0')!)).toBe(1);
    expect(tapMajorDiameterMm(findTap('M6x1.0')!)).toBe(6);
    expect(tapPitchMm(findTap('1/4-20')!)).toBeCloseTo(1.27, 2);
  });
});

describe('findTappableHoleGroups', () => {
  it('lists only analysed hole groups a standard tap fits', () => {
    const groups = findTappableHoleGroups(tappableBracket);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ key: '0', diameterMm: 5.0, count: 4, through: false });
    expect(groups[0].tapIds[0]).toBe('M6x1.0');
    expect(groups[0].tapIds).toContain('1/4-20');
    expect(findTappableHoleGroups(null)).toEqual([]);
  });

  it('turns picks into request lines that the engine prices', () => {
    const taps = tapRequestsFromPicks({ '0': { tapId: 'M6x1.0', count: 3 } });
    expect(taps).toEqual([{ tapId: 'M6x1.0', count: 3 }]);
    expect(quote({ taps }).breakdown.tappedHoles).toBe(3);
    expect(tapRequestsFromPicks({})).toEqual([]);
  });
});

describe('fitTapsToAnalysis', () => {
  it('keeps what the analysed holes can take and counts the rest', () => {
    expect(fitTapsToAnalysis(tappableBracket, [{ tapId: 'M6x1.0', count: 6 }])).toEqual({
      fitted: [{ tapId: 'M6x1.0', count: 4 }],
      unfitted: 2,
    });
    // Wrong drill size and unknown threads fit nowhere
    expect(fitTapsToAnalysis(tappableBracket, [{ tapId: 'M12x1.75', count: 1 }, { tapId: 'M99', count: 2 }])).toEqual({
      fitted: [],
      unfitted: 3,
    });
    // Two thread types sharing the Ø5.0 holes can't claim more than four
    expect(
      fitTapsToAnalysis(tappableBracket, [
        { tapId: 'M6x1.0', count: 3 },
        { tapId: '1/4-20', count: 3 },
      ])
    ).toEqual({ fitted: [{ tapId: 'M6x1.0', count: 3 }, { tapId: '1/4-20', count: 1 }], unfitted: 2 });
  });

  it('always produces a request the engine prices', () => {
    const { fitted } = fitTapsToAnalysis(tappableBracket, [
      { tapId: 'M6x1.0', count: 3 },
      { tapId: '1/4-20', count: 3 },
    ]);
    expect(quote({ taps: fitted }).breakdown.tappedHoles).toBe(4);
  });
});

describe('mergeCoaxialHoles', () => {
  const half = (cx: number, z = 0, radius = 2.5, depth = 12): HoleFeature => ({
    center: { x: cx, y: 0, z },
    radius,
    depth,
    normal: { x: 0, y: 0, z: 1 },
  });

  it('merges the two half-cylinder faces of one drilled hole onto its axis', () => {
    const merged = mergeCoaxialHoles([half(10 + 1.59), half(10 - 1.59)]);
    expect(merged).toHaveLength(1);
    expect(merged[0].center.x).toBeCloseTo(10, 5);
    expect(merged[0].radius).toBe(2.5);
  });

  it('keeps separate holes apart', () => {
    // Neighbouring holes, a counterbore of another size, and a second flange on the same axis
    expect(mergeCoaxialHoles([half(0), half(20)])).toHaveLength(2);
    expect(mergeCoaxialHoles([half(0), half(0, 0, 4.5)])).toHaveLength(2);
    expect(mergeCoaxialHoles([half(0, 0), half(0, 40)])).toHaveLength(2);
    expect(mergeCoaxialHoles(undefined)).toEqual([]);
  });
});

describe('generateCncQuote with taps', () => {
  it('adds tapping time and wear to the quote', () => {
    const plain = quote();
    const tapped = quote({ taps: [{ tapId: 'M6x1.0', count: 4 }] });

    expect(plain.breakdown.tappingCost).toBe(0);
    expect(tapped.breakdown.tappingCost).toBeGreaterThan(0);
    expect(tapped.breakdown.tappedHoles).toBe(4);
    expect(tapped.pricePerPart).toBeGreaterThan(plain.pricePerPart);
    expect(tapped.breakdown.cycleTimeMin).toBeGreaterThan(plain.breakdown.cycleTimeMin);
    expect(tapped.parameters.taps).toEqual([{ tapId: 'M6x1.0', count: 4 }]);
  });

  it('adds every tapped hole on top of the minimum order', () => {
    // A one-off sits at the ₹2900 minimum order; taps used to vanish under it.
    const price = (count: number) =>
      quote({ quantity: 1, ...(count ? { taps: [{ tapId: 'M6x1.0', count }] } : {}) }).totalPrice;
    expect(price(0)).toBe(2900);
    expect(price(1)).toBeGreaterThan(price(0));
    expect(price(2)).toBeGreaterThan(price(1));
    expect(price(4)).toBeGreaterThan(price(2));
  });

  it('costs more to tap stainless than aluminium', () => {
    const al = quote({ taps: [{ tapId: 'M6x1.0', count: 4 }] });
    const ss = quote({ materialId: 'ss_304', taps: [{ tapId: 'M6x1.0', count: 4 }] });
    expect(ss.breakdown.tappingCost!).toBeGreaterThan(al.breakdown.tappingCost!);
  });

  it('spreads tapping time over a batch but not tap wear', () => {
    const one = quote({ quantity: 1, taps: [{ tapId: 'M6x1.0', count: 4 }] });
    const many = quote({ quantity: 500, taps: [{ tapId: 'M6x1.0', count: 4 }] });
    expect(many.breakdown.tappingCost!).toBeLessThan(one.breakdown.tappingCost!);
    expect(many.breakdown.tappingCost!).toBeGreaterThan(0);
  });

  it('refuses threads the part has no holes for', () => {
    const tooMany = generateCncQuote(tappableBracket, { ...request, taps: [{ tapId: 'M6x1.0', count: 5 }] });
    expect(tooMany.success === false && tooMany.error.message).toMatch(/Only 4 holes .* M6/);

    // The original bracket's Ø6 clearance holes can't take an M6 (needs Ø5.0)
    const wrongSize = generateCncQuote(bracketAnalysis, { ...request, taps: [{ tapId: 'M6x1.0', count: 1 }] });
    expect(wrongSize.success).toBe(false);

    const unknown = generateCncQuote(tappableBracket, { ...request, taps: [{ tapId: 'M99', count: 1 }] });
    expect(unknown.success === false && unknown.error.message).toMatch(/Unknown thread/);
  });

  it('does not let two thread sizes claim the same holes twice', () => {
    // M6 (Ø5.0) and 1/4-20 (Ø5.1) share the four Ø5.0 holes
    const both = generateCncQuote(tappableBracket, {
      ...request,
      taps: [
        { tapId: 'M6x1.0', count: 3 },
        { tapId: '1/4-20', count: 2 },
      ],
    });
    expect(both.success === false && both.error.message).toMatch(/Only 1 hole /);
  });
});

describe('cncQuoteRequestSchema taps', () => {
  it('accepts a sane thread list and rejects oversized ones', () => {
    expect(cncQuoteRequestSchema.safeParse({ ...request, taps: [{ tapId: 'M6x1.0', count: 4 }] }).success).toBe(true);
    expect(cncQuoteRequestSchema.safeParse({ ...request, taps: [{ tapId: 'M6x1.0', count: 0 }] }).success).toBe(false);
    const huge = Array.from({ length: 21 }, () => ({ tapId: 'M6x1.0', count: 1 }));
    expect(cncQuoteRequestSchema.safeParse({ ...request, taps: huge }).success).toBe(false);
  });
});

describe('tap wear follows thread depth', () => {
  // M5×0.8: major Ø5, full depth 3×D = 15 mm, ₹(4 + 0.8 × 5) = ₹8 per full-depth hole before material factor
  const wear = (depthMm: number, group: 'mild_steel' | 'aluminium' = 'mild_steel') => {
    const r = calcTappingCost([{ diameterMm: 4.2, depthMm, count: 4, through: true }], [{ tapId: 'M5x0.8', count: 4 }], group, 600);
    if (!r.success) throw new Error(r.error.message);
    return r.data.wearCostPerPart;
  };

  it('charges full wear for full-depth threads, as before', () => {
    expect(wear(15)).toBeCloseTo(8 * 1.3 * 4);
    expect(wear(40)).toBeCloseTo(8 * 1.3 * 4); // threads stop at 3×D
  });

  it('charges proportionally less for shallower threads', () => {
    expect(wear(7.5)).toBeCloseTo((8 * 1.3 * 4) / 2);
  });

  it('keeps a 25% floor for very short threads, e.g. 2 mm sheet', () => {
    // Was ₹41.60 for 4 × M5 in 2 mm CRCA, 6× the ₹6.76 of machine time
    expect(wear(2)).toBeCloseTo(8 * 1.3 * 4 * 0.25);
    expect(wear(2, 'aluminium')).toBeCloseTo(8 * 1 * 4 * 0.25);
  });
});
