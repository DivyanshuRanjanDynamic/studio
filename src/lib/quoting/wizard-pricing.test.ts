import { describe, it, expect } from 'vitest';
import {
  buildCncQuoteRequest,
  buildPrintQuoteRequest,
  buildSheetQuoteRequest,
  fitRequestToAnalysis,
  fitSheetRequestToAnalysis,
  groupTapSelections,
  isFinishOfferedForCncMaterial,
  resolveCncMaterialId,
  resolveFinish,
} from './wizard-pricing';
import { bracketAnalysis } from './__fixtures__/cnc-analysis';
import type { CncAnalysis, SheetAnalysis } from '@/types/quoting';

const fourM6Holes: CncAnalysis = {
  ...bracketAnalysis,
  features: {
    ...bracketAnalysis.features,
    holes: [{ diameterMm: 5.0, depthMm: 12, through: false, depthToDiameter: 2.4, count: 4 }],
  },
};

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

  it('flags tapping as not included when no holes were picked', () => {
    const notesOnly = buildCncQuoteRequest({ materialId: 'al_6061', secondaryProcesses: ['tapping'], taps: [], quantity: 1 });
    expect(notesOnly).toMatchObject({ priceable: true, unpriced: ['tapping'] });
    expect(notesOnly.priceable && notesOnly.request.taps).toBeUndefined();
  });

  it('prices only the picks the analysed holes can take', () => {
    const picks = Array.from({ length: 6 }, (_, i) => ({ holeIndex: i, tapType: 'M6x1.0' }));
    const built = buildCncQuoteRequest({ materialId: 'al_6061', secondaryProcesses: ['tapping'], taps: picks, quantity: 1 });
    if (!built.priceable) throw new Error('expected priceable');
    const fitted = fitRequestToAnalysis(fourM6Holes, built.request, built.unpriced);
    expect(fitted.request.taps).toEqual([{ tapId: 'M6x1.0', count: 4 }]);
    expect(fitted.unpriced).toEqual(['tapping']);

    const exact = fitRequestToAnalysis(fourM6Holes, { ...built.request, taps: [{ tapId: 'M6x1.0', count: 4 }] }, []);
    expect(exact).toEqual({ request: { ...built.request, taps: [{ tapId: 'M6x1.0', count: 4 }] }, unpriced: [] });
  });

  it('builds sheet requests: thickness from the material, bending noted, unpriceable extras listed', () => {
    const built = buildSheetQuoteRequest({
      materialId: 'ms-crca',
      thicknessMm: 1.5,
      secondaryProcesses: ['bending', 'powder_coating', 'tapping'],
      coatingColor: 'black',
      taps: [{ holeIndex: 0, tapType: 'M5x0.8' }],
      quantity: 10,
    });
    expect(built).toMatchObject({
      priceable: true,
      unpriced: [],
      request: { materialId: 'ms-crca', thicknessMm: 1.5, finishType: 'powder_coat', bendingSelected: true, taps: [{ tapId: 'M5x0.8', count: 1 }] },
    });

    // Stainless can't be anodised; wood can't be tapped
    const ss = buildSheetQuoteRequest({ materialId: 'ss-304', thicknessMm: 2, secondaryProcesses: ['anodizing'], quantity: 1 });
    expect(ss).toMatchObject({ priceable: true, unpriced: ['anodizing'], request: { finishType: 'none' } });
    const wood = buildSheetQuoteRequest({
      materialId: 'plywood', thicknessMm: 6.3, secondaryProcesses: ['tapping'], taps: [{ holeIndex: 0, tapType: 'M5x0.8' }], quantity: 1,
    });
    expect(wood).toMatchObject({ priceable: true, unpriced: ['tapping'] });
    expect(wood.priceable && wood.request.taps).toBeUndefined();

    expect(buildSheetQuoteRequest({ materialId: 'cf-plate', thicknessMm: 2, secondaryProcesses: [], quantity: 1 }).priceable).toBe(false);
    expect(buildSheetQuoteRequest({ materialId: 'ms-crca', secondaryProcesses: [], quantity: 1 }).priceable).toBe(false);
  });

  it('fits sheet thread picks to the analysed through-holes', () => {
    const analysis = { holes: [{ diameterMm: 4.2, count: 2 }] } as unknown as SheetAnalysis;
    const request = {
      materialId: 'ss-304', thicknessMm: 2, finishType: 'none', quantity: 1, turnaround: 'standard_3d',
      taps: [{ tapId: 'M5x0.8', count: 3 }],
    } as const;
    expect(fitSheetRequestToAnalysis(analysis, request, [])).toEqual({
      request: { ...request, taps: [{ tapId: 'M5x0.8', count: 2 }] },
      unpriced: ['tapping'],
    });
  });

  it('builds print requests and lists processes FDM pricing does not cover', () => {
    expect(buildPrintQuoteRequest({ materialId: 'asa', secondaryProcesses: ['sand_blasting'], quantity: 3 })).toEqual({
      priceable: true,
      unpriced: [],
      request: { materialId: 'asa', finishType: 'sand_blasting', quantity: 3, turnaround: 'standard_3d' },
    });
    expect(buildPrintQuoteRequest({ materialId: 'tpu', secondaryProcesses: ['sand_blasting'], quantity: 1 })).toMatchObject({
      unpriced: ['sand_blasting'],
      request: { finishType: 'none' },
    });
    expect(buildPrintQuoteRequest({ materialId: 'nylon-cf', secondaryProcesses: [], quantity: 1 }).priceable).toBe(false);
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
