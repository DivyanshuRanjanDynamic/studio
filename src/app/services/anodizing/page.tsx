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
  Droplet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingNav } from '@/components/LandingNav';
import { Footer } from '@/components/Footer';
import { ServiceHero } from '@/components/ServiceHero';
import { ServiceMaterialGrid } from '@/components/ServiceMaterialGrid';
import { ExpertCTA } from '@/components/part-creation/ExpertCTA';

export default function AnodizingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-blue-100 selection:text-[#2F5FA7] font-sans overflow-x-hidden">
      <LandingNav />

      <ServiceHero
        title="Industrial"
        subtitle="Anodizing"
        description="Electrochemical surface treatment for aluminum components. We provide Type II and Type III (Hardcoat) anodizing for enhanced corrosion resistance and surface hardness."
        badge="Surface Engineering"
        icon={Droplet}
        image="/anodizing_service.png"
        operationalStatus="Chemical Process Tanks Active"
        statusLabel="Operational Status"
        stats={[
          { label: 'Durability', value: 'High-Hardness', icon: ShieldCheck },
          { label: 'Corrosion', value: 'ISO Certified', icon: Zap },
        ]}
      />

      {/* Anodizing Standards Ribbon */}
      <section className="bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 md:px-10 lg:px-20 py-10 md:py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center">
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">
                Type II/III
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#2F5FA7]">
                Process Standard
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">
                5 - 50μm
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#2F5FA7]">
                Layer Thickness
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">
                60HRC
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#2F5FA7]">
                Surface Hardness
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">
                MIL-A-8625
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#2F5FA7]">
                Military Specs
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
              Surface Protection
            </h2>
            <p className="text-lg text-slate-600 font-medium">
              We provide institutional-grade chemical finishes that transform the surface of
              aluminum into a durable, corrosion-resistant oxide layer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Hardcoat Anodizing',
                desc: 'Type III anodizing provides a thick, dense oxide layer with extreme wear resistance, ideal for mechanical friction parts.',
                icon: ShieldCheck,
                img: 'https://images.unsplash.com/photo-1625464736004-b51a8d4efc54?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                color: 'bg-blue-600',
              },
              {
                title: 'Decorative Color',
                desc: 'Type II anodizing allows for vibrant, metallic finishes including Black, Clear, Blue, Gold, and Red with consistent dye absorption.',
                icon: Zap,
                img: 'https://plus.unsplash.com/premium_photo-1713200811001-af93d0dcdfc2?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                color: 'bg-blue-400',
              },
              {
                title: 'Dielectric Strength',
                desc: 'Anodized layers act as a ceramic insulator, providing high dielectric breakdown strength for electrical components.',
                icon: Settings,
                img: 'https://images.unsplash.com/photo-1495976797530-f33e6580e44b?q=80&w=1112&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                color: 'bg-[#2F5FA7]',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="group relative bg-slate-50 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-slate-100 hover:border-[#2F5FA7]/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
              >
                <div className="relative aspect-[4/3] mb-8 rounded-2xl overflow-hidden shadow-lg bg-white/80 group-hover:shadow-2xl transition-all duration-500 border border-slate-100 flex items-center justify-center p-8">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
                  <div
                    className={`absolute top-4 left-4 w-10 h-10 rounded-xl ${item.color} flex items-center justify-center text-white shadow-xl z-20`}
                  >
                    <item.icon className="w-5 h-5" />
                  </div>
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

          <ExpertCTA description="Looking for specific military specs (MIL-A-8625), PTFE impregnation for lubrication, or masking for electrical grounding zones? Our chemical engineers can help." />
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
                  <span className="text-cyan-400">Anodizing</span>
                </h2>
                <p className="text-xl text-slate-400 leading-relaxed font-medium">
                  Surface finish and part geometry dictate the uniformity of the oxide layer.
                </p>
              </div>

              <div className="space-y-8">
                {[
                  {
                    id: 'A1',
                    title: 'Dimensional Build-up',
                    desc: 'Account for 50% build-up in Type III anodizing. External dimensions will increase by half the coating thickness.',
                    icon: <Maximize2 className="w-5 h-5" />,
                  },
                  {
                    id: 'A2',
                    title: 'Racking Points',
                    desc: "Parts require a physical connection point for current flow. These 'rack marks' will not be anodized and should be placed internally.",
                    icon: <Settings className="w-5 h-5" />,
                  },
                  {
                    id: 'A3',
                    title: 'Surface Prep',
                    desc: 'A smooth machined finish results in a more reflective, uniform anodized layer. We recommend Ra 3.2 or better.',
                    icon: <Target className="w-5 h-5" />,
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
                  src="https://images.unsplash.com/photo-1533457620604-acba98a11c60?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Anodizing Engineering Guide"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-10">
                  <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl inline-flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Chemical Analysis
                      </p>
                      <p className="text-sm font-bold text-slate-900 text-nowrap">
                        Oxide Uniformity: 100% Verified
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
      <ServiceMaterialGrid serviceName="Anodizing" />

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
                Our controlled chemical pipeline ensures consistent layer thickness and color
                saturation for institutional batches.
              </p>
              <div className="block mt-12">
                <div className="w-full aspect-[4/5] relative rounded-[3rem] overflow-hidden shadow-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1581093510983-ca501aa99163?auto=format&fit=crop&q=80"
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
                  title: 'Pre-Treatment',
                  description:
                    'Parts are degreased and etched to remove impurities and prepare the surface for optimal oxide growth.',
                },
                {
                  step: '02',
                  title: 'Electrolytic Oxidation',
                  description:
                    'Parts are submerged in a temperature-controlled acid bath where electrical current promotes the growth of the Al2O3 layer.',
                },
                {
                  step: '03',
                  title: 'Sealing & Inspection',
                  description:
                    'The porous oxide layer is sealed in a boiling water bath or chemical sealant to maximize corrosion resistance and lock in dyes.',
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
            Aerospace Finishing
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-10 max-w-2xl mx-auto tracking-tighter uppercase leading-tight">
            Institutional-grade surface protection.
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-green-500" />
              <span className="font-bold text-slate-700 uppercase leading-none">
                Mil-Spec Certified
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-green-500" />
              <span className="font-bold text-slate-700 uppercase leading-none">
                Chemical Traceability
              </span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
