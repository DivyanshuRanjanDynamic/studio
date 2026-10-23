'use client';

import Link from 'next/link';
import { Upload } from 'lucide-react';
import { Reveal, Tag } from './primitives';

const STEPS = [
  [
    'Choose Options',
    'Select your manufacturing process, material, thickness, and finishing options like anodizing or powder coating.',
  ],
  ['Upload Your Design', 'Upload your STEP, DXF, or DWG file through our secure, NDA-protected portal.'],
  ['Get Your Quote', 'Receive an instant or rapid quote with full cost breakdown — no hidden fees, ever.'],
  [
    'Receive Your Parts',
    'We manufacture at our vetted facility and deliver directly to your door, with real-time tracking.',
  ],
];

export function HowItWorks({ uploadHref }: { uploadHref: string }) {
  return (
    <section id="process" className="mx-auto max-w-[1400px] scroll-mt-16 px-4 py-28 sm:px-5">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
        <div className="self-start lg:sticky lg:top-28">
          <Reveal>
            <Tag>The Process</Tag>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="mt-5 text-[3rem] leading-[0.95] tracking-tight md:text-[4.5rem]">
              See How It <span className="lp-accent-serif">Works</span>
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-5 max-w-sm text-lp-muted-fg">From design file to delivered part — in days, not weeks.</p>
            <p className="mt-3 max-w-sm text-sm text-lp-muted-fg">
              Watch how a student team got their drone frame manufactured and delivered in 72 hours.
            </p>
          </Reveal>
          <Reveal delay={200} className="mt-8 max-w-md">
            <Link
              href={uploadHref}
              className="lp-grid-bg flex aspect-[4/3] flex-col items-center justify-center gap-4 rounded-sm bg-lp-primary text-lp-primary-fg"
            >
              <Upload className="lp-floaty size-12" strokeWidth={1} />
              <span className="text-center text-2xl">
                Drag &amp; Drop
                <br />
                Your Design
              </span>
              <span className="lp-label-mono opacity-80">STEP / DXF / DWG</span>
            </Link>
          </Reveal>
        </div>

        <div className="space-y-4">
          {STEPS.map(([title, body], i) => (
            <Reveal
              key={title}
              delay={i * 60}
              className="group flex gap-6 border border-lp-border bg-lp-card p-7 hover:translate-x-2 hover:border-lp-primary"
            >
              <span className="font-lp-serif text-6xl italic leading-none text-lp-primary/30 transition-colors group-hover:text-lp-primary">
                0{i + 1}
              </span>
              <div>
                <h4 className="text-2xl">{title}</h4>
                <p className="mt-2 text-sm text-lp-muted-fg">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
