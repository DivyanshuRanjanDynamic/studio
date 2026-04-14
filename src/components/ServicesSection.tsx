'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';

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
    <section id="services" className="relative py-20 md:py-28 bg-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(14,165,233,0.08),transparent_35%),radial-gradient(circle_at_90%_90%,rgba(37,99,235,0.08),transparent_35%)]" />
      <div className="absolute inset-0 blueprint-grid opacity-[0.03]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#2F5FA7]">
            <Sparkles className="h-3.5 w-3.5" />
            Manufacturing Services
          </div>
          <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-3xl text-3xl md:text-5xl font-black tracking-tight text-[#0F172A] leading-tight">
              Production-ready services for prototypes and scale.
            </h2>
            <Link
              href="/#materials"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#2F5FA7] hover:text-[#1E3A66] transition-colors"
            >
              Explore Materials
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
          {SERVICES.map((service) => (
            <Link
              key={service.num}
              href={service.href}
              className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-[#1E3A66] p-3 md:p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-300/40 hover:shadow-[0_20px_60px_rgba(14,165,233,0.15)] flex flex-col"
            >
              <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-xl border border-white/10">
                <Image
                  src={service.img}
                  alt={service.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent" />
               </div>

              <h3 className="text-lg font-extrabold tracking-tight text-white group-hover:text-sky-200 transition-colors">
                {service.title}
              </h3>
              <p className="mt-2 hidden text-sm leading-relaxed text-slate-300 sm:block">{service.desc}</p>
              <div className="mt-auto pt-4 inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.08em] text-sky-300 sm:text-xs sm:uppercase sm:tracking-[0.14em]">
                <span className="sm:hidden">More</span>
                <span className="hidden sm:inline">View Capability</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 sm:h-4 sm:w-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
