// ═══════════════════════════════════════════════════
// razorpay-checkout — the one way the browser opens Razorpay Checkout
//
//  • checkout.js is loaded on demand, once (it used to load on every page from
//    the root layout AND again from the project page)
//  • Checkout opens only after any modal dialog has closed: a Radix Dialog marks
//    everything outside itself aria-hidden and traps focus, which hid Razorpay's
//    container from assistive tech and could keep focus out of its payment form
//    ("Blocked aria-hidden on an element because its descendant retained focus")
//  • no placeholder keys — a missing key is an error, not a dummy test checkout
//  • amounts are whole paise
// The amount Razorpay charges is fixed by the server-created order (order_id);
// the browser value is display only.
// ═══════════════════════════════════════════════════

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
const LOAD_TIMEOUT_MS = 15_000;
const DIALOG_SETTLE_TIMEOUT_MS = 1_500;

export interface RazorpaySuccess {
  readonly razorpay_order_id: string;
  readonly razorpay_payment_id: string;
  readonly razorpay_signature: string;
}

export interface RazorpayFailure {
  readonly code?: string;
  readonly description?: string;
  readonly reason?: string;
  readonly metadata?: { readonly order_id?: string; readonly payment_id?: string };
}

export interface CheckoutOptions {
  readonly key: string | undefined | null;
  readonly orderId: string;
  /** Rupees; shown in the popup only — the order fixes what is charged */
  readonly amountRupees?: number;
  /** Paise, when the server already returned it */
  readonly amountPaise?: number;
  readonly description: string;
  readonly prefill?: { name?: string; email?: string; contact?: string };
  readonly notes?: Record<string, string>;
  readonly onSuccess: (response: RazorpaySuccess) => void | Promise<void>;
  readonly onFailure?: (error: RazorpayFailure) => void;
  readonly onDismiss?: () => void;
}

type RazorpayInstance = { open: () => void; on: (event: string, cb: (r: any) => void) => void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

let loading: Promise<RazorpayConstructor> | null = null;

/** Loads checkout.js once; resolves with window.Razorpay */
export function loadRazorpay(): Promise<RazorpayConstructor> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Razorpay is browser-only'));
  const existing = (window as any).Razorpay as RazorpayConstructor | undefined;
  if (existing) return Promise.resolve(existing);
  if (loading) return loading;

  loading = new Promise<RazorpayConstructor>((resolve, reject) => {
    const fail = (message: string) => {
      loading = null; // allow a retry
      reject(new Error(message));
    };
    let script = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SRC}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = CHECKOUT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
    const timer = window.setTimeout(
      () => fail('The payment gateway took too long to load. Check your connection and try again.'),
      LOAD_TIMEOUT_MS
    );
    script.addEventListener('load', () => {
      window.clearTimeout(timer);
      const Razorpay = (window as any).Razorpay as RazorpayConstructor | undefined;
      if (Razorpay) resolve(Razorpay);
      else fail('The payment gateway failed to initialise. Please refresh and try again.');
    });
    script.addEventListener('error', () => {
      window.clearTimeout(timer);
      script?.remove();
      fail('Could not load the payment gateway. Disable ad blockers for this site and try again.');
    });
  });
  return loading;
}

/** True while a modal (Radix Dialog / AlertDialog / Sheet) is open or animating out */
function modalIsOpen(): boolean {
  return (
    document.body.style.pointerEvents === 'none' ||
    document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]') !== null ||
    document.querySelector('[data-aria-hidden="true"]') !== null
  );
}

/** Resolves once no modal dialog is open (or after a short cap, so payment never hangs) */
export function waitForModalsToClose(timeoutMs = DIALOG_SETTLE_TIMEOUT_MS): Promise<void> {
  return new Promise((resolve) => {
    const started = performance.now();
    const check = () => {
      if (!modalIsOpen() || performance.now() - started > timeoutMs) resolve();
      else setTimeout(check, 16); // not rAF: it pauses in background tabs
    };
    check();
  });
}

/** Whole paise for the popup: prefers the server's paise, else rounds rupees */
export function toPaise(options: Pick<CheckoutOptions, 'amountPaise' | 'amountRupees'>): number | undefined {
  if (typeof options.amountPaise === 'number' && Number.isFinite(options.amountPaise)) {
    return Math.round(options.amountPaise);
  }
  if (typeof options.amountRupees === 'number' && Number.isFinite(options.amountRupees)) {
    return Math.round(options.amountRupees * 100);
  }
  return undefined;
}

/** Opens Razorpay Checkout for a server-created order */
export async function openRazorpayCheckout(options: CheckoutOptions): Promise<void> {
  if (!options.key) throw new Error('Payments are not configured. Please contact support.');
  if (!options.orderId) throw new Error('The payment order could not be created. Please try again.');

  const Razorpay = await loadRazorpay();
  await waitForModalsToClose();

  const amount = toPaise(options);
  const rzp = new Razorpay({
    key: options.key,
    order_id: options.orderId,
    ...(amount !== undefined ? { amount } : {}),
    currency: 'INR',
    name: 'MechHub',
    description: options.description,
    prefill: options.prefill ?? {},
    notes: options.notes ?? {},
    theme: { color: '#2F5FA7' },
    handler: (response: RazorpaySuccess) => options.onSuccess(response),
    modal: { ondismiss: () => options.onDismiss?.() },
  });
  rzp.on('payment.failed', (response: { error?: RazorpayFailure }) => {
    options.onFailure?.(response?.error ?? {});
  });
  rzp.open();
}
