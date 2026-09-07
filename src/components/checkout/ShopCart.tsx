'use client';

import React from 'react';
import { Trash2, Package, IndianRupee, Minus, Plus } from 'lucide-react';
import type { CartItem } from '@/context/CartContext';
import Image from 'next/image';

interface ShopCartProps {
  items: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  isLoading?: boolean;
}

/**
 * ShopCart — Displays the list of pre-defined shop products in the checkout flow.
 */
export function ShopCart({ items, onRemove, onUpdateQuantity, isLoading }: ShopCartProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <Package className="w-4 h-4 text-[#2F5FA7]" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2F5FA7]">
          {items.reduce((sum, i) => sum + i.quantity, 0)} PRODUCT{items.length > 1 ? 'S' : ''} IN
          CART
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-start gap-5">
              {/* Product Image */}
              <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <Package className="w-8 h-8 text-slate-300" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-slate-900 truncate uppercase tracking-tight">
                    {item.name}
                  </h4>
                  <button
                    onClick={() => onRemove(item.id)}
                    disabled={isLoading}
                    className="text-slate-300 hover:text-red-500 p-1 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 mt-3">
                  <div>
                    <span className="block text-[9px] font-bold text-blue-100 uppercase tracking-widest">
                      SKU
                    </span>
                    <span className="text-[11px] font-bold text-slate-700 font-mono tracking-widest">
                      {item.sku}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="text-blue-100 hover:text-[#2F5FA7] transition-colors"
                    >
                      <Minus size={12} strokeWidth={3} />
                    </button>
                    <span className="text-[11px] font-black text-slate-700 min-w-[20px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="text-blue-100 hover:text-[#2F5FA7] transition-colors"
                    >
                      <Plus size={12} strokeWidth={3} />
                    </button>
                  </div>

                  <div className="text-right ml-auto">
                    <span className="block text-[9px] font-bold text-blue-100 uppercase tracking-widest">
                      Price
                    </span>
                    <span className="text-[13px] font-bold text-[#2F5FA7]">
                      ₹{(item.salePrice * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
