import Link from 'next/link';
import { Check, MapPin, Star } from 'lucide-react';
import { Reveal, Tag } from './primitives';

const BUYER_BADGES = ['QC Inspected', 'NDA Signed', 'On-Time Rated'];
const SUPPLIER_BENEFITS = [
  'Steady order flow from verified buyers',
  'No sales calls — orders come to you',
  'Transparent payout with every delivery',
];
const SUPPLIER_STATS = [
  ['₹0', 'Setup Cost'],
  ['24hr', 'Onboarding'],
  ['100%', 'Transparent'],
];

// TODO: Replace mock partner card with real MechMaster profiles
export function MechMasterSection() {
  return (
    <section id="network" className="scroll-mt-16 bg-lp-ink py-28 text-lp-ink-fg">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-5">
        <Reveal>
          <Tag>The Network</Tag>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="mt-5 text-[3rem] leading-[0.95] tracking-tight md:text-[4.5rem]">
            Powered by Verified <span className="font-lp-serif italic opacity-70">MechMasters</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <Reveal className="border border-lp-ink-fg/15 p-8">
            <h3 className="text-3xl">Vetted Manufacturing Partners</h3>
            <p className="mt-3 text-sm opacity-70">
              Your parts aren&apos;t made in a black box. Every order goes to a MechHub-certified MechMaster — a
              verified manufacturing partner who has passed our technical and delivery quality standards.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {BUYER_BADGES.map((badge) => (
                <span key={badge} className="lp-label-mono border border-lp-ink-fg/25 px-2 py-1">
                  ✓ {badge}
                </span>
              ))}
            </div>
            <div className="mt-8 rounded-sm bg-lp-ink-fg/5 p-6 transition-transform hover:scale-[1.02]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg">Verified MechMaster</div>
                  <div className="flex items-center gap-1 text-xs opacity-60">
                    <MapPin className="size-3" />
                    Mumbai, India
                  </div>
                </div>
                <span className="lp-tag">Verified</span>
              </div>
              <div className="lp-label-mono mt-5 opacity-60">Capabilities</div>
              <div className="mt-2 flex gap-2">
                {['Sheet Cutting', 'CNC', 'Bending'].map((cap) => (
                  <span key={cap} className="border border-lp-ink-fg/25 px-2 py-1 text-xs">
                    {cap}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-2 text-sm">
                <Star className="size-4 fill-lp-primary text-lp-primary" />
                4.9 · 120 orders completed
              </div>
            </div>
          </Reveal>

          <Reveal delay={100} className="lp-grid-bg flex flex-col justify-between bg-lp-primary p-8 text-lp-primary-fg">
            <div>
              <h3 className="text-3xl">Become a MechMaster</h3>
              <p className="mt-3 text-sm opacity-85">
                Own a machine shop? CNC unit? Laser cutter? Join India&apos;s fastest-growing manufacturing network
                and get orders directly through the MechHub platform.
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {SUPPLIER_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex gap-2">
                    <Check className="size-4 shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-lp-primary-fg/30 pt-6">
                {SUPPLIER_STATS.map(([value, label]) => (
                  <div key={label}>
                    <div className="text-3xl">{value}</div>
                    <div className="lp-label-mono opacity-75">{label}</div>
                  </div>
                ))}
              </div>
              <Link
                href="/onboard"
                className="lp-label-mono mt-8 inline-flex items-center gap-2 rounded-sm bg-lp-bg px-5 py-3 text-lp-fg transition-transform hover:scale-105"
              >
                → Apply to Join
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
