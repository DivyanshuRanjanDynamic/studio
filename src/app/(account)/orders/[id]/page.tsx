'use client';

import { useState, useEffect, Suspense } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { V2Shell } from '@/components/V2Shell';
import {
  CheckCircle2,
  XCircle,
  Package,
  Printer,
  ArrowLeft,
  ExternalLink,
  MapPin,
  Calendar,
  Receipt,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { AccountLoader } from '@/components/PageLoaders';

function OrderConfirmationContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isSuccess = searchParams.get('success') === 'true';
  const db = useFirestore();

  const orderRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'orders', id);
  }, [db, id]);

  const { data: order, isLoading, error } = useDoc(orderRef);

  if (isLoading) {
    return <AccountLoader />;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <XCircle className="w-20 h-20 text-slate-200 mb-6" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Order Not Found</h1>
        <p className="text-slate-500 mb-8 text-center max-w-md">
          The order record could not be retrieved from the central procurement system.
        </p>
        <Link href="/shop">
          <Button variant="outline" className="border-slate-200">
            Back to Shop
          </Button>
        </Link>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'paid';

  return (
    <V2Shell noFooter>

      <main className="container mx-auto px-4 py-12 md:py-20 max-w-5xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {isPaid ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
                  <Receipt className="w-6 h-6 text-orange-600" />
                </div>
              )}
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                {isPaid ? 'Order Confirmed' : 'Verification Pending'}
              </h1>
            </div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest pl-1 mt-1">
              Ref ID:{' '}
              <span className="font-mono text-[#2F5FA7]">
                #{order.id?.slice(-8).toUpperCase() || 'UNKNOWN'}
              </span>
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="bg-white border-slate-200 hover:bg-slate-50 rounded-xl gap-2 h-11 px-6 font-bold uppercase tracking-widest text-[10px] shadow-sm print:hidden text-slate-600"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4" /> Print Receipt
            </Button>
            <Link href="/shop">
              <Button className="bg-[#2F5FA7] hover:bg-[#1E3A66] text-white rounded-xl h-11 px-6 font-bold uppercase tracking-widest text-[10px] shadow-lg transition-all border-none print:hidden">
                Continue Procuring
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Summary and Items */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-white border-slate-100 rounded-3xl overflow-hidden shadow-xl ring-1 ring-slate-200/5">
              <CardHeader className="p-8 pb-4 border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-sm font-bold flex items-center gap-3 text-slate-900 uppercase tracking-widest">
                  <Package className="w-5 h-5 text-[#2F5FA7]" /> Procurement Lineage
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-6">
                <div className="divide-y divide-slate-100">
                  {(order.items || []).map((item: any) => (
                    <div
                      key={item.id}
                      className="py-6 flex justify-between items-start gap-6 group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-slate-900 transition-colors leading-tight uppercase tracking-tight">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge
                            variant="outline"
                            className="text-[9px] border-slate-100 text-slate-500 font-bold uppercase tracking-widest py-0 px-2 h-5 bg-slate-50"
                          >
                            SKU: {item.sku}
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Qty:{' '}
                            <span className="text-[#2F5FA7] font-mono leading-none">
                              {item.quantity}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold font-mono text-slate-900 italic">
                          ₹{(item.quantity * item.price).toLocaleString()}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-widest font-bold">
                          ₹{item.price?.toLocaleString() || '0'} unit
                        </p>
                      </div>
                    </div>
                  ))}

                  {(order.shopItems || []).map((item: any) => (
                    <div
                      key={item.id}
                      className="py-6 flex justify-between items-start gap-6 group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-slate-900 transition-colors leading-tight uppercase tracking-tight">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge
                            variant="outline"
                            className="text-[9px] border-slate-100 text-slate-500 font-bold uppercase tracking-widest py-0 px-2 h-5 bg-slate-50"
                          >
                            SKU: {item.sku}
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Qty:{' '}
                            <span className="text-[#2F5FA7] font-mono leading-none">
                              {item.quantity}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold font-mono text-slate-900 italic">
                          ₹{(item.quantity * item.salePrice).toLocaleString()}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-widest font-bold">
                          ₹{item.salePrice?.toLocaleString() || '0'} unit
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-[10px] font-bold flex items-center gap-2 text-slate-400 uppercase tracking-widest">
                      <MapPin className="w-4 h-4 text-[#2F5FA7]" /> Shipping Destination
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-2">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                        {order.shippingAddress?.fullName || 'N/A'}
                      </p>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                        {order.shippingAddress?.street || order.shippingAddress?.addressLine1},{' '}
                        {order.shippingAddress?.city}
                        <br />
                        {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                        <br />
                        <span className="text-slate-400 font-medium">Contact:</span>{' '}
                        <span className="text-[#2F5FA7] font-mono">
                          {order.shippingAddress?.phone}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-[10px] font-bold flex items-center gap-2 text-slate-400 uppercase tracking-widest">
                      <CheckCircle2 className="w-4 h-4 text-[#2F5FA7]" /> Compliance Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-2">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                          QC Passed
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                          Tax Invoice Generated
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Right: Payment Details */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-[#1E3A66] border-[#1E3A66] rounded-3xl overflow-hidden shadow-xl text-white">
              <CardHeader className="p-8 pb-4 border-b border-white/10">
                <CardTitle className="text-sm font-bold flex items-center gap-3 text-white uppercase tracking-widest">
                  Commercials
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-blue-100">
                    <span>Logistics Subtotal</span>
                    <span className="font-mono text-sm leading-none">
                      ₹{(order.pricing?.subtotal || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-blue-100">
                    <span>GST (IGST 18%)</span>
                    <span className="font-mono text-sm leading-none">
                      ₹{(order.pricing?.gst || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-blue-100">
                    <span>Procure Shipping</span>
                    <span className="font-mono text-sm leading-none">
                      {order.pricing?.shipping === 0
                        ? 'FREE'
                        : `₹${(order.pricing?.shipping || 0).toLocaleString()}`}
                    </span>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-blue-100 font-bold uppercase text-[10px] tracking-widest">
                      Gross Total
                    </span>
                    <span className="text-3xl font-bold text-white font-mono tracking-tighter italic">
                      ₹{(order.pricing?.total || 0).toLocaleString()}
                    </span>
                  </div>
                  <Badge
                    className={`${isPaid ? 'bg-emerald-500 text-white border-transparent' : 'bg-orange-500 text-white border-transparent'} w-full flex justify-center py-2.5 rounded-xl text-[10px] uppercase font-bold tracking-[0.2em] shadow-lg`}
                  >
                    {isPaid ? 'TXN SECURED & SETTLED' : 'SETTLEMENT PENDING'}
                  </Badge>
                </div>

                <Separator className="bg-white/10" />

                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/5">
                      <Calendar className="w-4 h-4 text-blue-100" />
                    </div>
                    <div>
                      <p className="text-[9px] text-blue-200 font-bold uppercase tracking-widest">
                        Procured Date
                      </p>
                      <p className="text-xs font-bold text-white italic">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/5">
                      <Truck className="w-4 h-4 text-blue-100" />
                    </div>
                    <div>
                      <p className="text-[9px] text-blue-200 font-bold uppercase tracking-widest">
                        Fulfillment Type
                      </p>
                      <p className="text-xs font-bold text-white italic">Standard Tracked Ground</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer hover:bg-slate-50 transition-all">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-[#2F5FA7]" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  View Tax Invoice
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-[#2F5FA7] transition-colors" />
            </div>
          </div>
        </div>
      </main>

    </V2Shell>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<AccountLoader />}>
      <OrderConfirmationContent />
    </Suspense>
  );
}
