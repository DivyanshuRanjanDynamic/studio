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
  Cpu,
  RefreshCw,
  Box,
  Maximize2,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingNav } from '@/components/LandingNav';
import { Footer } from '@/components/Footer';
import { ServiceHero } from '@/components/ServiceHero';
import { ServiceMaterialGrid } from '@/components/ServiceMaterialGrid';
import { ExpertCTA } from '@/components/part-creation/ExpertCTA';

const CNC_SERVICES = [
  {
    title: '3-Axis Milling',
    desc: 'Precision milling for prismatic parts with high structural integrity and clean finishes.',
    tolerance: '± 0.005mm',
    speed: 'Rapid Setup',
    axis: '3-Axis Vertical',
    icon: Box,
    color: 'bg-blue-600',
    img: 'https://images.unsplash.com/photo-1602664876866-d3b33b77756b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    title: 'CNC Turning',
    desc: 'High-speed lathe operations for cylindrical components with excellent surface concentricity.',
    tolerance: '± 0.01mm',
    speed: 'Automated',
    axis: '2-Axis Horizontal',
    icon: RefreshCw,
    color: 'bg-[#2F5FA7]',
    img: 'https://images.unsplash.com/photo-1666618090858-fbcee636bd3e?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    title: 'Live Tooling',
    desc: 'Combined milling and turning operations in a single setup for complex mechanical parts.',
    tolerance: '± 0.008mm',
    speed: 'Complex Geometries',
    axis: 'Turn-Mill Multi-Tasking',
    icon: Cpu,
    color: 'bg-cyan-600',
    img: 'https://images.unsplash.com/photo-1666634157070-6fd830fb5672?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
];

export default function CNCMachiningPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-blue-100 selection:text-[#2F5FA7] font-sans overflow-x-hidden">
      <LandingNav />

      <ServiceHero
        title="Industrial"
        subtitle="CNC Milling/Turning"
        description="High-precision sub-millimeter machining for aerospace, medical, and defense sectors. We utilize 3-axis and 5-axis vertical machining centers for complex geometric execution."
        badge="Advanced Machining"
        icon={Settings}
        image="/cnc_machining_service.png"
        operationalStatus="VMC Lines Active"
        statusLabel="Operational Status"
        stats={[
          { label: 'Tolerance', value: '± 0.025mm Precision', icon: Target },
          { label: 'Production', value: 'Rapid Tooling', icon: Zap },
        ]}
      />

      {/* Capabilities Grid */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-10 lg:px-20">
          <div className="text-center max-w-3xl mx-auto mb-20 leading-tight">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 uppercase tracking-tighter">
              Machining Capabilities
            </h2>
            <p className="text-lg text-slate-600 font-medium">
              Our automated CNC facility ensures high repeatability and precision for everything
              from prototypes to production runs.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {CNC_SERVICES.map((service, index) => (
              <div
                key={index}
                className="group relative bg-slate-50 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-slate-100 hover:border-[#2F5FA7]/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
              >
                <div className="relative aspect-[4/3] mb-8 rounded-2xl overflow-hidden shadow-lg bg-white/80 group-hover:shadow-2xl transition-all duration-500 border border-slate-100">
                  <img
                    src={service.img}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-4 uppercase tracking-tighter">
                  {service.title}
                </h3>
                <p className="text-slate-600 mb-8 font-medium leading-relaxed italic">
                  {service.desc}
                </p>
                <div className="space-y-4 border-t border-slate-200 pt-8">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#2F5FA7]">
                      Axis
                    </span>
                    <span className="text-sm font-black text-slate-900">{service.axis}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#2F5FA7]">
                      Tolerance
                    </span>
                    <span className="text-sm font-black text-slate-900">{service.tolerance}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center pt-10">
            <ExpertCTA description="Looking for 5-axis simultaneous milling, micro-machining under 0.5mm, or complex turning in specialty alloys? Our CNC experts are available to consult on your custom geometry." />
          </div>
        </div>
      </section>

      {/* Standardized Material Grid */}
      <ServiceMaterialGrid serviceName="CNC Milling/Turning" />

      {/* DFM Guidelines */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#2F5FA7]/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-4 md:px-10 lg:px-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
            <div className="space-y-12">
              <div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 uppercase tracking-tighter">
                  Design for <br />
                  <span className="text-cyan-400">CNC Machining</span>
                </h2>
                <p className="text-xl text-slate-400 leading-relaxed font-medium">
                  Proper geometry ensures tool access and prevents chatter during the machining
                  process.
                </p>
              </div>

              <div className="space-y-8">
                {[
                  {
                    id: 'R',
                    title: 'Internal Radii',
                    desc: 'Always include internal corner radii (minimum 1.5mm) to accommodate standard milling cutters.',
                    icon: <Maximize2 className="w-5 h-5" />,
                  },
                  {
                    id: 'T',
                    title: 'Tapped Holes',
                    desc: 'Design pilot holes for M1.6 – M12 threads with at least 2x thread diameter clearance.',
                    icon: <Zap className="w-5 h-5" />,
                  },
                  {
                    id: 'W',
                    title: 'Wall Thickness',
                    desc: 'Maintain minimum 1mm wall thickness for aluminum and 0.5mm for steels to prevent deformation.',
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
              <div className="aspect-square md:aspect-[4/3] bg-white border-4 md:border-8 border-slate-900 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl relative">
                <img
                  src="https://images.unsplash.com/photo-1713371398484-cc4e4f6a262a?q=80&w=1331&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="CNC Part Visualization"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6 md:p-10">
                  <div className="bg-white/95 backdrop-blur-md px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl shadow-xl inline-flex items-center gap-3 md:gap-4">
                    <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Tool Path Check
                      </p>
                      <p className="text-sm font-bold text-slate-900 text-nowrap">
                        Valid Tool Clearance: 100%
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

      {/* How it Works */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-10 lg:px-20 relative z-10">
          <div className="flex flex-col lg:flex-row gap-20">
            <div className="lg:w-1/3">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 uppercase tracking-tighter leading-none">
                Machining <br />
                <span className="text-blue-600">Workflow</span>
              </h2>
              <p className="text-slate-600 font-medium mb-12">
                Our automated CNC pipeline minimizes setup time and ensures consistent results for
                institutional batches.
              </p>
              <div className="block mt-12">
                <div className="w-full aspect-[4/5] relative rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1531289172671-1ed49202fb47?auto=format&fit=crop&q=80"
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
                  title: 'CAD Analysis',
                  description:
                    'Upload your STEP or SLDPRT files. Our AI-driven analysis identifies features and generates optimal toolpaths instantly.',
                },
                {
                  step: '02',
                  title: 'Material Sourcing',
                  description:
                    'We stock verified aerospace-grade blocks and rods (Al 6061, SS 304, etc.) to ensure predictable material behavior.',
                },
                {
                  step: '03',
                  title: 'Precision Machining',
                  description:
                    'Our multi-axis machines execute the toolpaths with automated coolant management and dimensional verification.',
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
            Precision Engineering
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-10 max-w-2xl mx-auto tracking-tighter uppercase leading-tight">
            Institutional-grade CNC parts.
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-green-500" />
              <span className="font-bold text-slate-700 uppercase leading-none">
                Verified Tolerances
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-green-500" />
              <span className="font-bold text-slate-700 uppercase leading-none">
                Traceable Sourcing
              </span>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
