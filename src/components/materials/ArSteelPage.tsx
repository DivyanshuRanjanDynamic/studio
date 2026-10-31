import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { V2Shell } from '@/components/V2Shell';
import { FinalCTA } from '@/components/home/FinalCTA';
import { CtaButton, Reveal, Tag } from '@/components/home/primitives';
import { ORDER_MINIMUMS, formatInr } from '@/lib/services/service-facts';

export interface ArSteelGrade {
  readonly grade: 'AR400' | 'AR500';
  readonly hardness: string;
  readonly image: string;
  readonly intro: string;
  readonly uses: readonly string[];
  readonly choose: string;
  readonly compare: { readonly grade: string; readonly href: string; readonly note: string };
}

const PROCESS = [
  ['Send Your File', 'Share a STEP or DXF file with the thickness, quantity and any secondary work you need.'],
  ['Get an Engineer Quote', 'An engineer checks plate availability and confirms price and lead time. Accept it or counter-offer.'],
  ['Receive Your Parts', 'A verified MechMaster makes your parts under a full NDA contract. They are QC inspected and tracked to delivery.'],
];

const DESIGN_NOTES = [
  ['Cut profiles and holes by laser', 'Hard plate wears out drills and taps, so cut as much of the geometry as you can in one operation.'],
  ['Flag any bends early', 'Hardened plate resists forming and needs generous bend radii. Tell us before you finalise the design.'],
  ['Mention heat exposure', 'High heat softens the plate. Let us know about welding or hot service so we can review it.'],
];

