import Link from 'next/link';
import { Metadata } from 'next';
import { Accent } from '@/components/home/primitives';
import { LegalPage, type LegalSection } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Privacy Policy | MechHub',
  description:
    'How MechHub collects, uses, stores and protects your personal information and design files, and the choices you have.',
  alternates: {
    canonical: '/privacy-policy',
  },
};

const SECTIONS: LegalSection[] = [
  {
    id: 'who-we-are',
    title: 'Who we are',
    body: (
      <>
        <p>
          MechHub (the <strong>platform</strong>) is operated by {LEGAL.entity} (<strong>we</strong>, <strong>us</strong>)
          at {LEGAL.site}. This policy explains what information we collect, how we use it, how we store and protect it,
          and the rights you have over it.
        </p>
        <p>By using the platform you agree to the practices described here. If you do not agree, please stop using it.</p>
      </>
    ),
  },
  {
    id: 'what-we-collect',
    title: 'Information we collect',
    body: (
      <>
        <h3>Information you give us</h3>
        <ul>
          <li>
            <strong>Account details:</strong> your name, email address, phone number, company name, GST number (if you
            have one) and shipping address.
          </li>
          <li>
            <strong>Design and order details:</strong> part descriptions, CAD files (STEP, DXF, DWG, STL), drawings,
            material specifications, quantities and delivery requirements.
          </li>
          <li>
            <strong>Payment details:</strong> payments are processed by Razorpay under its own security standards. We do
            not store card or bank details on our servers.
          </li>
        </ul>
        <h3>Information collected automatically</h3>
        <ul>
          <li>
            <strong>Usage and device data:</strong> pages you visit, how you use the platform, your device type, and your
            IP address, which we keep for security audits.
          </li>
          <li>
            <strong>Cookies:</strong> essential cookies that keep you signed in, and anonymised Google Analytics that help
            us improve the platform.
          </li>
        </ul>
        <h3>Signing in with Google</h3>
        <p>
          If you sign in with Google, we receive your primary email address and public profile. We use them only to
          identify you, create your MechHub workspace, and manage your files, orders and messages with MechMasters. We do
          not use your Google data for anything else.
        </p>
      </>
    ),
  },
  {
    id: 'how-we-use-it',
    title: 'How we use your information',
    body: (
      <ul>
        <li>To prepare quotes and match your order with a suitable MechMaster</li>
        <li>To run design for manufacturing (DFM) checks and improve our quoting</li>
        <li>To send you updates on your orders</li>
        <li>To process payments securely</li>
        <li>To meet our legal, tax and regulatory obligations</li>
        <li>To improve how the platform works and looks</li>
      </ul>
    ),
  },
  {
    id: 'sharing',
    title: 'Who we share it with',
    body: (
      <>
        <p>
          <strong>We do not sell, trade or rent your personal data.</strong> We share it only where it is needed to run
          your order:
        </p>
        <ul>
          <li>
            <strong>Your assigned MechMaster</strong> receives the design and order details needed to make your parts,
            under the terms of our <Link href="/nda-policy">NDA policy</Link>.
          </li>
          <li>
            <strong>Razorpay</strong> processes your payments.
          </li>
          <li>
            <strong>Our hosting provider,</strong> Google Cloud, stores the platform&apos;s data.
          </li>
          <li>
            <strong>Delivery partners</strong> receive the name, phone number and address needed to deliver your order.
          </li>
          <li>
            <strong>Authorities,</strong> when the law requires us to disclose information.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'security',
    title: 'How we store and protect it',
    body: (
      <p>
        Your data is stored on Google Cloud infrastructure and encrypted with AES 256, both at rest and in transit. Inside
        MechHub, access is limited by role, so only the people who need your information to run your order can see it.
      </p>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep it',
    body: (
      <p>
        We keep your information for as long as your account is open and for as long afterwards as we need it to meet
        legal, tax and accounting obligations or to resolve disputes. After that it is deleted or anonymised.
      </p>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your rights',
    body: (
      <>
        <p>Under the Digital Personal Data Protection Act, 2023 you can ask us to:</p>
        <ul>
          <li>Tell you what personal data we hold about you and how we use it</li>
          <li>Correct or update data that is wrong or incomplete</li>
          <li>Delete your data, unless we must keep it by law</li>
          <li>Stop processing that relies on your consent, by withdrawing it</li>
        </ul>
        <p>
          To make a request or raise a grievance, email <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. We may need
          to confirm your identity before acting on it.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies',
    body: (
      <p>
        Essential cookies keep you signed in and cannot be switched off without breaking the platform. Analytics cookies
        are anonymised. You can block or delete cookies in your browser settings at any time.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <p>
        We may update this policy as the platform changes. When we do, we change the date at the top of this page.
        Continuing to use the platform after an update means you accept the revised policy.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      path="/privacy-policy"
      title={
        <>
          Privacy <Accent>policy</Accent>
        </>
      }
      intro="What we collect when you use MechHub, why we collect it, who we share it with, and how you stay in control of it."
      summary={[
        'We never sell, trade or rent your personal data.',
        'Your designs go only to the MechMaster making your parts, under NDA.',
        'Payments run through Razorpay. We never store card or bank details.',
        'Data is encrypted at rest and in transit, and you can ask us to correct or delete it.',
      ]}
      sections={SECTIONS}
    />
  );
}
