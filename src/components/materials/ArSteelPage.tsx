import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Plus } from '@phosphor-icons/react/dist/ssr';
import { V2Shell } from '@/components/V2Shell';
import { FinalCTA } from '@/components/home/FinalCTA';
import { Accent, CtaButton, Reveal, SectionHeader } from '@/components/home/primitives';
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
  ['Send your file', 'Share a STEP file with the thickness, quantity and any secondary work you need.'],
  ['Get an engineer quote', 'An engineer checks plate availability and confirms price and lead time. Accept it or send a counter offer.'],
  ['Receive your parts', 'A verified MechMaster makes your parts under a full NDA contract. They are QC inspected and tracked to delivery.'],
];

const DESIGN_NOTES = [
  ['Cut profiles and holes by laser', 'Hard plate wears out drills and taps, so cut as much of the geometry as you can in one operation.'],
  ['Flag any bends early', 'Hardened plate resists forming and needs generous bend radii. Tell us before you finalise the design.'],
  ['Mention heat exposure', 'High heat softens the plate. Let us know about welding or hot service so we can review it.'],
];

const sentence = (t: string) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();

export function ArSteelPage({ grade, hardness, image, intro, uses, choose, compare }: ArSteelGrade) {
  const specs = [
    ['Material', `${grade} abrasion resistant steel plate`],
    ['Nominal hardness', hardness],
    ['Process', 'Laser cutting'],
    ['Tolerance', '± 0.1 mm on metals up to 6 mm. Thicker plate is confirmed with your quote.'],
    ['Thickness', 'Confirmed at quote against available plate'],
    ['Files', 'STEP'],
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
      `Not yet. ${grade} is not in the instant quote engine, so an engineer prices it from your file and requirements. You can accept the quote or send a counter offer.`,
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
      <section aria-labelledby="grade-heading" className="px-4 pb-16 pt-8 md:pb-24 md:pt-16">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2">
          <div className="max-w-[680px]">
            <nav aria-label="Breadcrumb" className="caption-1 lp-hero-in text-lp-muted-fg">
              <Link href="/materials" className="rounded transition-colors duration-300 ease-lp hover:text-lp-primary">
                Materials
              </Link>
              <span aria-hidden="true"> / </span>
              <span aria-current="page">{grade}</span>
            </nav>
            <h1 id="grade-heading" className="heading-1 lp-hero-heading lp-hero-in mt-4" style={{ animationDelay: '60ms' }}>
              {grade} steel plate, <Accent>laser cut</Accent> to your drawing
            </h1>
            <p className="body-3 lp-hero-in mt-6 text-lp-muted-fg" style={{ animationDelay: '120ms' }}>
              {intro}
            </p>
            <div className="lp-hero-in mt-8" style={{ animationDelay: '180ms' }}>
              <CtaButton href="/contact">Get a quote from an engineer</CtaButton>
            </div>
          </div>
          <div className="lp-hero-in relative aspect-square max-h-[520px] w-full" style={{ animationDelay: '200ms' }}>
            <Image
              src={image}
              alt={`Laser cut ${grade} steel part`}
              fill
              priority
              sizes="(min-width: 1024px) 520px, 100vw"
              className="object-contain drop-shadow-xl"
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="specs-heading" className="bg-lp-muted px-4 py-16 md:py-24">
        <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[1fr_1.3fr]">
          <SectionHeader id="specs-heading" kicker="Specifications" title={`${grade} at MechHub`} />
          <Reveal className="rounded-2xl border border-lp-border bg-lp-bg px-6">
            <dl>
              {specs.map(([label, value]) => (
                <div key={label} className="grid gap-1 border-b border-lp-border py-4 last:border-0 sm:grid-cols-[180px_1fr] sm:gap-4">
                  <dt className="caption-1 text-lp-muted-fg">{label}</dt>
                  <dd className="body-5">{value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="quote-process-heading" className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-[1200px]">
          <SectionHeader id="quote-process-heading" kicker="How it works" title="How we quote it" />
          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {PROCESS.map(([title, body], i) => (
              <Reveal as="li" key={title} delay={i * 80} className="rounded-2xl border border-lp-border bg-lp-card p-6">
                <span className="caption-3 lp-num text-lp-primary">Step {i + 1}</span>
                <h3 className="heading-6 mt-6">{title}</h3>
                <p className="body-6 mt-2 text-lp-muted-fg">{body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="use-heading" className="bg-lp-ink px-4 py-16 text-lp-ink-fg md:py-24">
        <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-2">
          <div>
            <SectionHeader inverted id="use-heading" kicker="When to use it" title={choose} />
            <Reveal>
              <ul className="mt-8 flex flex-wrap gap-2">
                {uses.map((use) => (
                  <li key={use} className="caption-4 rounded-full border border-lp-ink-fg/20 px-2 py-1">
                    {sentence(use)}
                  </li>
                ))}
              </ul>
              <Link
                href={compare.href}
                className="lp-press group mt-8 flex items-center justify-between gap-4 rounded-2xl border border-lp-ink-fg/15 p-4 hover:bg-lp-ink-fg/5"
              >
                <span>
                  <span className="title-2 block">Compare {compare.grade}</span>
                  <span className="body-6 text-lp-ink-fg/70">{compare.note}</span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="size-5 shrink-0 transition-transform duration-300 ease-lp group-hover:translate-x-1"
                  weight="bold"
                />
              </Link>
            </Reveal>
          </div>
          <Reveal className="space-y-2">
            <h2 className="heading-5">Design notes</h2>
            {DESIGN_NOTES.map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-lp-ink-fg/10 p-4">
                <h3 className="title-3">{title}</h3>
                <p className="body-6 mt-1 text-lp-ink-fg/70">{body}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="grade-faq-heading" className="px-4 py-16 md:py-24">
        <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeader id="grade-faq-heading" kicker="FAQ" title={`${grade} questions`} />
          <Reveal className="divide-y divide-lp-border border-y border-lp-border">
            {faqs.map(([question, answer]) => (
              <details key={question} className="lp-faq">
                <summary className="title-2 flex cursor-pointer items-center justify-between gap-4 rounded py-4 transition-colors duration-300 ease-lp hover:text-lp-primary">
                  {question}
                  <Plus aria-hidden="true" className="lp-faq-icon size-4 shrink-0" weight="bold" />
                </summary>
                <p className="lp-faq-body body-6 max-w-[560px] pb-4 text-lp-muted-fg">{answer}</p>
              </details>
            ))}
          </Reveal>
        </div>
      </section>

      <FinalCTA
        heading={`Ready to quote your ${grade} parts?`}
        lead="Send your file and an engineer confirms plate, price and lead time."
        cta="Get a quote from an engineer"
        href="/contact"
      />
    </V2Shell>
  );
}
