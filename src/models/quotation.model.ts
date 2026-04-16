/**
 * Vendor-submitted quotation for a specific project RFQ.
 */
export interface Quotation {
  readonly id: string;
  readonly rfqId: string;
  readonly userId: string; // The customer who owns the project
  readonly vendorId: string; // The MechMaster submitting the bid
  readonly vendorName: string;
  readonly quotedPrice: number;
  readonly leadTimeDays: number;
  readonly notes?: string;
  readonly status: QuotationStatus;
  readonly negotiationHistory?: NegotiationEntry[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type QuotationStatus = 'pending' | 'revised' | 'accepted' | 'declined' | 'cancelled';

export interface NegotiationEntry {
  readonly party: 'vendor' | 'customer' | 'admin';
  readonly price: number;
  readonly leadTime: number;
  readonly message: string;
  readonly createdAt: string;
}
