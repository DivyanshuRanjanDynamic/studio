import type { ReactNode } from 'react';
import {
  Check,
  CreditCard,
  CurrencyInr,
  FileText,
  LockKey,
  Package,
  Percent,
  Receipt,
  ShieldCheck,
  Truck,
  Warning,
} from '@phosphor-icons/react/dist/ssr';
import { MATERIALS } from '@/lib/data/materials';
import { quoteShowcase } from '@/lib/services/service-facts';
import { cn } from '@/utils';
import { SERVICES } from './ServicesSection';
import { Accent, Reveal, SectionHeader } from './primitives';

type Showcase = ReturnType<typeof quoteShowcase>;

/* ── Shared card shell ─────────────────────────────────────────────────────── */

function Panel({
  index,
  label,
  title,
  body,
  children,
  className,
  dark = false,
  delay = 0,
}: {
  index: string;
  label: string;
  title: string;
  body: string;
  children: ReactNode;
  className?: string;
  dark?: boolean;
  delay?: number;
}) {
  return (
    <Reveal
      as="article"
      delay={delay}
      className={cn(
        'flex flex-col gap-6 overflow-hidden rounded-2xl p-6 md:p-8',
        dark ? 'bg-lp-ink text-lp-ink-fg' : 'border border-lp-border bg-lp-card',
        className
      )}
    >
      <div>
        <p className={cn('lp-mono flex items-center gap-2', dark ? 'text-lp-ink-fg/60' : 'text-lp-muted-fg')}>
          <span className={dark ? 'text-lp-ink-fg' : 'text-lp-primary'}>{index}</span>
          <span aria-hidden="true">/</span>
          {label}
        </p>
        <h3 className="heading-5 mt-4">{title}</h3>
        <p className={cn('body-6 mt-2 max-w-[440px]', dark ? 'text-lp-ink-fg/70' : 'text-lp-muted-fg')}>{body}</p>
      </div>
      <div className="mt-auto">{children}</div>
    </Reveal>
  );
}

/* ── Visuals (decorative mockups; the panel text carries the meaning) ──────── */

const QUOTE_LINES = ['Material', 'Cut length', 'Pierces', 'Setup', 'Finishing', 'Delivery'];

function QuoteSheet({ showcase }: { showcase: Showcase }) {
  const ten = showcase.prices.find((p) => p.quantity === 10);
  return (
    <div aria-hidden="true" className="rounded-xl border border-lp-border bg-lp-bg">
      <div className="flex items-center justify-between gap-4 border-b border-lp-border px-4 py-3">
        <span className="flex items-center gap-2">
          <Receipt className="size-4 text-lp-primary" weight="bold" />
          <span className="title-4">Quote</span>
        </span>
        <span className="lp-mono truncate text-lp-muted-fg">{showcase.material}</span>
      </div>
      <ul className="grid grid-cols-2 gap-x-6 px-4 py-2 sm:grid-cols-3">
        {QUOTE_LINES.map((line) => (
          <li key={line} className="caption-2 flex items-center justify-between gap-2 border-b border-dashed border-lp-border py-2">
            {line}
            <Check className="size-4 text-lp-primary" weight="bold" />
          </li>
        ))}
      </ul>
      {ten && (
        <div className="flex flex-wrap items-end justify-between gap-4 px-4 pb-4 pt-2">
          <div>
            <p className="lp-mono text-lp-muted-fg">10 pcs × {ten.label}</p>
            <p className="heading-4 lp-num mt-1">₹{(ten.perPart * 10).toLocaleString('en-IN')}</p>
          </div>
          <span className="lp-mono rounded bg-lp-primary px-2 py-1 text-lp-primary-fg">Plus GST, no hidden fees</span>
        </div>
      )}
    </div>
  );
}

