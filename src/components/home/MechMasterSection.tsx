import Link from 'next/link';
import { ArrowRight, Check, SealCheck, ShieldCheck } from '@phosphor-icons/react/dist/ssr';
import { Accent, Reveal, SectionHeader } from './primitives';
import { buttonClass } from './button';

const VETTING = ['Technical and delivery quality checks', 'Full NDA contract signed', 'QC inspection on every order'];
const SUPPLIER_BENEFITS = [
  'Orders from verified buyers, with drawings and specs already sorted',
  'No sales calls. Work arrives through the MechHub platform',
  'A clear payout on every delivery',
];

/** The partner network: who makes the parts, and how shops can join. */
export function MechMasterSection() {
  return (
    <section id="network" aria-labelledby="network-heading" className="scroll-mt-24 bg-lp-ink px-4 py-16 text-lp-ink-fg md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader
          inverted
          id="network-heading"
          kicker="The network"
          title={<>Made by vetted <Accent light>MechMasters</Accent></>}
          lead="Your parts never go to a black box. Every order is made by a MechMaster, a manufacturing partner who has passed our technical and delivery checks."
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <Reveal as="article" className="rounded-2xl border border-lp-ink-fg/15 p-6 md:p-8">
            <SealCheck aria-hidden="true" className="size-8 text-lp-primary" weight="duotone" />
            <h3 className="heading-5 mt-6">How partners are vetted</h3>
            <ul className="mt-6 space-y-4">
              {VETTING.map((item) => (
                <li key={item} className="body-6 flex gap-3 text-lp-ink-fg/80">
                  <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-lp-primary" weight="bold" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal as="article" delay={80} className="flex flex-col justify-between gap-8 rounded-2xl bg-lp-primary p-6 text-lp-primary-fg md:p-8">
            <div>
              <h3 className="heading-5">Run a machine shop? Become a MechMaster</h3>
              <p className="body-6 mt-2 text-lp-primary-fg/80">
                Laser cutter, CNC unit or fabrication shop: join the network and get orders straight through MechHub.
              </p>
              <ul className="mt-6 space-y-4">
                {SUPPLIER_BENEFITS.map((benefit) => (
                  <li key={benefit} className="body-6 flex gap-3">
                    <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0" weight="bold" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/onboard" className={`${buttonClass('inverted')} self-start`}>
              Apply to join
              <ArrowRight aria-hidden="true" className="size-4" weight="bold" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
