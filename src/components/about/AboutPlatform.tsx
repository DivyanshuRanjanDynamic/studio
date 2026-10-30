import { Asterisk, Factory, PencilRuler } from 'lucide-react';
import { Reveal, Tag } from '@/components/home/primitives';

/** Dashed link between two sides of the platform, with tokens travelling each way. */
function Lane({ forward, back }: { forward: string; back: string }) {
  const packet = 'about-packet lp-label-mono rounded-sm';
  return (
    <div className="about-lane" aria-hidden="true">
      <div className="about-lane-rail" style={{ '--rail': '34%' } as React.CSSProperties} />
      <div className="about-lane-rail" style={{ '--rail': '66%' } as React.CSSProperties} />
      <span className={`${packet} bg-lp-primary text-lp-primary-fg`} style={{ '--rail': '34%' } as React.CSSProperties}>
        {forward}
      </span>
      <span
        className={`${packet} about-packet-back bg-lp-ink-fg text-lp-ink`}
        style={{ '--rail': '66%' } as React.CSSProperties}
      >
        {back}
      </span>
    </div>
  );
}

export function AboutPlatform() {
  return (
    <section className="lp-grid-bg bg-lp-ink py-24 text-lp-ink-fg md:py-32">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-5">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <Reveal>
              <Tag>The Platform</Tag>
            </Reveal>
            <Reveal delay={100}>
              <h2 className="mt-5 text-[3rem] leading-[0.95] tracking-tight md:text-[4.5rem]">
                A Managed Marketplace, <span className="font-lp-serif italic opacity-70">Not a Vendor List</span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={150} className="lg:self-end">
            <p className="max-w-md opacity-70 lg:ml-auto">
              You deal with one platform and one price. MechHub runs the network behind it, so cutting, bending and
              finishing never become your project to manage.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid lg:grid-cols-[1fr_minmax(5rem,0.45fr)_1.1fr_minmax(5rem,0.45fr)_1fr]">
          <Reveal className="border border-lp-ink-fg/15 bg-lp-ink p-7">
            <PencilRuler className="size-7 text-lp-ink-fg/70" strokeWidth={1.25} />
            <div className="lp-label-mono mt-8 opacity-60">You</div>
            <h3 className="mt-2 text-2xl">Builders</h3>
            <p className="mt-3 text-sm opacity-70">
              Students, startups and hobbyists upload a design, approve a quote and track the order. One part or
              1,000+, with zero minimums.
            </p>
          </Reveal>

          <Lane forward="CAD" back="Parts" />

          <Reveal delay={100} className="lp-grid-bg relative overflow-hidden bg-lp-primary p-7 text-lp-primary-fg">
            <Asterisk
              className="lp-spin-slow absolute -right-8 -top-8 size-36 opacity-20"
              strokeWidth={1}
              aria-hidden="true"
            />
            <div className="lp-label-mono mt-[3.75rem] opacity-80">In the middle</div>
            <h3 className="mt-2 text-2xl">MechHub</h3>
            <p className="mt-3 text-sm opacity-85">
              Instant quotes, NDA-protected design files, real-time order tracking and QC inspection, all in one
              managed flow.
            </p>
          </Reveal>

          <Lane forward="Order" back="Parts" />

          <Reveal delay={200} className="border border-lp-ink-fg/15 bg-lp-ink p-7">
            <Factory className="size-7 text-lp-ink-fg/70" strokeWidth={1.25} />
            <div className="lp-label-mono mt-8 opacity-60">The Network</div>
            <h3 className="mt-2 text-2xl">MechMasters</h3>
            <p className="mt-3 text-sm opacity-70">
              Vetted manufacturing partners take on the work, from sheet cutting and CNC machining to surface
              finishing.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
