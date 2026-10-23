import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCart } from '@/context/CartContext';
import { useQuoteCartContext } from '@/context/QuoteCartContext';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Package,
  ArrowRight,
  X,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { landingFontVars } from '@/components/home/fonts';
import '@/components/home/landing.css';
import { cn } from '@/utils';

export function CartSidebar() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    totalPrice,
    totalSavings,
    totalItems,
    isCartOpen,
    setIsCartOpen,
  } = useCart();
  const quoteCart = useQuoteCartContext();
  const router = useRouter();

  const handleItemClick = (id: string) => {
    router.push(`/shop/${id}`);
    setIsCartOpen(false);
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className={cn("lp-root w-full sm:max-w-md bg-lp-bg border-l border-lp-border text-lp-fg flex flex-col p-0 overflow-hidden outline-none shadow-2xl", landingFontVars)}>
        {/* Header */}
        <div className="p-5 pb-3 border-b border-lp-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm bg-lp-accent flex items-center justify-center border border-lp-border">
                <ShoppingBag className="w-4 h-4 text-lp-primary" />
              </div>
              <div>
                <SheetTitle className="text-lg font-medium tracking-tight text-lp-fg leading-none font-lp-sans">
                  Procure<span className="font-lp-serif italic">ment</span>
                </SheetTitle>
                <p className="lp-label-mono text-lp-muted-fg mt-1">
                  Industrial logistics
                </p>
              </div>
            </div>
          </div>

          {/* Cart type switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-lp-accent rounded-sm border border-lp-border">
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-sm bg-lp-card border border-lp-border shadow-sm lp-label-mono text-lp-primary text-[10px]"
            >
              <ShoppingBag className="w-3 h-3" />
              Procurement {totalItems > 0 && `(${totalItems})`}
            </button>
            <button
              onClick={() => {
                setIsCartOpen(false);
                setTimeout(() => quoteCart.setIsDrawerOpen(true), 150);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-sm lp-label-mono text-lp-muted-fg hover:text-lp-fg hover:bg-lp-card/50 transition-colors text-[10px]"
            >
              <Layers className="w-3 h-3" />
              Manufacturing {quoteCart.itemCount > 0 && `(${quoteCart.itemCount})`}
            </button>
          </div>
        </div>

        {/* Actions bar */}
        <div className="px-5 py-2.5 flex items-center justify-between">
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-lp-destructive/20 bg-lp-destructive/5 lp-label-mono text-lp-destructive hover:bg-lp-destructive/10 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear selection
            </button>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-lp-accent border border-lp-border">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="lp-label-mono text-lp-muted-fg">Live registry</span>
          </div>
        </div>

        <div className="h-px bg-lp-border mx-5" />

        {/* Items */}
        <div className="flex-1 overflow-hidden">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-sm bg-lp-accent flex items-center justify-center mb-5 border border-lp-border">
                <Package className="w-8 h-8 text-lp-muted-fg/40" />
              </div>
              <h3 className="text-lg font-medium text-lp-fg mb-1.5">Cart is empty</h3>
              <p className="text-sm text-lp-muted-fg max-w-[240px] leading-relaxed">
                Your procurement list is currently empty. Browse our catalogue to get started.
              </p>
              <button
                className="mt-6 h-11 px-8 rounded-sm bg-lp-primary text-lp-primary-fg lp-label-mono hover:bg-lp-primary/90 transition-colors"
                onClick={() => router.push('/shop')}
              >
                Browse catalogue
              </button>
            </div>
          ) : (
            <ScrollArea className="h-full px-5">
              <div className="py-4 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 group cursor-pointer"
                    onDoubleClick={() => handleItemClick(item.id)}
                    title="Double click to view details"
                  >
                    <div className="relative w-20 h-20 bg-lp-accent rounded-sm border border-lp-border overflow-hidden flex items-center justify-center shrink-0 group-hover:border-lp-primary/40 transition-colors">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <Package className="w-7 h-7 text-lp-muted-fg/30" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-lp-fg truncate group-hover:text-lp-primary transition-colors leading-tight">
                            {item.name}
                          </h4>
                          <p className="lp-label-mono text-lp-muted-fg/60 mt-0.5">
                            Verified · {item.sku}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(item.id);
                          }}
                          className="text-lp-muted-fg/40 hover:text-lp-destructive transition-colors p-1 hover:bg-lp-destructive/5 rounded-sm shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex justify-between items-center mt-2 gap-2">
                        <div className="flex items-center bg-lp-accent border border-lp-border rounded-sm overflow-hidden h-7 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.id, item.quantity - 1);
                            }}
                            className="w-7 h-full flex items-center justify-center hover:bg-lp-border/50 text-lp-muted-fg transition-colors border-r border-lp-border"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-medium text-lp-fg font-lp-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.id, item.quantity + 1);
                            }}
                            disabled={item.quantity >= item.inventory}
                            className={`w-7 h-full flex items-center justify-center hover:bg-lp-border/50 text-lp-muted-fg transition-colors border-l border-lp-border ${item.quantity >= item.inventory ? 'opacity-20 cursor-not-allowed' : ''}`}
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-medium text-lp-fg group-hover:text-lp-primary transition-colors whitespace-nowrap">
                            ₹{(item.salePrice * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
                  <span className="text-sm text-lp-fg font-medium">₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="lp-label-mono text-lp-muted-fg">Procurement savings</span>
                  <span className="text-sm text-emerald-600 font-medium">- ₹{totalSavings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="lp-label-mono text-lp-muted-fg">Est. tax (GST 18%)</span>
                  <span className="text-sm text-lp-fg font-medium">
                    ₹{Math.round(totalPrice * 0.18).toLocaleString()}
                  </span>
                </div>

                <div className="h-px bg-lp-border my-1" />

                <div className="flex justify-between items-center pt-1">
                  <div>
                    <span className="lp-label-mono text-lp-muted-fg block">Total payable</span>
                    <span className="lp-label-mono text-lp-muted-fg/40 text-[8px]">(Inc. GST)</span>
                  </div>
                  <span className="text-xl font-medium text-lp-primary tracking-tight">
                    ₹{Math.round(totalPrice * 1.18).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-3">
                <Link href="/checkout" className="w-full" onClick={() => setIsCartOpen(false)}>
                  <button className="w-full h-12 bg-lp-primary text-lp-primary-fg rounded-sm lp-label-mono hover:bg-lp-primary/90 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]">
                    Commence strategic buy
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
                <button
                  className="w-full h-10 text-lp-muted-fg hover:text-lp-fg lp-label-mono hover:bg-lp-accent transition-colors rounded-sm"
                  onClick={() => setIsCartOpen(false)}
                >
                  Continue procuring
                </button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
