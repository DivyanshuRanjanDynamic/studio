'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, LockKey, ShieldCheck, WarningCircle } from '@phosphor-icons/react/dist/ssr';
import { logger } from '@/utils/logger';
import { loadRazorpay, openRazorpayCheckout } from '@/lib/razorpay-checkout';
import type { QuoteOrder } from '@/models/order.model';
import { buttonClass } from '@/components/home/button';
import { cn } from '@/utils';

interface PaymentSectionProps {
  order: QuoteOrder;
  onSuccess: (response: any) => void;
  isLoading?: boolean;
}

/**
 * PaymentSection — Razorpay Standard Checkout bridge.
 * Opens Razorpay Checkout for the server-created order (src/lib/razorpay-checkout)
 * and hands the signed response to the verification callback.
 */
export function PaymentSection({ order, onSuccess, isLoading: externalLoading }: PaymentSectionProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load checkout.js as soon as the payment step shows (once per session)
    let active = true;
    loadRazorpay()
      .then(() => active && setIsScriptLoaded(true))
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, []);

  const handlePayment = async () => {
    if (!isScriptLoaded) return;

    setInternalLoading(true);
    setError(null);

    try {
      await openRazorpayCheckout({
        key: (order as any)._serverRazorpayKey,
        orderId: order.razorpayOrderId ?? '',
        amountRupees: order.total,
        description: `Order ${order.orderNumber}`,
        prefill: {
          name: order.shippingAddress.fullName,
          contact: order.shippingAddress.phone,
        },
        notes: { orderNumber: order.orderNumber },
        onSuccess: (response) => {
          logger.info({
            event: 'Razorpay payment capture successful',
            orderId: order.id,
            razorpayOrderId: response.razorpay_order_id,
          });
          onSuccess(response); // Send full response (order_id, payment_id, signature)
          setInternalLoading(false);
        },
        onFailure: (failure) => {
          logger.error({ event: 'Razorpay payment failed', code: failure.code, reason: failure.reason });
          setError(failure.description || 'The payment did not go through. No money was taken.');
          setInternalLoading(false);
        },
        onDismiss: () => setInternalLoading(false),
      });
    } catch (e: any) {
      setError(e?.message || 'Could not open the payment gateway. Please try again.');
      setInternalLoading(false);
    }
  };

  const isLoading = externalLoading || internalLoading || !isScriptLoaded;
  const label = externalLoading
    ? 'Confirming your payment'
    : internalLoading
      ? 'Opening Razorpay'
      : !isScriptLoaded
        ? 'Preparing secure checkout'
        : `Pay ₹${order.total.toLocaleString('en-IN')}`;

  return (
    <section aria-labelledby="pay-heading" className="rounded-2xl border border-lp-border bg-lp-bg p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-lp-border pb-6">
        <div>
          <h2 id="pay-heading" className="lp-mono flex items-center gap-2 text-lp-muted-fg">
            <CreditCard aria-hidden="true" className="size-4 text-lp-primary" weight="bold" />
            Amount to pay
          </h2>
          <p className="heading-3 lp-num mt-2">₹{order.total.toLocaleString('en-IN')}</p>
        </div>
        <p className="caption-2 text-right text-lp-muted-fg">
          Includes GST (18%)
          <span className="lp-num block text-lp-fg">₹{order.gst.toLocaleString('en-IN')}</span>
        </p>
      </div>

      <p className="caption-2 mt-6 text-lp-muted-fg">
        Order <span className="lp-num text-lp-fg">#{order.orderNumber}</span> · delivering to {order.shippingAddress.fullName},{' '}
        {order.shippingAddress.city}
      </p>

      {error && (
        <p role="alert" className="body-6 mt-6 flex items-start gap-2 rounded-xl border border-lp-destructive/40 p-3 text-lp-destructive">
          <WarningCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" weight="bold" />
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handlePayment}
        disabled={isLoading}
        aria-busy={isLoading}
        className={cn(buttonClass('primary'), 'mt-6 w-full py-3 disabled:cursor-wait disabled:opacity-60')}
      >
        <LockKey aria-hidden="true" className="size-4" weight="bold" />
        {label}
      </button>

      <p className="caption-5 mt-4 flex items-center justify-center gap-2 text-lp-muted-fg">
        <ShieldCheck aria-hidden="true" className="size-4 text-lp-primary" />
        Payments are processed by Razorpay. MechHub never stores your card details.
      </p>
    </section>
  );
}
