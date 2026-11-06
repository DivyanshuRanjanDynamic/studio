'use client';

import React from 'react';
import Image from 'next/image';
import { Minus, Package, Plus, Trash } from '@phosphor-icons/react/dist/ssr';
import type { CartItem } from '@/context/CartContext';

interface ShopCartProps {
  items: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  isLoading?: boolean;
}

/** ShopCart — ready made shop products in the checkout, with quantity controls. */
export function ShopCart({ items, onRemove, onUpdateQuantity, isLoading }: ShopCartProps) {
  if (items.length === 0) return null;
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <section aria-labelledby="shop-cart-heading">
      <h2 id="shop-cart-heading" className="lp-mono flex items-center gap-2 text-lp-muted-fg">
        <Package aria-hidden="true" className="size-4 text-lp-primary" weight="bold" />
        {count} shop {count > 1 ? 'products' : 'product'}
      </h2>

      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="rounded-2xl border border-lp-border bg-lp-bg p-4 transition-colors duration-300 ease-lp hover:border-lp-primary/30 md:p-6">
            <div className="flex items-start gap-4">
              <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-lp-muted">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                ) : (
                  <Package aria-hidden="true" className="size-6 text-lp-muted-fg" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="title-3 truncate">{item.name}</h3>
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    disabled={isLoading}
                    aria-label={`Remove ${item.name}`}
                    className="lp-press flex size-8 shrink-0 items-center justify-center rounded-full text-lp-muted-fg hover:bg-lp-destructive/10 hover:text-lp-destructive"
                  >
                    <Trash aria-hidden="true" className="size-4" />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="lp-mono text-lp-muted-fg">SKU</p>
                    <p className="caption-1 lp-num mt-1">{item.sku}</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-lp-border p-1" role="group" aria-label={`Quantity of ${item.name}`}>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="lp-press flex size-8 items-center justify-center rounded-full hover:bg-lp-muted"
                    >
                      <Minus aria-hidden="true" className="size-3" weight="bold" />
                    </button>
                    <span className="title-4 lp-num w-8 text-center" aria-live="polite">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                      className="lp-press flex size-8 items-center justify-center rounded-full hover:bg-lp-muted"
                    >
                      <Plus aria-hidden="true" className="size-3" weight="bold" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="lp-mono text-lp-muted-fg">Price</p>
                    <p className="title-3 lp-num mt-1 text-lp-primary">₹{(item.salePrice * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
