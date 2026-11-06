'use client';

import React from 'react';
import { FileCode, Stack, Trash } from '@phosphor-icons/react/dist/ssr';
import type { QuoteCartItem } from '@/types/quoting';
import { getMaterialName } from '@/lib/quoting/materials';
import { isCncQuote } from '@/lib/quoting/pricing-engine';
import { CNC_PROCESS_LABELS } from '@/lib/quoting/cnc-materials';

interface QuoteCartProps {
  items: QuoteCartItem[];
  onRemove: (id: string) => void;
  isLoading?: boolean;
}

/** QuoteCart — the configured custom parts in the checkout, one spec card per part. */
export function QuoteCart({ items, onRemove, isLoading }: QuoteCartProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-lp-border p-8 text-center">
        <Stack aria-hidden="true" className="mx-auto size-8 text-lp-muted-fg" weight="duotone" />
        <h3 className="title-3 mt-4">No custom parts yet</h3>
        <p className="body-6 mt-1 text-lp-muted-fg">Upload a STEP file to add a quoted part to your order.</p>
      </div>
    );
  }

  return (
    <section aria-labelledby="quote-cart-heading">
      <h2 id="quote-cart-heading" className="lp-mono flex items-center gap-2 text-lp-muted-fg">
        <Stack aria-hidden="true" className="size-4 text-lp-primary" weight="bold" />
        {items.length} custom {items.length > 1 ? 'parts' : 'part'}
      </h2>

      <ul className="mt-4 space-y-2">
        {items.map((item) => {
          const materialName = getMaterialName(item.quote.parameters.materialId);
          const spec = isCncQuote(item.quote)
            ? { label: 'Process', value: CNC_PROCESS_LABELS[item.quote.process] }
            : { label: 'Thickness', value: `${item.quote.parameters.thicknessMm} mm` };

          return (
            <li key={item.id} className="rounded-2xl border border-lp-border bg-lp-bg p-4 transition-colors duration-300 ease-lp hover:border-lp-primary/30 md:p-6">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-lp-primary/10 text-lp-primary">
                  <FileCode aria-hidden="true" className="size-6" weight="duotone" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="title-3 truncate">{item.fileName}</h3>
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      disabled={isLoading}
                      aria-label={`Remove ${item.fileName}`}
                      className="lp-press flex size-8 shrink-0 items-center justify-center rounded-full text-lp-muted-fg hover:bg-lp-destructive/10 hover:text-lp-destructive"
                    >
                      <Trash aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      ['Material', materialName],
                      [spec.label, spec.value],
                      ['Quantity', `${item.quote.parameters.quantity} pcs`],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="lp-mono text-lp-muted-fg">{k}</dt>
                        <dd className="caption-1 mt-1">{v}</dd>
                      </div>
                    ))}
                    <div className="sm:text-right">
                      <dt className="lp-mono text-lp-muted-fg">Price</dt>
                      <dd className="title-3 lp-num mt-1 text-lp-primary">₹{item.quote.totalPrice.toLocaleString('en-IN')}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
