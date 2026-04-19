'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Settings,
  Zap,
  ShieldCheck,
  Target,
  CheckCircle2,
  Info,
  Layers,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingNav } from '@/components/LandingNav';
import { Footer } from '@/components/Footer';
import { ServiceHero } from '@/components/ServiceHero';
import { ServiceMaterialGrid } from '@/components/ServiceMaterialGrid';
import { ExpertCTA } from '@/components/part-creation/ExpertCTA';

export default function CountersinkingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-blue-100 selection:text-[#2F5FA7] font-sans overflow-x-hidden">
      <LandingNav />

      <ServiceHero
        title="Precision"
        subtitle="Countersinking"
        description="Professional-grade hole finishing for flush-mounted fasteners. Our automated process ensures consistent 82° and 90° angles with micron-level depth control."
        badge="Flush Mounting Systems"
        icon={Maximize2}
        image="/countersinking_service.png"
        operationalStatus="Drilling Station Active"
        statusLabel="Operational Status"
        stats={[
          { label: 'Position', value: '± 0.2mm Position', icon: Target },
          { label: 'Standard', value: '82° & 90° Standard', icon: Zap },
        ]}
      />

      <section className="bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 md:px-10 lg:px-20 py-10 md:py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center">
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">
                82° / 90°
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#2F5FA7]">
                Standard Angles
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">
                Max 60%
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#2F5FA7]">
                Thickness Depth
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">
                #0 - 1/2"
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#2F5FA7]">
                SAE Sizes
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">
                M1 - M12
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#2F5FA7]">
                Metric Sizes
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
              Flush Hole Finishing
            </h2>
            <p className="text-lg text-slate-600 font-medium">
              We provide clean, burr-free countersinks compatible with industrial fasteners and
              aerospace standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Precision Angularity',
                desc: 'Maintain strict 82° and 90° angles for perfect fastener alignment and flush seating.',
                icon: ShieldCheck,
                img: 'https://images.unsplash.com/photo-1582719202015-42a5aecad3af?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                color: 'bg-blue-600',
              },
              {
                title: 'Consistent Depth',
                desc: 'Automated depth stop controls ensure every countersink is identical across large production runs.',
                icon: Target,
                img: 'https://images.unsplash.com/photo-1524514587686-e2909d726e9b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                color: 'bg-blue-400',
              },
              {
                title: 'Burr-Free Finish',
                desc: 'Optimized tool speeds and feed rates prevent edge rolling and exit burrs on sensitive materials.',
                icon: Zap,
                img: '/Burr-Free-Finish.png',
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

          <div className="flex items-center justify-center pt-10">
            <ExpertCTA description="Need non-standard pilot sizes, unique 100° aerospace countersinks, or work on hardened substrates? Our precision team can handle your requirement." />
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
                  <span className="text-cyan-400">Flush Mounts</span>
                </h2>
                <p className="text-xl text-slate-400 leading-relaxed font-medium">
                  Proper countersink geometry is critical for fastener load distribution. Follow
                  these safety rules.
                </p>
              </div>

              <div className="space-y-8">
                {[
                  {
                    id: 'C1',
                    title: 'Head Diameter',
                    desc: 'The countersink major diameter must be at least 0.2mm larger than the screw head diameter.',
                    icon: <Maximize2 className="w-5 h-5" />,
                  },
                  {
                    id: 'C2',
                    title: 'Minimum Thickness',
                    desc: 'Unprotected countersinks require material at least 1.5x thicker than the countersink depth.',
                    icon: <Zap className="w-5 h-5" />,
                  },
                  {
                    id: 'C3',
                    title: 'Hole Preparation',
                    desc: 'Holes must be pre-drilled or CNC cut before countersinking to ensure concentricity and finish.',
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
                  src="https://res.cloudinary.com/dypbvtojf/image/upload/v1773985400/hole-aluminum-metal-made-chamfer-600nw-2733529461_wrekrv.webp"
                  alt="Countersinking Geometry Guide"
                  className="object-cover transition-transform duration-700 group-hover:scale-105 mx-auto"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-10">
                  <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl inline-flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Geometry Check
                      </p>
                      <p className="text-sm font-bold text-slate-900 text-nowrap">
                        Concentricity Tolerance ± 0.1mm
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
                <span className="text-blue-600">Finishing Path</span>
              </h2>
              <p className="text-slate-600 font-medium mb-12">
                Our configurator identifies hole geometries and calculates tool depth automatically
                during the quoting process.
              </p>
              <div className="block mt-12">
                <div className="w-full aspect-[4/5] relative rounded-[3rem] overflow-hidden shadow-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?auto=format&fit=crop&q=80"
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
                  title: 'Fastener Selection',
                  description:
                    'Upload your CAD. Our system detects holes and prompts you to select fastener type (SAE vs Metric) and desired fit.',
                },
                {
                  step: '02',
                  title: 'Tagging & Limits',
                  description:
                    'Indicate which holes require countersinking. Our engine instantly checks material thickness against depth limits.',
                },
                {
                  step: '03',
                  title: 'Automated Tooling',
                  description:
                    'Once confirmed, the design is queued for our automated countersinking stations where depth is strictly controlled.',
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
            Mechanical Perfection
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-10 max-w-2xl mx-auto tracking-tighter uppercase leading-tight">
            Flush surfaces for your assemblies.
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-green-500" />
              <span className="font-bold text-slate-700 uppercase leading-none">
                Institutional Finish
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-green-500" />
              <span className="font-bold text-slate-700 uppercase leading-none">
                Aerospace Precision
              </span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
