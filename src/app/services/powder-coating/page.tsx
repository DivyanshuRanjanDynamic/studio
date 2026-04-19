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
  Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingNav } from '@/components/LandingNav';
import { Footer } from '@/components/Footer';
import { ServiceHero } from '@/components/ServiceHero';
import { ServiceMaterialGrid } from '@/components/ServiceMaterialGrid';
import { ExpertCTA } from '@/components/part-creation/ExpertCTA';

export default function PowderCoatingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-blue-100 selection:text-[#2F5FA7] font-sans overflow-x-hidden">
      <LandingNav />

      <ServiceHero
        title="Industrial"
        subtitle="Powder Coating"
        description="High-durability polymer finish for metal components. We provide institutional-grade electrostatic coating with RAL color matching and multiple surface textures."
        badge="Surface Protection"
        icon={Palette}
        image="/powder_coating_service.png"
        operationalStatus="Electrostatic Lines Active"
        statusLabel="Operational Status"
        stats={[
          { label: 'Durability', value: 'Impact Resistant', icon: ShieldCheck },
          { label: 'Finish', value: 'RAL Color Range', icon: Zap },
        ]}
      />

      {/* Coating Standards Ribbon */}
      <section className="bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 md:px-10 lg:px-20 py-10 md:py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center">
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">
                RAL 700+
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#2F5FA7]">
                Color Options
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">
                60 - 120μm
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#2F5FA7]">
                Coating Thickness
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">
                200°C
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#2F5FA7]">
                Curing Temp
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">
                UV Stable
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#2F5FA7]">
                Weather Resistance
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
              Premium Finishing
            </h2>
            <p className="text-lg text-slate-600 font-medium">
              We provide professional-grade powder coating that offers a much tougher finish than
              conventional liquid paints, ideal for industrial machinery and enclosures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Electrostatic Bond',
                desc: 'Charged powder particles wrap around the component for 100% coverage, even in complex recessed geometries.',
                icon: Zap,
                img: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?auto=format&fit=crop&q=80',
                color: 'bg-blue-600',
              },
              {
                title: 'Material Compatibility',
                desc: 'Applicable to Aluminum, Carbon Steel, and Galvanized components with proper pre-treatment.',
                icon: Layers,
                img: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80',
                color: 'bg-blue-400',
              },
              {
                title: 'Texture Variety',
                desc: 'Available in Matte, Gloss, Sand-texture, and Hammer-tone finishes to meet aesthetic requirements.',
                icon: Settings,
                img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80',
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
            <ExpertCTA description="Looking for specific RAL colors, high-heat powders for engine components, or specialized UV-stable architectural coatings? Our finishing team can match any spec." />
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
                  <span className="text-cyan-400">Powder Coating</span>
                </h2>
                <p className="text-xl text-slate-400 leading-relaxed font-medium">
                  Proper part grounding and thermal stability are key for a successful cured finish.
                </p>
              </div>

              <div className="space-y-8">
                {[
                  {
                    id: 'C1',
                    title: 'Hanging Points',
                    desc: 'Parts are hung by hooks. Ensure there is a non-critical hole (min 3mm) for hanging or a hidden internal edge.',
                    icon: <Settings className="w-5 h-5" />,
                  },
                  {
                    id: 'C2',
                    title: 'Sharp Edges',
                    desc: 'Powder tends to thin on sharp edges. Radius all external edges (min 0.5mm) for better coating adhesion.',
                    icon: <Maximize2 className="w-5 h-5" />,
                  },
                  {
                    id: 'C3',
                    title: 'Thermal Limits',
                    desc: 'The component must withstand 200°C for 20 minutes. All plastic or rubber inserts must be removed.',
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
                  src="https://res.cloudinary.com/dypbvtojf/image/upload/v1773985558/powder-coating-process-600nw-2489824637_mndp2w.webp"
                  alt="Powder Coating Engineering Guide"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-10">
                  <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl inline-flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Curing Verification
                      </p>
                      <p className="text-sm font-bold text-slate-900 text-nowrap">
                        Cross-Hatch Adhesion Tested
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
                <span className="text-blue-600">Coating Path</span>
              </h2>
              <p className="text-slate-600 font-medium mb-12">
                Our automated coating line ensures deep color saturation and impact resistance for
                institutional metallic components.
              </p>
              <div className="block mt-12">
                <div className="w-full aspect-[4/5] relative rounded-[3rem] overflow-hidden shadow-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1590483734724-383b853b317d?auto=format&fit=crop&q=80"
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
                  title: 'Sanding & Degreasing',
                  description:
                    'Surfaces are mechanically abraded and chemically cleaned to ensure maximum electrostatic adhesion of the powder.',
                },
                {
                  step: '02',
                  title: 'Electrostatic Spraying',
                  description:
                    'Dry powder is sprayed via a charged gun, wrapping around the part and clinging to every surface through Coulombic force.',
                },
                {
                  step: '03',
                  title: 'Thermal Curing',
                  description:
                    'Parts enter our industrial ovens where the powder melts, flows, and cross-links into a continuous, tough polymer film.',
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
            Industrial Aesthetics
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-10 max-w-2xl mx-auto tracking-tighter uppercase leading-tight">
            Institutional-grade protective coatings.
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-green-500" />
              <span className="font-bold text-slate-700 uppercase leading-none">
                RAL Color Verified
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-green-500" />
              <span className="font-bold text-slate-700 uppercase leading-none">
                High Impact Strength
              </span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
