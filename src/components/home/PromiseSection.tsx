'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { cn } from '@/utils';
import { Reveal, Tag } from './primitives';

const STAGES = ['CAD Uploaded', 'Quote Approved', 'In Production', 'Quality Checked', 'Shipped'];

const BREAKDOWN = [
  ['Material', '$120.00'],
  ['Machining', '$80.00'],
  ['Finishing', '$40.00'],
  ['Delivery', '$15.00'],
];

const SCALE: [string, string, number][] = [
  ['1', 'prototype', 20],
  ['10', 'parts', 40],
  ['100', 'parts', 65],
  ['1,000+', 'parts', 100],
];

function PromiseCard({
  title,
  body,
  children,
  delay = 0,
  className = '',
}: {
  title: string;
  body: string;
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <Reveal
      delay={delay}
      className={cn(
        'flex flex-col justify-between gap-6 border border-lp-border bg-lp-card p-7 hover:shadow-[0_20px_60px_-20px_oklch(var(--lp-primary))]',
        className
      )}
    >
      <div>
        <h3 className="text-2xl">{title}</h3>
        <p className="mt-2 text-sm text-lp-muted-fg">{body}</p>
      </div>
      {children}
    </Reveal>
  );
}

/** "Manufacturing Without the Black Box" — tracking, IP, pricing and scale promises. */
export function PromiseSection() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStage((s) => (s + 1) % STAGES.length), 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-28 sm:px-5">
      <div className="text-center">
        <Reveal>
          <Tag>Our Promise</Tag>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="mt-5 text-[3rem] leading-[0.95] tracking-tight md:text-[4.5rem]">
            Manufacturing Without the <span className="lp-accent-serif">Black Box</span>
          </h2>
        </Reveal>
        <Reveal delay={150}>
          <p className="mx-auto mt-5 max-w-md text-lp-muted-fg">
            Clear pricing, protected designs, and visibility from CAD upload to delivery.
          </p>
        </Reveal>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-2">
        <PromiseCard
          title="Track Every Stage"
          body="Know exactly where your parts are — from quote approval to production, quality check and dispatch."
        >
          <div className="space-y-2">
            {STAGES.map((label, i) => (
              <div
                key={label}
                className={cn(
                  'flex items-center gap-3 text-sm transition-all duration-500',
                  i <= stage ? 'text-lp-fg' : 'text-lp-muted-fg/50'
                )}
              >
                <span
                  className={cn('size-2.5 rounded-full transition-colors', i <= stage ? 'bg-lp-primary' : 'bg-lp-border')}
                />
                {label}
              </div>
            ))}
          </div>
        </PromiseCard>

        <PromiseCard
          title="Your IP Stays Yours"
          body="We follow NDA-first workflows and store your designs in encrypted storage, so your ideas stay confidential."
          delay={80}
          className="lp-grid-bg bg-lp-primary text-lp-primary-fg [&_p]:text-lp-primary-fg/80"
        >
          <div className="relative flex h-24 items-center justify-center">
            <ShieldCheck className="lp-floaty size-20" strokeWidth={1} />
            <span className="absolute size-24 animate-ping rounded-full border border-lp-primary-fg/40" />
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="lp-label-mono flex items-center gap-2 border border-lp-primary-fg/40 px-3 py-2">
              <ShieldCheck className="size-4" />
              NDA Protected
            </span>
            <span className="lp-label-mono flex items-center gap-2 border border-lp-primary-fg/40 px-3 py-2">
              <Lock className="size-4" />
              Encrypted
            </span>
          </div>
        </PromiseCard>

        <PromiseCard
          title="Know What You Pay"
          body="Get transparent quotes, broken down by material, process, finishing and quantity. No surprises."
        >
          <div className="text-sm">
            <div className="lp-label-mono mb-2 text-lp-muted-fg">Quote Breakdown</div>
            {BREAKDOWN.map(([label, amount]) => (
              <div key={label} className="flex justify-between border-b border-dashed border-lp-border py-1.5">
                <span>{label}</span>
                <span className="font-lp-mono">{amount}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 font-medium text-lp-primary">
              <span>Total</span>
              <span className="font-lp-mono">$255.00</span>
            </div>
          </div>
        </PromiseCard>

        <PromiseCard
          title="From 1 Part to Production"
          body="Start with a single prototype, or scale to thousands. Our manufacturing network grows with your needs."
          delay={80}
        >
          <div className="flex items-end gap-3">
            {SCALE.map(([qty, unit, height]) => (
              <div key={qty} className="flex-1">
                <div
                  className="lp-bar-grow bg-lp-primary/20 transition-colors hover:bg-lp-primary"
                  style={{ height: `${height}px`, animationDelay: `${height * 8}ms` }}
                />
                <div className="mt-2 text-lg">{qty}</div>
                <div className="lp-label-mono text-lp-muted-fg">{unit}</div>
              </div>
            ))}
          </div>
        </PromiseCard>
      </div>

      <p className="lp-label-mono mt-8 text-center text-lp-muted-fg">
        NDA Protected • Transparent Quotes • QC Inspected • Reliable Lead Times
      </p>
    </section>
  );
}
