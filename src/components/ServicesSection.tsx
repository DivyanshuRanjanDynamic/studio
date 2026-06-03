'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollReveal, TextReveal } from '@/components/ScrollReveal';

const SERVICES = [
  {
    num: '01',
    title: 'Precision Sheet Cutting',
    desc: 'Laser cutting, waterjet, and CNC routing for sheet materials.',
    img: 'https://res.cloudinary.com/dypbvtojf/image/upload/v1773983927/3e6da763-3528-4151-803a-895414e5e3b5.png',
    href: '/services/precision-sheet-cutting',
  },
  {
    num: '02',
    title: 'CNC Milling/Turning',
    desc: 'Multi-axis CNC processing in billet stock.',
    img: 'https://res.cloudinary.com/dypbvtojf/image/upload/v1773985132/CNC-milling-housing-300x292_ppqvvc.jpg',
    href: '/services/cnc-machining',
  },
  {
    num: '03',
    title: 'Bending',
    desc: 'Bends within 1 degree of accuracy or better.',
    img: 'https://res.cloudinary.com/dypbvtojf/image/upload/v1773984524/sheet-metal-bending-parts-014_ofmchf.jpg',
    href: '/services/bending',
  },
  {
    num: '04',
    title: 'Countersinking',
    desc: 'Allow hardware to sit flush on your parts to reduce wear and tear.',
    img: 'https://res.cloudinary.com/dypbvtojf/image/upload/v1773985400/hole-aluminum-metal-made-chamfer-600nw-2733529461_wrekrv.webp',
    href: '/services/countersinking',
  },
  {
    num: '05',
    title: 'Dimple Forming',
    desc: 'Reinforce and enhance your parts with dimples up to 3".',
    img: 'https://res.cloudinary.com/dypbvtojf/image/upload/v1773984647/1771003010117-dimple-forming-1.jpg_rbtfn0.jpg',
    href: '/services/dimple-forming',
  },
  {
    num: '06',
    title: 'Hardware Insertion',
    desc: 'Add strong, permanent fasteners to your metal parts.',
    img: 'https://res.cloudinary.com/dypbvtojf/image/upload/v1773984866/inserting_tisw_TitleImageSwap500x408_u9dldf.webp',
    href: '/services/hardware-insertion',
  },
  {
    num: '07',
    title: 'Tapping',
    desc: 'Add threading for screws, bolts, and assembly hardware.',
    img: 'https://res.cloudinary.com/dypbvtojf/image/upload/v1773985261/Threaded-Holes-Vs-Tapped-Holes-e1723621552746_jkg74r.png',
    href: '/services/tapping',
  },
  {
    num: '08',
    title: 'Anodizing',
    desc: 'Increase durability with Class II anodizing in 5 color options.',
    img: 'https://res.cloudinary.com/dypbvtojf/image/upload/v1773985502/anodized-parts_c6bzzo.webp',
    href: '/services/anodizing',
  },
  {
    num: '09',
    title: 'Powder Coating',
    desc: 'A bold, long-lasting protective finish available in 11 options.',
    img: 'https://res.cloudinary.com/dypbvtojf/image/upload/v1773985460/powder-coated-profile_e6k4yo.png',
    href: '/services/powder-coating',
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="relative py-20 md:py-28 bg-[#0B1D35] overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(14,165,233,0.12),transparent_40%),radial-gradient(circle_at_90%_85%,rgba(37,99,235,0.08),transparent_40%)]" />
      <div className="absolute inset-0 blueprint-grid opacity-[0.06]" />

      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header — centered, premium layout */}
        <div className="max-w-6xl mx-auto text-center mb-12 md:mb-16">
          <ScrollReveal variant="fade-down" delay={100}>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300 mb-6 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Manufacturing Services
            </div>
          </ScrollReveal>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-5 leading-tight">
            <TextReveal text="Everything You Need to Build" />
          </h2>
          <ScrollReveal variant="fade-up" delay={200}>
            <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base font-medium text-balance">
              From raw sheet to finished part — all under one roof. Production-ready services for
              prototypes and scale.
            </p>
          </ScrollReveal>
        </div>

        {/* Services Grid — 3×3 */}
        <div className="max-w-6xl mx-auto grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
          {SERVICES.map((service, idx) => (
            <ScrollReveal
              key={service.num}
              variant="fade-up"
              staggerIndex={idx}
              staggerDelay={100}
              className="h-full"
            >
              <Link
                href={service.href}
                className="group relative h-full overflow-hidden rounded-2xl md:rounded-[1.25rem] border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-sky-400/30 hover:bg-white/[0.06] flex flex-col"
              >
                {/* Shimmer border on hover */}
                <div className="absolute inset-0 rounded-2xl md:rounded-[1.25rem] overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-[-1px] rounded-2xl md:rounded-[1.25rem] bg-gradient-to-r from-transparent via-sky-400/20 to-transparent animate-shimmer" />
                </div>

                {/* Card inner */}
                <div className="relative p-3 md:p-4 flex flex-col h-full">
                  {/* Image */}
                  <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-xl md:rounded-2xl border border-white/[0.06]">
                    <Image
                      src={service.img}
                      alt={service.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B1D35]/90 via-[#0B1D35]/20 to-transparent" />

                    {/* Number badge */}
                    <div className="absolute top-2.5 left-2.5 md:top-3 md:left-3">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
                        <span className="text-[9px] md:text-[10px] font-bold text-white/80 font-mono tracking-tight">
                          {service.num}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-base md:text-lg font-extrabold tracking-tight text-white group-hover:text-sky-200 transition-colors duration-300 leading-snug">
                    {service.title}
                  </h3>
                  <p className="mt-2 hidden text-[13px] leading-relaxed text-slate-400 sm:block">
                    {service.desc}
                  </p>

                  {/* CTA */}
                  <div className="mt-auto pt-4 inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.08em] text-sky-300/80 group-hover:text-sky-300 sm:text-xs sm:uppercase sm:tracking-[0.14em] transition-colors duration-300">
                    <span className="sm:hidden">More</span>
                    <span className="hidden sm:inline">View Capability</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 sm:h-4 sm:w-4" />
                  </div>
                </div>

                {/* Bottom glow on hover */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-sky-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              </Link>
            </ScrollReveal>
          ))}
        </div>

        {/* CTA Banner — "Don't see what you need?" */}
        <ScrollReveal variant="fade-up" delay={200} className="max-w-4xl mx-auto mt-14 md:mt-20">
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm overflow-hidden">
            {/* Background accent */}
            <div className="absolute top-0 right-0 w-60 h-60 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start gap-4 relative z-10 text-center md:text-left">
              <div className="hidden md:flex w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-400/20 items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-sky-300" />
              </div>
              <div>
                <p className="text-white font-bold text-base md:text-lg mb-1">
                  Don&rsquo;t see what you need?
                </p>
                <p className="text-slate-400 text-sm font-medium">
                  Talk to our engineers about custom manufacturing capabilities.
                </p>
              </div>
            </div>

            <Link href="/login?redirect=/consultation" className="relative z-10 w-full md:w-auto shrink-0">
              <Button className="w-full md:w-auto h-12 px-8 text-sm font-bold bg-white hover:bg-white/90 text-[#0B1D35] rounded-full shadow-lg shadow-white/5 transition-all duration-300 hover:-translate-y-0.5">
                Book Consultation
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </ScrollReveal>

        {/* Bottom explore link */}
        <ScrollReveal variant="fade-up" delay={300} className="max-w-6xl mx-auto mt-8 flex justify-center">
          <Link
            href="/#materials"
            className="inline-flex items-center gap-2 text-sm font-bold text-sky-300/70 hover:text-sky-300 transition-colors duration-300"
          >
            Explore Materials
            <ArrowRight className="w-4 h-4" />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
