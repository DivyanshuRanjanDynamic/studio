'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { V2Shell } from '@/components/V2Shell';
import '@/components/home/landing.css';
import { landingFontVars } from '@/components/home/fonts';
import { cn } from '@/utils';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  MapPin,
  Package,
  ShoppingCart,
  ArrowRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useQuoteCartContext } from '@/context/QuoteCartContext';
import { useQuoteCheckout } from '@/hooks/use-quote-checkout';
import { SHIPPING_OPTIONS } from '@/models/order.model';
import { QuoteCart } from '@/components/checkout/QuoteCart';
import { ShippingForm } from '@/components/checkout/ShippingForm';
import { PaymentSection } from '@/components/checkout/PaymentSection';
import { OrderConfirmation } from '@/components/checkout/OrderConfirmation';
import { ShopCart } from '@/components/checkout/ShopCart';
import { Badge as UI_Badge } from '@/components/ui/badge';
import { resolveUserFriendlyMessage } from '@/lib/error-mapping';
import { AccountLoader } from '@/components/PageLoaders';

export default function CheckoutPage() {
  const shopCart = useCart();
  const quoteCart = useQuoteCartContext();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const checkout = useQuoteCheckout(
    quoteCart.items,
    shopCart.items,
    quoteCart.clearCart,
    shopCart.clearCart,
    user?.uid || ''
  );

  // Combine totals for the UI
  const totalShopSubtotal = shopCart.totalPrice || 0;
  const totalQuoteSubtotal = quoteCart.totals.subtotal || 0;
  const combinedSubtotal = totalShopSubtotal + totalQuoteSubtotal;

  const combinedGst = Math.round(combinedSubtotal * 0.18);
  const combinedTotal = combinedSubtotal + combinedGst;

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/checkout');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (checkout.error) {
      const msg = resolveUserFriendlyMessage(checkout.error);
      if (msg) {
        toast({
          title: msg.title,
          description: msg.description,
          variant: msg.variant,
        });
      }
    }
  }, [checkout.error, toast]);

  if (isUserLoading || !quoteCart.isInitialized) {
    return <AccountLoader />;
  }

  if (!user) return null;

  // Handle empty state (Both carts empty)
  if (quoteCart.isEmpty && shopCart.totalItems === 0 && checkout.step !== 'success') {
    return (
      <div className={cn('lp-root min-h-screen bg-lp-bg flex flex-col items-center justify-center p-4', landingFontVars)}>
        <div className="w-20 h-20 rounded-sm bg-lp-card flex items-center justify-center mb-8 border border-lp-border">
          <ShoppingCart className="w-10 h-10 text-lp-muted-fg/40" />
        </div>
        <h1 className="text-2xl font-medium text-lp-fg mb-2 tracking-tight">
          Your cart is empty
        </h1>
        <p className="text-lp-muted-fg mb-8">Add some quotes or products to proceed.</p>
        <Link href="/quote/instant">
          <button className="lp-label-mono bg-lp-primary text-lp-primary-fg py-4 px-10 rounded-sm transition-all active:scale-[0.98] hover:bg-lp-primary/90">
            Start a New Design
          </button>
        </Link>
      </div>
    );
  }

  // Success State
  if (checkout.step === 'success' && checkout.order) {
    return (
      <V2Shell>
        <div className="pb-20 px-4">
          <OrderConfirmation order={checkout.order} />
        </div>
      </V2Shell>
    );
  }

  return (
    <V2Shell>
      <main className="container mx-auto px-4 pb-20 max-w-7xl">
        {/* Header / Stepper */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-4 bg-lp-accent px-4 py-2 rounded-sm">
            <ShieldCheck className="w-4 h-4 text-lp-primary" />
            <span className="lp-label-mono text-lp-primary">
              Secure Checkout Profile
            </span>
          </div>
          <h1 className="text-4xl font-medium text-lp-fg tracking-tight mb-4">
            Complete Your Order
          </h1>

          {/* Visual Stepper */}
          <div className="flex items-center justify-center gap-4 max-w-md mx-auto mt-8">
            {[
              { id: 'cart', label: 'Cart' },
              { id: 'shipping', label: 'Shipping' },
              { id: 'payment', label: 'Payment' },
            ].map((s, i) => (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-sm flex items-center justify-center border-2 transition-all duration-500 ${checkout.step === s.id
                        ? 'bg-lp-primary border-lp-primary text-lp-primary-fg'
                        : i < ['cart', 'shipping', 'payment'].indexOf(checkout.step)
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-lp-card border-lp-border text-lp-muted-fg/40'
                      }`}
                  >
                    <span className="text-[10px] font-semibold">{i + 1}</span>
                  </div>
                  <span
                    className={`lp-label-mono ${checkout.step === s.id ? 'text-lp-primary' : 'text-lp-muted-fg'}`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < 2 && <div className="h-0.5 w-12 bg-lp-border mb-5" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left: Step Content */}
          <div className="flex-1 w-full space-y-8">
            {checkout.step === 'cart' && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-8">
                {!quoteCart.isEmpty && (
                  <QuoteCart items={quoteCart.items} onRemove={quoteCart.removeFromCart} />
                )}

                {shopCart.totalItems > 0 && (
                  <ShopCart
                    items={shopCart.items}
                    onRemove={shopCart.removeItem}
                    onUpdateQuantity={shopCart.updateQuantity}
                  />
                )}
              </div>
            )}

            {checkout.step === 'shipping' && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <button
                  onClick={checkout.prevStep}
                  className="flex items-center gap-2 lp-label-mono text-lp-muted-fg hover:text-lp-primary transition-colors mb-6"
                >
                  <ChevronLeft size={14} /> Back to Cart
                </button>
                <ShippingForm
                  onSubmit={checkout.submitShipping}
                  isLoading={checkout.isProcessing}
                />
              </div>
            )}

            {checkout.step === 'payment' && checkout.order && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <button
                  onClick={checkout.prevStep}
                  className="flex items-center gap-2 lp-label-mono text-lp-muted-fg hover:text-lp-primary transition-colors mb-6"
                >
                  <ChevronLeft size={14} /> Back to Shipping
                </button>
                <PaymentSection
                  order={checkout.order}
                  onSuccess={(data) => checkout.verifyPayment(data)}
                  isLoading={checkout.isVerifying}
                />
              </div>
            )}

            {/* Fallback for payment if order not yet created but on payment step */}
            {checkout.step === 'payment' && !checkout.order && (
              <div className="bg-lp-card border border-lp-border rounded-sm p-12 text-center space-y-6">
                <Loader2 className="w-10 h-10 text-lp-primary animate-spin mx-auto" />
                <p className="text-lp-muted-fg">Finalizing order details...</p>
                <button
                  onClick={() => checkout.createOrder()}
                  className="lp-label-mono bg-lp-primary text-lp-primary-fg px-8 py-4 rounded-sm"
                >
                  Try again
                </button>
              </div>
            )}
          </div>

          {/* Right: Summary Sidebar */}
          <div className="lg:w-[400px] w-full sticky top-32">
            <div className="bg-lp-card border border-lp-border rounded-sm p-8 space-y-8">
              <h3 className="lp-label-mono text-lp-primary flex items-center gap-2">
                <Package size={14} /> Order Summary
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="lp-label-mono text-lp-muted-fg">
                    Subtotal
                  </span>
                  <span className="text-sm font-medium text-lp-fg">
                    ₹{combinedSubtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-emerald-600">
                  <span className="lp-label-mono">Shipping</span>
                  <span className="text-sm font-medium">
                    {checkout.selectedShippingOption.price === 0
                      ? 'FREE'
                      : `₹${checkout.selectedShippingOption.price}`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="lp-label-mono text-lp-muted-fg">
                    GST (18%)
                  </span>
                  <span className="text-sm font-medium text-lp-fg">
                    ₹{combinedGst.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <Separator className="bg-lp-border" />

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="lp-label-mono text-lp-fg">
                    Total
                  </span>
                  <span className="text-3xl font-medium text-lp-primary tracking-tight">
                    ₹
                    {(combinedTotal + checkout.selectedShippingOption.price).toLocaleString(
                      'en-IN'
                    )}
                  </span>
                </div>
                <p className="lp-label-mono text-lp-muted-fg/60 text-right">
                  Gross Inc. Logistics
                </p>
              </div>

              {checkout.step === 'cart' && (
                <button
                  onClick={checkout.nextStep}
                  disabled={quoteCart.isEmpty && shopCart.totalItems === 0}
                  className="w-full lp-label-mono bg-lp-primary hover:bg-lp-primary/90 disabled:opacity-40 text-lp-primary-fg py-5 rounded-sm transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  Proceed to Shipping <ArrowRight size={14} />
                </button>
              )}

              {/* Trust Badge */}
              <div className="flex items-center gap-3 pt-4 opacity-50 justify-center">
                <ShieldCheck size={16} className="text-lp-primary" />
                <span className="lp-label-mono text-lp-muted-fg">
                  Industrial Encryption
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </V2Shell>
  );
}

declare global {
  interface Window {
    Razorpay: any;
  }
}
