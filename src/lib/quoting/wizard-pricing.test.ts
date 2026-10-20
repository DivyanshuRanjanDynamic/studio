import { describe, it, expect } from 'vitest';
import {
  buildCncQuoteRequest,
  groupTapSelections,
  isFinishOfferedForCncMaterial,
  resolveCncMaterialId,
  resolveFinish,
} from './wizard-pricing';

// ═══════════════════════════════════════════════════
// Part-wizard selections → CNC pricing request
// ═══════════════════════════════════════════════════

describe('resolveCncMaterialId', () => {
  it('accepts pricing ids and maps ids saved by older wizard versions', () => {
    expect(resolveCncMaterialId('ss_304')).toBe('ss_304');
    expect(resolveCncMaterialId('al-6061-cnc')).toBe('al_6061');
    expect(resolveCncMaterialId('ss-304')).toBe('ss_304');
    expect(resolveCncMaterialId('pla')).toBeNull();
  });
});

describe('resolveFinish', () => {
  it('prices one finish (coating > plating > blasting) and lists the rest as unpriced', () => {
    expect(resolveFinish(['sand_blasting', 'anodizing', 'tapping'], 'black')).toEqual({
      finishType: 'anodize_color',
      unpriced: ['sand_blasting'],
    });
    expect(resolveFinish(['anodizing'], 'clear' as never).finishType).toBe('anodize_clear');
    expect(resolveFinish(['heat_treatment', 'tapping'], null)).toEqual({
      finishType: 'none',
      unpriced: ['heat_treatment'],
    });
  });
});

describe('groupTapSelections', () => {
  it('turns per-hole picks into thread counts', () => {
    expect(
      groupTapSelections([
        { holeIndex: 0, tapType: 'M6x1.0' },
        { holeIndex: 3, tapType: 'M6x1.0' },
        { holeIndex: 5, tapType: 'M4x0.7' },
      ])
    ).toEqual([
      { tapId: 'M6x1.0', count: 2 },
      { tapId: 'M4x0.7', count: 1 },
    ]);
  });
});

describe('buildCncQuoteRequest', () => {
  it('builds the engine request, ignoring taps unless tapping is selected', () => {
    const taps = [{ holeIndex: 0, tapType: 'M6x1.0' }];
    const withTapping = buildCncQuoteRequest({
      materialId: 'al_6061',
      secondaryProcesses: ['tapping', 'anodizing'],
      coatingColor: 'black',
      taps,
      quantity: 25,
    });
    expect(withTapping).toEqual({
      priceable: true,
      unpriced: [],
      request: {
        materialId: 'al_6061',
        finishType: 'anodize_color',
        quantity: 25,
        turnaround: 'standard_3d',
        taps: [{ tapId: 'M6x1.0', count: 1 }],
      },
    });

    const withoutTapping = buildCncQuoteRequest({ materialId: 'al_6061', secondaryProcesses: [], taps, quantity: 1 });
    expect(withoutTapping.priceable && withoutTapping.request.taps).toBeUndefined();
  });

  it('says why a material cannot be priced instantly', () => {
    const result = buildCncQuoteRequest({ materialId: 'acrylic', secondaryProcesses: [], quantity: 1 });
    expect(result).toEqual({ priceable: false, reason: expect.stringMatching(/engineers/) });
  });
});

describe('isFinishOfferedForCncMaterial', () => {
  it('only offers finishes the pricing catalogue supports for the material', () => {
    expect(isFinishOfferedForCncMaterial('anodizing', 'al_6061')).toBe(true);
    expect(isFinishOfferedForCncMaterial('anodizing', 'ss_304')).toBe(false);
    expect(isFinishOfferedForCncMaterial('chrome_plating', 'brass')).toBe(true);
    // Not priced by the engine → always offered (engineer adds it)
    expect(isFinishOfferedForCncMaterial('heat_treatment', 'ss_304')).toBe(true);
    expect(isFinishOfferedForCncMaterial('tapping', 'ss_304')).toBe(true);
  });
});
