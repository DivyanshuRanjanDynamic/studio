import Link from 'next/link';
import { Metadata } from 'next';
import { Lock } from 'lucide-react';
import { LandingNav } from '@/components/LandingNav';
import { BackToHomeBar } from '@/components/BackToHomeBar';

export const metadata: Metadata = {
  title: 'NDA Policy | MechHub',
  description:
    'MechHub NDA Policy — how we protect your intellectual property, trade secrets, and proprietary designs throughout the manufacturing process.',
};

export default function NdaPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 selection:text-[#2F5FA7] relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />
      <LandingNav />

      <BackToHomeBar className="relative z-10 pb-2" />
      <article className="container mx-auto px-4 max-w-4xl pb-20 pt-6 relative z-10">

        <div className="space-y-4 mb-12 pt-8">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2F5FA7] border border-blue-100 px-4 py-1.5 rounded-full bg-blue-50/50 shadow-sm">
            Legal Protocols
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
            NDA Policy
          </h1>
          <p className="text-sm font-bold text-blue-100 uppercase tracking-widest">
            Effective Date: 4 March 2025
          </p>
        </div>

        <div className="prose prose-slate max-w-none space-y-12 text-slate-600 p-8 md:p-14 rounded-[2.5rem] bg-white border border-slate-100 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#2F5FA7] to-[#1E3A66]" />

          <section className="p-8 rounded-3xl bg-blue-50/30 border border-blue-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Lock className="w-12 h-12 text-[#2F5FA7]" />
            </div>
            <h2 className="text-xl font-bold text-[#2F5FA7] mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5" /> Default IP Protection
            </h2>
            <p className="text-sm leading-relaxed font-medium text-slate-700">
              Every design file uploaded to MechHub is automatically protected by our centralized
              NDA framework. This eliminates the friction of individual agreements while maintaining
              institutional-grade confidentiality for every order.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <span className="text-[#2F5FA7]/20 font-black text-4xl">01</span> Confidential Scope
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0">
              {[
                'CAD Files & 3D Engineering Models',
                'Material & Tolerance Specifications',
                'Proprietary Manufacturing Processes',
                'Corporate Identity & Business Volume',
                'Project-Specific Revision Histories',
                'Quotation & Pricing Structures',
              ].map((item) => (
                <li
                  key={item}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-700 flex items-center gap-3"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <span className="text-[#2F5FA7]/20 font-black text-4xl">02</span> Mandatory
              Obligations
            </h2>
            <div className="space-y-6">
              <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#2F5FA7] mb-4">
                  MechHub Operations
                </h3>
                <p className="text-sm font-medium leading-relaxed">
                  Institutional commitment to zero-distribution with strict internal role-based
                  access. Data shared with MechMasters is limited to fabrication requirements.
                </p>
              </div>
              <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#2F5FA7] mb-4">
                  MechMaster Network
                </h3>
                <p className="text-sm font-medium leading-relaxed">
                  Verified partners are contractually prohibited from copying, photographing, or
                  retaining CAD data. Reverse-manufacturing of designs for external entities is
                  strictly banned.
                </p>
              </div>
            </div>
          </section>

          <section className="p-10 rounded-[2rem] bg-slate-50 border border-slate-100 mt-12 relative overflow-hidden group">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 relative z-10">
              Institutional Governance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-2">
                <p className="text-sm font-black uppercase tracking-widest text-[#2F5FA7]">
                  Corporate Entity
                </p>
                <p className="text-slate-800 font-bold">Synchubb Innovations Pvt Ltd</p>
                <p className="text-blue-200 text-xs">VIT Vellore, Tamil Nadu, India</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black uppercase tracking-widest text-[#2F5FA7]">
                  Legal Resolution
                </p>
                <Link
                  href="mailto:outreach@mechhub.in"
                  className="text-slate-900 font-bold hover:underline"
                >
                  outreach@mechhub.in
                </Link>
                <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest">
                  +91 9117203884
                </p>
              </div>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
