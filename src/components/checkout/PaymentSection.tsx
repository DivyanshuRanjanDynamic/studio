'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { logger } from '@/utils/logger';
import type { QuoteOrder } from '@/models/order.model';

interface PaymentSectionProps {
  order: QuoteOrder;
  onSuccess: (response: any) => void;
  isLoading?: boolean;
}

/**
 * PaymentSection — Razorpay Standard Checkout bridge.
 * Handles Razorpay script loading and payment verification callback.
 */
export function PaymentSection({
  order,
  onSuccess,
  isLoading: externalLoading,
}: PaymentSectionProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check if already loaded by RootLayout
    if ((window as any).Razorpay) {
      setIsScriptLoaded(true);
      return;
    }

    // 2. Poll for the global script (faster than waiting for a new script tag)
    const interval = setInterval(() => {
      if ((window as any).Razorpay) {
        setIsScriptLoaded(true);
        clearInterval(interval);
      }
    }, 100);

    // 3. Optional fallback Timeout
    const timeout = setTimeout(() => {
      if (!(window as any).Razorpay) {
        setError('Payment gateway took too long to load. Please refresh.');
      }
      clearInterval(interval);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const handlePayment = () => {
    if (!isScriptLoaded || typeof window === 'undefined') return;

    setInternalLoading(true);
    setError(null);

    const options = {
      key: (order as any)._serverRazorpayKey || process.env.NEXT_PUBLIC_RAZORPAY_KEY || 'rzp_test_dummy',
      amount: order.total * 100, // Amount in paise
      currency: 'INR',
      name: 'MechHub',
      description: `Order ${order.orderNumber}`,
      image: 'https://mechhub.in/logo.png',
      order_id: order.razorpayOrderId,
      handler: function (response: any) {
        logger.info({
          event: 'Razorpay payment capture successful',
          orderId: order.id,
          razorpayOrderId: response.razorpay_order_id,
        });
        onSuccess(response); // Send full response (order_id, payment_id, signature)
      },
      prefill: {
        name: order.shippingAddress.fullName,
        contact: order.shippingAddress.phone,
      },
      notes: {
        address: order.shippingAddress.addressLine1,
      },
      theme: {
        color: '#2F5FA7',
      },
      modal: {
        ondismiss: function () {
          setInternalLoading(false);
        },
      },
    };

    const rzp1 = new (window as any).Razorpay(options);
    rzp1.on('payment.failed', function (response: any) {
      logger.error({ event: 'Razorpay payment failed', error: response.error });
      setError(response.error.description);
      setInternalLoading(false);
    });
    rzp1.open();
  };

  const isLoading = externalLoading || internalLoading || !isScriptLoaded;

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-50 pb-6">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2F5FA7] flex items-center gap-2 mb-1">
            <CreditCard size={14} /> Total Payment
          </h3>
          <p className="text-2xl font-bold text-slate-900">
            ₹{order.total.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
            Including GST (18%)
          </span>
          <span className="text-[11px] font-bold text-slate-500">
            ₹{order.gst.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 animate-pulse">
          <AlertCircle className="text-red-500 w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-[11px] font-bold text-red-600 uppercase leading-snug">{error}</p>
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full bg-[#2F5FA7] hover:bg-[#1E3A66] disabled:opacity-40 shadow-xl text-white font-bold tracking-widest uppercase text-[11px] py-5 px-10 rounded-2xl transition-all transform active:scale-95 flex items-center justify-center gap-3"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            Initializing...
          </>
        ) : (
          <>
            <ShieldCheck size={18} /> Pay & Place Order
          </>
        )}
      </button>

      <div className="pt-4 flex items-center justify-center gap-6 opacity-40">
        <img
          src="https://razorpay.com/assets/razorpay-logo-white.svg"
          alt="Razorpay"
          className="h-4 grayscale invert"
        />
        <div className="h-4 w-px bg-slate-300" />
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          PCI-DSS Secure
        </span>
      </div>
    </div>
  );
}
