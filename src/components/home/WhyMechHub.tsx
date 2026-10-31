import { Check, X } from 'lucide-react';
import { Reveal, Tag } from './primitives';

const FEATURES = [
  ['Quoting', 'Get instant quotes with verified vendors.'],
  ['Transparency', 'See real-time production updates and pricing.'],
  ['Order Size', "From 1 piece to 1000+, we've got you covered."],
  ['IP Protection', 'Your designs stay yours — always.'],
  ['Logistics', 'Reliable and on-time delivery, across India.'],
];

const OLD_WAY = [
  'Email 10 vendors, wait 3 days, get 10 different answers.',
  "No visibility — you don't know if your part is being made or sitting in a queue.",
  'Minimum order quantities that price out students and small teams.',
  'Your CAD files shared with random vendors, no NDA, no protection.',
  'Different vendors for cutting, bending, finishing — you manage everything.',
];

const MECHHUB_WAY = [
  ['Upload once. Get an instant or rapid quote.', ' One platform, one price.'],
  ['Real-time order tracking', ' from upload to delivery. Full visibility, always.'],
  ['Order 1 part or 1000.', ' No minimum quantity, just a small minimum order value.'],
  ['Every design covered by NDA and encrypted', ' with AES-256. Your IP stays yours.'],
  ['All services through one partner network.', ' One order, one delivery, zero overhead.'],
];

export function WhyMechHub() {
  return (
    <section className="bg-lp-muted/60 py-28">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-5">
        <Reveal>
          <Tag>Why MechHub</Tag>
        </Reveal>
        <div className="mt-5 grid gap-8 lg:grid-cols-2">
          <Reveal delay={100}>
            <h2 className="text-[3rem] leading-[0.95] tracking-tight md:text-[4.5rem]">
              Why Builders Choose <span className="lp-accent-serif">MechHub</span>
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="max-w-md text-lp-muted-fg lg:ml-auto lg:mt-4">
              We didn&apos;t build another parts website. We built the infrastructure India&apos;s hardware builders
              actually needed.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-px bg-lp-border sm:grid-cols-2 lg:grid-cols-5">
          {FEATURES.map(([title, body], i) => (
            <Reveal key={title} delay={i * 60} className="bg-lp-card p-6 hover:bg-lp-accent">
              <span className="lp-label-mono text-lp-primary">0{i + 1}</span>
              <h4 className="mt-6 text-xl">{title}</h4>
              <p className="mt-2 text-sm text-lp-muted-fg">{body}</p>
            </Reveal>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Reveal className="border border-lp-border bg-lp-card p-8">
            <div className="lp-label-mono text-lp-muted-fg">The Old Way</div>
            <ul className="mt-6 space-y-4">
              {OLD_WAY.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm text-lp-muted-fg line-through decoration-lp-destructive/40"
                >
                  <X className="mt-0.5 size-4 shrink-0 text-lp-destructive" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={100} className="lp-grid-bg bg-lp-primary p-8 text-lp-primary-fg">
            <div className="lp-label-mono opacity-80">The MechHub Way</div>
            <ul className="mt-6 space-y-4">
              {MECHHUB_WAY.map(([bold, rest]) => (
                <li key={bold} className="flex gap-3 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0" />
                  <span>
                    <b className="font-medium">{bold}</b>
                    <span className="opacity-80">{rest}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="lp-floaty mt-8 inline-flex items-center gap-3 rounded-sm bg-lp-bg px-4 py-3 text-sm text-lp-fg">
              <Check className="size-4 text-lp-primary" />
              Quote received! <b className="font-semibold">₹ 18,500 · 2 days</b>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-14 text-center">
          <p className="mx-auto max-w-3xl text-2xl leading-snug md:text-4xl md:leading-snug">
            &ldquo;MechHub is the only Indian manufacturing platform built specifically for{' '}
            <span className="lp-accent-serif">prototypes and small teams</span> — not factories.&rdquo;
          </p>
          <p className="lp-label-mono mt-4 text-lp-muted-fg">💡 Better parts. Faster builds. For every creator.</p>
        </Reveal>
      </div>
    </section>
  );
}
