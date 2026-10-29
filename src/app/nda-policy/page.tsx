import Link from 'next/link';
import { Metadata } from 'next';
import { Lock } from 'lucide-react';
import { LegalLayout } from '@/components/LegalLayout';

export const metadata: Metadata = {
  title: 'NDA Policy | MechHub',
  description:
    'MechHub NDA Policy — how we protect your intellectual property, trade secrets, and proprietary designs throughout the manufacturing process.',
  alternates: {
    canonical: '/nda-policy',
  },
};

export default function NdaPolicyPage() {
  return (
    <LegalLayout>
      <div className="space-y-4 mb-12 pt-8">
        <span className="lp-label-mono text-lp-primary border border-lp-border px-3 py-1 bg-lp-accent inline-block">
          Legal Protocols
        </span>
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight">
          NDA Policy
        </h1>
        <p className="lp-label-mono text-lp-muted-fg">Effective Date: 4 March 2025</p>
      </div>

      <div className="prose prose-neutral max-w-none space-y-12 text-lp-muted-fg p-8 md:p-14 border border-lp-border bg-lp-bg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-lp-primary" />

        <section className="p-8 bg-lp-accent border border-lp-border relative overflow-hidden">
          <h2 className="text-xl font-medium text-lp-primary mb-3 flex items-center gap-2">
            <Lock className="size-5" /> Default IP Protection
          </h2>
          <p className="text-sm leading-relaxed text-lp-fg">
            Every design file uploaded to MechHub is automatically protected by our centralized
            NDA framework. This eliminates the friction of individual agreements while maintaining
            institutional-grade confidentiality for every order.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-medium text-lp-fg mb-6 flex items-center gap-3">
            <span className="text-lp-primary/20 font-medium text-4xl">01</span> Confidential Scope
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
                className="p-3 bg-lp-accent border border-lp-border text-sm text-lp-fg flex items-center gap-3"
              >
                <div className="size-1.5 bg-lp-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-medium text-lp-fg mb-6 flex items-center gap-3">
            <span className="text-lp-primary/20 font-medium text-4xl">02</span> Mandatory
            Obligations
          </h2>
          <div className="space-y-6">
            <div className="p-6 border border-lp-border bg-lp-card">
              <h3 className="lp-label-mono text-lp-primary mb-4">MechHub Operations</h3>
              <p className="text-sm leading-relaxed">
                Institutional commitment to zero-distribution with strict internal role-based
                access. Data shared with MechMasters is limited to fabrication requirements.
              </p>
            </div>
            <div className="p-6 border border-lp-border bg-lp-card">
              <h3 className="lp-label-mono text-lp-primary mb-4">MechMaster Network</h3>
              <p className="text-sm leading-relaxed">
                Verified partners are contractually prohibited from copying, photographing, or
                retaining CAD data. Reverse-manufacturing of designs for external entities is
                strictly banned.
              </p>
            </div>
          </div>
        </section>

        <section className="p-10 bg-lp-card border border-lp-border mt-12">
          <h2 className="text-2xl font-medium text-lp-fg mb-6">Institutional Governance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <p className="lp-label-mono text-lp-primary">Corporate Entity</p>
              <p className="text-lp-fg font-medium">Synchubb Innovations Pvt Ltd</p>
              <p className="text-xs text-lp-muted-fg">VIT Vellore, Tamil Nadu, India</p>
            </div>
            <div className="space-y-2">
              <p className="lp-label-mono text-lp-primary">Legal Resolution</p>
              <Link href="mailto:outreach@mechhub.in" className="text-lp-fg font-medium hover:underline">
                outreach@mechhub.in
              </Link>
              <p className="lp-label-mono text-lp-muted-fg">+91 9117203884</p>
            </div>
          </div>
        </section>
      </div>
    </LegalLayout>
  );
}
