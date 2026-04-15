'use client';

import React from 'react';
import { CheckCircle2, Package, Calendar, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';
import type { QuoteOrder } from '@/models/order.model';
import { format, addDays } from 'date-fns';

interface OrderConfirmationProps {
  order: QuoteOrder;
}

/**
 * OrderConfirmation — Success page shown after payment.
 * Shows order summary and next steps.
 */
export function OrderConfirmation({ order }: OrderConfirmationProps) {
  const estimatedDelivery = order.estimatedDeliveryDate
    ? new Date(order.estimatedDeliveryDate)
    : addDays(new Date(), order.shippingOption.estimatedDays + 2);

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Success Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 rounded-full mb-2">
          <CheckCircle2 className="text-green-500 w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">
          Order Placed Successfully!
        </h2>
        <p className="text-slate-500 font-medium">
          Thank you for choosing MechHub. Your order{' '}
          <span className="text-[#2F5FA7] font-bold">#{order.orderNumber}</span> has been confirmed.
        </p>
      </div>

      {/* Order Summary Card */}
      <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Quick Info */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <Calendar className="text-[#2F5FA7] w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Estimated Delivery
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {format(estimatedDelivery, 'EEE, do MMM yyyy')}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <Package className="text-[#2F5FA7] w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Items Confirmed
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {(order.items?.length || 0) + (order.shopItems?.length || 0)} Items ordered
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address Summary */}
          <div className="bg-slate-50 rounded-2xl p-6">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Home size={12} /> Shipping To
            </h4>
            <div className="text-[12px] font-bold text-slate-700 leading-relaxed uppercase">
              <p>{order.shippingAddress.fullName}</p>
              <p className="font-medium text-slate-500 mt-1">
                {order.shippingAddress.addressLine1}, {order.shippingAddress.city},{' '}
                {order.shippingAddress.state} - {order.shippingAddress.pincode}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-slate-50">
          <Link
            href="/dashboard"
            className="w-full sm:flex-1 bg-[#2F5FA7] hover:bg-[#1E3A66] text-white font-bold tracking-widest uppercase text-[11px] py-4 px-8 rounded-xl transition-all shadow-md hover:shadow-lg text-center flex items-center justify-center gap-2 group"
          >
            Go to Dashboard{' '}
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/orders"
            className="w-full sm:flex-1 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 font-bold tracking-widest uppercase text-[11px] py-4 px-8 rounded-xl transition-all text-center"
          >
            Order Details
          </Link>
        </div>
      </div>

      {/* Trust Quote */}
      <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
        YOUR DESIGNS ARE NOW IN PRODUCTION. TRACK UPDATES ON YOUR DASHBOARD.
      </p>
    </div>
  );
}
