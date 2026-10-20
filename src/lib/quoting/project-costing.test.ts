import { describe, it, expect } from 'vitest';
import { summarizeProjectCost } from './project-costing';
import { calculateProjectFinances } from '@/utils/finance';
import type { MechanicalPart, PartInstantQuote } from '@/models/project.model';

// ═══════════════════════════════════════════════════
// Project cost roll-up: per-part prices → subtotal, GST, shipping, total
// ═══════════════════════════════════════════════════

const NOW = 1_800_000_000_000;

const instantQuote = (totalPrice: number, overrides: Partial<PartInstantQuote> = {}): PartInstantQuote => ({
  quoteRef: 'MH-ABCDEFGH23',
  analysisId: 'cnca_0123456789abcdef',
  currency: 'INR',
  pricePerPart: totalPrice,
  totalPrice,
  quantity: 1,
  leadTimeDays: 3,
  process: 'cnc_machining_3axis',
  materialId: 'al_6061',
  finishType: 'none',
  breakdown: {} as PartInstantQuote['breakdown'],
  stock: '100 × 60 × 20 mm block',
  hasBlockingIssues: false,
  dfmIssues: [],
  unpricedProcesses: [],
  pricedAt: '2026-10-20T00:00:00Z',
  expiresAt: NOW + 15 * 60 * 1000,
  ...overrides,
});

const part = (id: string, overrides: Partial<MechanicalPart> = {}): MechanicalPart =>
  ({
    id,
    projectId: 'proj_1',
    userId: 'user_1',
    partName: `Part ${id}`,
    service: 'cnc_machining',
    cadFile: { fileName: `${id}.step`, fileUrl: `k/${id}`, fileSize: 1, uploadedAt: '2026-10-20T00:00:00Z' },
    material: { id: 'al_6061', name: 'Aluminium 6061' },
    secondaryProcesses: [],
    quantity: 1,
    status: 'ready_for_quote',
    createdAt: '2026-10-20T00:00:00Z',
    updatedAt: '2026-10-20T00:00:00Z',
    ...overrides,
  }) as MechanicalPart;

describe('summarizeProjectCost', () => {
  it('totals instant prices and applies GST + shipping', () => {
    const parts = [
      part('a', { quantity: 10, instantQuote: instantQuote(5000, { pricePerPart: 500, quantity: 10 }) }),
      part('b', { quantity: 2, instantQuote: instantQuote(3000, { pricePerPart: 1500, quantity: 2, leadTimeDays: 5 }) }),
    ];

    const summary = summarizeProjectCost(parts, { now: NOW });

    expect(summary.partsSubtotal).toBe(8000);
    expect(summary.allPriced).toBe(true);
    expect(summary.hasExpired).toBe(false);
    expect(summary.pricedPartCount).toBe(2);
    expect(summary.maxLeadTimeDays).toBe(5);
    expect(summary.finances).toEqual(calculateProjectFinances(8000));
    expect(summary.finances.total).toBe(8000 + 1440 + 150);
    expect(summary.lines.map((l) => l.status)).toEqual(['instant', 'instant']);
    expect(summary.lines[0]).toMatchObject({ unitPrice: 500, lineTotal: 5000, quantity: 10 });
  });

  it('excludes pending parts from the subtotal but keeps them visible', () => {
    const parts = [
      part('a', { instantQuote: instantQuote(5000) }),
      part('b', { quoteStatus: 'manual_review', instantQuote: null, quoteNote: 'Engineer will price this.' }),
    ];

    const summary = summarizeProjectCost(parts, { now: NOW });

    expect(summary.partsSubtotal).toBe(5000);
    expect(summary.allPriced).toBe(false);
    expect(summary.pendingPartCount).toBe(1);
    const pending = summary.lines[1];
    expect(pending).toMatchObject({ status: 'pending', unitPrice: null, lineTotal: null, note: 'Engineer will price this.' });
  });

  it('flags expired instant quotes but still counts their last price', () => {
    const parts = [part('a', { instantQuote: instantQuote(5000, { expiresAt: NOW - 1000 }) })];

    const summary = summarizeProjectCost(parts, { now: NOW });

    expect(summary.lines[0].status).toBe('expired');
    expect(summary.partsSubtotal).toBe(5000);
    expect(summary.hasExpired).toBe(true);
    expect(summary.expiredPartCount).toBe(1);
    expect(summary.allPriced).toBe(true); // expired is not pending
  });

  it('lets the admin-agreed unitCost override the instant quote', () => {
    const parts = [
      part('a', { quantity: 4, unitCost: 2000, instantQuote: instantQuote(1200, { pricePerPart: 300, quantity: 4 }) }),
    ];

    const summary = summarizeProjectCost(parts, { now: NOW });

    expect(summary.lines[0]).toMatchObject({ status: 'quoted', unitPrice: 2000, lineTotal: 8000 });
    expect(summary.partsSubtotal).toBe(8000);
  });

  it('honours a custom shipping cost and handles an empty project', () => {
    const withShip = summarizeProjectCost([part('a', { instantQuote: instantQuote(1000) })], { now: NOW, shippingCost: 0 });
    expect(withShip.finances.shipping).toBe(0);
    expect(withShip.finances.total).toBe(1000 + 180);

    const empty = summarizeProjectCost([], { now: NOW });
    expect(empty.partCount).toBe(0);
    expect(empty.allPriced).toBe(false);
    expect(empty.partsSubtotal).toBe(0);
  });
});
