import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCart } from '@/context/CartContext';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Package,
  ArrowRight,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  const handleItemClick = (id: string) => {
    router.push(`/shop/${id}`);
    setIsCartOpen(false);
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="w-full sm:max-w-md bg-white border-l border-slate-100 text-[#1E3A66] flex flex-col p-0 overflow-hidden outline-none shadow-2xl">
        {/* Custom Enhanced Header */}
        <div className="p-6 pb-4 bg-slate-50/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2F5FA7]/5 flex items-center justify-center border border-[#2F5FA7]/10">
                <ShoppingBag className="w-5 h-5 text-[#2F5FA7]" />
              </div>
              <div>
                <SheetTitle className="text-lg font-bold tracking-tight text-[#1E3A66] leading-none">
                  Procurement
                </SheetTitle>
                <p className="text-[10px] text-[#64748B] uppercase tracking-widest font-bold mt-1.5">
                  Industrial Logistics
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-[1px] bg-slate-200" />
            <span className="text-[9px] font-black text-[#2F5FA7]/40 uppercase tracking-[0.2em] whitespace-nowrap">
              {totalItems} Inventory Units
            </span>
            <div className="flex-1 h-[1px] bg-slate-200" />
          </div>
        </div>

        <div className="px-6 pb-2 flex items-center justify-between">
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-100 text-[10px] font-bold text-red-600 uppercase tracking-widest transition-all active:scale-[0.98]"
            >
              <Trash2 className="w-3 h-3 group-hover:rotate-12 transition-transform" />
              Clear Selection
            </button>
          )}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#E8F1FF] border border-[#2F5FA7]/10">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-[9px] font-bold text-[#64748B] uppercase">Live Registry</span>
          </div>
        </div>

        <Separator className="bg-slate-100 mx-6 w-auto" />

        <div className="flex-1 overflow-hidden">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 border border-slate-100 relative group">
                <Package className="w-10 h-10 text-slate-300 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <h3 className="text-xl font-bold text-[#1E3A66] mb-2">Cart is empty</h3>
              <p className="text-sm text-[#64748B] max-w-[240px] leading-relaxed font-medium">
                Your procurement list is currently empty. Browse our catalogue to get started.
              </p>
              <Button
                className="mt-8 bg-blue-600 hover:bg-[#1E3A66] h-12 px-10 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/10"
                onClick={() => router.push('/shop')}
              >
                Browse Catalogue
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-full px-6">
              <div className="py-6 space-y-5">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 group cursor-pointer"
                    onDoubleClick={() => handleItemClick(item.id)}
                    title="Double click to view details"
                  >
                    <div className="relative w-20 h-20 md:w-24 md:h-24 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100 overflow-hidden flex items-center justify-center shrink-0 group-hover:border-[#2F5FA7]/40 transition-all duration-500">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-contain p-2 group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-slate-200" />
                      )}
                      <div className="absolute inset-0 bg-[#2F5FA7]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ExternalLink className="w-5 h-5 text-[#2F5FA7]" />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 py-1 bg-white/80 backdrop-blur-sm border-t border-slate-100">
                        <p className="text-[7px] font-bold text-[#64748B] text-center tracking-tighter uppercase">
                          {item.sku}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[13px] md:text-sm font-bold text-[#1E3A66] truncate group-hover:text-[#2F5FA7] transition-colors leading-tight tracking-tight uppercase">
                            {item.name}
                          </h4>
                          <p className="text-[9px] font-bold text-[#2F5FA7]/60 uppercase tracking-widest mt-0.5">
                            Verified Component
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(item.id);
                          }}
                          className="text-blue-100 hover:text-red-500 transition-all p-1 hover:bg-red-50 rounded-lg group/trash shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5 group-hover/trash:scale-110 transition-transform" />
                        </button>
                      </div>

                      <div className="flex justify-between items-center sm:items-end mt-2 gap-2">
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden h-8 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.id, item.quantity - 1);
                            }}
                            className="w-8 h-full flex items-center justify-center hover:bg-slate-200 text-[#64748B] hover:text-[#1E3A66] transition-colors border-r border-slate-200"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-9 text-center text-[11px] font-bold text-[#1E3A66]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.id, item.quantity + 1);
                            }}
                            disabled={item.quantity >= item.inventory}
                            className={`w-8 h-full flex items-center justify-center hover:bg-slate-200 text-[#64748B] hover:text-[#1E3A66] transition-colors ${item.quantity >= item.inventory ? 'opacity-20 cursor-not-allowed' : ''}`}
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm md:text-base font-bold text-[#1E3A66] group-hover:text-[#2F5FA7] transition-colors whitespace-nowrap">
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

        {items.length > 0 && (
          <div className="p-6 h-auto flex flex-col border-t border-slate-100 bg-slate-50/80 backdrop-blur-3xl relative">
            <div className="w-full space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-[#64748B] font-bold uppercase tracking-wider">
                  <span>Subtotal</span>
                  <span className="text-[#1E3A66]">₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-[#64748B] font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">Procurement Savings</span>
                  <span className="text-emerald-600">- ₹{totalSavings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-[#64748B] font-bold uppercase tracking-wider">
                  <span>Estimated Tax (GST 18%)</span>
                  <span className="text-[#1E3A66]">
                    ₹{Math.round(totalPrice * 0.18).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center py-4 border-t border-slate-200 mt-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#64748B] uppercase tracking-widest leading-none">
                      Total Payable
                    </span>
                    <span className="text-[9px] text-blue-100 mt-1.5 font-bold uppercase tracking-widest">
                      (Inc. GST)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-[#2F5FA7] tracking-tighter">
                      ₹{Math.round(totalPrice * 1.18).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Link href="/checkout" className="w-full" onClick={() => setIsCartOpen(false)}>
                  <Button className="w-full h-14 bg-blue-600 hover:bg-[#1E3A66] text-white font-bold gap-3 rounded-2xl shadow-lg shadow-blue-900/10 group transition-all duration-300 active:scale-[0.98]">
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full h-11 text-[#64748B] hover:text-[#1E3A66] hover:bg-slate-200/50 text-[10px] uppercase font-bold tracking-widest transition-all"
                  onClick={() => setIsCartOpen(false)}
                >
                  Continue Procuring
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
