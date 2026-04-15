'use client';

import { useState, useCallback } from 'react';
import {
  type ShippingAddress,
  type ShippingOption,
  SHIPPING_OPTIONS,
  type QuoteOrder,
} from '@/models/order.model';
import { type QuoteCartItem } from '@/types/quoting';
import { logger } from '@/utils/logger';
import { useRouter } from 'next/navigation';

export type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'success';

/**
 * use-quote-checkout — Manages the multi-step checkout process.
 * Coordinates between cart items, shipping details, and payment.
 */
export function useQuoteCheckout(
  cartItems: QuoteCartItem[],
  shopItems: any[],
  clearCart: () => void,
  clearShopCart: () => void,
  userId: string
) {
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption>(
    SHIPPING_OPTIONS[0]
  );
  const [order, setOrder] = useState<QuoteOrder | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<any>(null);

  const router = useRouter();

  const nextStep = useCallback(() => {
    if (step === 'cart') setStep('shipping');
    else if (step === 'shipping') setStep('payment');
    else if (step === 'payment') setStep('success');
  }, [step]);

  const prevStep = useCallback(() => {
    if (step === 'shipping') setStep('cart');
    else if (step === 'payment') setStep('shipping');
  }, [step]);

  const createOrder = useCallback(
    async (overridenAddress?: ShippingAddress) => {
      const addressToUse = overridenAddress || shippingAddress;
      if (!addressToUse || (cartItems.length === 0 && shopItems.length === 0)) return;

      setIsProcessing(true);
      setError(null);
      try {
        logger.info({
          event: 'Initiating order creation',
          itemCount: cartItems.length,
          shippingOptionId: selectedShippingOption.id,
        });

        const response = await fetch('/api/v1/order/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cartItems,
            shopItems: shopItems,
            shippingAddress: addressToUse,
            shippingOptionId: selectedShippingOption.id,
            userId,
          }),
        });

        let result;
        try {
          result = await response.json();
        } catch (e) {
          const text = await response.text();
          logger.error({
            event: 'Order API JSON parse failed',
            status: response.status,
            responseText: text.substring(0, 500),
          });
          throw new Error(`Invalid server response (${response.status})`);
        }

        if (!response.ok) {
          logger.warn({ event: 'Order API returned error', status: response.status, result });
          throw new Error(result.error?.message || 'Failed to create order');
        }

        setOrder({
          ...result.data,
          _serverRazorpayKey: result.razorpayKey // attaching dynamic key
        });
        logger.info({
          event: 'Order initiated via API',
          orderId: result.data.id,
          razorpayOrderId: result.data.razorpayOrderId,
        });
        setStep('payment');
      } catch (e: any) {
        logger.error({ event: 'Order initiation failed', error: e });
        setError(e);
      } finally {
        setIsProcessing(false);
      }
    },
    [cartItems, shippingAddress, selectedShippingOption, userId]
  );

  const submitShipping = useCallback(
    (address: ShippingAddress) => {
      setShippingAddress(address);
      logger.info({ event: 'Shipping address submitted', pincode: address.pincode });
      // Trigger creation immediately with the new address
      createOrder(address);
    },
    [createOrder]
  );

  const verifyPayment = useCallback(
    async (paymentData: any) => {
      if (!order) return;

      setIsVerifying(true);
      setError(null);
      try {
        logger.info({ event: 'Verifying payment signature', orderId: order.id });

        const response = await fetch('/api/v1/order/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...paymentData, // includes razorpay_order_id, razorpay_payment_id, razorpay_signature
            orderId: order.id,
            userId,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message || 'Payment verification failed');
        }

        logger.info({ event: 'Payment verified successfully', orderId: order.id });
        setStep('success');
        clearCart();
        clearShopCart();
      } catch (e: any) {
        logger.error({ event: 'Payment verification failed', error: e });
        setError(e);
      } finally {
        setIsVerifying(false);
      }
    },
    [order, userId, clearCart]
  );

  return {
    step,
    shippingAddress,
    selectedShippingOption,
    setSelectedShippingOption,
    order,
    isProcessing,
    isVerifying,
    error,
    nextStep,
    prevStep,
    submitShipping,
    createOrder,
    verifyPayment,
    shippingOptions: SHIPPING_OPTIONS,
  };
}
