'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Settings,
  Zap,
  ShieldCheck,
  Target,
  Maximize2,
  Layers,
  ChevronRight,
  Anchor,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingNav } from '@/components/LandingNav';
import { Footer } from '@/components/Footer';
import { ServiceHero } from '@/components/ServiceHero';
import { ServiceMaterialGrid } from '@/components/ServiceMaterialGrid';
import { ExpertCTA } from '@/components/part-creation/ExpertCTA';

export default function HardwareInsertionPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-blue-100 selection:text-[#2F5FA7] font-sans overflow-x-hidden">
      <LandingNav />

      <ServiceHero
        title="Automated"
        subtitle="Hardware Insertion"
        description="High-force hydraulic insertion for PEM® brand and compatible self-clinching fasteners. We provide permanent, high-torque threads in thin sheet metal assemblies."
        badge="Assembly Solutions"
        icon={Anchor}
        image="/hardware_insertion_service.png"
        operationalStatus="Hydraulic Press Station Online"
        statusLabel="Operational Status"
        stats={[
          { label: 'Strength', value: 'High-Torque Fit', icon: Zap },
          { label: 'Standard', value: 'PEM® Compatible', icon: ShieldCheck },
        ]}
      />

      {/* Hardware Standards Ribbon */}
      <section className="bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 md:px-10 lg:px-20 py-10 md:py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center">
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">
                M2 - M8
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#2F5FA7]">
                Metric Nuts
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">
                #2 - 5/16"
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#2F5FA7]">
                SAE Studs
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">
                6T - 8T
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#2F5FA7]">
                Press Force
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">
                0.8 - 4.8mm
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#2F5FA7]">
                Sheet Thickness
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-10 lg:px-20">
          <div className="text-center max-w-3xl mx-auto mb-20 leading-tight">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 uppercase tracking-tighter">
              Clinching Technology
            </h2>
            <p className="text-lg text-slate-600 font-medium">
              We utilize automated Haeger® presses to install self-clinching nuts, studs, and
              standoffs that become a permanent part of the substrate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Self-Clinching Nuts',
                desc: 'Permanent high-strength internal threads (PEM style) for thin sheets where tapping is not feasible.',
                icon: ShieldCheck,
                img: 'https://plus.unsplash.com/premium_photo-1677612031010-5424f4ea90ff?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                color: 'bg-blue-600',
              },
              {
                title: 'Standoffs & Spacers',
                desc: 'Automated insertion of threaded pillars for PCB mounting and structural parallel plate alignment.',
                icon: Settings,
                img: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80',
                color: 'bg-blue-400',
              },
              {
                title: 'Threaded Studs',
                desc: 'Flush-mount external threaded fasteners for grounding points and component mounting applications.',
                icon: Zap,
                img: 'https://images.unsplash.com/photo-1564226591723-659ff3852b2a?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                color: 'bg-[#2F5FA7]',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="group relative bg-slate-50 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-slate-100 hover:border-[#2F5FA7]/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
              >
                <div className="relative aspect-[4/3] mb-8 rounded-2xl overflow-hidden shadow-lg bg-white/80 group-hover:shadow-2xl transition-all duration-500 border border-slate-100 ">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-4 uppercase tracking-tighter">
                  {item.title}
                </h3>
                <p className="text-slate-600 mb-8 font-medium leading-relaxed italic">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center pt-14">
            <ExpertCTA description="Looking for specific PEM fastener types, custom standoff heights, or high-density insertion patterns? Our assembly experts can help optimize your hardware BOM." />
          </div>
        </div>
      </section>

      {/* Engineering Guidelines */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#2F5FA7]/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-4 md:px-10 lg:px-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
            <div className="space-y-12">
              <div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 uppercase tracking-tighter">
                  Design for <br />
                  <span className="text-cyan-400">Self-Clinching</span>
                </h2>
                <p className="text-xl text-slate-400 leading-relaxed font-medium">
                  Proper hole sizing and edge distance are critical to prevent sheet deformation
                  during high-pressure insertion.
                </p>
              </div>

              <div className="space-y-8">
                {[
                  {
                    id: 'H1',
                    title: 'Hole Tolerance',
                    desc: 'Clinching holes must be within +0.08mm / -0.00mm. We recommend laser cutting for perfect fitment.',
                    icon: <ShieldCheck className="w-5 h-5" />,
                  },
                  {
                    id: 'H2',
                    title: 'Edge Distance',
                    desc: 'The center of the hole should be at least 2.5x the hole diameter from any edge to prevent bulging.',
                    icon: <Maximize2 className="w-5 h-5" />,
                  },
                  {
                    id: 'H3',
                    title: 'Material Hardness',
                    desc: 'The substrate must be softer than the fastener. Most Al and CRS grades are perfectly compatible.',
                    icon: <Layers className="w-5 h-5" />,
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-6 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-cyan-400/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-400/30 font-black text-xl group-hover:scale-110 transition-transform">
                      {item.id}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2 flex items-center gap-2">
                        {item.title}
                      </h4>
                      <p className="text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative group">
              <div className="aspect-[4/3] bg-white border-8 border-slate-900 rounded-[3rem] overflow-hidden shadow-2xl relative p-12">
                <img
                  src="https://images.unsplash.com/photo-1653914697498-4d6a0c3d158f?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Hardware Insertion Engineering Guide"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-10">
                  <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl inline-flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Insertion Check
                      </p>
                      <p className="text-sm font-bold text-slate-900 text-nowrap">
                        Auto-Pressure Calibration Active
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -z-10 -bottom-6 -right-6 w-full h-full border-4 border-cyan-400 rounded-[3rem] opacity-30 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Standardized Material Grid */}
      <ServiceMaterialGrid serviceName="Sheet Cutting" />

      {/* How it Works */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-10 lg:px-20 relative z-10">
          <div className="flex flex-col lg:flex-row gap-20">
            <div className="lg:w-1/3">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 uppercase tracking-tighter leading-none">
                The <br />
                <span className="text-blue-600">Assembly Path</span>
              </h2>
              <p className="text-slate-600 font-medium mb-12">
                Our configurator identifies hole networks for self-clinching hardware and assigns
                the correct press tools automatically.
              </p>
              <div className="block mt-12">
                <div className="w-full aspect-[4/5] relative rounded-[3rem] overflow-hidden shadow-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80"
                    alt="Process Visualization"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-blue-600/20 mix-blend-multiply" />
                </div>
              </div>
            </div>

            <div className="lg:w-2/3 space-y-12">
              {[
                {
                  step: '01',
                  title: 'Fastener Mapping',
                  description:
                    'Upload your CAD. Our system detects standard PEM® hole sizes and prompts you to select the corresponding hardware (Nuts, Studs, Standoffs).',
                },
                {
                  step: '02',
                  title: 'Tagging & Pressure',
                  description:
                    'Indicate which holes receive hardware. Our engine calculates the required insertion force based on material type and thickness.',
                },
                {
                  step: '03',
                  title: 'Automated Pressing',
                  description:
                    'Once confirmed, the design is queued for our automated Haeger® presses where pressure is strictly controlled for a permanent lock.',
                },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-6 md:gap-10 group">
                  <div className="text-5xl md:text-6xl font-black text-slate-200 group-hover:text-[#2F5FA7]/20 transition-colors leading-none">
                    {item.step}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tighter">
                      {item.title}
                    </h3>
                    <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-xl">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}

              <div className="pt-10">
                <Link href="/login?redirect=/dashboard">
                  <Button
                    size="lg"
                    className="w-full md:w-auto px-16 h-20 bg-[#2F5FA7] hover:bg-blue-700 text-white rounded-[2rem] font-black text-xl gap-4 shadow-[0_20px_50px_rgba(47,95,167,0.3)]"
                  >
                    Start Your Project <ArrowRight className="w-6 h-6" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-black text-[#2F5FA7] uppercase tracking-[0.3em] mb-4">
            Mechanical Integration
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-10 max-w-2xl mx-auto tracking-tighter uppercase leading-tight">
            Institutional-grade fastener integration.
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-green-500" />
              <span className="font-bold text-slate-700 uppercase leading-none">
                PEM® Grade Standards
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-green-500" />
              <span className="font-bold text-slate-700 uppercase leading-none">
                Industrial Resilience
              </span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
