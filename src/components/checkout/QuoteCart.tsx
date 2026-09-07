'use client';

import React from 'react';
import { Trash2, FileText, IndianRupee, Layers } from 'lucide-react';
import type { QuoteCartItem } from '@/types/quoting';
import { getMaterialById } from '@/lib/quoting/materials';

interface QuoteCartProps {
  items: QuoteCartItem[];
  onRemove: (id: string) => void;
  isLoading?: boolean;
}

/**
 * QuoteCart — Displays the list of configured parts in the checkout flow.
 * Shows premium breakdown for each part.
 */
export function QuoteCart({ items, onRemove, isLoading }: QuoteCartProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Layers className="text-slate-300 w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2 uppercase tracking-tight">
          Your cart is empty
        </h3>
        <p className="text-blue-100 text-sm font-medium">
          Add some designs to your cart to proceed with an order.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <Layers className="w-4 h-4 text-[#2F5FA7]" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2F5FA7]">
          {items.length} PART{items.length > 1 ? 'S' : ''} IN CART
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const material = getMaterialById(item.quote.parameters.materialId);

          return (
            <div
              key={item.id}
              className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-start gap-5">
                {/* Part Icon/Preview */}
                <div className="w-16 h-16 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-center shrink-0">
                  <FileText className="w-8 h-8 text-[#2F5FA7]" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-slate-900 truncate uppercase tracking-tight">
                      {item.fileName}
                    </h4>
                    <button
                      onClick={() => onRemove(item.id)}
                      disabled={isLoading}
                      className="text-slate-300 hover:text-red-500 p-1 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
                    <div>
                      <span className="block text-[9px] font-bold text-blue-100 uppercase tracking-widest">
                        Material
                      </span>
                      <span className="text-[11px] font-bold text-slate-700">{material?.name}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-blue-100 uppercase tracking-widest">
                        Thickness
                      </span>
                      <span className="text-[11px] font-bold text-slate-700">
                        {item.quote.parameters.thicknessMm}mm
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-blue-100 uppercase tracking-widest">
                        Quantity
                      </span>
                      <span className="text-[11px] font-bold text-slate-700">
                        {item.quote.parameters.quantity} pcs
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[9px] font-bold text-blue-100 uppercase tracking-widest">
                        Price
                      </span>
                      <span className="text-[13px] font-bold text-[#2F5FA7]">
                        ₹{item.quote.totalPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
