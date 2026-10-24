import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ═══════════════════════════════════════════════════
// razorpay-checkout (browser): one on-demand script load, checkout opens only
// once modal dialogs have closed (the aria-hidden / focus-trap console warning),
// no placeholder keys, whole-paise amounts, failures surfaced.
// ═══════════════════════════════════════════════════

const SRC = 'https://checkout.razorpay.com/v1/checkout.js';

type Handler = (r: any) => void;
let instances: Array<{ options: Record<string, any>; opened: boolean; handlers: Record<string, Handler> }>;

class FakeRazorpay {
  record: (typeof instances)[number];
  constructor(options: Record<string, any>) {
    this.record = { options, opened: false, handlers: {} };
    instances.push(this.record);
  }
  open() {
    this.record.opened = true;
  }
  on(event: string, cb: Handler) {
    this.record.handlers[event] = cb;
  }
}

async function freshModule() {
  vi.resetModules();
  return import('@/lib/razorpay-checkout');
}

/** Simulate the browser finishing the checkout.js download */
function finishScriptLoad() {
  (window as any).Razorpay = FakeRazorpay;
  document.querySelector(`script[src="${SRC}"]`)!.dispatchEvent(new Event('load'));
}

beforeEach(() => {
  instances = [];
  delete (window as any).Razorpay;
  document.body.innerHTML = '';
  document.body.style.pointerEvents = '';
});
afterEach(() => {
  vi.useRealTimers();
});

describe('loadRazorpay', () => {
  it('adds checkout.js once, however many callers ask at the same time', async () => {
    const { loadRazorpay } = await freshModule();
    const a = loadRazorpay();
    const b = loadRazorpay();
    expect(document.querySelectorAll(`script[src="${SRC}"]`)).toHaveLength(1);
    finishScriptLoad();
    expect(await a).toBe(FakeRazorpay);
    expect(await b).toBe(FakeRazorpay);
    // Already loaded: no new tag
    await loadRazorpay();
    expect(document.querySelectorAll(`script[src="${SRC}"]`)).toHaveLength(1);
  });

  it('rejects with a readable message when the script is blocked, and can retry', async () => {
    const { loadRazorpay } = await freshModule();
    const first = loadRazorpay();
    document.querySelector(`script[src="${SRC}"]`)!.dispatchEvent(new Event('error'));
    await expect(first).rejects.toThrow(/ad blockers/);
    expect(document.querySelectorAll(`script[src="${SRC}"]`)).toHaveLength(0);

    const retry = loadRazorpay();
    finishScriptLoad();
    await expect(retry).resolves.toBe(FakeRazorpay);
  });
});

describe('openRazorpayCheckout', () => {
  const base = {
    key: 'rzp_live_key',
    orderId: 'order_123',
    description: '50% Advance',
    onSuccess: vi.fn(),
  };

  it('refuses to open without a key or order (no dummy test keys)', async () => {
    (window as any).Razorpay = FakeRazorpay;
    const { openRazorpayCheckout } = await freshModule();
    await expect(openRazorpayCheckout({ ...base, key: undefined })).rejects.toThrow(/not configured/);
    await expect(openRazorpayCheckout({ ...base, key: '' })).rejects.toThrow(/not configured/);
    await expect(openRazorpayCheckout({ ...base, orderId: '' })).rejects.toThrow(/could not be created/);
    expect(instances).toHaveLength(0);
  });

  it('waits for an open modal dialog to close before opening', async () => {
    (window as any).Razorpay = FakeRazorpay;
    const { openRazorpayCheckout } = await freshModule();

    // A Radix modal: open dialog + body pointer-events lock + aria-hidden siblings
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('data-state', 'open');
    const sibling = document.createElement('div');
    sibling.setAttribute('data-aria-hidden', 'true');
    document.body.append(dialog, sibling);
    document.body.style.pointerEvents = 'none';

    const opening = openRazorpayCheckout(base);
    await new Promise((r) => setTimeout(r, 60));
    expect(instances).toHaveLength(0); // still waiting

    // Dialog closes: Radix removes everything it set
    dialog.remove();
    sibling.remove();
    document.body.style.pointerEvents = '';
    await opening;
    expect(instances).toHaveLength(1);
    expect(instances[0].opened).toBe(true);
  });

  it('opens anyway after a short cap so payment never hangs', async () => {
    (window as any).Razorpay = FakeRazorpay;
    const { waitForModalsToClose } = await freshModule();
    document.body.style.pointerEvents = 'none';
    const started = Date.now();
    await waitForModalsToClose(100);
    expect(Date.now() - started).toBeGreaterThanOrEqual(90);
  });

  it('sends whole paise and wires success, failure and dismiss', async () => {
    (window as any).Razorpay = FakeRazorpay;
    const { openRazorpayCheckout, toPaise } = await freshModule();
    expect(toPaise({ amountRupees: 5975.5 })).toBe(597550);
    expect(toPaise({ amountRupees: 19.99 })).toBe(1999); // 19.99 * 100 = 1998.9999999999998
    expect(toPaise({ amountPaise: 597500 })).toBe(597500);
    expect(toPaise({})).toBeUndefined();

    const onSuccess = vi.fn();
    const onFailure = vi.fn();
    const onDismiss = vi.fn();
    await openRazorpayCheckout({ ...base, amountRupees: 19.99, onSuccess, onFailure, onDismiss });
    const { options, handlers } = instances[0];
    expect(options).toMatchObject({ key: 'rzp_live_key', order_id: 'order_123', amount: 1999, currency: 'INR' });

    const signed = { razorpay_order_id: 'order_123', razorpay_payment_id: 'pay_1', razorpay_signature: 'sig' };
    options.handler(signed);
    expect(onSuccess).toHaveBeenCalledWith(signed);

    handlers['payment.failed']({ error: { code: 'BAD_REQUEST_ERROR', description: 'Card declined' } });
    expect(onFailure).toHaveBeenCalledWith(expect.objectContaining({ description: 'Card declined' }));

    options.modal.ondismiss();
    expect(onDismiss).toHaveBeenCalled();
  });
});
