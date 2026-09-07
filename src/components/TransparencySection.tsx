'use client';

import React from 'react';
import {
  Clock,
  Lock,
  Coins,
  TrendingUp,
  Box,
  FileText,
  Settings,
  ShieldCheck,
  Truck,
  Check,
  ArrowRight,
} from 'lucide-react';
import { ScrollReveal, TextReveal } from '@/components/ScrollReveal';

export function TransparencySection() {
  return (
    <section id="transparency" className="py-24 md:py-32 bg-[#F8FAFC] relative overflow-hidden border-t border-slate-200/80">
      {/* Background blueprint vector lineart watermarks */}
      <div className="absolute top-10 left-6 opacity-10 pointer-events-none">
        <svg width="220" height="220" viewBox="0 0 200 200" fill="none" stroke="#2563EB" strokeWidth="1">
          <circle cx="100" cy="100" r="80" strokeDasharray="4 4" />
          <circle cx="100" cy="100" r="50" />
          <path d="M100 0v200M0 100h200" strokeDasharray="2 4" />
          <circle cx="100" cy="100" r="15" />
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = 100 + 70 * Math.cos(angle);
            const y1 = 100 + 70 * Math.sin(angle);
            const x2 = 100 + 85 * Math.cos(angle);
            const y2 = 100 + 85 * Math.sin(angle);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1.5" />;
          })}
        </svg>
      </div>

      <div className="absolute top-12 right-12 opacity-10 pointer-events-none hidden md:block">
        <svg width="180" height="180" viewBox="0 0 100 100" fill="none" stroke="#2563EB" strokeWidth="0.8">
          <line x1="50" y1="0" x2="50" y2="100" />
          <line x1="0" y1="50" x2="100" y2="50" />
          <circle cx="50" cy="50" r="35" strokeDasharray="3 3" />
        </svg>
      </div>

      <div className="absolute bottom-6 right-6 opacity-10 pointer-events-none hidden lg:block">
        <svg width="260" height="260" viewBox="0 0 200 200" fill="none" stroke="#2563EB" strokeWidth="0.8">
          <path d="M40 160 L100 125 L160 160 L100 195 Z" />
          <path d="M40 160 L40 90 L100 55 L160 90 L160 160" />
          <path d="M100 195 L100 125" />
          <path d="M100 125 L160 90" />
          <path d="M100 125 L40 90" />
          <circle cx="100" cy="90" r="16" strokeDasharray="2 2" />
        </svg>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
          <ScrollReveal variant="fade-down" delay={100}>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#2563EB] mb-4 shadow-sm">
              OUR PROMISE
            </div>
          </ScrollReveal>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0F172A] font-['Lora',serif] mt-2 mb-4 leading-tight">
            <TextReveal text="Manufacturing Without the Black Box" />
          </h2>
          <ScrollReveal variant="fade-up" delay={200}>
            <p className="text-[#64748B] text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
              Clear pricing, protected designs, and visibility from CAD upload to delivery.
            </p>
          </ScrollReveal>
        </div>

        {/* 2x2 Bento Box Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto mb-16">

          {/* Card 1: Track Every Stage (Top Left - col-span-7) */}
          <ScrollReveal
            variant="fade-up"
            delay={100}
            className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-100 shadow-[0_15px_40px_-15px_rgba(15,23,42,0.06)] hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.12)] transition-all duration-300 flex flex-col justify-between relative group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] border border-blue-100 flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold font-['Lora',serif] text-[#0F172A] mb-2">
                Track Every Stage
              </h3>
              <p className="text-[#64748B] text-sm leading-relaxed max-w-md font-normal mb-8">
                Know exactly where your parts are — from quote approval to production, quality check and dispatch.
              </p>
            </div>

            {/* Stepper Timeline Widget */}
            <div className="pt-4 pb-2 border-t border-slate-100">
              <div className="relative flex items-center justify-between">
                {/* Connector Line */}
                <div className="absolute top-5 left-6 right-6 h-[2px] bg-slate-100 -z-0" />
                <div className="absolute top-5 left-6 right-[20%] h-[2px] bg-gradient-to-r from-[#2563EB] to-blue-400 -z-0" />

                {[
                  { label: 'CAD Uploaded', icon: Box },
                  { label: 'Quote Approved', icon: FileText },
                  { label: 'In Production', icon: Settings },
                  { label: 'Quality Checked', icon: ShieldCheck },
                  { label: 'Shipped', icon: Truck },
                ].map((step, i) => (
                  <div key={i} className="relative z-10 flex flex-col items-center group/step">
                    <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] flex items-center justify-center shadow-sm relative transition-transform duration-300 group-hover/step:scale-110">
                      <step.icon className="w-4 h-4" />
                      <div className="absolute -bottom-1 w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center border-2 border-white shadow">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#0F172A] mt-3 text-center tracking-tight leading-tight max-w-[70px]">
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Card 2: Your IP Stays Yours (Top Right - col-span-5) */}
          <ScrollReveal
            variant="fade-up"
            delay={200}
            className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-100 shadow-[0_15px_40px_-15px_rgba(15,23,42,0.06)] hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.12)] transition-all duration-300 flex flex-col justify-between relative group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] border border-blue-100 flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold font-['Lora',serif] text-[#0F172A] mb-2">
                Your IP Stays Yours
              </h3>
              <p className="text-[#64748B] text-sm leading-relaxed font-normal mb-6">
                We follow NDA-first workflows and store your designs in encrypted storage, so your ideas stay confidential.
              </p>
            </div>

            {/* Shield & Security Graphic Widget */}
            <div className="relative py-6 flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-slate-100">
              {/* Orbital Rings Accent */}
              <div className="relative flex items-center justify-center mb-4">
                <div className="absolute w-24 h-24 rounded-full border border-blue-200/60 border-dashed animate-[spin_20s_linear_infinite]" />
                <div className="absolute w-32 h-14 rounded-full border border-blue-300/40 -rotate-12" />
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 border-2 border-white relative z-10">
                  <ShieldCheck className="w-7 h-7" />
                </div>
              </div>

              {/* Security Pills */}
              <div className="flex items-center justify-center gap-2 flex-wrap relative z-10">
                <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-[#2563EB] text-[11px] font-bold px-3 py-1 rounded-full shadow-2xs">
                  <Check className="w-3 h-3 stroke-[3]" /> NDA Protected
                </span>
                <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-[#2563EB] text-[11px] font-bold px-3 py-1 rounded-full shadow-2xs">
                  <Check className="w-3 h-3 stroke-[3]" /> Encrypted
                </span>
              </div>
            </div>
          </ScrollReveal>

          {/* Card 3: Know What You Pay (Bottom Left - col-span-6) */}
          <ScrollReveal
            variant="fade-up"
            delay={300}
            className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-100 shadow-[0_15px_40px_-15px_rgba(15,23,42,0.06)] hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.12)] transition-all duration-300 flex flex-col justify-between relative group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] border border-blue-100 flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold font-['Lora',serif] text-[#0F172A] mb-2">
                Know What You Pay
              </h3>
              <p className="text-[#64748B] text-sm leading-relaxed font-normal mb-6">
                Get transparent quotes, broken down by material, process, finishing and quantity. No surprises.
              </p>
            </div>

            {/* Split Content: Receipt + Isometric Wireframe CAD Part */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
              {/* Receipt Box */}
              <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 sm:p-5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Quote Breakdown
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Material
                    </span>
                    <span className="font-mono text-slate-900 font-semibold">$120.00</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Machining
                    </span>
                    <span className="font-mono text-slate-900 font-semibold">$80.00</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Finishing
                    </span>
                    <span className="font-mono text-slate-900 font-semibold">$40.00</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Delivery
                    </span>
                    <span className="font-mono text-slate-900 font-semibold">$15.00</span>
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-200/80 flex items-center justify-between font-bold text-sm text-[#0F172A]">
                  <span>Total</span>
                  <span className="font-mono text-base text-[#2563EB]">$255.00</span>
                </div>
              </div>

              {/* Isometric Wireframe CAD Drawing SVG */}
              <div className="flex items-center justify-center p-2">
                <svg width="150" height="130" viewBox="0 0 160 140" fill="none" stroke="#2563EB" strokeWidth="1.2">
                  {/* Outer Isometric Block */}
                  <path d="M80 15 L140 45 L140 95 L80 125 L20 95 L20 45 Z" strokeDasharray="3 2" opacity="0.6" />
                  <path d="M80 15 L80 65 L140 95" />
                  <path d="M80 65 L20 95" />

                  {/* Central Boss / Hole Wireframe */}
                  <ellipse cx="80" cy="50" rx="26" ry="14" />
                  <ellipse cx="80" cy="70" rx="26" ry="14" strokeDasharray="2 2" opacity="0.5" />
                  <line x1="54" y1="50" x2="54" y2="70" />
                  <line x1="106" y1="50" x2="106" y2="70" />

                  {/* Mounting Holes */}
                  <ellipse cx="40" cy="70" rx="8" ry="4" />
                  <ellipse cx="120" cy="70" rx="8" ry="4" />
                </svg>
              </div>
            </div>
          </ScrollReveal>

          {/* Card 4: From 1 Part to Production (Bottom Right - col-span-6) */}
          <ScrollReveal
            variant="fade-up"
            delay={400}
            className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-100 shadow-[0_15px_40px_-15px_rgba(15,23,42,0.06)] hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.12)] transition-all duration-300 flex flex-col justify-between relative group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] border border-blue-100 flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold font-['Lora',serif] text-[#0F172A] mb-2">
                From 1 Part to Production
              </h3>
              <p className="text-[#64748B] text-sm leading-relaxed font-normal mb-8">
                Start with a single prototype, or scale to thousands. Our manufacturing network grows with your needs.
              </p>
            </div>

            {/* Scaling Stepper Bar */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 sm:p-5">
              <div className="grid grid-cols-7 items-center text-center">
                {/* Step 1: Active 1 Prototype */}
                <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-xl p-2.5 shadow-2xs">
                  <div className="text-base font-extrabold text-[#2563EB] font-mono">1</div>
                  <div className="text-[10px] font-bold text-[#2563EB] tracking-tight">prototype</div>
                </div>

                {/* Arrow */}
                <div className="col-span-1 flex items-center justify-center text-slate-300">
                  <ArrowRight className="w-4 h-4" />
                </div>

                {/* Step 2: 10 parts */}
                <div className="col-span-1 py-2">
                  <div className="text-sm font-bold text-slate-700 font-mono">10</div>
                  <div className="text-[10px] font-medium text-slate-400">parts</div>
                </div>

                {/* Arrow */}
                <div className="col-span-1 flex items-center justify-center text-slate-300">
                  <ArrowRight className="w-4 h-4" />
                </div>

                {/* Step 3: 100 parts */}
                <div className="col-span-1 py-2">
                  <div className="text-sm font-bold text-slate-700 font-mono">100</div>
                  <div className="text-[10px] font-medium text-slate-400">parts</div>
                </div>

                {/* Arrow & Step 4: 1,000+ parts */}
                <div className="col-span-1 py-2">
                  <div className="text-sm font-bold text-slate-700 font-mono">1,000+</div>
                  <div className="text-[10px] font-medium text-slate-400">parts</div>
                </div>
              </div>
            </div>
          </ScrollReveal>

        </div>

        {/* Bottom Trust Assurance Bar */}
        <ScrollReveal variant="scale-in" delay={300}>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm font-semibold text-[#64748B] pt-4">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" /> NDA Protected
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#2563EB]" /> Transparent Quotes
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#2563EB]" /> QC Inspected
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#2563EB]" /> Reliable Lead Times
            </span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

