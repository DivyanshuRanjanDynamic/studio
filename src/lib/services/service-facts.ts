// ═══════════════════════════════════════════════════
// service-facts — the numbers on the public service pages, read from the
// same rate cards and engines that price customer uploads, so a page can
// never promise a material, range or price the quote engine disagrees with.
// Internal figures (margin, hourly rates, ₹/mm² finish rates) are not exposed:
// pages show what drives a price and real example prices instead.
// ═══════════════════════════════════════════════════

import type { FinishType, SheetQuoteRequest, TurnaroundType } from '@/types/quoting';
import { MATERIAL_CATALOG as WIZARD_CATALOG } from '@/lib/data/material-data';
import { SHEET_MATERIALS, CUT_SPEED_MM_MIN, SHEET_SHOP_RATES } from '@/lib/quoting/sheet-rates';
import { CNC_MATERIAL_DATA, formatCncStock } from '@/lib/quoting/cnc-materials';
import { MATERIAL_CATALOG, FINISH_RATES, TURNAROUND_OPTIONS } from '@/lib/quoting/materials';
import { PRINT_SHOP_RATES } from '@/lib/quoting/print-rates';
import { ALL_TAPS } from '@/config/manufacturing';
import { generateSheetQuote } from '@/lib/quoting/sheet-metal';
import { MIN_ORDER_INR, generateCncQuote } from '@/lib/quoting/pricing-engine';
import { REF_CNC_BLOCK, REF_SHEET_BRACKET, REF_SHEET_PLATE } from './reference-parts';

export interface FactRow {
  readonly cells: readonly string[];
  /** Priced instantly online (false = quoted by an engineer) */
  readonly instant: boolean;
}

