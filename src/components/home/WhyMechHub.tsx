'use client';

import React from 'react';
import {
  X,
  Check,
  Shield,
  Eye,
  Box,
  Lock,
  Truck,
  Settings,
  Zap,
  CreditCard,
  MapPin,
  Leaf,
  ShieldCheck,
} from 'lucide-react';
import { ScrollReveal, TextReveal } from '@/components/ScrollReveal';

const comparisons = [
  {
    feature: 'Quoting',
    featureIcon: Shield,
    featureColor: 'bg-blue-100 text-blue-600',
    featureDesc: 'Get instant quotes with verified vendors.',
    old: 'Email 10 vendors, wait 3 days, get 10 different answers.',
    newBold: 'Upload once. Get an instant or rapid quote.',
    newRest: ' One platform, one price.',
  },
  {
    feature: 'Transparency',
    featureIcon: Eye,
    featureColor: 'bg-purple-100 text-purple-600',
    featureDesc: 'See real-time production updates and pricing.',
    old: "No visibility — you don't know if your part is being made or sitting in a queue.",
    newBold: 'Real-time order tracking',
    newRest: ' from upload to delivery. Full visibility, always.',
  },
  {
    feature: 'Order Size',
    featureIcon: Box,
    featureColor: 'bg-emerald-100 text-emerald-600',
    featureDesc: "From 1 piece to 1000+, we've got you covered.",
    old: 'Minimum order quantities that price out students and small teams.',
    newBold: 'Order 1 part or 1000.',
    newRest: ' Zero minimums. Built for builders at every scale.',
  },
  {
    feature: 'IP Protection',
    featureIcon: Lock,
    featureColor: 'bg-indigo-100 text-indigo-600',
    featureDesc: 'Your designs stay yours — always.',
    old: 'Your CAD files shared with random vendors, no NDA, no protection.',
    newBold: 'Every design covered by NDA and encrypted',
    newRest: ' with AES-256. Your IP stays yours.',
  },
  {
    feature: 'Logistics',
    featureIcon: Truck,
    featureColor: 'bg-sky-100 text-sky-600',
    featureDesc: 'Reliable and on-time delivery, across India.',
    old: 'Different vendors for cutting, bending, finishing — you manage everything.',
    newBold: 'All services under one roof.',
    newRest: ' One order, one delivery, zero overhead.',
  },
];

