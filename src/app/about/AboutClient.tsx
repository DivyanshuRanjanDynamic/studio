'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronLeft,
  Users,
  Zap,
  Shield,
  Target,
  MapPin,
  Mail,
  Phone,
  Factory,
  Cpu,
  Layers,
} from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function AboutClient() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-blue-100 selection:text-blue-700 font-sans">
      {/* Nav */}
      <div className="fixed top-0 left-0 w-full z-[100] bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-[#2F5FA7] transition-all group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Hub
          </Link>
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <span className="text-sm font-bold tracking-tight text-[#1E3A66]">MechHub</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-40 pb-16 overflow-hidden bg-white border-b border-slate-100">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 blur-[120px] rounded-full -mr-96 -mt-96" />

        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="space-y-8 text-center lg:text-left lg:max-w-3xl">
            <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-blue-100 bg-blue-50/50 text-[#2F5FA7] text-[10px] font-black tracking-[0.2em] uppercase shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              Building India&apos;s Infrastructure
            </span>

            <h1 className="text-5xl md:text-8xl font-bold tracking-tight text-slate-900 leading-[0.95] md:leading-[1]">
              Architecting the <br />
              <span className="text-[#2F5FA7]">Future of Fabrication.</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-2xl font-medium">
              MechHub is an institutional-grade marketplace connecting design teams with verified
              CNC, laser, and fabrication experts — making precision production accessible,
              reliable, and lightning-fast.
            </p>
          </div>
        </div>

        {/* Floating Architectural Element */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden xl:block opacity-20 group">
          <div className="relative w-[600px] h-[600px] p-20 animate-float">
            <div className="absolute inset-x-0 top-1/2 h-px bg-slate-900/10 border-dashed border-b border-slate-900/5" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-slate-900/10 border-dashed border-r border-slate-900/5" />
            <div className="w-full h-full border border-slate-900/10 rounded-3xl p-10 flex items-center justify-center">
              <div className="w-full h-full border border-slate-900/10 rounded-2xl flex items-center justify-center bg-white/50 backdrop-blur-sm">
                <Layers className="w-24 h-24 text-slate-300" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Market Stats Segment */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left border-y border-slate-100 py-10">
            <div>
              <div className="text-5xl font-bold text-slate-900 mb-2">
                ₹40,000<span className="text-[#2F5FA7]"> Cr</span>
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                Total Addressable Market
              </div>
            </div>
            <div>
              <div className="text-5xl font-bold text-slate-900 mb-2">
                20<span className="text-[#2F5FA7]">+</span>
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                Verified MechMasters
              </div>
            </div>
            <div>
              <div className="text-5xl font-bold text-slate-900 mb-2">
                24<span className="text-[#2F5FA7]">h</span>
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                Average Bidding Response
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Strategic Mission */}
      <section className="py-20 relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 lg:items-center">
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto lg:ml-0">
                <Target className="w-6 h-6 text-[#2F5FA7]" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                The Strategic Mission
              </h2>
              <p className="text-lg text-slate-500 leading-relaxed font-medium">
                India&apos;s custom manufacturing market is worth ₹40,000 Crore — yet there remains
                no unified platform connecting buyers with precision manufacturing shops.
              </p>
              <p className="text-slate-500 leading-relaxed pt-2">
                MechHub bridges this gap. We are building a vertically integrated infrastructure
                where any engineer can upload a CAD file, receive an instant DFM review, and get
                matched with a verified manufacturing partner (
                <span className="text-[#2F5FA7] font-bold">MechMasters</span>).
              </p>
            </div>
            <div className="flex-1">
              <div className="relative aspect-video rounded-[32px] overflow-hidden shadow-2xl border-4 border-white">
                <Image
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200"
                  alt="Industrial Focus"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Differentiators */}
      <section className="py-24 bg-slate-50/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl font-bold tracking-tight text-slate-900">
              Why Engineers Choose MechHub
            </h2>
            <p className="text-slate-500 font-medium max-w-xl mx-auto">
              Built for engineers, by engineers. We own the standards for precision procurement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
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
            ].map((item, i) => (
              <div
                key={i}
                className="group p-10 rounded-[40px] bg-white border border-slate-100 hover:border-blue-100 hover:shadow-[0_4px_32px_rgba(47,95,167,0.06)] transition-all duration-500"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  <item.icon className="w-7 h-7 text-[#2F5FA7]" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-20">
            <div className="space-y-4 text-center lg:text-left">
              <h2 className="text-4xl font-bold tracking-tight text-slate-900">
                The Technical Leadership
              </h2>
              <p className="text-slate-500 font-medium leading-relaxed max-w-xl mx-auto lg:ml-0">
                A cross-functional team of engineers solving the high-friction procurement gap in
                the Indian manufacturing sector.
              </p>
            </div>
            <div className="flex -space-x-4 mx-auto lg:mx-0">
              {['ujjawal.jpg', 'divyanshu.jpg', 'dristi.png', 'ram_image.jpeg'].map((img, i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded-full border-4 border-white bg-slate-100 overflow-hidden relative"
                >
                  <Image src={`/team/${img}`} alt="Team Member" fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: 'Ujjawal Kumar',
                role: 'Founder & CEO',
                focus: 'Product · Strategy · P&L',
                bio: 'VIT Vellore. Leading strategic growth and institutional partnerships.',
                image: '/team/ujjawal.jpg',
              },
              {
                name: 'Divyanshu Ranjan',
                role: 'Co-Founder & CTO',
                focus: 'Innovation · Technology · AI',
                bio: 'Techno Main Salt Lake. Architect of the MechHub platform engine.',
                image: '/team/divyanshu.jpg',
              },
              {
                name: 'Dristi Sengupta',
                role: 'Co-Founder & COO',
                focus: 'Operations . SupplyChain . Execution',
                bio: 'VIT Vellore. Managing 20+ verified manufacturing partners.',
                image: '/team/dristi.png',
              },
              {
                name: 'Raamchandiran',
                role: 'Chief Product Officer',
                focus: 'Product . Strategy . Customer ',
                bio: 'VIT Vellore. Aligning cross-functional teams to deliver customer value.',
                image: '/team/ram_image.jpeg',
              },
            ].map((member) => (
              <div key={member.name} className="group space-y-6">
                <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden bg-slate-100 group-hover:scale-[1.02] transition-transform duration-500">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700 hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest">
                      {member.focus}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
                  <p className="text-xs font-black uppercase tracking-wider text-[#2F5FA7]">
                    {member.role}
                  </p>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed pt-2 line-clamp-2">
                    {member.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Institutional Liaison */}
      <section className="py-24 border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="p-12 md:p-20 rounded-[3rem] bg-[#1E3A66] relative overflow-hidden text-center lg:text-left">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full -mr-48 -mt-48" />

            <div className="flex flex-col lg:flex-row items-center gap-16 relative z-10">
              <div className="flex-1 space-y-8">
                <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-[1.1]">
                  Connect with the <br />
                  <span className="text-blue-300">Hub Presence.</span>
                </h2>
                <p className="text-lg text-blue-100/60 leading-relaxed font-medium">
                  Strategic partners of the prestigious VIT Vellore TBI ecosystem. We are redefining
                  precision procurement for India.
                </p>
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 transition-colors hover:bg-white/10">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-bold">outreach@mechhub.in</span>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 transition-colors hover:bg-white/10">
                    <MapPin className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-bold text-left leading-tight">
                      VIT Vellore,
                      <br />
                      Tamil Nadu, India
                    </span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block w-px h-64 bg-white/10" />
              <div className="flex-1 text-center">
                <div className="inline-block p-10 border border-white/10 bg-white/5 backdrop-blur-md rounded-[2.5rem] relative group cursor-default">
                  <Logo size={80} />
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest shadow-xl">
                    SyncHubb Innovations
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Placeholder (Simulated) */}
      <footer className="py-12 bg-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
            © 2026 MechHub. All Rights Reserved.
          </p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0);
          }
          50% {
            transform: translateY(-20px) rotate(1deg);
          }
        }
        .animate-float {
          animation: float 12s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
