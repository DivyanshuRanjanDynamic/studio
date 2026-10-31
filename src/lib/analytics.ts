// ═══════════════════════════════════════════════════
// analytics — the one way the app sends events to GA4
//
//  • call only after a step has succeeded (server confirmed), never on a click
//  • never pass names, emails, phone numbers, addresses or file names
//  • a no-op until NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID is set
//
// Event definitions live in docs/tracking-plan.md.
// ═══════════════════════════════════════════════════

type AnalyticsEvent =
  | 'sign_up'
  | 'project_created'
  | 'part_added'
  | 'add_to_cart'
  | 'quote_requested'
  | 'quote_accepted'
  | 'begin_checkout'
  | 'purchase'
  | 'contact_submitted'
  | 'consultation_requested'
  | 'vendor_application_submitted';

type EventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (command: 'event', name: string, params: EventParams) => void;
  }
}

export function trackEvent(name: AnalyticsEvent, params: EventParams = {}): void {
  if (typeof window === 'undefined') return;
  window.gtag?.('event', name, params);
}

/** A verified payment. `transactionId` is the Razorpay order id, so GA4 counts each payment once. */
export function trackPurchase(transactionId: string, valueRupees: number, paymentType: 'full' | 'advance' | 'balance'): void {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value: valueRupees,
    currency: 'INR',
    payment_type: paymentType,
  });
}
