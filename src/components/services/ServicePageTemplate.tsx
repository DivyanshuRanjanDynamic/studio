'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ProcessIllustration } from '@/components/services/ProcessIllustration';
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { V2Shell } from '@/components/V2Shell';
import { ServiceHero } from '@/components/ServiceHero';
import { ExpertCTA } from '@/components/part-creation/ExpertCTA';
import { ScrollReveal } from '@/components/ScrollReveal';
import type { FactTable } from '@/lib/services/service-facts';
import {
  GlowCard,
  TiltCard,
  MagneticWrap,
  Marquee,
  GlassPanel,
  SerifAccent,
  PillBadge,
  CustomCursor,
  MotionStyles,
} from './MotionEffects';
import { useParallax } from '@/hooks/use-motion-effects';

// ── Config types ──

export interface ServiceCapability {
  title: string;
  desc: string;
  icon: LucideIcon;
}

export interface DfmRule {
  id: string;
  title: string;
  desc: string;
}

export interface ProcessStep {
  step: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface ServicePageConfig {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroBadge: string;
  heroIcon: LucideIcon;
  heroImage: string;
  heroStatus: string;
  heroStatusLabel: string;
  heroStats: { label: string; value: string; icon: LucideIcon }[];
  capabilities: ServiceCapability[];
  expertCta: string;
  materialsTable: () => FactTable;
  exampleTable: () => FactTable;
  exampleTable2?: () => FactTable;
  orderMinimumInr: number | null;
  turnaroundTable: () => FactTable;
  costDrivers: string[];
  instantPricing: boolean;
  dfmTitle: string;
  dfmIntro: string;
  dfmRules: DfmRule[];
  dfmImage: string;
  processTitle: string;
  processSubtitle: string;
  processImage: string;
  processSteps: ProcessStep[];
  faq?: FaqItem[];
  footerTag: string;
  footerHeading: string;
  footerBadges: string[];
}

// ── Table renderer ──

function DataTable({ table, className = '' }: { table: FactTable; className?: string }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200">
            {table.columns.map((c, i) => (
              <th
                key={i}
                className="py-3 px-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400 whitespace-nowrap font-mono"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((r, i) => (
            <tr
              key={i}
              className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80 transition-colors duration-200"
            >
              {r.cells.map((c, j) => (
                <td key={j} className="py-3.5 px-4 text-neutral-700 whitespace-nowrap">
                  {j === 0 ? (
                    <span className="flex items-center gap-2.5 font-medium">
                      {c}
                      {r.instant ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                          Instant
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200/60">
                          Engineer
                        </span>
                      )}
                    </span>
                  ) : (
                    c
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.caption && (
        <p className="text-xs text-neutral-400 mt-3 leading-relaxed">{table.caption}</p>
      )}
    </div>
  );
}

// ── Parallax DFM image ──

function ParallaxImage({ src, alt }: { src: string; alt: string }) {
  const ref = useParallax<HTMLDivElement>(0.06);
  return (
    <div ref={ref} className="mh-parallax-bg relative">
      <div className="aspect-square md:aspect-[4/3] bg-neutral-100 rounded-2xl md:rounded-3xl overflow-hidden shadow-xl relative">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition-transform duration-700 hover:scale-105"
        />
      </div>
    </div>
  );
}

// ── Main template ──

export function ServicePageTemplate({ config }: { config: ServicePageConfig }) {
  const c = config;
  return (
    <V2Shell noFooter>
      <MotionStyles />
      <CustomCursor />

      {/* ── Hero ── */}
      <ServiceHero
        title={c.heroTitle}
        subtitle={c.heroSubtitle}
        description={c.heroDescription}
        badge={c.heroBadge}
        icon={c.heroIcon}
        image={c.heroImage}
        operationalStatus={c.heroStatus}
        statusLabel={c.heroStatusLabel}
        stats={c.heroStats}
      />

      {/* ── Marquee ticker ── */}
      <div className="border-y border-neutral-200 py-3.5 bg-white overflow-hidden">
        <Marquee speed={30} className="text-neutral-500">
          {c.capabilities.map((cap, i) => (
            <span key={i} className="text-[11px] font-semibold uppercase tracking-[0.2em] flex items-center gap-4 font-mono">
              {cap.title}
              <span className="text-[#2563eb]/40">✦</span>
            </span>
          ))}
          {c.footerBadges.map((b, i) => (
            <span key={`b-${i}`} className="text-[11px] font-semibold uppercase tracking-[0.2em] flex items-center gap-4 font-mono">
              {b}
              <span className="text-[#2563eb]/40">✦</span>
            </span>
          ))}
        </Marquee>
      </div>

      {/* ── Capabilities ── */}
      <section className="py-28 bg-white">
        <div className="container mx-auto px-6 md:px-10 lg:px-20">
          <ScrollReveal variant="fade-up">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <PillBadge className="mb-6">Key Capabilities</PillBadge>
              <h2 className="text-4xl md:text-[3.5rem] leading-[1.1] font-medium text-neutral-900 tracking-tight">
                Everything You <SerifAccent>Need</SerifAccent>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {c.capabilities.map((cap, i) => (
              <ScrollReveal key={i} variant="fade-up" delay={i * 120}>
                <TiltCard className="h-full" maxDeg={4}>
                  <GlowCard
                    className="group relative bg-white rounded-2xl p-8 border border-neutral-200 h-full mh-card-float"
                    glowColor="rgba(37, 99, 235, 0.06)"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-600 group-hover:text-[#2563eb] group-hover:border-[#2563eb]/20 transition-all duration-300">
                        <cap.icon className="w-6 h-6" />
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-[#2563eb] transition-colors duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transform" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-3 tracking-tight">
                      {cap.title}
                    </h3>
                    <p className="text-[15px] text-neutral-500 leading-relaxed">{cap.desc}</p>
                  </GlowCard>
                </TiltCard>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal variant="fade-up" delay={400}>
            <div className="flex items-center justify-center pt-14">
              <ExpertCTA description={c.expertCta} />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Materials ── */}
      <section className="py-28 bg-neutral-50/70 border-y border-neutral-100 relative overflow-hidden">
        <div className="container mx-auto px-6 md:px-10 lg:px-20 relative z-10">
          <ScrollReveal variant="fade-up">
            <div className="mb-14">
              <PillBadge className="mb-6">Materials In Stock</PillBadge>
              <h2 className="text-4xl md:text-[3.5rem] leading-[1.1] font-medium text-neutral-900 tracking-tight max-w-xl">
                Precision <SerifAccent>Materials</SerifAccent>
              </h2>
              <p className="text-neutral-500 mt-4 max-w-2xl text-[15px] leading-relaxed">
                Every material below is stocked and ready to run. Grades, thicknesses and finishes come
                straight from our inventory system.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={150}>
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8 shadow-sm">
              <DataTable table={c.materialsTable()} />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── How it's priced ── */}
      <section className="py-28 bg-white">
        <div className="container mx-auto px-6 md:px-10 lg:px-20">
          <ScrollReveal variant="fade-up">
            <div className="max-w-3xl mb-16">
              <PillBadge className="mb-6">Transparent Pricing</PillBadge>
              <h2 className="text-4xl md:text-[3.5rem] leading-[1.1] font-medium text-neutral-900 tracking-tight">
                Know What You <SerifAccent>Pay</SerifAccent>
              </h2>
              <p className="text-neutral-500 mt-4 text-[15px] leading-relaxed">
                {c.instantPricing
                  ? 'Upload your file and get an instant price. Here is what goes into it.'
                  : 'This service is quoted by our engineers. Here is what drives the price.'}
              </p>
            </div>
          </ScrollReveal>

          {/* Cost drivers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-16">
            {c.costDrivers.map((d, i) => (
              <ScrollReveal key={i} variant="fade-up" delay={i * 60}>
                <div className="flex items-center gap-3 px-5 py-3.5 bg-neutral-50 rounded-xl border border-neutral-100 mh-card-float cursor-default">
                  <span className="text-[10px] font-semibold text-neutral-300 font-mono">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm text-neutral-700">{d}</span>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Example prices */}
          <ScrollReveal variant="fade-up" delay={100}>
            <div className="space-y-8">
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400 font-mono">Example Prices</span>
                </div>
                <DataTable table={c.exampleTable()} />
              </div>

              {c.exampleTable2 && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8 shadow-sm">
                  <DataTable table={c.exampleTable2()} />
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Order minimum + turnaround */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-14">
            <ScrollReveal variant="fade-up" delay={0}>
              <div className="bg-[#2563eb]/[0.03] rounded-2xl p-8 border border-[#2563eb]/10">
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#2563eb] font-mono">Order Minimum</span>
                {c.orderMinimumInr !== null ? (
                  <p className="text-neutral-700 mt-4 leading-relaxed">
                    You can order a single part. The minimum order value is{' '}
                    <span className="font-semibold text-neutral-900">₹{c.orderMinimumInr.toLocaleString('en-IN')}</span>{' '}
                    per line item (rush orders multiply this). Volume pricing lowers the per-part cost
                    automatically.
                  </p>
                ) : (
                  <p className="text-neutral-700 mt-4 leading-relaxed">
                    This operation is bundled with your cutting or machining order. No separate minimum.
                  </p>
                )}
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" delay={100}>
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8 shadow-sm">
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400 font-mono mb-6 block">Turnaround</span>
                <DataTable table={c.turnaroundTable()} />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── DFM section ── */}
      <section className="py-28 bg-neutral-950 text-white overflow-hidden relative">
        <div className="container mx-auto px-6 md:px-10 lg:px-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
            <div className="space-y-10">
              <ScrollReveal variant="fade-up">
                <div>
                  <PillBadge className="mb-6 border-white/10 bg-white/5 text-white/80">Design Guidelines</PillBadge>
                  <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] leading-[1.1] font-medium tracking-tight">
                    Design for{' '}
                    <span className="font-heading italic text-[#60a5fa]">{c.dfmTitle}</span>
                  </h2>
                  <p className="text-lg text-neutral-400 leading-relaxed mt-6">{c.dfmIntro}</p>
                </div>
              </ScrollReveal>
              <div className="space-y-4">
                {c.dfmRules.map((rule, i) => (
                  <ScrollReveal key={rule.id} variant="fade-left" delay={i * 120}>
                    <div className="flex gap-5 p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-400 group mh-card-float">
                      <div className="text-2xl font-mono font-light text-neutral-600 group-hover:text-[#60a5fa] transition-colors duration-300 shrink-0 w-8 text-center">
                        {rule.id}
                      </div>
                      <div>
                        <h4 className="text-[15px] font-semibold mb-1.5 text-white/90">{rule.title}</h4>
                        <p className="text-sm text-neutral-500 leading-relaxed">{rule.desc}</p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>

            <ScrollReveal variant="scale-in" delay={200}>
              <ParallaxImage src={c.dfmImage} alt={`Design for ${c.dfmTitle}`} />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Process steps ── */}
      <section className="py-28 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6 md:px-10 lg:px-20 relative z-10">
          <div className="flex flex-col lg:flex-row gap-20">
            <div className="lg:w-5/12">
              <ScrollReveal variant="fade-up">
                <PillBadge className="mb-6">The Process</PillBadge>
                <h2 className="text-4xl md:text-[3.5rem] leading-[1.1] font-medium text-neutral-900 tracking-tight">
                  {c.processTitle}{' '}
                  <SerifAccent>{c.processSubtitle}</SerifAccent>
                </h2>
              </ScrollReveal>
              <ScrollReveal variant="fade-up" delay={200}>
                <div className="block mt-14">
                  <ProcessIllustration />
                </div>
              </ScrollReveal>
            </div>

            <div className="lg:w-7/12 space-y-0">
              {c.processSteps.map((item, idx) => (
                <ScrollReveal key={idx} variant="fade-up" delay={idx * 100}>
                  <div className="flex gap-6 md:gap-8 py-10 border-b border-neutral-100 last:border-0 group">
                    <div className="text-4xl md:text-5xl font-mono font-light text-neutral-200 group-hover:text-[#2563eb]/30 transition-colors duration-400 leading-none shrink-0 w-16 pt-1">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-neutral-900 mb-3 tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-[15px] text-neutral-500 leading-relaxed max-w-lg">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
              <ScrollReveal variant="fade-up" delay={400}>
                <div className="pt-12">
                  <MagneticWrap strength={0.15}>
                    <Link href="/login?redirect=/dashboard">
                      <Button
                        size="lg"
                        className="group/btn px-10 h-14 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full font-medium text-sm gap-3 tracking-wide uppercase shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <span className="text-neutral-400 group-hover/btn:text-white transition-colors">→</span>
                        Start Your Project
                        <ArrowUpRight className="w-4 h-4 opacity-50 group-hover/btn:opacity-100 transition-opacity" />
                      </Button>
                    </Link>
                  </MagneticWrap>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      {c.faq && c.faq.length > 0 && (
        <section className="py-28 bg-neutral-50/70 border-t border-neutral-100">
          <div className="container mx-auto px-6 md:px-10 lg:px-20">
            <div className="flex flex-col lg:flex-row gap-20">
              <div className="lg:w-1/3">
                <div className="sticky top-32">
                  <ScrollReveal variant="fade-up">
                    <PillBadge className="mb-6">FAQ</PillBadge>
                    <h2 className="text-4xl font-medium text-neutral-900 tracking-tight leading-[1.1]">
                      Technical{' '}
                      <SerifAccent>Questions</SerifAccent>
                    </h2>
                  </ScrollReveal>
                </div>
              </div>
              <div className="lg:w-2/3 space-y-4">
                {c.faq.map((item, idx) => (
                  <ScrollReveal key={idx} variant="fade-up" delay={idx * 80}>
                    <div className="p-7 bg-white rounded-2xl border border-neutral-200 hover:border-neutral-300 transition-all duration-300 mh-card-float shadow-sm">
                      <h3 className="text-[15px] font-semibold text-neutral-900 mb-3 flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] shrink-0" />
                        {item.q}
                      </h3>
                      <p className="text-[15px] text-neutral-500 leading-relaxed pl-[18px]">{item.a}</p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer CTA ── */}
      <section className="py-28 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6 text-center relative z-10">
          <ScrollReveal variant="fade-up">
            <PillBadge className="mb-8">{c.footerTag}</PillBadge>
            <h2 className="text-4xl md:text-[3.5rem] leading-[1.1] font-medium text-neutral-900 mb-10 max-w-2xl mx-auto tracking-tight">
              {c.footerHeading}
            </h2>
            <div className="flex flex-wrap justify-center gap-3 mb-14">
              {c.footerBadges.map((b, i) => (
                <div key={i} className="flex items-center gap-2.5 mh-card-float cursor-default px-4 py-2.5 rounded-full bg-white border border-neutral-200 shadow-sm">
                  <span className="text-emerald-500 text-xs">✓</span>
                  <span className="text-[11px] font-semibold text-neutral-600 uppercase tracking-[0.1em] font-mono">{b}</span>
                </div>
              ))}
            </div>
            <MagneticWrap strength={0.12}>
              <Link href="/login?redirect=/dashboard">
                <Button
                  size="lg"
                  className="group/btn px-10 h-14 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-full font-medium text-sm gap-3 tracking-wide uppercase shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="text-blue-300 group-hover/btn:text-white transition-colors">→</span>
                  Upload Your Design
                  <ArrowUpRight className="w-4 h-4 opacity-50 group-hover/btn:opacity-100 transition-opacity" />
                </Button>
              </Link>
            </MagneticWrap>
          </ScrollReveal>
        </div>
      </section>
    </V2Shell>
  );
}
