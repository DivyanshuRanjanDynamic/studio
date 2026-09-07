'use client';

import React from 'react';
import {
  Star,
  Users,
  Box,
  Zap,
  ShieldCheck,
  GraduationCap,
  Building2,
} from 'lucide-react';
import { ScrollReveal, TextReveal } from '@/components/ScrollReveal';

const TESTIMONIALS = [
  {
    stars: 5,
    tagBlue: 'Robotics',
    tagGrey: 'Prototype',
    quote:
      'MechHub helped us manufacture custom aluminium chassis parts for our robotics prototype within days. The quality, precision and support were way better than what we found locally — and at a student-friendly cost.',
    initials: 'AR',
    name: 'A.R.',
    role: 'Robotics Team, IIT',
  },
  {
    stars: 5,
    tagBlue: 'Drone',
    tagGrey: 'CNC Parts',
    quote:
      'We needed lightweight, high-precision parts for our drone frame. MechHub delivered exactly what we needed — great quality, fast turnaround and super helpful support throughout the process.',
    initials: 'VK',
    name: 'V.K.',
    role: 'Founder, Student Startup',
  },
  {
    stars: 5,
    tagBlue: 'EV',
    tagGrey: 'Production',
    quote:
      'From CAD to finished parts, MechHub made the entire process seamless. We ordered custom brackets and housings for our EV prototype and the fit and finish were excellent. Highly recommended for any hardware team.',
    initials: 'SP',
    name: 'S.P.',
    role: 'Design Team, EV Startup',
  },
];

const METRICS = [
  {
    icon: Users,
    value: '500+',
    label: 'Builders on MechHub',
  },
  {
    icon: Box,
    value: '10k+',
    label: 'Parts Shipped',
  },
  {
    icon: Zap,
    value: '2–4 Days',
    label: 'Rapid Lead Times',
  },
  {
    icon: ShieldCheck,
    value: '99%',
    label: 'On-time Delivery',
  },
];

