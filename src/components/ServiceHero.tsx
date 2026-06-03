'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollReveal, TextReveal } from '@/components/ScrollReveal';

interface ServiceHeroProps {
  title: string;
  subtitle: string;
  description: string;
  stats: { label: string; value: string; icon: LucideIcon }[];
  image: string;
  operationalStatus: string;
  statusLabel: string;
  icon: LucideIcon;
  badge: string;
}

export function ServiceHero({
  title,
  subtitle,
  description,
  stats,
  image,
  operationalStatus,
  statusLabel,
  icon: Icon,
  badge,
}: ServiceHeroProps) {
  return (
    <section className="relative min-h-[60vh] lg:h-[90vh] flex items-center py-10 lg:py-0 overflow-hidden bg-slate-950">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(#ffffff 1px, transparent 1px), linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '20px 20px, 100px 100px, 100px 100px',
        }}
      />

      <div className="container mx-auto px-4 md:px-10 lg:px-20 relative z-10 mt-16 md:mt-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content Column */}
          <div className="space-y-6 md:space-y-8">
            <ScrollReveal variant="fade-down" delay={100}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[10px] md:text-xs font-bold tracking-widest uppercase mb-2">
                <Icon className="w-4 h-4" />
                {badge}
              </div>
            </ScrollReveal>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tighter uppercase">
              <TextReveal text={title} /> <br />
              <ScrollReveal variant="fade-left" delay={300} as="span" className="inline-block text-cyan-300">
                {subtitle}
              </ScrollReveal>
            </h1>

            <ScrollReveal variant="fade-up" delay={200}>
              <p className="text-sm md:text-lg text-white/80 max-w-xl leading-relaxed font-medium">
                {description}
              </p>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" delay={300}>
              <div className="flex flex-wrap gap-6 pt-4 border-t border-white/10">
                {stats.map((stat, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-white font-bold">
                    <stat.icon className="w-5 h-5 text-cyan-300" />
                    <span className="text-sm md:text-base">{stat.value}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" delay={400}>
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Link href="/login?redirect=/dashboard">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-8 h-14 bg-white hover:bg-slate-100 text-[#2F5FA7] rounded-full font-black text-base gap-2 shadow-2xl transition-all hover:scale-105 active:scale-95"
                  >
                    Get a Quote <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          </div>

          {/* Image Column */}
          <ScrollReveal variant="scale-in" delay={300} className="relative group">
            <div className="absolute -inset-4 bg-white/10 rounded-[3rem] blur-2xl group-hover:bg-cyan-500/10 transition-all duration-700 opacity-50" />
            <div className="relative rounded-[2rem] md:rounded-[3rem] overflow-hidden border-4 md:border-8 border-white/10 shadow-2xl aspect-[4/3] bg-slate-900/40 backdrop-blur-sm">
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 md:p-10">
                <div className="bg-white/95 backdrop-blur-md px-5 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl shadow-xl inline-flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
                  <div>
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#2F5FA7] leading-none mb-1">
                      {statusLabel}
                    </p>
                    <p className="text-sm md:text-base font-bold text-slate-900 leading-none">
                      {operationalStatus}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
