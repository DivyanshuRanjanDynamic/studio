'use client';

import React, { createContext, useCallback, useContext, useState, useEffect, ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useUser } from '@/firebase/provider';

// Firestore sync for signed-in users, loaded on demand (see CartCloudSync).
const CartCloudSync = dynamic(() => import('./CartCloudSync'), { ssr: false });

export interface CartItem {
  id: string;
  name: string;
  salePrice: number;
  basePrice: number;
  quantity: number;
  image?: string;
  sku: string;
  inventory: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  totalSavings: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useUser();

  // 1. Load from local storage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('mechhub_cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      } catch (e) {
        console.error('Failed to parse cart from local storage', e);
      }
    }
    if (!user) setIsInitialized(true);
  }, [user]);

  // 2. Sync with local storage
  useEffect(() => {
    localStorage.setItem('mechhub_cart', JSON.stringify(items));
  }, [items]);

  // 3. Signed-in users: CartCloudSync loads the saved cart once, then writes changes back.
  // The saved cart only replaces an empty local cart.
  const handleCloudCart = useCallback((cloudCart: CartItem[] | null) => {
    if (cloudCart) setItems((prev) => (prev.length === 0 ? cloudCart : prev));
    setIsInitialized(true);
  }, []);

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === newItem.id);
      if (existing) {
        const totalQuantity = existing.quantity + newItem.quantity;
        const cappedQuantity = Math.min(totalQuantity, newItem.inventory);
        return prev.map((i) => (i.id === newItem.id ? { ...i, quantity: cappedQuantity } : i));
      }
      return [...prev, { ...newItem, quantity: Math.min(newItem.quantity, newItem.inventory) }];
    });
    setIsCartOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          return { ...i, quantity: Math.min(quantity, i.inventory) };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.quantity * (item.salePrice || 0), 0);
  const totalSavings = items.reduce((sum, item) => {
    const savings = (item.basePrice || item.salePrice || 0) - (item.salePrice || 0);
    return sum + item.quantity * Math.max(0, savings);
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        totalSavings,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {user && (
        <CartCloudSync
          uid={user.uid}
          items={items}
          isInitialized={isInitialized}
          onCloudCart={handleCloudCart}
        />
      )}
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