const TRUSTED_TEAMS = [
  { name: 'IIT Bombay', icon: GraduationCap },
  { name: 'NIT Trichy', icon: GraduationCap },
  { name: 'BITS Pilani', icon: GraduationCap },
  { name: 'Startup Teams', icon: Building2 },
];

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="py-20 md:py-28 bg-[#F3F7FD] relative overflow-hidden border-t border-b border-blue-100/60"
    >
      {/* Background subtle blueprint grid pattern */}
      <div className="absolute inset-0 blueprint-grid opacity-[0.035] pointer-events-none" />

      {/* Blueprint Annotations Left Side */}
      <div className="hidden xl:block absolute left-4 top-10 pointer-events-none text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest leading-relaxed opacity-60">
        CUSTOM<br />MANUFACTURING<br />FOR A BRIGHTER<br />TOMORROW
      </div>

      <div className="hidden xl:block absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest leading-relaxed opacity-60">
        DESIGN<br />ITERATE<br />MANUFACTURE<br />BUILD
      </div>

      {/* Bottom Left Metallic Part Graphic & Handwritten Annotation */}
      <div className="hidden xl:block absolute left-4 bottom-6 pointer-events-none z-10">
        <div className="flex flex-col items-start">
          <svg width="120" height="90" viewBox="0 0 120 90" fill="none">
            {/* 3D Machined Metal Block */}
            <path d="M10 50 L60 20 L110 50 L60 80 Z" fill="url(#metalBase)" stroke="#94A3B8" strokeWidth="1.5" />
            <path d="M10 50 L60 80 L60 88 L10 58 Z" fill="#94A3B8" stroke="#64748B" strokeWidth="1.5" />
            <path d="M60 80 L110 50 L110 58 L60 88 Z" fill="#64748B" stroke="#475569" strokeWidth="1.5" />
            {/* Bore Holes */}
            <circle cx="40" cy="50" r="10" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />
            <circle cx="80" cy="50" r="8" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.5" />
            <defs>
              <linearGradient id="metalBase" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#CBD5E1" />
                <stop offset="100%" stopColor="#94A3B8" />
              </linearGradient>
            </defs>
          </svg>
          <div className="mt-1 flex items-center gap-1">
            <svg width="20" height="20" viewBox="0 0 30 30" fill="none" stroke="#0066FF" strokeWidth="1.5" className="rotate-45">
              <path d="M 5 25 Q 15 5 25 15" strokeDasharray="3 3" />
              <path d="M 20 10 L 25 15 L 20 20" />
            </svg>
            <span className="font-serif italic text-xs text-[#0066FF] font-medium leading-tight -rotate-2">
              Real Ideas<br />Real Impact
            </span>
          </div>
        </div>
      </div>

      {/* Blueprint Annotations Right Side */}
      <div className="hidden xl:block absolute right-6 top-10 pointer-events-none text-right">
        <span className="font-serif italic text-[#0066FF] text-sm block font-medium leading-tight rotate-3">
          Ideas<br />Into<br />Real Parts
        </span>
      </div>

      <div className="hidden xl:block absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest leading-relaxed opacity-60 text-right">
        PRECISION<br />FOR<br />PROGRESS
      </div>

      {/* Bottom Right Metallic Bracket Graphic & Annotation */}
      <div className="hidden xl:block absolute right-4 bottom-6 pointer-events-none z-10 text-right">
        <svg width="120" height="95" viewBox="0 0 120 95" fill="none">
          {/* L-Bracket 3D */}
          <path d="M30 70 L90 70 L90 85 L30 85 Z" fill="#94A3B8" stroke="#475569" strokeWidth="1.5" />
          <path d="M90 70 L115 50 L115 65 L90 85 Z" fill="#64748B" stroke="#334155" strokeWidth="1.5" />
          <path d="M30 20 L55 5 L55 70 L30 85 Z" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.5" />
          <path d="M55 5 L90 30 L90 70 L55 70 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
          <circle cx="42" cy="35" r="4" fill="#94A3B8" />
          <circle cx="42" cy="55" r="4" fill="#94A3B8" />
          <circle cx="70" cy="78" r="4" fill="#64748B" />
        </svg>
        <div className="mt-1 text-[9.5px] font-mono text-slate-400 font-bold uppercase tracking-widest opacity-60">
          MORE<br />BUILDERS<br />BIGGER<br />POSSIBILITIES
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Header Section */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <ScrollReveal variant="fade-down" delay={100}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0066FF]/20 bg-blue-50/80 px-4 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#0066FF] mb-3 shadow-2xs">
              <span className="text-[#0066FF]/50">—</span> TESTIMONIALS <span className="text-[#0066FF]/50">—</span>
            </div>
          </ScrollReveal>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0B192C] font-['Lora',serif] mt-1 mb-3.5 leading-tight tracking-tight">
            <TextReveal text="Built by Builders." /> <span className="text-[#0066FF] font-sans font-black">Trusted by Teams.</span>
          </h2>

          <ScrollReveal variant="fade-up" delay={150}>
            <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto font-medium leading-relaxed">
              From student prototypes to production-ready parts — see why teams choose MechHub.
            </p>
          </ScrollReveal>
        </div>

        {/* 3 Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {TESTIMONIALS.map((item, idx) => (
            <ScrollReveal
              key={item.name}
              variant="fade-up"
              staggerIndex={idx}
              staggerDelay={50}
              className="h-full"
            >
              <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs hover:shadow-xl hover:border-[#0066FF] transition-all duration-300 flex flex-col justify-between h-full relative group cursor-pointer">
                <div>
                  {/* Top Row: Stars + Tags */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-1 text-[#F59E0B]">
                      {Array.from({ length: item.stars }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[#F59E0B] stroke-[#F59E0B]" />
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#0066FF] bg-[#EFF6FF] border border-[#DBEAFE] px-2.5 py-0.5 rounded-full">
                        {item.tagBlue}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                        {item.tagGrey}
                      </span>
                    </div>
                  </div>

                  {/* Large Quote Mark */}
                  <div className="text-[#0066FF]/25 font-serif text-5xl leading-none -mb-3 select-none">
                    “
                  </div>

                  {/* Quote Body */}
                  <p className="text-slate-600 font-sans text-xs sm:text-sm leading-relaxed mb-6 font-normal">
                    {item.quote}
                  </p>
                </div>

                {/* Author Info */}
                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[#0066FF] font-extrabold text-xs flex items-center justify-center shrink-0">
                    {item.initials}
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-slate-900 text-sm leading-snug">
                      {item.name}
                    </h4>
                    <p className="text-slate-500 text-xs font-medium">
                      {item.role}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Horizontal Metrics Bar */}
        <ScrollReveal variant="fade-up" delay={200}>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 mb-10">
            {METRICS.map((m, i) => {
              const IconComp = m.icon;
              return (
                <div key={m.label} className={`flex items-center gap-3.5 ${i !== 0 ? 'pt-3 md:pt-0 md:pl-6' : ''}`}>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#0066FF] flex items-center justify-center shrink-0">
                    <IconComp className="w-5 h-5 text-[#0066FF]" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 font-sans tracking-tight">
                      {m.value}
                    </div>
                    <div className="text-xs font-medium text-slate-500">
                      {m.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Trusted By Logos / Pill Bar */}
        <ScrollReveal variant="fade-up" delay={250}>
          <div className="text-center">
            <div className="inline-flex items-center gap-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              <span className="w-8 h-px bg-slate-200" />
              <span>Trusted by Students, Startups and Innovation Teams</span>
              <span className="w-8 h-px bg-slate-200" />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {TRUSTED_TEAMS.map((item) => {
                const IconComp = item.icon;
                return (
                  <div
                    key={item.name}
                    className="bg-white border border-slate-200/90 rounded-full px-4 py-2 shadow-2xs flex items-center gap-2 text-xs font-bold text-slate-800 hover:border-[#0066FF] hover:text-[#0066FF] transition-all cursor-pointer"
                  >
                    <IconComp className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span>{item.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* Bottom Footer Blueprint Line */}
        <div className="mt-12 text-center text-[9px] font-mono text-slate-400 font-bold uppercase tracking-[0.25em] opacity-50">
          MECHHUB — MANUFACTURING TOMORROW TOGETHER
        </div>
      </div>
    </section>
  );
}