export function WhyMechHub() {
  return (
    <section id="why-mechhub" className="py-20 md:py-28 bg-[#F0F6FF] relative overflow-hidden border-b border-blue-100">
      {/* Background blueprint grid watermark */}
      <div className="absolute inset-0 blueprint-grid opacity-[0.03] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <ScrollReveal variant="fade-down" delay={100}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C7DDFE] bg-[#E0ECFF] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#2563EB] mb-4 shadow-2xs">
              WHY MECHHUB
            </div>
          </ScrollReveal>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0F172A] tracking-tight mt-2 mb-4 leading-tight">
            Why Builders <span className="text-[#2563EB]">Choose MechHub</span>
          </h2>
          <ScrollReveal variant="fade-up" delay={200}>
            <p className="text-[#64748B] text-base sm:text-lg font-normal leading-relaxed">
              We didn&apos;t build another parts website. We built the infrastructure India&apos;s
              hardware builders actually needed.
            </p>
          </ScrollReveal>
        </div>

        {/* Main Grid: Left Features, Center Comparison Table, Right Visual Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16">

          {/* Left Column: Feature Highlights & Blueprint Illustration */}
          <div className="lg:col-span-3 space-y-6 hidden lg:block">
            {/* Top Handwritten Annotation */}
            <div className="relative pl-6 pb-2">
              <span className="font-serif italic text-blue-500 text-sm block -rotate-3">
                From CAD files to real parts
              </span>
              <svg className="w-12 h-6 text-blue-400 opacity-60 ml-4 -mt-1" viewBox="0 0 50 25" fill="none" stroke="currentColor">
                <path d="M5 5 Q 35 5 45 20" strokeWidth="1.5" strokeDasharray="3 3" />
                <path d="M40 16 L45 20 L42 24" strokeWidth="1.5" />
              </svg>
            </div>

            {/* CAD Part Visual Box */}
            <div className="relative bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-blue-100 shadow-md">
              <div className="absolute top-3 left-3 bg-blue-50 border border-blue-200 text-[#2563EB] text-[10px] font-bold px-2 py-0.5 rounded">
                STL / STEP &gt;
              </div>
              <div className="flex items-center justify-center py-4">
                <svg width="140" height="110" viewBox="0 0 160 130" fill="none" stroke="#2563EB" strokeWidth="1.2">
                  <path d="M80 20 L135 48 L135 90 L80 118 L25 90 L25 48 Z" strokeDasharray="3 2" opacity="0.4" />
                  <path d="M80 20 L80 68 L135 90" />
                  <path d="M80 68 L25 90" />
                  <circle cx="80" cy="55" r="20" />
                  <circle cx="80" cy="55" r="12" strokeDasharray="2 2" opacity="0.6" />
                  <ellipse cx="45" cy="72" rx="6" ry="3" />
                  <ellipse cx="115" cy="72" rx="6" ry="3" />
                  <text x="10" y="60" fill="#2563EB" fontSize="8" fontFamily="monospace" opacity="0.7">120 mm</text>
                  <text x="100" y="110" fill="#2563EB" fontSize="8" fontFamily="monospace" opacity="0.7">80 mm</text>
                </svg>
              </div>
            </div>

            {/* Left Feature List */}
            <div className="space-y-4 pt-2">
              {comparisons.map((item) => (
                <div key={item.feature} className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl ${item.featureColor} flex items-center justify-center shrink-0 shadow-2xs mt-0.5`}>
                    <item.featureIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">{item.feature}</h4>
                    <p className="text-[11px] text-[#64748B] leading-tight font-normal">{item.featureDesc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Note Sticky */}
            <div className="bg-white/90 border border-blue-100 rounded-xl p-3 shadow-xs transform -rotate-1">
              <p className="font-serif italic text-xs text-blue-600 font-medium leading-tight">
                💡 Better parts. Faster builds. For every creator.
              </p>
            </div>
          </div>

          {/* Center Column: The Old Way vs The MechHub Way Comparison Cards */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* The Old Way Card */}
            <div className="bg-[#FEF2F2]/80 border border-[#FECACA] rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-[#FEE2E2] text-[#EF4444] font-bold text-xs px-3.5 py-1 rounded-full mb-6 uppercase tracking-wider">
                  <div className="w-4 h-4 rounded-full bg-[#EF4444] text-white flex items-center justify-center text-[10px]">
                    <X className="w-3 h-3 stroke-[3]" />
                  </div>
                  THE OLD WAY
                </div>

                <div className="space-y-6">
                  {comparisons.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs text-slate-700 font-normal leading-relaxed">
                      <div className="w-5 h-5 rounded-full bg-[#FEE2E2] text-[#EF4444] flex items-center justify-center shrink-0 mt-0.5">
                        <X className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span>{item.old}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* The MechHub Way Card */}
            <div className="bg-white border-2 border-[#16A34A]/30 rounded-3xl p-6 sm:p-7 shadow-xl shadow-green-900/5 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="inline-flex items-center gap-1.5 bg-[#DCFCE7] text-[#16A34A] font-bold text-xs px-3.5 py-1 rounded-full mb-6 uppercase tracking-wider">
                  <div className="w-4 h-4 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-[10px]">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  THE MECHHUB WAY
                </div>

                <div className="space-y-6">
                  {comparisons.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs text-slate-700 leading-relaxed">
                      <div className="w-5 h-5 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <div>
                        <strong className="text-slate-900 font-bold">{item.newBold}</strong>
                        <span className="text-slate-600 font-normal">{item.newRest}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Dashboard Mockup Graphic & Status Badges */}
          <div className="lg:col-span-3 space-y-6 hidden lg:block">
            {/* Top Floating Notification Badge */}
            <div className="flex justify-end pr-2">
              <div className="bg-white border border-blue-100 rounded-full px-3.5 py-1.5 shadow-md flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px]">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span className="font-bold text-slate-800">Quote received!</span>
                <span className="text-[#2563EB] font-mono font-bold text-[11px]">₹ 18,500 - 2 days</span>
              </div>
            </div>

            {/* Tablet Mockup Screen Displaying MechHub Dashboard */}
            <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-3 border-4 border-white shadow-xl shadow-blue-500/10 rotate-1">
              <div className="bg-[#101d33] rounded-xl p-3 text-white border border-slate-800">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Box className="w-4 h-4 text-[#2563EB]" />
                    <span className="text-xs font-bold font-mono tracking-tight">MechHub</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  </div>
                </div>

                {/* 3D Part Preview Graphic inside screen */}
                <div className="bg-slate-950/80 rounded-lg p-2 flex items-center justify-center border border-slate-800/80 mb-3">
                  <svg width="90" height="70" viewBox="0 0 100 80" fill="none" stroke="#38BDF8" strokeWidth="1">
                    <path d="M50 10 L85 30 L85 60 L50 80 L15 60 L15 30 Z" />
                    <path d="M50 10 L50 45 L85 60" />
                    <path d="M50 45 L15 60" />
                    <circle cx="50" cy="35" r="12" />
                  </svg>
                </div>

                {/* Status checklist */}
                <div className="space-y-1.5 text-[10px]">
                  {['Upload CAD', 'Get Quote', 'Track Order', 'Delivered'].map((step, idx) => (
                    <div key={step} className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px]">
                        <Check className="w-2 h-2 stroke-[3]" />
                      </div>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Handwritten Tracking Pointer Annotation */}
            <div className="flex items-center justify-end pr-4 gap-2">
              <span className="font-serif italic text-blue-500 text-xs rotate-3">Real-time tracking</span>
              <svg className="w-8 h-8 text-blue-400 opacity-60" viewBox="0 0 30 30" fill="none" stroke="currentColor">
                <path d="M5 25 Q 15 5 25 10" strokeWidth="1.5" strokeDasharray="3 3" />
              </svg>
            </div>

            {/* Bottom Part & Secure Badge */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <div className="bg-white p-2 rounded-xl border border-blue-100 shadow-sm">
                <svg width="40" height="35" viewBox="0 0 50 40" fill="none" stroke="#2563EB" strokeWidth="1.2">
                  <path d="M25 5 L42 15 L42 30 L25 38 L8 30 L8 15 Z" />
                  <circle cx="25" cy="20" r="8" />
                </svg>
              </div>
              <div className="bg-blue-50 text-[#2563EB] border border-blue-200 rounded-full p-2 shadow-2xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-serif italic text-xs text-blue-600 font-medium">
                Secure &amp; Reliable
              </span>
            </div>
          </div>

        </div>

        {/* Center Quote Banner */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="bg-[#E8F2FF] border border-[#D0E2FF] rounded-full py-4 px-6 md:px-8 shadow-sm flex items-center justify-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white text-[#2563EB] flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
              <Settings className="w-5 h-5" />
            </div>
            <p className="text-[#0F172A] font-medium text-xs sm:text-sm text-center leading-normal">
              &ldquo;MechHub is the only Indian manufacturing platform built specifically for{' '}
              <strong className="text-[#2563EB] font-bold">prototypes and small teams</strong> — not factories.&rdquo;
            </p>
          </div>
        </div>

        {/* Bottom Trust Icons Bar */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-[#64748B] pt-4 border-t border-blue-100/60">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" /> Verified Vendors
          </span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#2563EB]" /> Fast Turnaround
          </span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#2563EB]" /> Secure Payments
          </span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#2563EB]" /> Pan India Delivery
          </span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-[#2563EB]" /> Sustainable Manufacturing
          </span>
        </div>

      </div>
    </section>
  );
}

