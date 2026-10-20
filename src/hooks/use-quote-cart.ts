'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AnyQuoteResult, QuoteCartItem } from '@/types/quoting';
import { logger } from '@/utils/logger';
import { nanoid } from 'nanoid';

const CART_STORAGE_KEY = 'mechhub_quote_cart';

/**
 * use-quote-cart — Manages a multi-part cart in localStorage.
 * Persists configured quotes across sessions.
 */
export function useQuoteCart() {
  const [items, setItems] = useState<QuoteCartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      logger.error({ event: 'Failed to load cart from localStorage', error: e });
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // 2. Sync to LocalStorage on Change
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      logger.error({ event: 'Failed to save cart to localStorage', error: e });
    }
  }, [items, isInitialized]);

  const addToCart = useCallback((quote: AnyQuoteResult, fileName: string) => {
    setItems((prev) => {
      // Deduplicate if the exact same quoteRef is added again
      if (prev.find((item) => item.quote.quoteRef === quote.quoteRef)) {
        return prev;
      }

      const newItem: QuoteCartItem = {
        id: `cart_${nanoid(8)}`,
        fileName,
        quote,
      };

      logger.info({ event: 'Added item to cart', quoteRef: quote.quoteRef, fileName });
      return [...prev, newItem];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setItems((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      logger.info({ event: 'Removed item from cart', itemId: id });
      return filtered;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    logger.info({ event: 'Cart cleared' });
  }, []);

  // ── Totals ──
  const subtotal = items.reduce((sum, item) => sum + item.quote.totalPrice, 0);
  const gst = subtotal * 0.18; // 18% GST for India
  const total = subtotal + gst;

  return {
    items,
    isInitialized,
    addToCart,
    removeFromCart,
    clearCart,
    totals: {
      subtotal,
      gst,
      total,
    },
    isEmpty: items.length === 0,
    itemCount: items.length,
  };
}
