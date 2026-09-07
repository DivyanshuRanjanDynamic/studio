import Link from 'next/link';
import { Metadata } from 'next';
import { LandingNav } from '@/components/LandingNav';
import { BackToHomeBar } from '@/components/BackToHomeBar';

export const metadata: Metadata = {
  title: 'Terms of Service | MechHub',
  description:
    "MechHub Terms of Service — governing the use of India's precision manufacturing marketplace.",
};

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-sm font-bold text-blue-100 uppercase tracking-widest">
            Effective Date: 4 March 2025
          </p>
        </div>

        <div className="prose prose-slate max-w-none space-y-12 text-slate-600 p-8 md:p-14 rounded-[2.5rem] bg-white border border-slate-100 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#2F5FA7] to-[#1E3A66]" />

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <span className="text-[#2F5FA7]/20 font-black text-4xl">01</span> Acceptance of Terms
            </h2>
            <p className="leading-relaxed font-medium">
              By accessing or using MechHub (&quot;Platform&quot;), operated by Synchubb Innovations
              Pvt Ltd (&quot;Company&quot;), you agree to be bound by these Terms of Service. These
              Terms apply to all users including buyers, sellers (&quot;MechMasters&quot;), and
              visitors.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <span className="text-[#2F5FA7]/20 font-black text-4xl">02</span> Strategic Framework
            </h2>
            <p className="leading-relaxed font-medium">
              MechHub is a specialized B2B manufacturing marketplace. The Platform facilitates
              institutional-grade procurement through RFQ submission, AI-powered DFM checks, order
              lifecycle management, and secure financial settlements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <span className="text-[#2F5FA7]/20 font-black text-4xl">03</span> Verified Interaction
            </h2>
            <ul className="space-y-4 list-none p-0">
              <li className="flex gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                <p>
                  <strong className="text-slate-900 underline decoration-blue-100 decoration-4 underline-offset-4">
                    Governance:
                  </strong>{' '}
                  All users must provide accurate, active business credentials. Accounts are subject
                  to institutional verification.
                </p>
              </li>
              <li className="flex gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                <p>
                  <strong className="text-slate-900 underline decoration-blue-100 decoration-4 underline-offset-4">
                    Responsibility:
                  </strong>{' '}
                  Users retain absolute responsibility for design specifications, CAD file accuracy,
                  and compliance with technical tolerances.
                </p>
              </li>
              <li className="flex gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                <p>
                  <strong className="text-slate-900 underline decoration-blue-100 decoration-4 underline-offset-4">
                    Security:
                  </strong>{' '}
                  Maintain high-grade credential security; MechHub reserves the right to terminate
                  access for protocol violations.
                </p>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <span className="text-[#2F5FA7]/20 font-black text-4xl">04</span> Financial &
              Operations
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0">
              {[
                'Quoted in INR (₹) plus applicable GST',
                'Razorpay-secured payment gateways',
                'Institutional inspection reports provided',
                'Independent MechMaster manufacturing network',
                'Estimated lead times adjusted for shop load',
                'Risk transfer upon logistics handover',
              ].map((term) => (
                <li
                  key={term}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-700 flex items-center gap-3"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  {term}
                </li>
              ))}
            </ul>
          </section>

          <section className="p-10 rounded-[2rem] bg-slate-50 border border-slate-100 mt-12 relative overflow-hidden group">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 relative z-10">
              Institutional Liaison
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
