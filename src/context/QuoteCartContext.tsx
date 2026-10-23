'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { AnyQuoteResult, QuoteCartItem } from '@/types/quoting';
import { nanoid } from 'nanoid';

const CART_STORAGE_KEY = 'mechhub_quote_cart';

interface QuoteCartContextType {
  items: QuoteCartItem[];
  isInitialized: boolean;
  addToCart: (quote: AnyQuoteResult, fileName: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  totals: { subtotal: number; gst: number; total: number };
  isEmpty: boolean;
  itemCount: number;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
}

const QuoteCartContext = createContext<QuoteCartContextType | undefined>(undefined);

export function QuoteCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QuoteCartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      // ignore
    } finally {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, isInitialized]);

  const addToCart = useCallback((quote: AnyQuoteResult, fileName: string) => {
    setItems((prev) => {
      if (prev.find((item) => item.quote.quoteRef === quote.quoteRef)) {
        return prev;
      }
      const newItem: QuoteCartItem = {
        id: `cart_${nanoid(8)}`,
        fileName,
        quote,
      };
      return [...prev, newItem];
    });
    setIsDrawerOpen(true);
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.quote.totalPrice, 0);
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  return (
    <QuoteCartContext.Provider
      value={{
        items,
        isInitialized,
        addToCart,
        removeFromCart,
        clearCart,
        totals: { subtotal, gst, total },
        isEmpty: items.length === 0,
        itemCount: items.length,
        isDrawerOpen,
        setIsDrawerOpen,
      }}
    >
      {children}
    </QuoteCartContext.Provider>
  );
}

export function useQuoteCartContext() {
  const context = useContext(QuoteCartContext);
  if (!context) {
    throw new Error('useQuoteCartContext must be used within a QuoteCartProvider');
  }
  return context;
}
