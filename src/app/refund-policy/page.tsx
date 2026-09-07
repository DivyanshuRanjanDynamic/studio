import Link from 'next/link';
import { Metadata } from 'next';
import { Info, Package, ShieldCheck, AlertCircle } from 'lucide-react';
import { LandingNav } from '@/components/LandingNav';
import { BackToHomeBar } from '@/components/BackToHomeBar';

export const metadata: Metadata = {
  title: 'Refund Policy | MechHub',
  description:
    'MechHub Refund Policy — clear guidelines on when and how refunds are processed for custom manufacturing orders.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 selection:text-[#2F5FA7] relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />
      <LandingNav />

      <BackToHomeBar className="relative z-10 pb-2" />
      <article className="container mx-auto px-4 max-w-4xl pb-20 pt-6">

        <div className="space-y-4 mb-12 pt-8 relative z-10">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2F5FA7] border border-blue-100 px-4 py-1.5 rounded-full bg-blue-50/50 shadow-sm">
            Legal Protocols
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
            Refund Policy
          </h1>
          <p className="text-sm font-bold text-blue-100 uppercase tracking-widest">
            Effective Date: 4 March 2025
          </p>
        </div>

        <div className="prose prose-slate max-w-none space-y-12 text-slate-600 relative z-10 p-8 md:p-14 rounded-[2.5rem] bg-white border border-slate-100 shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#2F5FA7] to-[#1E3A66]" />

          <section className="p-8 rounded-3xl bg-blue-50/30 border border-blue-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Info className="w-12 h-12 text-[#2F5FA7]" />
            </div>
            <h2 className="text-xl font-bold text-[#2F5FA7] mb-3 flex items-center gap-2">
              <Info className="w-5 h-5" /> Manufacturing Reality
            </h2>
            <p className="text-sm leading-relaxed font-medium text-slate-700">
              Custom manufacturing is fundamentally different from off-the-shelf product purchases.
              Every part is manufactured to your exact specifications. Once production begins, the
              raw material is irreversibly altered and cannot be returned to stock or resold.
            </p>
            <p className="mt-3 text-sm font-bold text-[#2F5FA7]/80 italic">
              This policy ensures fair protection for buyers during genuine quality failures while
              respecting the custom nature of fabrication.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <span className="text-[#2F5FA7]/20 font-black text-4xl">01</span> Cancellation
              Protocol
            </h2>
            <ul className="space-y-4 p-0 list-none">
              <li className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex gap-4 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900">Pre-Material Procurement (100% Refund)</p>
                  <p className="text-sm">
                    Full refund if the order has not entered the institutional production pipeline.
                  </p>
                </div>
              </li>
              <li className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex gap-4 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900">Post-Procurement / Pre-Milling/Turning</p>
                  <p className="text-sm">
                    Refund minus verifiable raw material costs purchased specifically for the order.
                  </p>
                </div>
              </li>
              <li className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex gap-4 items-start border-l-4 border-l-red-100">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900">
                    Active Milling/Turning/Fabrication (Non-Refundable)
                  </p>
                  <p className="text-sm">
                    No refund is available once fabrication has commenced, as materials are
                    irreversibly altered.
                  </p>
                </div>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <span className="text-[#2F5FA7]/20 font-black text-4xl">02</span> Quality Conformance
            </h2>
            <p className="mb-6 font-medium">
              If parts do not conform to specifications, tolerances, or material requirements stated
              in your drawing, you are entitled to a remedy.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#2F5FA7]">
                  Eligibility
                </h3>
                <ul className="space-y-3 p-0 list-none text-sm">
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <span>Report within 7 business days</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <span>Provide measurement evidence (CMM, Calliper)</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    <span>Design-originated errors are not covered</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#2F5FA7]">
                  Remedy Options
                </h3>
                <ul className="space-y-3 p-0 list-none text-sm">
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>Re-manufacture at no cost</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>Partial refund for minor deviations</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>Full refund for unusable parts</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section className="p-10 rounded-[2rem] bg-slate-50 border border-slate-100 mt-12 relative overflow-hidden group">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 relative z-10">
              Liaison & Support
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-2">
                <p className="text-sm font-black uppercase tracking-widest text-[#2F5FA7]">
                  Corporate Oversight
                </p>
                <p className="text-slate-800 font-bold">Synchubb Innovations Pvt Ltd</p>
                <p className="text-blue-200 text-xs">VIT Vellore, Tamil Nadu, India</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black uppercase tracking-widest text-[#2F5FA7]">
                  Resolution Email
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