function NdaDoc() {
  return (
    <div aria-hidden="true" className="space-y-2">
      <div className="rounded-xl border border-lp-ink-fg/10 bg-lp-ink-fg/5 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <FileText className="size-4" weight="bold" />
            <span className="title-4">Non disclosure agreement</span>
          </span>
          <ShieldCheck className="size-5 shrink-0 text-lp-primary" weight="fill" />
        </div>
        <div className="mt-4 space-y-2">
          {['w-full', 'w-11/12', 'w-4/5', 'w-2/3'].map((w) => (
            <div key={w} className={cn('h-1 rounded-full bg-lp-ink-fg/15', w)} />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {['MechHub', 'MechMaster'].map((party) => (
            <div key={party} className="rounded-lg border border-lp-ink-fg/10 px-2 py-2">
              <p className="lp-mono text-lp-ink-fg/60">{party}</p>
              <p className="caption-4 mt-1 flex items-center gap-1">
                <Check className="size-3 text-lp-primary" weight="bold" /> Signed
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 rounded-xl border border-lp-ink-fg/10 px-4 py-3">
        <span className="caption-4 truncate">bracket_v3.step</span>
        <span className="lp-mono flex shrink-0 items-center gap-1 text-lp-primary">
          <LockKey className="size-3" weight="bold" /> Encrypted
        </span>
      </div>
    </div>
  );
}

const STAGES = ['CAD uploaded', 'Quote approved', 'In production', 'Quality checked', 'Shipped'];

function Tracker() {
  const current = 2;
  return (
    <div aria-hidden="true">
      <div className="flex gap-1">
        {STAGES.map((s, i) => (
          <span key={s} className={cn('h-1 flex-1 rounded-full', i <= current ? 'bg-lp-primary' : 'bg-lp-border')} />
        ))}
      </div>
      <ol className="mt-4 space-y-2">
        {STAGES.map((s, i) => (
          <li key={s} className="flex items-center justify-between">
            <span className={cn('caption-1 flex items-center gap-2', i > current && 'text-lp-muted-fg/60')}>
              <span className={cn('size-2 rounded-full', i <= current ? 'bg-lp-primary' : 'bg-lp-border')} />
              {s}
            </span>
            {i === current && <span className="lp-mono rounded bg-lp-primary/10 px-1 text-lp-primary">Now</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

function ScaleChart({ showcase }: { showcase: Showcase }) {
  const max = Math.max(...showcase.prices.map((p) => p.perPart));
  return (
    <div aria-hidden="true">
      <div className="flex h-32 items-end gap-2">
        {showcase.prices.map((p) => (
          <div key={p.quantity} className="flex h-full flex-1 flex-col justify-end">
            <span className="lp-mono mb-1 text-center">{p.label}</span>
            <div
              className={cn('rounded-t', p.quantity === 100 ? 'bg-lp-primary' : 'bg-lp-primary/25')}
              style={{ height: `${Math.max(8, (p.perPart / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 border-t border-lp-border pt-2">
        {showcase.prices.map((p) => (
          <span key={p.quantity} className="lp-mono flex-1 text-center text-lp-muted-fg">
            {p.quantity} {p.quantity === 1 ? 'pc' : 'pcs'}
          </span>
        ))}
      </div>
    </div>
  );
}

function Pipeline() {
  const steps = ['Cutting', 'Bending', 'Machining', 'Finishing'];
  return (
    <div aria-hidden="true" className="flex items-stretch gap-2">
      <div className="flex flex-col gap-1">
        {steps.map((s) => (
          <span key={s} className="lp-mono rounded border border-lp-border bg-lp-bg px-2 py-1 text-lp-muted-fg">
            {s}
          </span>
        ))}
      </div>
      <svg viewBox="0 0 40 120" preserveAspectRatio="none" className="w-8 shrink-0 text-lp-primary" fill="none" stroke="currentColor" strokeWidth="1.25">
        <path d="M0 14C24 14 16 60 40 60M0 45C20 45 20 60 40 60M0 75C20 75 20 60 40 60M0 106C24 106 16 60 40 60" />
      </svg>
      <div className="flex flex-1 flex-col justify-center gap-1 rounded-xl bg-lp-primary p-3 text-lp-primary-fg">
        <Package className="size-5" weight="duotone" />
        <span className="title-4">One order</span>
        <span className="lp-mono flex items-center gap-1 opacity-80">
          <Truck className="size-3" weight="bold" /> One delivery
        </span>
      </div>
    </div>
  );
}

// The rules the sheet DFM check applies (see the precision sheet cutting service page).
const DFM_CHECKS: { label: string; ok: boolean }[] = [
  { label: 'Kerf compensated automatically', ok: true },
  { label: 'Part spacing at least 1× thickness', ok: true },
  { label: 'Keep 2 mm lead in clearance from critical edges', ok: false },
];

function DfmChecks() {
  return (
    <ul aria-hidden="true" className="divide-y divide-lp-border rounded-xl border border-lp-border bg-lp-bg">
      {DFM_CHECKS.map(({ label, ok }) => (
        <li key={label} className="caption-2 flex items-center gap-3 px-4 py-3">
          {ok ? (
            <Check className="size-4 shrink-0 text-lp-primary" weight="bold" />
          ) : (
            <Warning className="size-4 shrink-0 text-lp-destructive" weight="bold" />
          )}
          <span className={cn('flex-1', !ok && 'text-lp-fg')}>{label}</span>
          <span className={cn('lp-mono', ok ? 'text-lp-muted-fg' : 'text-lp-destructive')}>{ok ? 'Pass' : 'Fix'}</span>
        </li>
      ))}
    </ul>
  );
}

function Payment() {
  return (
    <div aria-hidden="true" className="grid grid-cols-3 gap-2">
      {[
        { icon: CurrencyInr, label: 'Priced in rupees' },
        { icon: CreditCard, label: 'Razorpay checkout' },
        { icon: Percent, label: 'GST shown upfront' },
      ].map(({ icon: Icon, label }) => (
        <div key={label} className="flex flex-col items-start gap-2 rounded-xl border border-lp-border bg-lp-bg p-3">
          <Icon className="size-5 text-lp-primary" weight="duotone" />
          <span className="caption-4">{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Section ───────────────────────────────────────────────────────────────── */

/** What you get: real platform numbers, then a product view of each promise. */
export function PromiseSection() {
  const showcase = quoteShowcase();
  const kpis = [
    { value: String(SERVICES.length), label: 'Manufacturing processes' },
    { value: String(MATERIALS.length), label: 'Materials in stock' },
    { value: '± 0.025 mm', label: 'CNC tolerance' },
    { value: '72 h', label: 'Average turnaround' },
  ];

  return (
    <section id="benefits" aria-labelledby="benefits-heading" className="scroll-mt-24 bg-lp-muted px-4 py-16 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader
          id="benefits-heading"
          kicker="What you get"
          title={
            <>
              Manufacturing you can <br className="hidden md:block" />
              actually <Accent>see into</Accent>
            </>
          }
          lead="Clear pricing, protected designs and a live view of every order, from CAD upload to your door."
        />

        <Reveal as="div" className="mt-12">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-lp-border bg-lp-border md:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.label} className="bg-lp-bg p-6">
                <dt className="lp-mono text-lp-muted-fg">{k.label}</dt>
                <dd className="heading-4 lp-num mt-2">{k.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          <Panel
            className="lg:col-span-7"
            index="01"
            label="Pricing"
            title="See every rupee"
            body={`Your quote lists what goes into the price before you order. Shown: a live quote for a ${showcase.part} in ${showcase.material}.`}
          >
            <QuoteSheet showcase={showcase} />
          </Panel>

          <Panel
            dark
            delay={80}
            className="lg:col-span-5"
            index="02"
            label="Protection"
            title="Your design stays yours"
            body="Every MechMaster signs an NDA before seeing a file, and designs are encrypted at rest and in transit."
          >
            <NdaDoc />
          </Panel>

          <Panel className="lg:col-span-4" index="03" label="Tracking" title="Track every stage" body="Know where your parts are, from quote approval through production, QC and dispatch.">
            <Tracker />
          </Panel>

          <Panel
            className="lg:col-span-4"
            delay={80}
            index="04"
            label="Scale"
            title="One part or a thousand"
            body="No minimum quantity, and the price per part falls as the batch grows. Same plate as above."
          >
            <ScaleChart showcase={showcase} />
          </Panel>

          <Panel
            className="lg:col-span-4"
            delay={160}
            index="05"
            label="Network"
            title="One order, one delivery"
            body="Cutting, bending, machining and finishing run through one partner network. You manage one order, not four vendors."
          >
            <Pipeline />
          </Panel>

          <Panel
            className="lg:col-span-6"
            index="06"
            label="Design checks"
            title="Problems caught before you pay"
            body="Our DFM engine checks geometry, nesting and kerf the moment you upload, so you can fix issues before ordering."
          >
            <DfmChecks />
          </Panel>

          <Panel
            className="lg:col-span-6"
            delay={80}
            index="07"
            label="Payment"
            title="Pay the way Indian teams do"
            body="Quotes are in rupees plus applicable GST, and checkout runs through Razorpay. We never store your card details."
          >
            <Payment />
          </Panel>
        </div>
      </div>
    </section>
  );
}
