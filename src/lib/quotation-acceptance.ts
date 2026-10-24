import type { NegotiationEntry, QuotationStatus } from '@/models/quotation.model';

// ═══════════════════════════════════════════════════
// quotation-acceptance — who may set and accept a quotation's price
//
// The accepted price becomes the project's quotedPrice, which Razorpay charges
// (payment/create-order, CheckoutService.priceProjectPayment). So a price only
// binds once the *other* party agrees to it:
//   • vendor/admin counter-offers change quotedPrice; a customer's counter-offer
//     is only recorded in negotiationHistory
//   • the customer accepts the vendor's current quotedPrice
//   • the vendor accepts the customer's latest counter-offer
// ═══════════════════════════════════════════════════

export type QuotationActor = 'customer' | 'vendor' | 'admin';

/** The quotation fields acceptance reads (Firestore data, so loosely typed) */
export interface AcceptableQuotation {
  readonly rfqId?: string;
  readonly userId?: string;
  readonly vendorId?: string;
  readonly quotedPrice?: unknown;
  readonly leadTimeDays?: unknown;
  readonly status?: QuotationStatus | string;
  readonly negotiationHistory?: readonly NegotiationEntry[];
}

export interface AcceptanceProject {
  readonly userId?: string;
}

export type AcceptanceDecision =
  | { readonly ok: true; readonly price: number; readonly leadTimeDays: number }
  | { readonly ok: false; readonly code: number; readonly message: string };

const OPEN_STATUSES: readonly string[] = ['pending', 'revised'];

const positive = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Fields a counter-offer writes. Only a vendor or admin move changes the binding
 * price and lead time; a customer's proposal waits in the history for the vendor.
 */
export function counterOfferFields(
  actor: QuotationActor,
  price: number,
  leadTime: number
): { quotedPrice?: number; leadTimeDays?: number } {
  return actor === 'customer' ? {} : { quotedPrice: price, leadTimeDays: leadTime };
}

/**
 * Whether `actor` may accept `quote` for project `projectId`, and at what price.
 * Rejects quotations from another project or customer, closed quotations, and a
 * party accepting its own latest offer.
 */
export function decideAcceptance(
  projectId: string,
  project: AcceptanceProject,
  quote: AcceptableQuotation,
  actor: QuotationActor
): AcceptanceDecision {
  if (quote.rfqId !== projectId || !quote.userId || quote.userId !== project.userId) {
    return { ok: false, code: 404, message: 'Quotation not found' };
  }
  if (!OPEN_STATUSES.includes(String(quote.status ?? ''))) {
    return { ok: false, code: 409, message: `Quotation is ${quote.status ?? 'closed'}` };
  }

  const history = Array.isArray(quote.negotiationHistory) ? quote.negotiationHistory : [];
  const lastMove = history.length > 0 ? history[history.length - 1] : undefined;

  if (actor === 'vendor') {
    // A vendor accepts the customer's counter-offer, never its own price.
    if (lastMove?.party !== 'customer') {
      return { ok: false, code: 409, message: 'There is no customer counter-offer to accept' };
    }
    const price = positive(lastMove.price);
    const leadTimeDays = positive(lastMove.leadTime);
    if (price === null || leadTimeDays === null) {
      return { ok: false, code: 409, message: 'The counter-offer has no valid price' };
    }
    return { ok: true, price, leadTimeDays };
  }

  if (actor === 'customer' && lastMove?.party === 'customer') {
    return { ok: false, code: 409, message: 'Waiting for the vendor to respond to your counter-offer' };
  }

  // Customer or admin: the vendor's current price.
  const price = positive(quote.quotedPrice);
  const leadTimeDays = positive(quote.leadTimeDays);
  if (price === null || leadTimeDays === null) {
    return { ok: false, code: 409, message: 'Quotation has no valid price' };
  }
  return { ok: true, price, leadTimeDays };
}
