import { describe, expect, it } from 'vitest';
import * as F from './service-facts';

describe('service facts', () => {
  it('prices every live example (no gaps)', () => {
    const tables = [F.sheetCuttingExample(), F.bendingExample(), F.cncExample(), F.tappingExample(),
      F.finishExample('powder_coat', 'ms-crca', 'ms_a36'), F.finishExample('anodize_color', 'al-5052', 'al_6061')];
    for (const t of tables) for (const r of t.rows) for (const c of r.cells) expect(c).not.toBe('—');
    console.log(JSON.stringify(tables.map((t) => t.rows.map((r) => r.cells)), null, 1));
  });

  it('volume lowers the per-part price', () => {
    for (const t of [F.sheetCuttingExample(), F.bendingExample(), F.cncExample()]) {
      for (const r of t.rows) {
        const [one, , hundred] = r.cells.slice(1).map((c) => Number(c.replace(/[^\d]/g, '')));
        expect(hundred).toBeLessThan(one);
      }
    }
  });

  it('material tables', () => {
    console.log(JSON.stringify({
      cut: F.sheetCuttingMaterials().rows, bend: F.bendingMaterials().rows, cnc: F.cncMaterials().rows,
      powder: F.finishMaterials(['powder_coat']).rows, anod: F.finishMaterials(['anodize_clear', 'anodize_color']).rows,
      taps: F.TAP_RANGE, mins: F.ORDER_MINIMUMS, turn: F.turnaroundTable().rows,
    }, null, 1));
    expect(F.cncMaterials().rows.length).toBe(9);
    expect(F.bendingMaterials().rows.some((r) => !r.instant)).toBe(true);
  });
});
