import Link from 'next/link';
import { Metadata } from 'next';
import { Info } from 'lucide-react';
import { LegalLayout } from '@/components/LegalLayout';

export const metadata: Metadata = {
  title: 'Refund Policy | MechHub',
  description:
    'MechHub Refund Policy — clear guidelines on when and how refunds are processed for custom manufacturing orders.',
  alternates: {
    canonical: '/refund-policy',
  },
};

export default function RefundPolicyPage() {
  return (
    <LegalLayout>
      <div className="space-y-4 mb-12 pt-8">
        <span className="lp-label-mono text-lp-primary border border-lp-border px-3 py-1 bg-lp-accent inline-block">
          Legal Protocols
        </span>
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight">
          Refund Policy
        </h1>
        <p className="lp-label-mono text-lp-muted-fg">Effective Date: 4 March 2025</p>
      </div>

      <div className="prose prose-neutral max-w-none space-y-12 text-lp-muted-fg p-8 md:p-14 border border-lp-border bg-lp-bg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-lp-primary" />

        <section className="p-8 bg-lp-accent border border-lp-border relative overflow-hidden">
          <h2 className="text-xl font-medium text-lp-primary mb-3 flex items-center gap-2">
            <Info className="size-5" /> Manufacturing Reality
          </h2>
          <p className="text-sm leading-relaxed text-lp-fg">
            Custom manufacturing is fundamentally different from off-the-shelf product purchases.
            Every part is manufactured to your exact specifications. Once production begins, the
            raw material is irreversibly altered and cannot be returned to stock or resold.
          </p>
          <p className="mt-3 text-sm text-lp-primary/80 italic">
            This policy ensures fair protection for buyers during genuine quality failures while
            respecting the custom nature of fabrication.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-medium text-lp-fg mb-6 flex items-center gap-3">
            <span className="text-lp-primary/20 font-medium text-4xl">01</span> Cancellation
            Protocol
          </h2>
          <ul className="space-y-4 p-0 list-none">
            <li className="p-4 bg-lp-accent border border-lp-border flex gap-4 items-start">
              <div className="size-1.5 bg-lp-primary mt-1.5 shrink-0" />
              <div>
                <p className="font-medium text-lp-fg">Pre-Material Procurement (100% Refund)</p>
                <p className="text-sm">
                  Full refund if the order has not entered the institutional production pipeline.
                </p>
              </div>
            </li>
            <li className="p-4 bg-lp-accent border border-lp-border flex gap-4 items-start">
              <div className="size-1.5 bg-lp-primary mt-1.5 shrink-0" />
              <div>
                <p className="font-medium text-lp-fg">Post-Procurement / Pre-Milling/Turning</p>
                <p className="text-sm">
                  Refund minus verifiable raw material costs purchased specifically for the order.
                </p>
              </div>
            </li>
            <li className="p-4 bg-lp-accent border border-lp-border border-l-4 border-l-red-400 flex gap-4 items-start">
              <div className="size-1.5 bg-red-400 mt-1.5 shrink-0" />
              <div>
                <p className="font-medium text-lp-fg">
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
          <h2 className="text-2xl font-medium text-lp-fg mb-6 flex items-center gap-3">
            <span className="text-lp-primary/20 font-medium text-4xl">02</span> Quality Conformance
          </h2>
          <p className="mb-6">
            If parts do not conform to specifications, tolerances, or material requirements stated
            in your drawing, you are entitled to a remedy.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="lp-label-mono text-lp-primary">Eligibility</h3>
              <ul className="space-y-3 p-0 list-none text-sm">
                <li className="flex gap-2">
                  <div className="size-1.5 bg-lp-primary/60 mt-1.5 shrink-0" />
                  <span>Report within 7 business days</span>
                </li>
                <li className="flex gap-2">
                  <div className="size-1.5 bg-lp-primary/60 mt-1.5 shrink-0" />
                  <span>Provide measurement evidence (CMM, Calliper)</span>
                </li>
                <li className="flex gap-2">
                  <div className="size-1.5 bg-red-400 mt-1.5 shrink-0" />
                  <span>Design-originated errors are not covered</span>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="lp-label-mono text-lp-primary">Remedy Options</h3>
              <ul className="space-y-3 p-0 list-none text-sm">
                <li className="flex gap-2">
                  <div className="size-1.5 bg-lp-primary mt-1.5 shrink-0" />
                  <span>Re-manufacture at no cost</span>
                </li>
                <li className="flex gap-2">
                  <div className="size-1.5 bg-lp-primary mt-1.5 shrink-0" />
                  <span>Partial refund for minor deviations</span>
                </li>
                <li className="flex gap-2">
                  <div className="size-1.5 bg-lp-primary mt-1.5 shrink-0" />
                  <span>Full refund for unusable parts</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="p-10 bg-lp-card border border-lp-border mt-12">
          <h2 className="text-2xl font-medium text-lp-fg mb-6">Liaison & Support</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <p className="lp-label-mono text-lp-primary">Corporate Oversight</p>
              <p className="text-lp-fg font-medium">Synchubb Innovations Pvt Ltd</p>
              <p className="text-xs text-lp-muted-fg">VIT Vellore, Tamil Nadu, India</p>
            </div>
            <div className="space-y-2">
              <p className="lp-label-mono text-lp-primary">Resolution Email</p>
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
