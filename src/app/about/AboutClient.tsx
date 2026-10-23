'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Target, Zap, Factory, Cpu, Mail, MapPin } from 'lucide-react';
import { V2Shell } from '@/components/V2Shell';
import { Reveal, Tag } from '@/components/home/primitives';

const STATS = [
  { value: '₹40,000 Cr', label: 'Total Addressable Market' },
  { value: '20+', label: 'Verified MechMasters' },
  { value: '24h', label: 'Average Bidding Response' },
];

const DIFFERENTIATORS = [
  {
    icon: Cpu,
    title: 'AI-Powered DFM',
    desc: 'Every file is verified for manufacturability — eliminating rejection cycles before they start.',
  },
  {
    icon: Zap,
    title: 'Rapid Deployment',
    desc: 'Institutional quotes delivered in under 24 hours. No competitor in India matches this throughput.',
  },
  {
    icon: Factory,
    title: 'Verified Clusters',
    desc: 'Localized manufacturing network ensures 24–72 hour delivery across Tier 1 cities.',
  },
];

export default function AboutClient() {
  return (
    <V2Shell>
      {/* Hero */}
      <section className="lp-hero-dots py-20 md:py-32">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-5">
          <Reveal>
            <Tag>About MechHub</Tag>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-5 max-w-4xl text-[3rem] leading-[0.95] tracking-tight md:text-[5rem]">
              Architecting the{' '}
              <span className="font-lp-serif italic">Future of Fabrication.</span>
            </h1>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-6 max-w-2xl text-lg text-lp-muted-fg">
              MechHub is an institutional-grade marketplace connecting design teams with verified
              CNC, laser, and fabrication experts — making precision production accessible,
              reliable, and lightning-fast.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-lp-border py-12">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-4 sm:px-5 md:grid-cols-3">
          {STATS.map((stat) => (
            <Reveal key={stat.label}>
              <div className="text-center md:text-left">
                <div className="text-[3rem] font-normal leading-none tracking-tight">
                  {stat.value}
                </div>
                <div className="lp-label-mono mt-2 text-lp-muted-fg">{stat.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-5">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <Reveal>
                <div className="flex size-12 items-center justify-center bg-lp-accent text-lp-primary">
                  <Target className="size-6" />
                </div>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="mt-5 text-3xl tracking-tight">The Strategic Mission</h2>
              </Reveal>
              <Reveal delay={120}>
                <p className="mt-4 text-lp-muted-fg leading-relaxed">
                  India&apos;s custom manufacturing market is worth ₹40,000 Crore — yet there remains
                  no unified platform connecting buyers with precision manufacturing shops.
                </p>
                <p className="mt-4 text-lp-muted-fg leading-relaxed">
                  MechHub bridges this gap. We are building a vertically integrated infrastructure
                  where any engineer can upload a CAD file, receive an instant DFM review, and get
                  matched with a verified manufacturing partner (
                  <span className="text-lp-primary font-medium">MechMasters</span>).
                </p>
              </Reveal>
            </div>
            <Reveal delay={100}>
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200"
                  alt="Industrial Focus"
                  fill
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="bg-lp-card py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-5">
          <Reveal>
            <h2 className="text-center text-[3rem] leading-[0.95] tracking-tight md:text-[4rem]">
              Why Engineers Choose{' '}
              <span className="font-lp-serif italic">MechHub</span>
            </h2>
          </Reveal>
          <Reveal delay={60}>
            <p className="mx-auto mt-4 max-w-xl text-center text-sm text-lp-muted-fg">
              Built for engineers, by engineers. We own the standards for precision procurement.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {DIFFERENTIATORS.map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <div className="group border border-lp-border bg-lp-bg p-10 transition-colors hover:border-lp-primary">
                  <div className="flex size-14 items-center justify-center bg-lp-accent text-lp-primary transition-transform group-hover:scale-110">
                    <item.icon className="size-7" />
                  </div>
                  <h3 className="mt-6 text-xl tracking-tight">{item.title}</h3>
                  <p className="mt-3 text-sm text-lp-muted-fg leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / Liaison */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-5">
          <Reveal>
            <div className="lp-grid-bg bg-lp-ink p-12 text-lp-ink-fg md:p-20">
              <div className="grid items-center gap-16 lg:grid-cols-2">
                <div>
                  <h2 className="text-3xl tracking-tight md:text-[3.5rem] md:leading-[0.95]">
                    Connect with the{' '}
                    <span className="font-lp-serif italic opacity-70">Hub Presence.</span>
                  </h2>
                  <p className="mt-6 text-sm opacity-60 leading-relaxed">
                    Strategic partners of the prestigious IIM Bangalore ecosystem. We are redefining
                    precision procurement for India.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-4">
                    <div className="flex items-center gap-3 border border-lp-ink-fg/15 px-5 py-3">
                      <Mail className="size-4 text-lp-primary" />
                      <span className="text-sm">outreach@mechhub.in</span>
                    </div>
                    <div className="flex items-center gap-3 border border-lp-ink-fg/15 px-5 py-3">
                      <MapPin className="size-4 text-lp-primary" />
                      <span className="text-sm leading-tight">Wakad, Pune, Maharashtra</span>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:flex items-center justify-center">
                  <div className="border border-lp-ink-fg/10 bg-lp-ink-fg/5 p-10">
                    <Image src="/mechhub-logo.svg" alt="MechHub" width={80} height={80} />
                    <div className="lp-tag mt-4 mx-auto w-fit">SyncHubb Innovations</div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </V2Shell>
  );
}