export function ArSteelPage({ grade, hardness, image, intro, uses, choose, compare }: ArSteelGrade) {
  const specs = [
    ['Material', `${grade} abrasion-resistant steel plate`],
    ['Nominal hardness', hardness],
    ['Process', 'Laser cutting'],
    ['Tolerance', '± 0.1 mm on metals up to 6 mm. Thicker plate is confirmed with your quote.'],
    ['Thickness', 'Confirmed at quote against available plate'],
    ['Files', 'STEP or DXF'],
    ['Quoting', 'Engineer review'],
    ['Minimum order', `One part, ${formatInr(ORDER_MINIMUMS.sheet)} minimum value per line item`],
  ];

  const faqs = [
    [
      `What thicknesses do you offer ${grade} in?`,
      'We confirm thickness against available plate when we quote. Tell us what you need and an engineer will come back with what can be supplied.',
    ],
    [
      `Can I get an instant quote for ${grade}?`,
      `Not yet. ${grade} is not in the instant quote engine, so an engineer prices it from your file and requirements. You can accept the quote or send a counter-offer.`,
    ],
    ['What tolerance can I expect?', '± 0.1 mm for fiber laser on metals up to 6 mm. Thicker plate is confirmed with your quote.'],
    ['Is there a minimum order?', `You can order one part. The minimum order value is ${formatInr(ORDER_MINIMUMS.sheet)} per line item.`],
    [
      'Who makes my parts?',
      'A verified MechMaster from our partner network. Every partner works under a full NDA contract, and parts are QC inspected before dispatch.',
    ],
  ];

  return (
    <V2Shell>
      <section className="lp-hero-dots pb-20 pt-32 md:pt-40">
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-4 sm:px-5 lg:grid-cols-2">
          <div>
            <Reveal>
              <Tag>Materials</Tag>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="mt-5 text-[3rem] leading-[0.95] tracking-tight md:text-[5rem]">
                {grade} <span className="lp-accent-serif">Steel</span> Plate
              </h1>
            </Reveal>
            <Reveal delay={150}>
              <p className="mt-6 max-w-lg text-lp-muted-fg">{intro}</p>
            </Reveal>
            <Reveal delay={200} className="mt-8 flex flex-wrap gap-3">
              <CtaButton href="/contact">Talk to an Engineer</CtaButton>
              <CtaButton href="/materials" ghost>
                All Materials
              </CtaButton>
            </Reveal>
          </div>
          <Reveal delay={150} className="relative aspect-square max-h-[520px] w-full">
            <Image
              src={image}
              alt={`Laser cut ${grade} steel part`}
              fill
              priority
              sizes="(min-width: 1024px) 520px, 100vw"
              className="object-contain drop-shadow-[0_30px_30px_rgba(0,0,40,0.18)]"
            />
          </Reveal>
        </div>
      </section>

      <section className="bg-lp-muted/60 py-24">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-4 sm:px-5 lg:grid-cols-[1fr_1.3fr]">
          <Reveal>
            <Tag>Specifications</Tag>
            <h2 className="mt-5 text-[2.5rem] leading-[0.95] tracking-tight md:text-[3.5rem]">
              {grade} at <span className="lp-accent-serif">MechHub</span>
            </h2>
          </Reveal>
          <Reveal delay={100} className="border border-lp-border bg-lp-card px-6">
            <dl>
              {specs.map(([label, value]) => (
                <div
                  key={label}
                  className="grid gap-1 border-b border-lp-border py-4 last:border-0 sm:grid-cols-[180px_1fr] sm:gap-4"
                >
                  <dt className="lp-label-mono text-lp-muted-fg">{label}</dt>
                  <dd className="text-sm">{value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-24 sm:px-5">
        <Reveal>
          <Tag>The Process</Tag>
          <h2 className="mt-5 text-[2.5rem] leading-[0.95] tracking-tight md:text-[3.5rem]">
            How We <span className="lp-accent-serif">Quote</span> It
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {PROCESS.map(([title, body], i) => (
            <Reveal key={title} delay={i * 80} className="border border-lp-border bg-lp-card p-7">
              <span className="lp-label-mono text-lp-primary">0{i + 1}</span>
              <h3 className="mt-6 text-2xl">{title}</h3>
              <p className="mt-2 text-sm text-lp-muted-fg">{body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-lp-ink py-24 text-lp-ink-fg">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-4 sm:px-5 lg:grid-cols-2">
          <Reveal>
            <Tag>When to Use It</Tag>
            <p className="mt-6 text-2xl leading-snug md:text-3xl">{choose}</p>
            <ul className="mt-8 flex flex-wrap gap-2">
              {uses.map((use) => (
                <li key={use} className="lp-label-mono border border-lp-ink-fg/25 px-2 py-1">
                  {use}
                </li>
              ))}
            </ul>
            <Link
              href={compare.href}
              className="group mt-10 flex items-center justify-between gap-4 border-t border-lp-ink-fg/15 pt-5"
            >
              <span>
                <span className="block text-xl">Compare {compare.grade}</span>
                <span className="text-sm opacity-70">{compare.note}</span>
              </span>
              <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
          <Reveal delay={100} className="space-y-6">
            <h2 className="text-3xl">Design Notes</h2>
            {DESIGN_NOTES.map(([title, body]) => (
              <div key={title} className="border-t border-lp-ink-fg/15 pt-5">
                <h3 className="text-xl">{title}</h3>
                <p className="mt-2 text-sm opacity-70">{body}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-24 sm:px-5">
        <Reveal className="text-center">
          <Tag>FAQs</Tag>
          <h2 className="mt-5 text-[2.5rem] leading-[0.95] tracking-tight md:text-[3.5rem]">
            {grade} <span className="lp-accent-serif">Questions</span>
          </h2>
        </Reveal>
        <div className="mt-12 space-y-3">
          {faqs.map(([question, answer]) => (
            <details key={question} className="group border border-lp-border bg-lp-card p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                <span className="font-medium">{question}</span>
                <Plus className="size-4 shrink-0 text-lp-primary transition-transform group-open:rotate-45" />
              </summary>
              <p className="mt-3 text-sm text-lp-muted-fg">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <FinalCTA />
    </V2Shell>
  );
}
