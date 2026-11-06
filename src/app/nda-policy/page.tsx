import Link from 'next/link';
import { Metadata } from 'next';
import { Accent } from '@/components/home/primitives';
import { LegalPage, type LegalSection } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'NDA Policy | MechHub',
  description:
    'How MechHub keeps your CAD files and designs confidential: what is covered, and what MechHub and every MechMaster must do.',
  alternates: {
    canonical: '/nda-policy',
  },
};

const SECTIONS: LegalSection[] = [
  {
    id: 'default-protection',
    title: 'Protected by default',
    body: (
      <p>
        Every design file you upload to MechHub is automatically covered by our NDA framework. You do not need to sign a
        separate agreement for each order, and the same confidentiality applies to every part you make with us.
      </p>
    ),
  },
  {
    id: 'what-is-covered',
    title: 'What we keep confidential',
    body: (
      <ul>
        <li>CAD files and 3D models</li>
        <li>Material and tolerance specifications</li>
        <li>Your own manufacturing processes</li>
        <li>Your company&apos;s identity and order volumes</li>
        <li>Revision history for each project</li>
        <li>Quotes and pricing</li>
      </ul>
    ),
  },
  {
    id: 'mechhub-obligations',
    title: 'What MechHub commits to',
    body: (
      <ul>
        <li>We never distribute your files to anyone outside your order.</li>
        <li>Inside MechHub, access is limited by role, so only people working on your order can see it.</li>
        <li>MechMasters receive only the information they need to make your parts.</li>
      </ul>
    ),
  },
  {
    id: 'mechmaster-obligations',
    title: 'What every MechMaster commits to',
    body: (
      <ul>
        <li>MechMasters are verified partners under contract with MechHub.</li>
        <li>They may not copy, photograph or keep your CAD data.</li>
        <li>They may not manufacture your design, or a copy of it, for anyone else.</li>
      </ul>
    ),
  },
  {
    id: 'your-own-nda',
    title: 'Need your own agreement?',
    body: (
      <p>
        If your organisation needs its own NDA in place before sharing a design, email{' '}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> and we will discuss it with you. How we handle personal data is
        covered separately in our <Link href="/privacy-policy">privacy policy</Link>.
      </p>
    ),
  },
];

export default function NdaPolicyPage() {
  return (
    <LegalPage
      path="/nda-policy"
      title={
        <>
          NDA <Accent>policy</Accent>
        </>
      }
      intro="Your designs are your competitive edge. Here is how MechHub and every MechMaster keep them confidential."
      summary={[
        'Every upload is covered automatically. No per order paperwork.',
        'Files, specifications, pricing and your identity all stay confidential.',
        'MechMasters see only what they need to make your parts.',
        'Copying, photographing, keeping or reselling your design is prohibited.',
      ]}
      sections={SECTIONS}
    />
  );
}
