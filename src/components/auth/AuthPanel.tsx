import {
  EnvelopeSimple,
  Phone,
  SealCheck,
  ShieldCheck,
} from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/utils';
import { EXAMPLE_QUOTE, PROCESSES, SUPPORT } from './auth-facts';
import { VENDOR_CAPABILITIES } from '@/lib/vendor-onboarding';

/* ── Right-hand side panel of sign-in / register screens ──────────────────────
   Clean, visual card: a bold headline, one-liner and a hero parts showcase.
   Inspired by the SendCutSend pattern — minimal text, maximum impact.         */

export const JOIN_STEPS = [
  { title: 'Apply online', body: 'Four short steps: your business, what you make, a password and the NDA.' },
  { title: 'Verify your email', body: 'We send a link to the address you applied with. Your account activates once you click it.' },
  { title: 'We review your shop', body: 'Our team checks your technical and delivery capability and contacts you on the number you gave.' },
  { title: 'Receive orders', body: 'Approved MechMasters get orders with drawings and specs sorted, and a clear payout on every delivery.' },
];

export const KEEP_READY = [
  'Company and owner name',
  'Workshop address and pincode',
  'GST number, if you have one',
  'The processes your shop runs',
];

/** dark: on the sign in panel. light: on ordinary page backgrounds (the MechMaster application). */
type Tone = 'dark' | 'light';

/** Numbered steps joined by a rule, used on the application flow. */
export function StepList({ steps, className, tone = 'dark' }: { steps: { title: string; body: string }[]; className?: string; tone?: Tone }) {
  const light = tone === 'light';
  return (
    <ol className={cn('relative space-y-6', className)}>
      <span aria-hidden="true" className={cn('absolute bottom-3 left-[15px] top-3 w-px', light ? 'bg-lp-border' : 'bg-white/20')} />
      {steps.map((s, i) => (
        <li key={s.title} className="relative flex gap-4">
          <span
            className={cn(
              'lp-mono relative flex size-8 shrink-0 items-center justify-center rounded-full border',
              light ? 'border-lp-border bg-lp-bg text-lp-primary' : 'border-white/20 bg-white/10 text-white'
            )}
          >
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="pt-1">
            <span className={cn('title-4 block', light ? 'text-lp-fg' : 'text-white')}>{s.title}</span>
            <span className={cn('caption-2 mt-1 block', light ? 'text-lp-muted-fg' : 'text-white/60')}>{s.body}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Phone and email so nobody is stuck at a sign-in screen. */
export function HelpLine({ title = 'Need a hand?', className, tone = 'dark' }: { title?: string; className?: string; tone?: Tone }) {
  const light = tone === 'light';
  const link = cn(
    'caption-1 inline-flex items-center gap-2 rounded-full border px-3 py-2 transition-colors duration-300',
    light ? 'border-lp-border text-lp-fg hover:border-lp-primary hover:text-lp-primary' : 'border-white/15 text-white/70 hover:border-white/40 hover:text-white'
  );
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4',
        light ? 'border-lp-border bg-lp-bg' : 'border-white/10 bg-white/5',
        className
      )}
    >
      <div>
        <p className={cn('title-4', light ? 'text-lp-fg' : 'text-white')}>{title}</p>
        <p className={cn('caption-5 mt-1', light ? 'text-lp-muted-fg' : 'text-white/50')}>
          {light ? `Talk to the MechHub team, ${SUPPORT.office}.` : SUPPORT.office}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={SUPPORT.phoneHref} className={link}>
          <Phone aria-hidden="true" className="size-4" weight="bold" />
          {SUPPORT.phone}
        </a>
        <a href={`mailto:${SUPPORT.email}`} className={link}>
          <EnvelopeSimple aria-hidden="true" className="size-4" weight="bold" />
          {SUPPORT.email}
        </a>
      </div>
    </div>
  );
}

/** Clean hero card — bold headline, one-liner, floating part images. */
function HeroCard({
  badge,
  badgeIcon: BadgeIcon,
  headline,
  subhead,
  stats,
  note,
}: {
  badge: string;
  badgeIcon: typeof ShieldCheck;
  headline: string;
  subhead: string;
  stats: { value: string; label: string }[];
  /** Where the numbers come from, shown under the stats row. */
  note?: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      {/* Badge */}
      <p className="caption-1 inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-3 py-1.5 text-blue-400">
        <BadgeIcon aria-hidden="true" className="size-4" weight="fill" />
        {badge}
      </p>

      {/* Headline */}
      <h2 className="mt-6 max-w-[400px] text-[1.75rem] font-bold leading-tight tracking-tight text-white xl:text-[2.25rem]">
        {headline}
      </h2>
      <p className="body-6 mt-3 max-w-[340px] text-white/50">{subhead}</p>

      {/* Stats row */}
      <div className="mt-12 flex w-full max-w-[400px] justify-between">
        {stats.map((s, i) => (
          <div key={s.label} className={cn('flex-1 py-2', i > 0 && 'border-l border-white/10')}>
            <p className="text-2xl font-bold tabular-nums text-white xl:text-3xl">{s.value}</p>
            <p className="caption-5 mt-1 text-white/40">{s.label}</p>
          </div>
        ))}
      </div>
      {note && <p className="caption-5 mt-6 max-w-[360px] text-white/40">{note}</p>}
    </div>
  );
}

/* Every stat below is something the site already states or the pricing engine produces:
   72 h is the average turnaround the home page and FAQ promise, the counts come from the
   service pages and the application form, and ₹77 is EXAMPLE_QUOTE (pinned by a test). */
const PER_PART_AT_100 = EXAMPLE_QUOTE.prices.find((p) => p.quantity === 100)!;
const VENDOR_PROCESSES = VENDOR_CAPABILITIES.filter((c) => c !== 'Other').length;

export function CustomerGuide() {
  return (
    <HeroCard
      badge="NDA on every file"
      badgeIcon={ShieldCheck}
      headline="Custom metal parts, priced instantly"
      subhead="Upload a STEP file. Get a price. Made by a vetted shop, delivered anywhere in India."
      stats={[
        { value: '72h', label: 'Avg turnaround' },
        { value: String(PROCESSES.length), label: 'Processes' },
        { value: PER_PART_AT_100.label, label: `Per part at ${PER_PART_AT_100.quantity} pcs` },
      ]}
      note={`Example quote: ${EXAMPLE_QUOTE.part}, ${EXAMPLE_QUOTE.material}, ${EXAMPLE_QUOTE.process.toLowerCase()}. Excluding GST.`}
    />
  );
}

export function VendorGuide() {
  return (
    <HeroCard
      badge="MechMaster network"
      badgeIcon={SealCheck}
      headline="Orders for your shop, zero sales calls"
      subhead="Drawings and specs sorted. Clear payouts on every delivery."
      stats={[
        { value: '4', label: 'Steps to apply' },
        { value: String(VENDOR_PROCESSES), label: 'Processes we route' },
        { value: '0', label: 'Sales calls' },
      ]}
      note="Every partner passes our technical and delivery checks before the first order."
    />
  );
}