export interface FactTable {
  readonly columns: readonly string[];
  readonly rows: readonly FactRow[];
  readonly caption?: string;
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const QTYS = [1, 10, 100] as const;

const FAMILY_LABEL: Record<string, string> = {
  mild_steel: 'Mild steel',
  stainless: 'Stainless',
  aluminium: 'Aluminium',
  alloy_steel: 'Alloy steel',
  brass: 'Brass',
  copper: 'Copper',
  plastic: 'Plastic',
};

const FIBER = ['mild_steel', 'stainless', 'aluminium'];

/** Wizard sheet catalogue entries (stocked thicknesses), including ones without a rate card */
const wizardSheetMaterials = WIZARD_CATALOG.sheet_metal_cutting.categories.flatMap((c) => c.materials);

function stocked(id: string): readonly number[] {
  return wizardSheetMaterials.find((m) => m.id === id)?.thicknesses ?? [];
}

function stockedRange(id: string): string {
  const t = stocked(id);
  return t.length ? `${t[0]} – ${t[t.length - 1]} mm (${t.length} sizes)` : '—';
}

/** Thickness range the laser cuts instantly for a sheet material */
export function cutRange(materialId: string): string {
  const m = SHEET_MATERIALS[materialId];
  if (!m) return '—';
  const table = CUT_SPEED_MM_MIN[m.family];
  return `${table[0][0]} – ${table[table.length - 1][0]} mm`;
}

// ── Order minimums and turnaround ──

export const ORDER_MINIMUMS = {
  sheet: SHEET_SHOP_RATES.minOrderLine,
  cnc: MIN_ORDER_INR,
  print: PRINT_SHOP_RATES.minOrderLine,
} as const;

export function formatInr(n: number): string {
  return inr(n);
}

export function turnaroundTable(): FactTable {
  return {
    columns: ['Turnaround', 'Lead time', 'Price'],
    rows: TURNAROUND_OPTIONS.map((t) => ({
      cells: [
        t.label.replace(/\s*\(.*\)$/, ''),
        t.days === 0 ? 'Same day' : `${t.days} working day${t.days > 1 ? 's' : ''}`,
        t.multiplier === 1
          ? 'Standard price'
          : t.multiplier < 1
            ? `${Math.round((1 - t.multiplier) * 100)}% less`
            : `+${Math.round((t.multiplier - 1) * 100)}%${t.type === 'rush_1d' || t.type === 'same_day' ? ' (more when the shop is busy)' : ''}`,
      ],
      instant: true,
    })),
  };
}

// ── Materials ──

export function sheetCuttingMaterials(): FactTable {
  const rows: FactRow[] = Object.values(SHEET_MATERIALS).map((m) => ({
    cells: [
      m.name,
      FIBER.includes(m.family) ? 'Fiber laser' : 'CO₂ laser',
      cutRange(m.id),
      stockedRange(m.id),
      `${m.sheetMm.long} × ${m.sheetMm.short} mm`,
    ],
    instant: true,
  }));
  for (const m of wizardSheetMaterials.filter((w) => !SHEET_MATERIALS[w.id])) {
    rows.push({ cells: [m.name, 'Engineer review', '—', stockedRange(m.id), '—'], instant: false });
  }
  return {
    columns: ['Material', 'Process', 'Instant cut range', 'Stocked thickness', 'Max sheet'],
    rows,
    caption: 'Parts larger than the sheet, or thicknesses outside the instant range, are quoted by our engineers.',
  };
}

export function bendingMaterials(): FactTable {
  return {
    columns: ['Material', 'Bends up to', 'Stocked thickness', 'Note'],
    rows: Object.values(SHEET_MATERIALS)
      .filter((m) => FIBER.includes(m.family))
      .map((m) => ({
        cells: [
          m.name,
          m.maxBendThicknessMm === null ? 'Not bent' : `${m.maxBendThicknessMm} mm`,
          stockedRange(m.id),
          m.maxBendThicknessMm === null ? 'T6 temper cracks on tight bends — choose Al 5052' : 'Cut and bent in one order',
        ],
        instant: m.maxBendThicknessMm !== null,
      })),
    caption: `Bend lines up to ${SHEET_SHOP_RATES.maxBendLineMm} mm long. Parts longer than ${SHEET_SHOP_RATES.twoPersonLengthMm} mm are handled by two operators.`,
  };
}

/** Sheet metals for secondary sheet operations (insertion, dimpling, countersinking) */
export function sheetMetalMaterials(note: (id: string) => string): FactTable {
  return {
    columns: ['Material', 'Stocked thickness', 'Note'],
    rows: Object.values(SHEET_MATERIALS)
      .filter((m) => FIBER.includes(m.family))
      .map((m) => ({ cells: [m.name, stockedRange(m.id), note(m.id)], instant: false })),
  };
}

export function cncMaterials(): FactTable {
  return {
    columns: ['Material', 'Grade', 'Machinability', 'Finishes available'],
    rows: MATERIAL_CATALOG.filter((m) => CNC_MATERIAL_DATA[m.id]).map((m) => ({
      cells: [
        m.name,
        m.alloy,
        FAMILY_LABEL[CNC_MATERIAL_DATA[m.id].machinabilityGroup] ?? '—',
        m.availableFinishes
          .filter((f) => f !== 'none')
          .map((f) => FINISH_RATES[f].label)
          .join(', '),
      ],
      instant: true,
    })),
    caption: 'Stock is the smallest standard block or round bar that fits your part, picked automatically from the 3D model.',
  };
}

/** Materials that take one of these finishes, by process */
export function finishMaterials(finishes: readonly FinishType[]): FactTable {
  const takes = (list: readonly FinishType[]) => finishes.filter((f) => list.includes(f));
  const rows: FactRow[] = [];
  for (const m of Object.values(SHEET_MATERIALS)) {
    const ok = takes(m.finishes);
    if (ok.length) rows.push({ cells: [m.name, 'Sheet metal', ok.map((f) => FINISH_RATES[f].label).join(', ')], instant: true });
  }
  for (const m of MATERIAL_CATALOG.filter((c) => CNC_MATERIAL_DATA[c.id])) {
    const ok = takes(m.availableFinishes);
    if (ok.length) rows.push({ cells: [m.name, 'CNC machined', ok.map((f) => FINISH_RATES[f].label).join(', ')], instant: true });
  }
  return { columns: ['Material', 'Process', 'Finish'], rows };
}

export function tappingMaterials(): FactTable {
  const rows: FactRow[] = [
    ...Object.values(SHEET_MATERIALS).map((m) => ({
      cells: [m.name, 'Sheet metal', m.tapGroup ? `${FAMILY_LABEL[m.tapGroup]} speeds` : 'Not tapped (wood)'],
      instant: m.tapGroup !== null,
    })),
    ...MATERIAL_CATALOG.filter((c) => CNC_MATERIAL_DATA[c.id]).map((m) => ({
      cells: [m.name, 'CNC machined', `${FAMILY_LABEL[CNC_MATERIAL_DATA[m.id].machinabilityGroup]} speeds`],
      instant: true,
    })),
  ];
  return { columns: ['Material', 'Process', 'Tapping'], rows };
}

// ── Threads ──

const metric = ALL_TAPS.filter((t) => !t.isInch);
const imperial = ALL_TAPS.filter((t) => t.isInch);
export const TAP_RANGE = {
  metric: `${metric[0].id.split('x')[0]} – ${metric[metric.length - 1].id.split('x')[0]}`,
  imperial: `#${imperial[0].id} – ${imperial[imperial.length - 1].id}`,
  count: ALL_TAPS.length,
} as const;

// ── Live example prices ──

const sheetQuote = (analysis = REF_SHEET_PLATE, req: Partial<SheetQuoteRequest> & { materialId: string }) => {
  const r = generateSheetQuote(analysis, {
    thicknessMm: 2,
    finishType: 'none',
    quantity: 1,
    turnaround: 'standard_3d' as TurnaroundType,
    ...req,
  });
  return r.success ? r.data : null;
};

export function sheetCuttingExample(): FactTable {
  const materials: Array<[string, number]> = [['ms-crca', 2], ['ss-304', 2], ['al-5052', 2], ['acrylic', 3], ['mdf', 3.2]];
  return {
    columns: ['Material', '1 pc', '10 pcs', '100 pcs'],
    rows: materials.map(([id, t]) => ({
      cells: [
        `${SHEET_MATERIALS[id].name}, ${t} mm`,
        ...QTYS.map((q) => {
          const p = sheetQuote(REF_SHEET_PLATE, { materialId: id, thicknessMm: t, quantity: q });
          return p ? inr(p.pricePerPart) : '—';
        }),
      ],
      instant: true,
    })),
    caption: 'Price per part for a 200 × 100 mm plate with 4 holes, standard 3-day turnaround, excl. GST. One-offs carry the order minimum.',
  };
}

export function bendingExample(): FactTable {
  return {
    columns: ['Material (2 mm)', '1 pc', '10 pcs', '100 pcs'],
    rows: ['ms-crca', 'ss-304', 'al-5052'].map((id) => ({
      cells: [
        SHEET_MATERIALS[id].name,
        ...QTYS.map((q) => {
          const p = sheetQuote(REF_SHEET_BRACKET, { materialId: id, quantity: q, bendingSelected: true });
          return p ? inr(p.pricePerPart) : '—';
        }),
      ],
      instant: true,
    })),
    caption: 'Price per part for a 100 × 40 × 50 mm L-bracket with one 90° bend, cut and bent, standard turnaround, excl. GST. Bend setup is shared across the batch.',
  };
}

export function cncExample(): FactTable {
  return {
    columns: ['Material', '1 pc', '10 pcs', '100 pcs'],
    rows: ['al_6061', 'ms_a36', 'ss_304', 'brass'].map((id) => ({
      cells: [
        MATERIAL_CATALOG.find((m) => m.id === id)!.name,
        ...QTYS.map((q) => {
          const r = generateCncQuote(REF_CNC_BLOCK, { materialId: id, finishType: 'none', quantity: q, turnaround: 'standard_3d' });
          return r.success ? inr(r.data.pricePerPart) : '—';
        }),
      ],
      instant: true,
    })),
    caption: `Price per part for an 80 × 50 × 20 mm block with a pocket and 4 through holes (${formatCncStock(REF_CNC_BLOCK.stock)} stock), standard turnaround, excl. GST.`,
  };
}

/** Price per part with and without a finish, on the reference plate (sheet) and block (CNC) */
export function finishExample(finish: FinishType, sheetMaterialId: string, cncMaterialId: string): FactTable {
  const qtys = [1, 10, 50];
  const sheet = (f: FinishType, q: number) =>
    sheetQuote(REF_SHEET_PLATE, { materialId: sheetMaterialId, finishType: f, quantity: q })?.pricePerPart ?? null;
  const cnc = (f: FinishType, q: number) => {
    const r = generateCncQuote(REF_CNC_BLOCK, { materialId: cncMaterialId, finishType: f, quantity: q, turnaround: 'standard_3d' });
    return r.success ? r.data.pricePerPart : null;
  };
  const row = (label: string, price: (f: FinishType, q: number) => number | null, f: FinishType): FactRow => ({
    cells: [label, ...qtys.map((q) => { const p = price(f, q); return p === null ? '—' : inr(p); })],
    instant: true,
  });
  const plate = `200 × 100 mm ${SHEET_MATERIALS[sheetMaterialId].name} plate`;
  const block = `80 × 50 × 20 mm ${MATERIAL_CATALOG.find((m) => m.id === cncMaterialId)!.name} block`;
  const label = FINISH_RATES[finish].label.toLowerCase();
  return {
    columns: ['Part', '1 pc', '10 pcs', '50 pcs'],
    rows: [
      row(`${plate}, as cut`, sheet, 'none'),
      row(`${plate}, ${label}`, sheet, finish),
      row(`${block}, as machined`, cnc, 'none'),
      row(`${block}, ${label}`, cnc, finish),
    ],
    caption: `Price per part including fabrication, standard turnaround, excl. GST. The finishing lot charge is shared across the batch, so ${label} costs far less per part in volume.`,
  };
}

export function tappingExample(): FactTable {
  const cnc = (id: string, taps?: boolean) => {
    const r = generateCncQuote(REF_CNC_BLOCK, {
      materialId: id, finishType: 'none', quantity: 10, turnaround: 'standard_3d',
      ...(taps ? { taps: [{ tapId: 'M6x1.0', count: 4 }] } : {}),
    });
    return r.success ? r.data.pricePerPart : null;
  };
  const sheet = (id: string, taps?: boolean) =>
    sheetQuote(REF_SHEET_PLATE, { materialId: id, quantity: 10, ...(taps ? { taps: [{ tapId: 'M5x0.8', count: 4 }] } : {}) })?.pricePerPart ?? null;
  const row = (label: string, base: number | null, tapped: number | null): FactRow => ({
    cells: [label, base === null ? '—' : inr(base), tapped === null ? '—' : inr(tapped), base !== null && tapped !== null ? `+${inr(tapped - base)}` : '—'],
    instant: true,
  });
  return {
    columns: ['Part (10 pcs)', 'Untapped', 'With threads', 'Threads add'],
    rows: [
      row('CNC block + 4 × M6, Aluminium 6061', cnc('al_6061'), cnc('al_6061', true)),
      row('CNC block + 4 × M6, Stainless 304', cnc('ss_304'), cnc('ss_304', true)),
      row('2 mm plate + 4 × M5, CRCA Mild Steel', sheet('ms-crca'), sheet('ms-crca', true)),
      row('2 mm plate + 4 × M5, Stainless 304', sheet('ss-304'), sheet('ss-304', true)),
    ],
    caption: 'Price per part. Threads are priced from the holes our analysis finds in your model: machine time plus tap wear, which scales with thread depth.',
  };
}
