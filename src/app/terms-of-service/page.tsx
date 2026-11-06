import Link from 'next/link';
import { Metadata } from 'next';
import { Accent } from '@/components/home/primitives';
import { LegalPage, type LegalSection } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Terms of Service | MechHub',
  description:
    'The terms for using MechHub: accounts, your designs, quotes and payment, inspection, delivery and the MechMaster network.',
  alternates: {
    canonical: '/terms-of-service',
  },
};

const SECTIONS: LegalSection[] = [
  {
    id: 'acceptance',
    title: 'Accepting these terms',
    body: (
      <p>
        By accessing or using MechHub (the <strong>platform</strong>), operated by {LEGAL.entity} (<strong>we</strong>,{' '}
        <strong>us</strong>), you agree to these terms. They apply to everyone who uses the platform: buyers, manufacturing
        partners (<strong>MechMasters</strong>) and visitors.
      </p>
    ),
  },
  {
    id: 'the-platform',
    title: 'What MechHub does',
    body: (
      <>
        <p>
          MechHub is a business to business marketplace for custom manufacturing. Through the platform you can request
          and receive quotes, have your designs checked for manufacturability, manage orders and pay securely.
        </p>
        <p>
          Your parts are made by independent MechMasters in our partner network. MechHub manages the order between you
          and the MechMaster from quote to delivery.
        </p>
      </>
    ),
  },
  {
    id: 'accounts',
    title: 'Your account',
    body: (
      <ul>
        <li>Give accurate, current details when you register, including your business details where they apply.</li>
        <li>Accounts may be verified before you can place orders or take on work.</li>
        <li>Keep your sign in details secure. You are responsible for activity on your account.</li>
        <li>We may suspend or close accounts that break these terms.</li>
      </ul>
    ),
  },
  {
    id: 'your-designs',
    title: 'Your designs and specifications',
    body: (
      <>
        <p>
          You are responsible for your design: the accuracy of your CAD files and drawings, the specifications you choose,
          and whether the tolerances you set are right for your use. Our DFM checks help catch problems, but they do not
          replace your own engineering review.
        </p>
        <p>
          You confirm that you have the right to use and manufacture every design you upload. Uploading a design does not
          transfer its ownership to MechHub. How we keep it confidential is set out in our{' '}
          <Link href="/nda-policy">NDA policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: 'quotes-and-payment',
    title: 'Quotes, prices and payment',
    body: (
      <ul>
        <li>Prices are quoted in Indian rupees (₹) plus applicable GST.</li>
        <li>Payments are made through Razorpay&apos;s secure checkout.</li>
        <li>Lead times are estimates and can change with workshop load. We will keep you updated on your order.</li>
      </ul>
    ),
  },
  {
    id: 'inspection-and-delivery',
    title: 'Inspection and delivery',
    body: (
      <ul>
        <li>Orders are inspected before dispatch, and inspection reports are provided.</li>
        <li>Responsibility for the parts passes to you when the order is handed over to the delivery partner.</li>
        <li>
          If parts do not match your specification, our <Link href="/refund-policy">refund policy</Link> explains what
          happens next.
        </li>
      </ul>
    ),
  },
  {
    id: 'related-policies',
    title: 'Related policies',
    body: (
      <p>
        These terms work together with our <Link href="/privacy-policy">privacy policy</Link>,{' '}
        <Link href="/refund-policy">refund policy</Link> and <Link href="/nda-policy">NDA policy</Link>.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    body: (
      <p>
        We may update these terms as the platform changes. When we do, we change the date at the top of this page.
        Continuing to use the platform after an update means you accept the revised terms.
      </p>
    ),
  },
];

export default function TermsOfServicePage() {
  return (
    <LegalPage
      path="/terms-of-service"
      title={
        <>
          Terms of <Accent>service</Accent>
        </>
      }
      intro="The agreement between you and MechHub when you request quotes, order parts or manufacture as a MechMaster."
      summary={[
        'MechHub manages your order; independent, vetted MechMasters make the parts.',
        'You stay responsible for your design and keep ownership of it.',
        'Prices are in rupees plus GST, paid through Razorpay.',
        'Responsibility for the parts passes to you at handover to the delivery partner.',
      ]}
      sections={SECTIONS}
    />
  );
}
