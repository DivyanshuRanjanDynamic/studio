'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Layers,
  Settings2,
  CornerDownRight,
  CircleDot,
  Shield,
  Wrench,
  ScanLine,
  Sparkles,
  Paintbrush,
  ArrowRight,
  CheckCircle,
  ShieldCheck,
  RefreshCw,
  Truck,
  Leaf,
} from 'lucide-react';
import { ScrollReveal, TextReveal } from '@/components/ScrollReveal';

interface Capability {
  id: string;
  name: string;
  category: string;
  image: string;
  description: string;
  tags: string[];
  slug: string;
  iconBg: string;
  iconColor: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const CAPABILITIES: Capability[] = [
  {
    id: '01',
    name: 'Precision Sheet Cutting',
    category: 'Sheet Metal',
    image: '/sheet_cutting_service.png',
    description: 'Laser & waterjet cutting with 2D designs from flat sheet stock with minimal accuracy.',
    tags: ['High Precision', 'Smooth Edges', 'Custom Shapes'],
    slug: '/services/precision-sheet-cutting',
    iconBg: 'bg-blue-100/80',
    iconColor: 'text-[#0066FF]',
    Icon: Layers,
  },
  {
    id: '02',
    name: 'CNC Milling / Turning',
    category: 'CNC Machining',
    image: '/cnc_machining_service.png',
    description: 'Remove material from a solid block to create complex 3D geometry with high tolerances.',
    tags: ['Tight Tolerances', 'Complex Geometries', 'High Finish'],
    slug: '/services/cnc-machining',
    iconBg: 'bg-indigo-100/80',
    iconColor: 'text-[#4F46E5]',
    Icon: Settings2,
  },
  {
    id: '03',
    name: 'Bending & Folding',
    category: 'Bending & Folding',
    image: '/bending_service.png',
    description: 'Precisely fold sheet metal along defined lines to produce structural angles & enclosures.',
    tags: ['Accurate Angles', 'Multiple Thicknesses', 'Large Panels'],
    slug: '/services/bending',
    iconBg: 'bg-emerald-100/80',
    iconColor: 'text-[#10B981]',
    Icon: CornerDownRight,
  },
  {
    id: '04',
    name: 'Countersinking',
    category: 'Reduced Tolerance',
    image: '/countersinking_service.png',
    description: 'Create tapered holes to sit flush with fasteners for a clean and professional finish.',
    tags: ['Flush Fit', 'Better Aesthetics', 'Secure Assembly'],
    slug: '/services/countersinking',
    iconBg: 'bg-cyan-100/80',
    iconColor: 'text-[#06B6D4]',
    Icon: CircleDot,
  },
  {
    id: '05',
    name: 'Dimple Forming',
    category: 'Custom Fabrication',
    image: '/dimple_forming_service.png',
    description: 'Form reinforced dimples to increase strength and reduce vibration in sheet metal parts.',
    tags: ['Stronger Parts', 'Vibration Resistant', 'Lightweight'],
    slug: '/services/dimple-forming',
    iconBg: 'bg-purple-100/80',
    iconColor: 'text-[#9333EA]',
    Icon: Shield,
  },
  {
    id: '06',
    name: 'Hardware Insertion',
    category: 'Hardware',
    image: '/hardware_insertion_service.png',
    description: 'Press-fit threaded inserts, standoffs, and PEM fasteners for durable and reliable assemblies.',
    tags: ['Strong Hold', 'Repeatable Process', 'Wide Range'],
    slug: '/services/hardware-insertion',
    iconBg: 'bg-amber-100/80',
    iconColor: 'text-[#D97706]',
    Icon: Wrench,
  },
  {
    id: '07',
    name: 'Precision Tapping',
    category: 'Threading',
    image: '/tapping_service.png',
    description: 'Create internal threads with high accuracy for secure, long-lasting connections.',
    tags: ['Metric / Imperial', 'High Accuracy', 'Clean Finish'],
    slug: '/services/tapping',
    iconBg: 'bg-blue-100/80',
    iconColor: 'text-[#2563EB]',
    Icon: ScanLine,
  },
  {
    id: '08',
    name: 'Anodizing',
    category: 'Surface Finishing',
    image: '/anodizing_service.png',
    description: 'Enhance corrosion resistance and aesthetics with durable, high-quality anodized coatings.',
    tags: ['Corrosion Resistant', 'Multiple Colors', 'Long Life'],
    slug: '/services/anodizing',
    iconBg: 'bg-teal-100/80',
    iconColor: 'text-[#0D9488]',
    Icon: Sparkles,
  },
  {
    id: '09',
    name: 'Powder Coating',
    category: 'Finishing',
    image: '/powder_coating_service.png',
    description: 'Electrostatic coating for a durable, impact-resistant, and visually appealing finish.',
    tags: ['Durable Finish', 'Scratch Resistant', 'Multiple Colors'],
    slug: '/services/powder-coating',
    iconBg: 'bg-pink-100/80',
    iconColor: 'text-[#DB2777]',
    Icon: Paintbrush,
  },
];

export function ServicesSection() {
  return (
    <section
      id="services"
      className="py-20 md:py-28 bg-[#F3F7FD] relative overflow-hidden border-t border-b border-blue-100/60"
    >
      {/* Background subtle blueprint grid pattern */}
      <div className="absolute inset-0 blueprint-grid opacity-[0.035] pointer-events-none" />

      {/* Top Left CAD drawing annotation */}
      <div className="hidden xl:block absolute left-4 top-16 w-44 pointer-events-none z-10">
        <span className="font-serif italic text-[#0066FF] text-xs block -rotate-3 font-medium">
          From CAD files to real parts
        </span>
        <svg className="w-8 h-8 text-[#0066FF] opacity-70 ml-12 my-1" viewBox="0 0 30 30" fill="none" stroke="currentColor">
          <path d="M 5 5 Q 15 15 10 25" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 5 20 L 10 25 L 15 20" strokeWidth="1.5" />
        </svg>
        <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs opacity-95">
          <svg width="90" height="60" viewBox="0 0 100 70" fill="none">
            <path d="M20 40 L50 20 L80 40 L50 60 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.5" />
            <path d="M20 40 L50 60 L50 70 L20 50 Z" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" />
            <path d="M50 60 L80 40 L80 50 L50 70 Z" fill="#94A3B8" stroke="#64748B" strokeWidth="1.5" />
            <circle cx="50" cy="40" r="8" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      {/* Lower Left annotation */}
      <div className="hidden xl:block absolute left-6 bottom-40 w-40 pointer-events-none z-10">
        <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 text-[#0066FF] flex items-center justify-center mb-1 shadow-2xs">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <span className="font-serif italic text-[#0066FF] text-xs block font-medium leading-tight max-w-[120px]">
          High quality parts, every time.
        </span>
        <svg className="w-8 h-8 text-[#0066FF] opacity-70 mt-1" viewBox="0 0 30 30" fill="none" stroke="currentColor">
          <path d="M 25 5 Q 10 10 5 25" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 10 20 L 5 25 L 5 18" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Top Right Checklist floating card */}
      <div className="hidden xl:block absolute right-6 top-16 w-44 pointer-events-none z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs space-y-2 text-xs font-bold text-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-[#0066FF]" />
            <span>CNC Precision</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-[#0066FF]" />
            <span>Quality Checked</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-[#0066FF]" />
            <span>On-time Delivery</span>
          </div>
        </div>
        <svg className="w-8 h-8 text-[#0066FF] opacity-70 ml-10 mt-1 -rotate-45" viewBox="0 0 30 30" fill="none" stroke="currentColor">
          <path d="M 5 5 Q 15 15 25 10" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 20 5 L 25 10 L 18 12" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Middle Right annotation */}
      <div className="hidden xl:block absolute right-4 top-1/2 -translate-y-1/2 w-44 pointer-events-none z-10">
        <span className="font-serif italic text-[#0066FF] text-xs block rotate-2 font-medium text-right pr-4">
          Precision meets performance.
        </span>
        <svg className="w-8 h-8 text-[#0066FF] opacity-70 ml-auto mr-8 my-1 rotate-90" viewBox="0 0 30 30" fill="none" stroke="currentColor">
          <path d="M 5 5 Q 15 15 25 20" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 20 15 L 25 20 L 20 25" strokeWidth="1.5" />
        </svg>
        <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs opacity-95 ml-auto w-32">
          <svg width="90" height="60" viewBox="0 0 100 70" fill="none">
            <rect x="20" y="15" width="60" height="40" rx="4" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />
            <circle cx="50" cy="35" r="12" fill="#CBD5E1" stroke="#475569" strokeWidth="1.5" />
            <circle cx="50" cy="35" r="6" fill="#F8FAFC" />
          </svg>
        </div>
      </div>

      {/* Bottom Right dot matrix & cube */}
      <div className="hidden xl:block absolute right-8 bottom-24 opacity-60 pointer-events-none z-10">
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-blue-400" />
          ))}
        </div>
        <svg width="24" height="24" viewBox="0 0 30 30" fill="none" stroke="#0066FF" strokeWidth="1">
          <path d="M15 5 L27 12 L27 24 L15 30 L3 24 L3 12 Z" />
          <path d="M15 5 L15 30" />
          <path d="M3 12 L15 18 L27 12" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <ScrollReveal variant="fade-down" delay={100}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0066FF]/20 bg-blue-50/80 px-4 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#0066FF] mb-3 shadow-2xs">
              <span className="text-[#0066FF]/50">—</span> OUR CAPABILITIES <span className="text-[#0066FF]/50">—</span>
            </div>
          </ScrollReveal>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0B192C] font-['Lora',serif] mt-1 mb-3.5 leading-tight tracking-tight">
            <TextReveal text="Everything You Need to" /> <span className="text-[#0066FF] font-sans font-black">Build</span>
          </h2>

