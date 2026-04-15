'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Phone, User, Home, Building2, CreditCard } from 'lucide-react';
import { shippingAddressSchema } from '@/validators/order.validator';
import type { ShippingAddress } from '@/models/order.model';

interface ShippingFormProps {
  onSubmit: (data: ShippingAddress) => void;
  defaultValues?: Partial<ShippingAddress>;
  isLoading?: boolean;
}

/**
 * ShippingForm — India-specific address form with Pincode and GST validation.
 * Uses Zod for strict validation against MechHub rules.
 */
export function ShippingForm({ onSubmit, defaultValues, isLoading }: ShippingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ShippingAddress>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: {
      fullName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      isGstInvoicing: false,
      ...defaultValues,
    },
  });

  const isGstSelected = watch('isGstInvoicing');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2F5FA7] flex items-center gap-2">
          <MapPin size={14} /> Shipping Destination
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
              <input
                {...register('fullName')}
                placeholder="Receiver's name"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-slate-900 focus:outline-none focus:border-[#2F5FA7] focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium"
              />
            </div>
            {errors.fullName && (
              <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 uppercase">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
              <input
                {...register('phone')}
                placeholder="10-digit mobile"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-slate-900 focus:outline-none focus:border-[#2F5FA7] focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium"
              />
            </div>
            {errors.phone && (
              <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 uppercase">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Address Line 1 */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Address Line 1
            </label>
            <div className="relative">
              <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
              <input
                {...register('addressLine1')}
                placeholder="Building, Street, Area"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-slate-900 focus:outline-none focus:border-[#2F5FA7] focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium"
              />
            </div>
            {errors.addressLine1 && (
              <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 uppercase">
                {errors.addressLine1.message}
              </p>
            )}
          </div>

          {/* City */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              City
            </label>
            <input
              {...register('city')}
              placeholder="e.g. Bengaluru"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:border-[#2F5FA7] focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium"
            />
            {errors.city && (
              <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 uppercase">
                {errors.city.message}
              </p>
            )}
          </div>

          {/* State */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              State
            </label>
            <input
              {...register('state')}
              placeholder="e.g. Karnataka"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:border-[#2F5FA7] focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium"
            />
            {errors.state && (
              <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 uppercase">
                {errors.state.message}
              </p>
            )}
          </div>

          {/* Pincode */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Pincode
            </label>
            <input
              {...register('pincode')}
              placeholder="6-digit PIN"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:border-[#2F5FA7] focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-bold tracking-widest"
            />
            {errors.pincode && (
              <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 uppercase">
                {errors.pincode.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* GST Section */}
      <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-4">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            {...register('isGstInvoicing')}
            className="w-5 h-5 rounded-lg border-slate-200 text-[#2F5FA7] focus:ring-[#2F5FA7] transition-all cursor-pointer"
          />
          <span className="text-sm font-bold text-slate-700 uppercase tracking-tight group-hover:text-[#2F5FA7] transition-colors">
            Business Order (GST Invoicing)
          </span>
        </label>

        {isGstSelected && (
          <div className="space-y-4 pt-4 border-t border-slate-50 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  GST Number
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                  <input
                    {...register('gstNumber')}
                    placeholder="e.g. 29AAAAA0000A1Z5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-slate-900 focus:outline-none focus:border-[#2F5FA7] focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-bold uppercase"
                  />
                </div>
                {errors.gstNumber && (
                  <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 uppercase">
                    {errors.gstNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Company Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                  <input
                    {...register('companyName')}
                    placeholder="Legal business name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-slate-900 focus:outline-none focus:border-[#2F5FA7] focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium"
                  />
                </div>
                {errors.companyName && (
                  <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 uppercase">
                    {errors.companyName.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#2F5FA7] hover:bg-[#1E3A66] disabled:opacity-40 shadow-xl text-white font-bold tracking-widest uppercase text-[11px] py-5 px-10 rounded-2xl transition-all transform active:scale-95"
      >
        Confirm Shipping Details
      </button>
    </form>
  );
}
