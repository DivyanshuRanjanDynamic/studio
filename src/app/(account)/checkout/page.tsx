'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { V2Shell } from '@/components/V2Shell';
import { cn } from '@/utils';
import {
  ArrowRight,
  CaretLeft,
  Check,
  LockKey,
  Receipt,
  ShieldCheck,
  ShoppingCartSimple,
  Truck,
} from '@phosphor-icons/react/dist/ssr';
import { useToast } from '@/hooks/use-toast';
import { Accent, Tag } from '@/components/home/primitives';
import { buttonClass } from '@/components/home/button';
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

  const steps = [
    { id: 'cart', label: 'Review' },
    { id: 'shipping', label: 'Delivery' },
    { id: 'payment', label: 'Payment' },
  ] as const;
  const stepIndex = steps.findIndex((s) => s.id === checkout.step);
  const shippingPrice = checkout.selectedShippingOption.price;

  // Handle empty state (Both carts empty)
  if (quoteCart.isEmpty && shopCart.totalItems === 0 && checkout.step !== 'success') {
    return (
      <V2Shell>
        <section className="px-4 py-16 md:py-24">
          <div className="lp-hero-in mx-auto max-w-[480px] text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-lp-primary/10 text-lp-primary">
              <ShoppingCartSimple aria-hidden="true" className="size-8" weight="duotone" />
            </span>
            <h1 className="heading-4 mt-6">
              Your cart is <Accent>empty</Accent>
            </h1>
            <p className="body-6 mt-2 text-lp-muted-fg">
              Upload a STEP file to get an instant quote, or pick a ready made part from the shop.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
              <Link href="/quote/instant" className={buttonClass('primary')}>
                Get an instant quote
                <ArrowRight aria-hidden="true" className="size-4" weight="bold" />
              </Link>
              <Link href="/shop" className={buttonClass('secondary')}>
                Browse the shop
              </Link>
            </div>
          </div>
        </section>
      </V2Shell>
    );
  }

  // Success State
  if (checkout.step === 'success' && checkout.order) {
    return (
      <V2Shell>
        <div className="px-4 pb-16 md:pb-24">
          <OrderConfirmation order={checkout.order} />
        </div>
      </V2Shell>
    );
  }

  return (
    <V2Shell>
      <div className="px-4 pb-16 pt-8 md:pb-24 md:pt-16">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <Tag>Checkout</Tag>
              <h1 className="heading-2 mt-4">
                Complete your <Accent>order</Accent>
              </h1>
            </div>

            <ol className="flex items-center gap-2" aria-label="Checkout progress">
              {steps.map((s, i) => {
                const done = i < stepIndex;
                const current = i === stepIndex;
                return (
                  <li key={s.id} className="flex items-center gap-2" aria-current={current ? 'step' : undefined}>
                    <span
                      className={cn(
                        'lp-mono flex size-8 items-center justify-center rounded-full border',
                        current
                          ? 'border-lp-primary bg-lp-primary text-lp-primary-fg'
                          : done
                            ? 'border-lp-primary bg-lp-primary/10 text-lp-primary'
                            : 'border-lp-border text-lp-muted-fg'
                      )}
                    >
                      {done ? <Check aria-hidden="true" className="size-4" weight="bold" /> : i + 1}
                    </span>
                    <span className={cn('caption-1', current ? 'text-lp-fg' : 'text-lp-muted-fg')}>{s.label}</span>
                    {i < steps.length - 1 && <span aria-hidden="true" className="h-px w-6 bg-lp-border md:w-12" />}
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="mt-12 grid items-start gap-8 lg:grid-cols-[1fr_400px]">
            <div className="min-w-0 space-y-8">
              {checkout.step === 'cart' && (
                <div className="lp-hero-in space-y-8">
                  {!quoteCart.isEmpty && <QuoteCart items={quoteCart.items} onRemove={quoteCart.removeFromCart} />}
                  {shopCart.totalItems > 0 && (
                    <ShopCart items={shopCart.items} onRemove={shopCart.removeItem} onUpdateQuantity={shopCart.updateQuantity} />
                  )}
                </div>
              )}

              {checkout.step === 'shipping' && (
                <div className="lp-hero-in">
                  <BackButton onClick={checkout.prevStep}>Back to review</BackButton>
                  <ShippingForm onSubmit={checkout.submitShipping} isLoading={checkout.isProcessing} />
                </div>
              )}

              {checkout.step === 'payment' && checkout.order && (
                <div className="lp-hero-in">
                  <BackButton onClick={checkout.prevStep}>Back to delivery</BackButton>
                  <PaymentSection order={checkout.order} onSuccess={(data) => checkout.verifyPayment(data)} isLoading={checkout.isVerifying} />
                </div>
              )}

              {/* Fallback for payment if order not yet created but on payment step */}
              {checkout.step === 'payment' && !checkout.order && (
                <div className="rounded-2xl border border-lp-border bg-lp-bg p-6 md:p-8" role="status">
                  <div className="space-y-4" aria-hidden="true">
                    <div className="h-4 w-32 animate-pulse rounded bg-lp-muted" />
                    <div className="h-10 w-48 animate-pulse rounded-lg bg-lp-muted" />
                    <div className="h-12 animate-pulse rounded-full bg-lp-primary/20" />
                  </div>
                  <p className="body-6 mt-6 text-lp-muted-fg">Preparing your order for payment.</p>
                  <button type="button" onClick={() => checkout.createOrder()} className={cn(buttonClass('secondary'), 'mt-4')}>
                    Try again
                  </button>
                </div>
              )}
            </div>

            {/* Order summary */}
            <aside aria-labelledby="summary-heading" className="lg:sticky lg:top-24">
              <div className="rounded-2xl border border-lp-border bg-lp-card p-6 md:p-8">
                <h2 id="summary-heading" className="heading-6 flex items-center gap-2">
                  <Receipt aria-hidden="true" className="size-5 text-lp-primary" weight="duotone" />
                  Order summary
                </h2>

                <dl className="mt-6 space-y-3">
                  {totalQuoteSubtotal > 0 && (
                    <div className="flex justify-between gap-4">
                      <dt className="body-6 text-lp-muted-fg">Custom parts</dt>
                      <dd className="body-5 lp-num">₹{totalQuoteSubtotal.toLocaleString('en-IN')}</dd>
                    </div>
                  )}
                  {totalShopSubtotal > 0 && (
                    <div className="flex justify-between gap-4">
                      <dt className="body-6 text-lp-muted-fg">Shop products</dt>
                      <dd className="body-5 lp-num">₹{totalShopSubtotal.toLocaleString('en-IN')}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <dt className="body-6 text-lp-muted-fg">Shipping</dt>
                    <dd className={cn('body-5 lp-num', shippingPrice === 0 && 'text-lp-primary')}>
                      {shippingPrice === 0 ? 'Free' : `₹${shippingPrice.toLocaleString('en-IN')}`}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="body-6 text-lp-muted-fg">GST (18%)</dt>
                    <dd className="body-5 lp-num">₹{combinedGst.toLocaleString('en-IN')}</dd>
                  </div>
                </dl>

                <div className="mt-6 flex items-end justify-between gap-4 border-t border-lp-border pt-6">
                  <span className="title-3">Total</span>
                  <span className="heading-4 lp-num text-lp-primary">₹{(combinedTotal + shippingPrice).toLocaleString('en-IN')}</span>
                </div>
                <p className="caption-5 mt-1 text-right text-lp-muted-fg">Including GST and shipping</p>

                {checkout.step === 'cart' && (
                  <button
                    type="button"
                    onClick={checkout.nextStep}
                    disabled={quoteCart.isEmpty && shopCart.totalItems === 0}
                    className={cn(buttonClass('primary', 'md', true), 'mt-6 w-full justify-between disabled:opacity-60')}
                  >
                    Continue to delivery
                    <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-lp-primary-fg/15">
                      <ArrowRight className="size-4" weight="bold" />
                    </span>
                  </button>
                )}

                <ul className="mt-6 space-y-2 border-t border-lp-border pt-6">
                  {[
                    { icon: LockKey, label: 'NDA on every file' },
                    { icon: ShieldCheck, label: 'Payments by Razorpay' },
                    { icon: Truck, label: 'Delivered across India' },
                  ].map(({ icon: Icon, label }) => (
                    <li key={label} className="caption-1 flex items-center gap-2 text-lp-muted-fg">
                      <Icon aria-hidden="true" className="size-4 text-lp-primary" weight="bold" />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </V2Shell>
  );
}

function BackButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="caption-1 mb-6 flex items-center gap-2 rounded-full px-2 py-1 text-lp-muted-fg transition-colors duration-300 ease-lp hover:bg-lp-muted hover:text-lp-fg"
    >
      <CaretLeft aria-hidden="true" className="size-4" weight="bold" />
      {children}
    </button>
  );
}

declare global {
  interface Window {
    Razorpay: any;
  }
}
