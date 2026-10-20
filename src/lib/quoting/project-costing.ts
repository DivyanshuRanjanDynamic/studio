// ═══════════════════════════════════════════════════
// project-costing — roll up a project's parts into one cost summary
//
// Pure and deterministic, so the project page, the RFQ email and the quotation
// PDF all show the same numbers. Each part's price comes from (in order):
//   1. the admin-agreed unitCost, once a quotation has been sent
//   2. the server-stored instant quote (CNC), while it is still valid
//   3. nothing — the part is pending an engineer's price
// GST and shipping use the shared finance rules.
// ═══════════════════════════════════════════════════

import type { MechanicalPart } from '@/models/project.model';
import { calculateProjectFinances, type ProjectFinances } from '@/utils/finance';

/** Where a part's price came from, worst-to-best for the UI to surface */
export type PartPriceStatus = 'pending' | 'expired' | 'instant' | 'quoted';

export interface PartCostLine {
  readonly partId: string;
  readonly partName: string;
  readonly materialName: string;
  readonly quantity: number;
  /** Per-part price, or null when the part is pending an engineer's quote */
  readonly unitPrice: number | null;
  readonly lineTotal: number | null;
  readonly status: PartPriceStatus;
  readonly leadTimeDays: number | null;
  /** Why there is no firm instant price (pending), shown to the customer */
  readonly note?: string;
}

export interface ProjectCostSummary {
  readonly currency: 'INR';
  readonly lines: readonly PartCostLine[];
  readonly partCount: number;
  readonly pricedPartCount: number;
  readonly pendingPartCount: number;
  readonly expiredPartCount: number;
  /** Every part has a firm (non-pending) price — checkout/RFQ totals are complete */
  readonly allPriced: boolean;
  /** At least one instant price has lapsed and should be refreshed */
  readonly hasExpired: boolean;
  /** Sum of every priced line (instant, expired-but-known, or admin-quoted) */
  readonly partsSubtotal: number;
  readonly finances: ProjectFinances;
  readonly maxLeadTimeDays: number;
}

function costLine(part: MechanicalPart, now: number): PartCostLine {
  const quantity = Math.max(0, Number(part.quantity) || 0);
  const base = {
    partId: part.id,
    partName: part.partName || 'Untitled part',
    materialName: part.material?.name || 'Custom',
    quantity,
  };

  // 1. Admin-agreed price wins once a quotation is sent.
  const unitCost = Number(part.unitCost);
  if (Number.isFinite(unitCost) && unitCost > 0) {
    return { ...base, unitPrice: unitCost, lineTotal: Math.round(unitCost * quantity), status: 'quoted', leadTimeDays: null };
  }

  // 2. Server-stored instant quote (CNC).
  const quote = part.instantQuote;
  if (quote && Number.isFinite(quote.totalPrice) && quote.totalPrice > 0) {
    const expired = typeof quote.expiresAt === 'number' && quote.expiresAt <= now;
    return {
      ...base,
      unitPrice: quote.pricePerPart,
      lineTotal: quote.totalPrice,
      status: expired ? 'expired' : 'instant',
      leadTimeDays: quote.leadTimeDays ?? null,
    };
  }

  // 3. Awaiting an engineer's price.
  return {
    ...base,
    unitPrice: null,
    lineTotal: null,
    status: 'pending',
    leadTimeDays: null,
    ...(part.quoteNote ? { note: part.quoteNote } : {}),
  };
}

export interface SummarizeOptions {
  /** Flat shipping fee; defaults to the finance module's standard rate */
  readonly shippingCost?: number;
  /** Injectable clock for deterministic tests */
  readonly now?: number;
}

export function summarizeProjectCost(
  parts: readonly MechanicalPart[],
  options: SummarizeOptions = {}
): ProjectCostSummary {
  const now = options.now ?? Date.now();
  const lines = parts.map((p) => costLine(p, now));

  const pricedLines = lines.filter((l) => l.lineTotal !== null);
  const partsSubtotal = pricedLines.reduce((sum, l) => sum + (l.lineTotal ?? 0), 0);
  const pendingPartCount = lines.filter((l) => l.status === 'pending').length;
  const expiredPartCount = lines.filter((l) => l.status === 'expired').length;
  const maxLeadTimeDays = lines.reduce((max, l) => Math.max(max, l.leadTimeDays ?? 0), 0);

  return {
    currency: 'INR',
    lines,
    partCount: lines.length,
    pricedPartCount: pricedLines.length,
    pendingPartCount,
    expiredPartCount,
    allPriced: lines.length > 0 && pendingPartCount === 0,
    hasExpired: expiredPartCount > 0,
    partsSubtotal,
    finances: calculateProjectFinances(partsSubtotal, options.shippingCost),
    maxLeadTimeDays,
  };
}
