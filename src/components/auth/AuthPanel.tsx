import Image from 'next/image';
import {
  EnvelopeSimple,
  Phone,
  SealCheck,
  ShieldCheck,
} from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/utils';
import { SUPPORT } from './auth-facts';

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

/** Numbered steps joined by a rule, used on the application flow. */
export function StepList({ steps, className }: { steps: { title: string; body: string }[]; className?: string }) {
  return (
    <ol className={cn('relative space-y-6', className)}>
      <span aria-hidden="true" className="absolute bottom-3 left-[15px] top-3 w-px bg-white/20" />
      {steps.map((s, i) => (
        <li key={s.title} className="relative flex gap-4">
          <span className="lp-mono relative flex size-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white">
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="pt-1">
            <span className="title-4 block text-white">{s.title}</span>
            <span className="caption-2 mt-1 block text-white/60">{s.body}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Phone and email so nobody is stuck at a sign-in screen. */
export function HelpLine({ title = 'Need a hand?', className }: { title?: string; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4', className)}>
      <div>
        <p className="title-4 text-white">{title}</p>
        <p className="caption-5 mt-1 text-white/50">{SUPPORT.office}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={SUPPORT.phoneHref}
          className="caption-1 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-white/70 transition-colors duration-300 hover:border-white/40 hover:text-white"
        >
          <Phone aria-hidden="true" className="size-4" weight="bold" />
          {SUPPORT.phone}
        </a>
        <a
          href={`mailto:${SUPPORT.email}`}
          className="caption-1 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-white/70 transition-colors duration-300 hover:border-white/40 hover:text-white"
        >
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
}: {
  badge: string;
  badgeIcon: typeof ShieldCheck;
  headline: string;
  subhead: string;
  stats: { value: string; label: string }[];
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
    </div>
  );
}

export function CustomerGuide() {
  return (
    <HeroCard
      badge="NDA on every file"
      badgeIcon={ShieldCheck}
      headline="Custom CNC parts, priced instantly"
      subhead="Upload a STEP file. Get a price. Made by a vetted shop, delivered anywhere in India."
      stats={[
        { value: '72h', label: 'Avg turnaround' },
        { value: '9+', label: 'Processes' },
        { value: '₹0', label: 'Quoting fee' },
      ]}
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
        { value: '0%', label: 'Commission' },
        { value: '100%', label: 'Specs sorted' },
        { value: 'Fast', label: 'Payouts' },
      ]}
    />
  );
}
