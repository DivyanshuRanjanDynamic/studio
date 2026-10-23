'use client';

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useQuoteCartContext } from '@/context/QuoteCartContext';
import { useCart } from '@/context/CartContext';
import {
  ShoppingBag,
  Trash2,
  FileText,
  ArrowRight,
  Package,
  Layers,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { landingFontVars } from '@/components/home/fonts';
import '@/components/home/landing.css';
import { cn } from '@/utils';
import { getMaterialName } from '@/lib/quoting/materials';
import { isCncQuote } from '@/lib/quoting/pricing-engine';
import { CNC_PROCESS_LABELS } from '@/lib/quoting/cnc-materials';

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export function QuoteCartDrawer() {
  const {
    items,
    removeFromCart,
    clearCart,
    totals,
    itemCount,
    isDrawerOpen,
    setIsDrawerOpen,
  } = useQuoteCartContext();
  const shopCart = useCart();

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <SheetContent
        className={cn(
          'lp-root w-full sm:max-w-md bg-lp-bg border-l border-lp-border text-lp-fg flex flex-col p-0 overflow-hidden outline-none shadow-2xl',
          landingFontVars
        )}
      >
        {/* Header */}
        <div className="p-5 pb-3 border-b border-lp-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm bg-lp-accent flex items-center justify-center border border-lp-border">
                <Layers className="w-4 h-4 text-lp-primary" />
              </div>
              <div>
                <SheetTitle className="text-lg font-medium tracking-tight text-lp-fg leading-none font-lp-sans">
                  Manufact<span className="font-lp-serif italic">uring</span> Cart
                </SheetTitle>
                <p className="lp-label-mono text-lp-muted-fg mt-1">
                  Configured parts
                </p>
              </div>
            </div>
          </div>

          {/* Cart type switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-lp-accent rounded-sm border border-lp-border">
            <button
              onClick={() => {
                setIsDrawerOpen(false);
                setTimeout(() => shopCart.setIsCartOpen(true), 150);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-sm lp-label-mono text-lp-muted-fg hover:text-lp-fg hover:bg-lp-card/50 transition-colors text-[10px]"
            >
              <ShoppingBag className="w-3 h-3" />
              Procurement {shopCart.totalItems > 0 && `(${shopCart.totalItems})`}
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-sm bg-lp-card border border-lp-border shadow-sm lp-label-mono text-lp-primary text-[10px]"
            >
              <Layers className="w-3 h-3" />
              Manufacturing {itemCount > 0 && `(${itemCount})`}
            </button>
          </div>
        </div>

        {/* Actions bar */}
        {items.length > 0 && (
          <>
            <div className="px-5 py-2.5 flex items-center justify-between">
              <button
                onClick={clearCart}
                className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-lp-destructive/20 bg-lp-destructive/5 lp-label-mono text-lp-destructive hover:bg-lp-destructive/10 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear all
              </button>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-lp-accent border border-lp-border">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="lp-label-mono text-lp-muted-fg">Priced live</span>
              </div>
            </div>
            <div className="h-px bg-lp-border mx-5" />
          </>
        )}

        {/* Items */}
        <div className="flex-1 overflow-hidden">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-sm bg-lp-accent flex items-center justify-center mb-5 border border-lp-border">
                <Package className="w-8 h-8 text-lp-muted-fg/40" />
              </div>
              <h3 className="text-lg font-medium text-lp-fg mb-1.5">No parts yet</h3>
              <p className="text-sm text-lp-muted-fg max-w-[260px] leading-relaxed">
                Configure a part in the Instant Quote tool and add it to your cart.
              </p>
              <Link
                href="/quote/instant"
                className="mt-6 h-11 px-8 rounded-sm bg-lp-primary text-lp-primary-fg lp-label-mono hover:bg-lp-primary/90 transition-colors inline-flex items-center"
                onClick={() => setIsDrawerOpen(false)}
              >
                Start quoting
              </Link>
            </div>
          ) : (
            <ScrollArea className="h-full px-5">
              <div className="py-4 space-y-3">
                {items.map((item) => {
                  const materialName = getMaterialName(item.quote.parameters.materialId);
                  const isCnc = isCncQuote(item.quote);
                  const spec = isCnc
                    ? CNC_PROCESS_LABELS[item.quote.process]
                    : `${item.quote.parameters.thicknessMm}mm`;

                  return (
                    <div
                      key={item.id}
                      className="group p-4 rounded-sm border border-lp-border bg-lp-card hover:border-lp-primary/40 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-sm bg-lp-accent border border-lp-border flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-lp-primary" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-medium text-lp-fg truncate leading-tight">
                              {item.fileName}
                            </h4>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-lp-muted-fg/40 hover:text-lp-destructive transition-colors p-1 hover:bg-lp-destructive/5 rounded-sm shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="lp-label-mono text-lp-muted-fg">
                              {materialName}
                            </span>
                            <span className="w-px h-3 bg-lp-border" />
                            <span className="lp-label-mono text-lp-muted-fg">
                              {spec}
                            </span>
                            <span className="w-px h-3 bg-lp-border" />
                            <span className="lp-label-mono text-lp-muted-fg">
                              {item.quote.parameters.quantity} pcs
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-lp-border/50">
                            <span className="lp-label-mono text-lp-muted-fg">Total</span>
                            <span className="text-sm font-medium text-lp-primary font-lp-mono">
                              {inr(item.quote.totalPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer summary */}
        {items.length > 0 && (
          <div className="p-5 flex flex-col border-t border-lp-border bg-lp-card">
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="lp-label-mono text-lp-muted-fg">Subtotal</span>
                  <span className="text-sm text-lp-fg font-medium font-lp-mono">
                    {inr(totals.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="lp-label-mono text-lp-muted-fg">Est. GST (18%)</span>
                  <span className="text-sm text-lp-fg font-medium font-lp-mono">
                    {inr(totals.gst)}
                  </span>
                </div>

                <div className="h-px bg-lp-border my-1" />

                <div className="flex justify-between items-center pt-1">
                  <div>
                    <span className="lp-label-mono text-lp-muted-fg block">Estimated total</span>
                    <span className="lp-label-mono text-lp-muted-fg/40 text-[8px]">(Inc. GST)</span>
                  </div>
                  <span className="text-xl font-medium text-lp-primary tracking-tight font-lp-mono">
                    {inr(totals.total)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-3">
                <Link
                  href="/checkout"
                  className="w-full"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  <button className="w-full h-12 bg-lp-primary text-lp-primary-fg rounded-sm lp-label-mono hover:bg-lp-primary/90 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]">
                    Proceed to checkout
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
                <button
                  className="w-full h-10 text-lp-muted-fg hover:text-lp-fg lp-label-mono hover:bg-lp-accent transition-colors rounded-sm"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  Continue configuring
                </button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
