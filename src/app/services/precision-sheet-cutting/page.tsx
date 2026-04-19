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
  Scissors,
  Droplets,
  Wrench,
  Maximize2,
  Layers,
  Clock,
  Boxes,
  Truck,
  FileCode2,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingNav } from '@/components/LandingNav';
import { Footer } from '@/components/Footer';
import { ServiceHero } from '@/components/ServiceHero';
import { ServiceMaterialGrid } from '@/components/ServiceMaterialGrid';
import { ExpertCTA } from '@/components/part-creation/ExpertCTA';

const CUTTING_SERVICES = [
  {
    title: 'Fiber Laser Cutting',
    desc: 'The industrial standard for high-speed, high-precision metal fabrication. Our fiber lasers deliver clean edges and intricate detail with minimal heat-affected zones.',
    tolerance: '± 0.005" (0.127mm)',
    thickness: '0.4mm – 19mm',
    icon: Zap,
    color: 'bg-blue-600',
    img: '/laser-cutting.png',
  },
  {
    title: 'Abrasive Waterjet',
    desc: 'A powerful, cold-cutting process ideal for thick plates and heat-sensitive materials. Perfect for maintaining material properties without edge hardening.',
    tolerance: '± 0.009" (0.228mm)',
    thickness: '1.0mm – 57mm',
    icon: Droplets,
    color: 'bg-blue-400',
    img: '/waterjet-cutting.png',
  },
  {
    title: 'CNC Routing',
    desc: 'Mechanical precision for large-format sheets. Optimized for non-ferrous metals, industrial plastics, and composite materials requiring structural accuracy.',
    tolerance: '± 0.009" (0.228mm)',
    thickness: '3.0mm – 12.7mm',
    icon: Wrench,
    color: 'bg-[#2F5FA7]',
    img: '/cnc-routing.png',
  },
];

