'use client';

import React from 'react';
import { CircleDollarSign, ShieldCheck, Activity, Package, Lock, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { ScrollReveal, TextReveal } from '@/components/ScrollReveal';

export function TransparencySection() {
  return (
    <section id="transparency" className="py-24 bg-slate-50 text-slate-900 border-t border-slate-200">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <ScrollReveal variant="fade-down" delay={100}>
            <span className="text-[#2F5FA7] font-semibold tracking-wider uppercase text-xs">
              Our Commitment
            </span>
          </ScrollReveal>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-4 mb-6 text-[#0F172A]">
            <TextReveal text="We Work With Transparency" />
          </h2>
          <ScrollReveal variant="fade-up" delay={200}>
            <p className="text-slate-600 text-lg md:text-xl font-medium">
              No hidden fees. No black boxes. Just honest, predictable manufacturing.
            </p>
          </ScrollReveal>
        </div>

        {/* Feature Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-6xl mx-auto mb-20">
          
          {/* Card 1: Real-time Tracking (Wide) */}
          <ScrollReveal 
            variant="fade-up" 
            delay={100}
            className="md:col-span-8 group bg-white border border-slate-200 rounded-3xl p-8 md:p-10 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex flex-col md:flex-row gap-8 h-full">
              <div className="flex-1">
                <div className="w-12 h-12 bg-blue-50 text-[#2F5FA7] rounded-xl flex items-center justify-center mb-6">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Real-time Tracking</h3>
                <p className="text-slate-600 leading-relaxed">
                  Track your order from quote to delivery. You get full visibility at every stage of the manufacturing process directly from your dashboard.
                </p>
              </div>
              <div className="w-full md:w-64 bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col justify-center shrink-0">
                {/* Clean, professional step indicator */}
                <div className="space-y-4">
                  {[
                    { label: 'Quote Approved', active: true },
                    { label: 'In Production', active: true },
                    { label: 'Quality Check', active: false },
                    { label: 'Shipped', active: false },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${step.active ? 'bg-[#2F5FA7]' : 'bg-slate-300'}`} />
                      <span className={`text-sm font-semibold ${step.active ? 'text-slate-900' : 'text-slate-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Card 2: NDA Protected (Tall) */}
          <ScrollReveal 
            variant="fade-up" 
            delay={200}
            className="md:col-span-4 group bg-white border border-slate-200 rounded-3xl p-8 md:p-10 hover:shadow-lg transition-all duration-300 flex flex-col"
          >
            <div className="w-12 h-12 bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center mb-6">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">NDA Protected</h3>
            <p className="text-slate-600 leading-relaxed mb-8">
              Every design is protected by automated NDAs and AES-256 encryption. Your IP is strictly confidential.
            </p>
            <div className="mt-auto bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Default NDA active
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Data encrypted
              </div>
            </div>
          </ScrollReveal>

          {/* Card 3: Clear Pricing */}
          <ScrollReveal 
            variant="fade-up" 
            delay={300}
            className="md:col-span-5 group bg-white border border-slate-200 rounded-3xl p-8 md:p-10 hover:shadow-lg transition-all duration-300 flex flex-col"
          >
             <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
               <CircleDollarSign className="w-6 h-6" />
             </div>
             <h3 className="text-2xl font-bold text-slate-900 mb-3">Clear Pricing</h3>
             <p className="text-slate-600 leading-relaxed">
               Instant quotes with a full, transparent cost breakdown. What you see is what you pay.
             </p>
          </ScrollReveal>

          {/* Card 4: No Minimums */}
          <ScrollReveal 
            variant="fade-up" 
            delay={400}
            className="md:col-span-7 group bg-white border border-slate-200 rounded-3xl p-8 md:p-10 hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row gap-8 items-start md:items-center"
          >
             <div className="flex-1">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">No Minimum Orders</h3>
                <p className="text-slate-600 leading-relaxed">
                  Whether you need a single prototype or ten thousand production parts, we scale with you.
                </p>
             </div>
             <div className="w-full md:w-auto bg-slate-50 border border-slate-100 rounded-2xl py-5 px-8 flex items-center justify-center gap-6 shrink-0">
                <div className="text-center">
                  <div className="text-2xl font-black text-slate-900">1</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Part</div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300" />
                <div className="text-center">
                  <div className="text-2xl font-black text-slate-900">10k+</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Parts</div>
                </div>
             </div>
          </ScrollReveal>

        </div>

        {/* Trust Badges Row */}
        <ScrollReveal variant="scale-in" delay={300}>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-sm font-semibold text-slate-600">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-400" /> Enterprise-grade Security
            </span>
            <span className="hidden md:block text-slate-300">•</span>
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" /> Transparent Quotes
            </span>
            <span className="hidden md:block text-slate-300">•</span>
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" /> Reliable Lead Times
            </span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
