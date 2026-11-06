import { Metadata } from 'next';
import { Accent } from '@/components/home/primitives';
import { LegalPage, type LegalSection } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Refund Policy | MechHub',
  description:
    'When you can cancel a MechHub order, what you get back at each stage, and how quality problems with your parts are put right.',
  alternates: {
    canonical: '/refund-policy',
  },
};

const STAGES = [
  {
    stage: 'Before material is bought',
    outcome: 'Full refund',
    detail: 'Your order has not entered production yet, so you get everything back.',
  },
  {
    stage: 'Material bought, fabrication not started',
    outcome: 'Refund minus material',
    detail: 'You are refunded in full, less the verifiable cost of raw material bought specifically for your order.',
  },
  {
    stage: 'Fabrication started',
    outcome: 'No refund',
    detail: 'Once cutting, machining or other fabrication begins, the material is altered for good and cannot be reused.',
  },
];

const SECTIONS: LegalSection[] = [
  {
    id: 'why-custom-is-different',
    title: 'Why custom parts are different',
    body: (
      <>
        <p>
          Every part on MechHub is made to your exact specification. Once production starts, the raw material is
          permanently altered and cannot be returned to stock or sold to anyone else.
        </p>
        <p>
          This policy protects you fully when something goes wrong on our side, while being fair to the MechMasters who
          make your parts.
        </p>
      </>
    ),
  },
  {
    id: 'cancellations',
    title: 'Cancelling an order',
    body: (
      <>
        <p>What you get back depends on how far your order has progressed:</p>
        <div className="not-prose grid gap-2 sm:grid-cols-3">
          {STAGES.map((s, i) => (
            <div key={s.stage} className="rounded-xl border border-lp-border bg-lp-card p-4">
              <p className="lp-mono text-lp-primary">Stage {i + 1}</p>
              <p className="title-4 mt-2 text-lp-fg">{s.stage}</p>
              <p className="lp-mono mt-2 text-lp-fg">{s.outcome}</p>
              <p className="caption-2 mt-2 text-lp-muted-fg">{s.detail}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: 'quality',
    title: 'When parts do not match your specification',
    body: (
      <>
        <p>
          If your parts do not conform to the specifications, tolerances or material stated in your drawing, you are
          entitled to a remedy.
        </p>
        <h3>To be eligible</h3>
        <ul>
          <li>Report the problem within 7 business days of receiving your parts.</li>
          <li>Share measurement evidence, such as CMM or calliper readings.</li>
          <li>The problem must come from manufacturing. Errors in the design itself are not covered.</li>
        </ul>
        <h3>What we offer</h3>
        <ul>
          <li>
            <strong>Remake</strong> the parts at no cost to you
          </li>
          <li>
            <strong>Partial refund</strong> for minor deviations
          </li>
          <li>
            <strong>Full refund</strong> for parts that cannot be used
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'raising-a-claim',
    title: 'How to raise a claim',
    body: (
      <>
        <p>
          Email <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> with your order number, a short description of the
          problem, photos of the affected parts and your measurements. We will review the evidence with the MechMaster and
          confirm which remedy applies.
        </p>
        <p>Refunds are paid back to the payment method you used for the order.</p>
      </>
    ),
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalPage
      path="/refund-policy"
      title={
        <>
          Refund <Accent>policy</Accent>
        </>
      }
      intro="When you can cancel an order, what you get back at each stage, and how we put things right if your parts are not to specification."
      summary={[
        'Cancel before material is bought for a full refund.',
        'After material is bought, you get back everything except its cost.',
        'Once fabrication starts, the order cannot be refunded.',
        'Parts not to spec? Report within 7 business days for a remake or refund.',
      ]}
      sections={SECTIONS}
    />
  );
}
