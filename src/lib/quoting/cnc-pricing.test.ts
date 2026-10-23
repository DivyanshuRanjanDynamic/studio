import { describe, it, expect } from 'vitest';
import { generateCncQuote, calcCncLearningFactor, calcCncMachiningCost } from './pricing-engine';
import { DEFAULT_CNC_SHOP_RATES } from './cnc-materials';
import { bracketAnalysis, shaftFlatAnalysis } from './__fixtures__/cnc-analysis';
import type { CncAnalysis, CncQuoteRequest } from '@/types/quoting';

// ═══════════════════════════════════════════════════
// CNC Pricing Branch Tests
// ═══════════════════════════════════════════════════

const baseRequest: CncQuoteRequest = {
  materialId: 'al_6061',
  finishType: 'none',
  quantity: 10,
  turnaround: 'standard_3d',
};

function quote(analysis: CncAnalysis, overrides: Partial<CncQuoteRequest> = {}) {
  const result = generateCncQuote(analysis, { ...baseRequest, ...overrides });
  if (!result.success) {
    throw result.error;
  }
  return result.data;
}

describe('CNC Pricing Engine', () => {
  it('prices a milled bracket from block stock', () => {
    const q = quote(bracketAnalysis);
    const b = q.breakdown;

    expect(q.process).toBe('cnc_machining_3axis');
    // 105×65×25 mm block of 6061 = 0.46 kg × ₹380 × 1.05
    expect(b.materialCost).toBeCloseTo(0.1706 * 2.7 * 380 * 1.05, 0);
    expect(b.machiningCost).toBeGreaterThan(0);
    expect(b.setupCost).toBeCloseTo(((52 / 60) * 800) / 10, 1);
    // Unit and total are rounded independently, as in the laser engine.
    expect(Math.abs(q.totalPrice - q.pricePerPart * 10)).toBeLessThanOrEqual(5);
    expect(q.hasBlockingIssues).toBe(false);
  });

  it('uses the material machinability group for cycle time', () => {
    const aluminium = quote(bracketAnalysis);
    const stainless = quote(bracketAnalysis, { materialId: 'ss_304' });
    expect(stainless.breakdown.cycleTimeMin).toBeGreaterThan(aluminium.breakdown.cycleTimeMin);
    expect(stainless.pricePerPart).toBeGreaterThan(aluminium.pricePerPart);
  });

  it('amortises setup and programming over the batch', () => {
    const one = quote(bracketAnalysis, { quantity: 1 });
    const hundred = quote(bracketAnalysis, { quantity: 100 });
    expect(hundred.breakdown.setupCost).toBeCloseTo(one.breakdown.setupCost / 100, 2);
    expect(hundred.pricePerPart).toBeLessThan(one.pricePerPart);
  });

  it('charges the finish minimum once per lot, not per part', () => {
    // Anodize min is ₹750 a lot. It used to apply to every part (₹615/₹525 at 10/100),
    // so batch prices dropped: now area × rate (20,665 mm² × ₹0.0048) after batch discounts.
    const finished = (quantity: number) =>
      quote(bracketAnalysis, { finishType: 'anodize_color', quantity }).breakdown.finishCost;
    expect(finished(1)).toBe(750);
    expect(finished(10)).toBeCloseTo(20665.45 * 0.0048 * 0.82, 1);
    expect(finished(100)).toBeCloseTo(20665.45 * 0.0048 * 0.7, 1);
  });

  it('adds the finish on top of the minimum order', () => {
    // A one-off sits at the ₹2900 minimum, which used to absorb most of the ₹750
    // anodize lot charge (₹3206 → ₹3965).
    const bare = quote(bracketAnalysis, { quantity: 1 });
    const anodised = quote(bracketAnalysis, { quantity: 1, finishType: 'anodize_color' });
    expect(bare.totalPrice).toBe(2900);
    const markup = anodised.breakdown.rushMultiplier * (1 + anodised.breakdown.marginPct);
    expect(anodised.totalPrice).toBeCloseTo(2900 + 750 * markup, -1);
  });

  it('applies only half the standard quantity discount to cycle time', () => {
    expect(calcCncLearningFactor(1)).toBe(1);
    expect(calcCncLearningFactor(100)).toBeCloseTo(1 - 0.5 * (1 - 0.695), 4);
  });

  it('bills turned parts at the lathe rate and secondary milling at the VMC rate', () => {
    const times = shaftFlatAnalysis.machiningTime.aluminium;
    const cost = calcCncMachiningCost(times, 0, 'cnc_turning', DEFAULT_CNC_SHOP_RATES);
    const expected =
      ((times.cycleMin - times.secondaryMillingMin) / 60) * 750 +
      (times.secondaryMillingMin / 60) * 1000;
    expect(cost).toBeCloseTo(expected, 6);

    const q = quote(shaftFlatAnalysis, { materialId: 'en8', finishType: 'zinc_plate' });
    expect(q.process).toBe('cnc_turning');
    expect(q.breakdown.finishCost).toBeGreaterThan(0);
  });

  it('allows forcing 5-axis on a milled part at the 5-axis rate', () => {
    const three = quote(bracketAnalysis);
    const five = quote(bracketAnalysis, { process: 'cnc_machining_5axis' });
    expect(five.process).toBe('cnc_machining_5axis');
    expect(five.breakdown.machiningCost).toBeCloseTo(three.breakdown.machiningCost * 3, 1);
  });

  it('rejects switching between turning and milling stock', () => {
    const result = generateCncQuote(bracketAnalysis, { ...baseRequest, process: 'cnc_turning' });
    expect(result.success).toBe(false);
  });

  it('rejects materials without CNC data, invalid finishes and quantities', () => {
    expect(generateCncQuote(bracketAnalysis, { ...baseRequest, materialId: 'nope' }).success).toBe(
      false
    );
    expect(
      generateCncQuote(bracketAnalysis, {
        ...baseRequest,
        finishType: 'anodize_clear',
        materialId: 'en8',
      }).success
    ).toBe(false);
    expect(generateCncQuote(bracketAnalysis, { ...baseRequest, quantity: 0 }).success).toBe(false);
    expect(generateCncQuote(bracketAnalysis, { ...baseRequest, quantity: 2.5 }).success).toBe(
      false
    );
  });

  it('surfaces blocking DFM issues from the analyser', () => {
    const thinWalled: CncAnalysis = {
      ...bracketAnalysis,
      dfm: [
        {
          code: 'THIN_WALL',
          severity: 'error',
          message: 'Wall thickness of 0.30 mm will deflect or break during machining.',
          fixSuggestion: 'Keep metal walls ≥ 0.8 mm.',
          blocking: true,
        },
      ],
    };
    const q = quote(thinWalled);
    expect(q.hasBlockingIssues).toBe(true);
    expect(q.dfmIssues).toHaveLength(1);
  });

  it('enforces the minimum order value', () => {
    const q = quote(shaftFlatAnalysis, { quantity: 1 });
    expect(q.totalPrice).toBeGreaterThanOrEqual(2900);
  });
});
