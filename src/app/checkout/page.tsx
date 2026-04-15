'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { LandingNav } from '@/components/LandingNav';
import { Footer } from '@/components/Footer';
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

import { useQuoteCart } from '@/hooks/use-quote-cart';
import { useQuoteCheckout } from '@/hooks/use-quote-checkout';
import { SHIPPING_OPTIONS } from '@/models/order.model';
import { QuoteCart } from '@/components/checkout/QuoteCart';
import { ShippingForm } from '@/components/checkout/ShippingForm';
import { PaymentSection } from '@/components/checkout/PaymentSection';
import { OrderConfirmation } from '@/components/checkout/OrderConfirmation';
import { ShopCart } from '@/components/checkout/ShopCart';
import { Badge as UI_Badge } from '@/components/ui/badge';
import { resolveUserFriendlyMessage } from '@/lib/error-mapping';

export default function CheckoutPage() {
  const shopCart = useCart();
  const quoteCart = useQuoteCart();
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
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#2F5FA7] animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  // Handle empty state (Both carts empty)
  if (quoteCart.isEmpty && shopCart.totalItems === 0 && checkout.step !== 'success') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-8 border border-slate-100 shadow-sm">
          <ShoppingCart className="w-10 h-10 text-slate-300" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2 uppercase tracking-tight">
          Your cart is empty
        </h1>
        <p className="text-slate-400 mb-8 font-medium">Add some quotes or products to proceed.</p>
        <Link href="/quote/instant">
          <button className="bg-[#2F5FA7] hover:bg-[#1E3A66] text-white font-bold tracking-widest uppercase text-[11px] py-4 px-10 rounded-2xl transition-all shadow-lg active:scale-95">
            Start a New Design
          </button>
        </Link>
      </div>
    );
  }

  // Success State
  if (checkout.step === 'success' && checkout.order) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <LandingNav />
        <div className="pt-32 pb-20 px-4">
          <OrderConfirmation order={checkout.order} />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <LandingNav />

      <main className="container mx-auto px-4 pt-32 pb-20 max-w-7xl">
        {/* Header / Stepper */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-4 bg-blue-50 px-4 py-2 rounded-full">
            <ShieldCheck className="w-4 h-4 text-[#2F5FA7]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#2F5FA7]">
              Secure Checkout Profile
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter mb-4">
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
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${checkout.step === s.id
                        ? 'bg-[#2F5FA7] border-[#2F5FA7] text-white shadow-lg'
                        : i < ['cart', 'shipping', 'payment'].indexOf(checkout.step)
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'bg-white border-slate-200 text-slate-300'
                      }`}
                  >
                    <span className="text-[10px] font-black">{i + 1}</span>
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-widest ${checkout.step === s.id ? 'text-[#2F5FA7]' : 'text-slate-400'}`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < 2 && <div className="h-0.5 w-12 bg-slate-100 rounded-full mb-5" />}
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
                  className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-[#2F5FA7] transition-colors mb-6"
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
                  className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-[#2F5FA7] transition-colors mb-6"
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
              <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center space-y-6">
                <Loader2 className="w-10 h-10 text-[#2F5FA7] animate-spin mx-auto" />
                <p className="text-slate-500 font-medium">Finalizing order details...</p>
                <button
                  onClick={() => checkout.createOrder()}
                  className="bg-[#2F5FA7] text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-[11px]"
                >
                  Try again
                </button>
              </div>
            )}
          </div>

          {/* Right: Summary Sidebar */}
          <div className="lg:w-[400px] w-full sticky top-32">
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-blue-900/5 space-y-8">
              <h3 className="text-[10px] font-bold text-[#2F5FA7] uppercase tracking-[0.2em] flex items-center gap-2">
                <Package size={14} /> Order Summary
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Subtotal
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    ₹{combinedSubtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-emerald-600">
                  <span className="text-[11px] font-bold uppercase tracking-widest">Shipping</span>
                  <span className="text-sm font-bold">
                    {checkout.selectedShippingOption.price === 0
                      ? 'FREE'
                      : `₹${checkout.selectedShippingOption.price}`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    GST (18%)
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    ₹{combinedGst.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <Separator className="bg-slate-50" />

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[12px] font-bold text-slate-900 uppercase tracking-widest">
                    Total
                  </span>
                  <span className="text-3xl font-black text-[#2F5FA7] tracking-tighter">
                    ₹
                    {(combinedTotal + checkout.selectedShippingOption.price).toLocaleString(
                      'en-IN'
                    )}
                  </span>
                </div>
                <p className="text-[9px] text-slate-300 font-bold uppercase text-right tracking-widest">
                  Gross Inc. Logistics
                </p>
              </div>

              {checkout.step === 'cart' && (
                <button
                  onClick={checkout.nextStep}
                  disabled={quoteCart.isEmpty && shopCart.totalItems === 0}
                  className="w-full bg-[#2F5FA7] hover:bg-[#1E3A66] disabled:opacity-40 text-white font-bold tracking-widest uppercase text-[11px] py-5 rounded-2xl transition-all shadow-xl shadow-blue-900/10 flex items-center justify-center gap-3 active:scale-95"
                >
                  Proceed to Shipping <ArrowRight size={14} />
                </button>
              )}

              {/* Trust Badge */}
              <div className="flex items-center gap-3 pt-4 opacity-50 justify-center">
                <ShieldCheck size={16} className="text-[#2F5FA7]" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Industrial Encryption
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

declare global {
  interface Window {
    Razorpay: any;
  }
}