export default function PrecisionSheetCuttingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-blue-100 selection:text-[#2F5FA7] font-sans overflow-x-hidden">
      <LandingNav />

      <ServiceHero
        title="Industrial Grade"
        subtitle="Sheet Metal Cutting"
        description="State-of-the-art fiber laser, waterjet, and CNC routing services. Get instant DFM feedback, no minimum orders, and rapid lead times starting at just 2 days."
        badge="Institutional Fabrication"
        icon={Scissors}
        image="/focus-image.jpg"
        operationalStatus="Fiber Laser & Waterjet Lines Active"
        statusLabel="Operational Status"
        stats={[
          { label: 'Tolerances', value: 'Up to ±0.005"', icon: Target },
          { label: 'Lead Time', value: 'Ships in 2-4 Days', icon: Zap },
        ]}
      />

      {/* Cutting Methods Grid */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-10 lg:px-20">
          <div className="text-center max-w-3xl mx-auto mb-20 leading-tight">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 uppercase tracking-tighter">
              Cutting Capabilities
            </h2>
            <p className="text-lg text-slate-600 font-medium">
              We utilize multiple industrial technologies to ensure the perfect finish and
              dimensional accuracy for every material type.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {CUTTING_SERVICES.map((service, index) => (
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
                      Tolerance
                    </span>
                    <span className="text-sm font-black text-slate-900">{service.tolerance}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#2F5FA7]">
                      Max Thickness
                    </span>
                    <span className="text-sm font-black text-slate-900">{service.thickness}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center pt-10">
            <ExpertCTA description="If your project requires material types not listed above, extreme precision beyond ± 0.1mm, or specialized edge finishing (like deburring/rounding), connect with our expert team." />
          </div>
        </div>
      </section>

      {/* Why Choose MechHub */}
      <section className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="container mx-auto px-4 md:px-10 lg:px-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: 'No Minimum Orders',
                desc: "Whether it's a single prototype or a production run of 10,000, we provide the same institutional quality with no MOQ constraints.",
                icon: Boxes,
                color: 'text-blue-600',
              },
              {
                title: 'Industrial Precision',
                desc: 'Our state-of-the-art fiber lasers and waterjets maintain tight tolerances (up to ±0.005") across a wide range of materials and thicknesses.',
                icon: Target,
                color: 'text-cyan-600',
              },
              {
                title: 'Rapid Lead Times',
                desc: 'Leveraging automated DFM and high-speed equipment, we offer industry-leading turnaround times, shipping parts in as little as 2 days.',
                icon: Clock,
                color: 'text-indigo-600',
              },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-start gap-6">
                <div
                  className={`w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center ${item.color} border border-slate-100`}
                >
                  <item.icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tighter">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 font-medium leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Standardized Material Grid */}
      <ServiceMaterialGrid serviceName="Sheet Cutting" />

      {/* Engineering Guidelines */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#2F5FA7]/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-4 md:px-10 lg:px-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
            <div className="space-y-12">
              <div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 uppercase tracking-tighter">
                  Design for <br />
                  <span className="text-cyan-400">Sheet Cutting</span>
                </h2>
                <p className="text-xl text-slate-400 leading-relaxed font-medium">
                  Optimizing your geometry for CNC cutting reduces waste and prevents edge
                  deformation. Follow these essential DFM rules.
                </p>
              </div>

              <div className="space-y-8">
                {[
                  {
                    id: 'K',
                    title: 'Kerf Allowance',
                    desc: 'Account for the width of the cut (Kerf). Laser usually 0.2mm, Waterjet up to 0.8mm.',
                    icon: <Maximize2 className="w-5 h-5" />,
                  },
                  {
                    id: 'L',
                    title: 'Lead-In Distance',
                    desc: 'Ensure at least 2mm clearance from any critical geometry for the cut start-point.',
                    icon: <Zap className="w-5 h-5" />,
                  },
                  {
                    id: 'S',
                    title: 'Part Spacing',
                    desc: 'Maintain a minimum distance of 1x material thickness between adjacent parts to ensure structural integrity.',
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
                <Image
                  src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=1200"
                  alt="Cutting Geometry Guide"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6 md:p-10">
                  <div className="bg-white/95 backdrop-blur-md px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl shadow-xl inline-flex items-center gap-3 md:gap-4">
                    <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Geometry Verification
                      </p>
                      <p className="text-sm font-bold text-slate-900 text-nowrap">
                        Automated Kerf Compensation Active
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
                How to Order <br />
                <span className="text-blue-600">Cut Parts</span>
              </h2>
              <p className="text-slate-600 font-medium mb-12">
                Our automated pipeline ensures your custom sheet components are cut to exact
                specifications.
              </p>
              <div className="block mt-12">
                <div className="w-full aspect-[4/5] relative rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl bg-slate-100">
                  <Image
                    src="/process.png"
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
                  title: 'Secure Upload',
                  description:
                    'Upload your CAD files (DXF, STEP, AI, EPS) to our secure engine. Our system instantly parses geometry for manufacturing compatibility.',
                  icon: FileCode2,
                },
                {
                  step: '02',
                  title: 'Instant Quote & DFM',
                  description:
                    'Receive real-time pricing and automated Design for Manufacturing (DFM) feedback. Adjust materials and quantities to optimize your budget.',
                  icon: Zap,
                },
                {
                  step: '03',
                  title: 'Precision Cutting',
                  description:
                    'Your parts are precision-cut using industrial fiber lasers or waterjets, ensuring edge quality and dimensional accuracy.',
                  icon: Scissors,
                },
                {
                  step: '04',
                  title: 'Inspection & Delivery',
                  description:
                    'Every part undergoes a rigorous institutional quality check before being packed and shipped directly to your facility.',
                  icon: Truck,
                },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-6 md:gap-10 group">
                  <div className="text-5xl md:text-6xl font-black text-slate-200 group-hover:text-[#2F5FA7]/20 transition-colors leading-none shrink-0">
                    {item.step}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tighter flex items-center gap-3">
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

      {/* FAQ Section */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 md:px-10 lg:px-20">
          <div className="flex flex-col lg:flex-row gap-20">
            <div className="lg:w-1/3">
              <div className="sticky top-32">
                <HelpCircle className="w-12 h-12 text-blue-600 mb-6" />
                <h2 className="text-4xl font-black text-slate-900 mb-6 uppercase tracking-tighter leading-none">
                  Technical <br />
                  <span className="text-blue-600">FAQ</span>
                </h2>
                <p className="text-slate-600 font-medium">
                  Find answers to common questions about our sheet cutting processes and technical
                  requirements.
                </p>
              </div>
            </div>
            <div className="lg:w-2/3 space-y-6">
              {[
                {
                  q: 'What file formats do you accept for sheet cutting?',
                  a: 'For 2D sheet cutting, we recommend DXF or DWG files with a 1:1 scale. We also support vector files like AI and EPS, as well as 3D STEP files which our engine will automatically flatten.',
                },
                {
                  q: 'What is your standard tolerance for laser cutting?',
                  a: 'Our fiber lasers maintain a standard linear tolerance of ± 0.005" (0.127mm). For thicker materials over 12mm, tolerances may vary slightly depending on the geometry.',
                },
                {
                  q: 'Do you have a minimum order quantity (MOQ)?',
                  a: 'No. MechHub is built for both prototyping and production. You can order as little as one part or as many as ten thousand.',
                },
                {
                  q: 'How do you handle internal sharp corners?',
                  a: 'Laser and waterjet cutting can produce very tight internal radii (typically 0.1mm - 0.2mm). However, for CNC routing, the internal radius is limited by the diameter of the cutting tool (usually 3mm minimum).',
                },
                {
                  q: 'Can you provide finishing services after cutting?',
                  a: 'Yes. We offer integrated secondary operations including bending, tapping, hardware insertion, anodizing, and powder coating for a complete turn-key solution.',
                },
              ].map((faq, idx) => (
                <div
                  key={idx}
                  className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-blue-200 transition-colors group"
                >
                  <h3 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-tight flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    {faq.q}
                  </h3>
                  <p className="text-slate-600 font-medium leading-relaxed italic">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-black text-[#2F5FA7] uppercase tracking-[0.3em] mb-4">
            Industrial Quality
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-10 max-w-2xl mx-auto tracking-tighter uppercase leading-tight">
            Ready to cut your custom designs?
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-green-500" />
              <span className="font-bold text-slate-700 uppercase leading-none">
                Certified Precision
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-green-500" />
              <span className="font-bold text-slate-700 uppercase leading-none">
                Rapid Turnaround
              </span>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
