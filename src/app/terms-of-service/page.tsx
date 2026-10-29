import Link from 'next/link';
import { Metadata } from 'next';
import { LegalLayout } from '@/components/LegalLayout';

export const metadata: Metadata = {
  title: 'Terms of Service | MechHub',
  description:
    "MechHub Terms of Service — governing the use of India's precision manufacturing marketplace.",
  alternates: {
    canonical: '/terms-of-service',
  },
};

export default function TermsPage() {
  return (
    <LegalLayout>
      <div className="space-y-4 mb-12 pt-8">
        <span className="lp-label-mono text-lp-primary border border-lp-border px-3 py-1 bg-lp-accent inline-block">
          Legal Protocols
        </span>
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight">
          Terms of Service
        </h1>
        <p className="lp-label-mono text-lp-muted-fg">Effective Date: 4 March 2025</p>
      </div>

      <div className="prose prose-neutral max-w-none space-y-12 text-lp-muted-fg p-8 md:p-14 border border-lp-border bg-lp-bg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-lp-primary" />

        <section>
          <h2 className="text-2xl font-medium text-lp-fg mb-6 flex items-center gap-3">
            <span className="text-lp-primary/20 font-medium text-4xl">01</span> Acceptance of Terms
          </h2>
          <p className="leading-relaxed">
            By accessing or using MechHub (&quot;Platform&quot;), operated by Synchubb Innovations
            Pvt Ltd (&quot;Company&quot;), you agree to be bound by these Terms of Service. These
            Terms apply to all users including buyers, sellers (&quot;MechMasters&quot;), and
            visitors.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-medium text-lp-fg mb-6 flex items-center gap-3">
            <span className="text-lp-primary/20 font-medium text-4xl">02</span> Strategic Framework
          </h2>
          <p className="leading-relaxed">
            MechHub is a specialized B2B manufacturing marketplace. The Platform facilitates
            institutional-grade procurement through RFQ submission, AI-powered DFM checks, order
            lifecycle management, and secure financial settlements.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-medium text-lp-fg mb-6 flex items-center gap-3">
            <span className="text-lp-primary/20 font-medium text-4xl">03</span> Verified Interaction
          </h2>
          <ul className="space-y-4 list-none p-0">
            <li className="flex gap-4">
              <div className="size-1.5 bg-lp-primary mt-2 shrink-0" />
              <p>
                <strong className="text-lp-fg">Governance:</strong>{' '}
                All users must provide accurate, active business credentials. Accounts are subject
                to institutional verification.
              </p>
            </li>
            <li className="flex gap-4">
              <div className="size-1.5 bg-lp-primary mt-2 shrink-0" />
              <p>
                <strong className="text-lp-fg">Responsibility:</strong>{' '}
                Users retain absolute responsibility for design specifications, CAD file accuracy,
                and compliance with technical tolerances.
              </p>
            </li>
            <li className="flex gap-4">
              <div className="size-1.5 bg-lp-primary mt-2 shrink-0" />
              <p>
                <strong className="text-lp-fg">Security:</strong>{' '}
                Maintain high-grade credential security; MechHub reserves the right to terminate
                access for protocol violations.
              </p>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-medium text-lp-fg mb-6 flex items-center gap-3">
            <span className="text-lp-primary/20 font-medium text-4xl">04</span> Financial &
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
                className="p-3 bg-lp-accent border border-lp-border text-sm text-lp-fg flex items-center gap-3"
              >
                <div className="size-1.5 bg-lp-primary shrink-0" />
                {term}
              </li>
            ))}
          </ul>
        </section>

        <section className="p-10 bg-lp-card border border-lp-border mt-12">
          <h2 className="text-2xl font-medium text-lp-fg mb-6">Institutional Liaison</h2>
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
