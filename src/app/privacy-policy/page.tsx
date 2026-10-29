import Link from 'next/link';
import { Metadata } from 'next';
import { LegalLayout } from '@/components/LegalLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy | MechHub',
  description:
    'MechHub Privacy Policy — how we collect, use, store, and protect your personal information.',
  alternates: {
    canonical: '/privacy-policy',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout>
      <div className="space-y-4 mb-12 pt-8">
        <span className="lp-label-mono text-lp-primary border border-lp-border px-3 py-1 bg-lp-accent inline-block">
          Legal Protocols
        </span>
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight">
          Privacy Policy
        </h1>
        <p className="lp-label-mono text-lp-muted-fg">
          Effective Date: 4 March 2025
        </p>
      </div>

      <div className="prose prose-neutral max-w-none space-y-12 text-lp-muted-fg p-8 md:p-14 border border-lp-border bg-lp-bg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-lp-primary" />

        <section>
          <h2 className="text-2xl font-medium text-lp-fg mb-6 flex items-center gap-3">
            <span className="text-lp-primary/20 font-medium text-4xl">01</span> Introduction
          </h2>
          <p className="leading-relaxed">
            MechHub (&quot;Platform&quot;), operated by Synchubb Innovations Pvt Ltd
            (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;), is committed to protecting the
            privacy of every user who interacts with our platform at{' '}
            <Link href="https://www.mechhub.in" className="text-lp-primary hover:underline">
              www.mechhub.in
            </Link>
            . This Privacy Policy explains what information we collect, how we use it, how we
            store and protect it, and what rights you have regarding your data.
          </p>
          <p className="mt-4 opacity-80 italic">
            By using the Platform, you consent to the practices described in this policy. If you
            do not agree, please discontinue use of the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-medium text-lp-fg mb-6 flex items-center gap-3">
            <span className="text-lp-primary/20 font-medium text-4xl">02</span> Information
            Collection
          </h2>
          <h3 className="text-lg font-medium text-lp-fg mb-4 mt-8">
            2.1 Information You Provide
          </h3>
          <ul className="space-y-4">
            <li className="flex gap-4">
              <div className="size-1.5 bg-lp-primary mt-2 shrink-0" />
              <p>
                <strong className="text-lp-fg">Account Registration:</strong>{' '}
                Name, email address, phone number, company name, GST number (if applicable), and
                shipping address.
              </p>
            </li>
            <li className="flex gap-4">
              <div className="size-1.5 bg-lp-primary mt-2 shrink-0" />
              <p>
                <strong className="text-lp-fg">RFQ Submissions:</strong>{' '}
                Part descriptions, CAD files (STEP, DXF, DWG, STL), drawings, material
                specifications, quantity, and delivery requirements.
              </p>
            </li>
            <li className="flex gap-4">
              <div className="size-1.5 bg-lp-primary mt-2 shrink-0" />
              <p>
                <strong className="text-lp-fg">Payment Information:</strong>{' '}
                Processed via Razorpay. We do not store financial details on our servers.
                Razorpay&apos;s encryption protocols apply.
              </p>
            </li>
          </ul>

          <h3 className="text-lg font-medium text-lp-fg mb-4 mt-8">
            2.2 Information Collected Automatically
          </h3>
          <ul className="space-y-4">
            <li className="flex gap-4">
              <div className="size-1.5 bg-lp-primary mt-2 shrink-0" />
              <p>
                <strong className="text-lp-fg">Usage & Device Data:</strong>{' '}
                Pages visited, interaction patterns, device type, and encrypted IP address for
                security auditing.
              </p>
            </li>
            <li className="flex gap-4">
              <div className="size-1.5 bg-lp-primary mt-2 shrink-0" />
              <p>
                <strong className="text-lp-fg">Cookies:</strong>{' '}
                Essential session management and anonymized Google Analytics to optimize platform
                performance.
              </p>
            </li>
          </ul>

          <h3 className="text-lg font-medium text-lp-fg mb-4 mt-8">2.3 Google User Data</h3>
          <p className="mb-4">
            If you choose to sign in via Google OAuth, MechHub requests access to your Google
            account primary email and public profile information. We use this data exclusively
            for:
          </p>
          <ul className="space-y-4">
            <li className="flex gap-4">
              <div className="size-1.5 bg-lp-primary mt-2 shrink-0" />
              <p>
                Identifying you as a unique user and creating your personalized MechHub workspace.
              </p>
            </li>
            <li className="flex gap-4">
              <div className="size-1.5 bg-lp-primary mt-2 shrink-0" />
              <p>
                Securely managing your CAD files, manufacturing orders, and communication with
                MechMasters.
              </p>
            </li>
          </ul>
          <p className="mt-4 text-sm italic">
            MechHub does not use your Google data for any purpose other than providing and
            improving the platform&apos;s core manufacturing services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-medium text-lp-fg mb-6 flex items-center gap-3">
            <span className="text-lp-primary/20 font-medium text-4xl">03</span> Strategic Data Usage
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'RFQ processing & partner matching',
              'DFM check & algorithm optimization',
              'Institutional order status updates',
              'Secure payment gateway integration',
              'Compliance with regulatory filings',
              'Continuous platform UI/UX improvements',
            ].map((usage) => (
              <li
                key={usage}
                className="p-3 bg-lp-accent border border-lp-border text-sm text-lp-fg flex items-center gap-3"
              >
                <div className="size-1.5 bg-lp-primary shrink-0" />
                {usage}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-medium text-lp-fg mb-6 flex items-center gap-3">
            <span className="text-lp-primary/20 font-medium text-4xl">04</span> Verified Data
            Governance
          </h2>
          <div className="space-y-6">
            <div className="p-6 bg-lp-accent border border-lp-border">
              <p className="text-lp-primary font-medium text-lg mb-4">Zero-Sale Policy</p>
              <p>
                We do not sell, trade, or rent your personal data to non-manufacturing third
                parties. Data is strictly shared with assigned MechMasters for production
                requirements.
              </p>
            </div>

            <p>
              Data is stored on{' '}
              <strong className="text-lp-fg">Google Cloud Infrastructure</strong>{' '}
              with institutional-grade encryption (AES-256) at rest and in transit.
            </p>
          </div>
        </section>

        <section className="p-10 bg-lp-card border border-lp-border mt-12">
          <h2 className="text-2xl font-medium text-lp-fg mb-6">
            Legal Contact Support
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <p className="lp-label-mono text-lp-primary">Entity Oversight</p>
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