          <ScrollReveal variant="fade-up" delay={150}>
            <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto font-medium leading-relaxed">
              Nine precision manufacturing capabilities. One automated platform. Delivered straight to your production line.
            </p>
          </ScrollReveal>
        </div>

        {/* 3x3 Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {CAPABILITIES.map((service, idx) => {
            const IconComp = service.Icon;
            return (
              <ScrollReveal
                key={service.id}
                variant="fade-up"
                staggerIndex={idx}
                staggerDelay={40}
                className="h-full"
              >
                <div className="group bg-white rounded-2xl p-4 sm:p-4.5 border border-slate-200/90 shadow-2xs hover:shadow-xl hover:border-[#0066FF] transition-all duration-300 flex flex-col justify-between h-full relative cursor-pointer">
                  {/* Top Image Container */}
                  <div>
                    <div className="relative w-full h-44 sm:h-48 rounded-xl overflow-hidden mb-4 border border-slate-100 bg-slate-50">
                      <Image
                        src={service.image}
                        alt={service.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Number Badge Top Left */}
                      <div className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-[#0066FF] text-white text-xs font-bold flex items-center justify-center shadow-md">
                        {service.id}
                      </div>
                      {/* Category Badge Top Right */}
                      <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                        {service.category}
                      </div>
                    </div>

                    {/* Content Section */}
                    {/* Icon Badge */}
                    <div className={`w-8 h-8 rounded-lg ${service.iconBg} ${service.iconColor} flex items-center justify-center mb-2.5 shadow-2xs`}>
                      <IconComp className="w-4 h-4" />
                    </div>

                    <h3 className="font-sans font-extrabold text-slate-900 text-base sm:text-lg mb-1.5 group-hover:text-[#0066FF] transition-colors">
                      {service.name}
                    </h3>

                    <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-4 font-normal">
                      {service.description}
                    </p>
                  </div>

                  <div>
                    {/* Tags Row */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {service.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] sm:text-[11px] font-semibold text-[#0066FF] bg-[#EFF6FF] border border-[#DBEAFE] px-2.5 py-0.5 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Bottom Link */}
                    <Link
                      href={service.slug}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0066FF] hover:underline group-hover:gap-2 transition-all"
                    >
                      <span>Learn more</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Bottom Consultation Banner */}
        <ScrollReveal variant="fade-up" delay={200}>
          <div className="mt-10 sm:mt-12 bg-[#E8F1FD] border border-blue-200/90 rounded-3xl sm:rounded-full p-4 sm:p-4.5 pl-5 sm:pl-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <div className="w-10 h-10 rounded-full bg-[#0066FF]/10 text-[#0066FF] flex items-center justify-center shrink-0 border border-[#0066FF]/20">
                <Wrench className="w-5 h-5 text-[#0066FF]" />
              </div>
              <div>
                <h4 className="font-sans font-extrabold text-slate-900 text-sm sm:text-base">
                  Don&apos;t see what you need?
                </h4>
                <p className="text-slate-600 text-xs font-normal">
                  Our engineering team can spec, quote, and manufacture custom parts across 50+ alloys & polymers.
                </p>
              </div>
            </div>

            <Link
              href="/contact"
              className="bg-[#0066FF] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full inline-flex items-center gap-2 shrink-0 transition-all shadow-md shadow-blue-500/20"
            >
              <span>Book Free Engineering Consultation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </ScrollReveal>

        {/* Trust Metrics Footer Bar */}
        <ScrollReveal variant="fade-up" delay={250}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-bold text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>Verified Vendors</span>
            </div>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>Fast Turnaround</span>
            </div>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>Secure Payments</span>
            </div>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>Pan India Delivery</span>
            </div>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>Sustainable Manufacturing</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
