import type { ComponentType } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { V2Shell } from '@/components/V2Shell';
import { Accent, CtaButton, Reveal, SectionHeader } from '@/components/home/primitives';
import { TaglineReveal } from '@/components/home/TaglineReveal';
import { FinalCTA } from '@/components/home/FinalCTA';
import type { FactTable } from '@/lib/services/service-facts';
import { cn } from '@/utils';

// ── Config types ──

/** A Phosphor icon (design system SKILL B6). */
export type ServiceIcon = ComponentType<{
  className?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  'aria-hidden'?: boolean | 'true' | 'false';
}>;

export interface ServiceCapability {
  title: string;
  desc: string;
  icon: ServiceIcon;
}

export interface DfmRule {
  id: string;
  title: string;
  desc: string;
}

export interface ProcessStep {
  step: string;
  title: string;
  description: string;
  icon: ServiceIcon;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface ServicePageConfig {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroBadge: string;
  heroIcon: ServiceIcon;
  heroImage: string;
  heroStatus: string;
  heroStatusLabel: string;
  heroStats: { label: string; value: string; icon: ServiceIcon }[];
  capabilities: ServiceCapability[];
  expertCta: string;
  materialsTable: () => FactTable;
  exampleTable: () => FactTable;
  exampleTable2?: () => FactTable;
  orderMinimumInr: number | null;
  turnaroundTable: () => FactTable;
  costDrivers: string[];
  instantPricing: boolean;
  dfmTitle: string;
  dfmIntro: string;
  dfmRules: DfmRule[];
  dfmImage: string;
  processTitle: string;
  processSubtitle: string;
  processImage: string;
  processSteps: ProcessStep[];
  faq?: FaqItem[];
  footerTag: string;
  footerHeading: string;
  footerBadges: string[];
}

// ── Copy helpers ──
// The configs are shared with the quote engine, so the design system's copy rules
// (no hyphens between words, sentence case headings) are applied at render time.

/** "heat-affected zone" → "heat affected zone". Leaves number ranges and minus signs alone. */
const copy = (text: string) => text.replace(/(?<=\p{L})-(?=\p{L})/gu, ' ');

/** "Sheet Metal Cutting" → "Sheet metal cutting"; keeps acronyms like CNC, DFM, PEM®, CO₂. */
const sentence = (text: string) =>
  copy(text)
    .split(' ')
    .map((word, i) => {
      if (i === 0) return word.charAt(0).toUpperCase() + word.slice(1);
      const upper = (word.match(/\p{Lu}/gu) ?? []).length;
      return upper >= 2 || /\d/.test(word) ? word : word.toLowerCase();
    })
    .join(' ');

/** Same as `sentence`, for words that continue a sentence: "Sheet Metal" → "sheet metal", "CNC Machining" → "CNC machining". */
const midSentence = (text: string) => sentence(`x ${text}`).slice(2);

// ── Table renderer ──

function DataTable({ table }: { table: FactTable }) {
  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-lp-border bg-lp-bg">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-lp-border bg-lp-muted">
              {table.columns.map((c, i) => (
                <th key={i} scope="col" className="caption-3 whitespace-nowrap px-4 py-3 text-lp-muted-fg">
                  {sentence(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r, i) => (
              <tr key={i} className="border-b border-lp-border last:border-0">
                {r.cells.map((c, j) => (
                  <td key={j} className={cn('body-6 whitespace-nowrap px-4 py-3', j === 0 ? 'body-5' : 'lp-num')}>
                    {j === 0 ? (
                      <span className="flex items-center gap-2">
                        {c}
                        <span
                          className={cn(
                            'caption-3 rounded-full px-2 py-0.5',
                            r.instant ? 'bg-lp-primary/10 text-lp-primary' : 'bg-lp-muted text-lp-muted-fg'
                          )}
                        >
                          {r.instant ? 'Instant' : 'Engineer'}
                        </span>
                      </span>
                    ) : (
                      c
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.caption && <p className="caption-2 mt-3 text-lp-muted-fg">{copy(table.caption)}</p>}
    </div>
  );
}

// ── Main template ──

export function ServicePageTemplate({ config }: { config: ServicePageConfig }) {
  const c = config;
  const name = sentence(c.heroSubtitle);
  const ctaLabel = c.instantPricing ? 'Get an instant quote' : 'Get a quote from an engineer';

  const faqSchema = c.faq?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: c.faq.map(({ q, a }) => ({
          '@type': 'Question',
          name: copy(q),
          acceptedAnswer: { '@type': 'Answer', text: copy(a) },
        })),
      }
    : null;

  return (
    <V2Shell>
      {/* ── Hero ── */}
      <section aria-labelledby="service-hero-heading" className="px-4 pb-16 pt-8 md:pb-24 md:pt-16">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div className="max-w-[680px]">
            <nav aria-label="Breadcrumb" className="caption-1 lp-hero-in text-lp-muted-fg">
              <Link href="/services" className="rounded transition-colors duration-300 ease-lp hover:text-lp-primary">
                Services
              </Link>
              <span aria-hidden="true"> / </span>
              <span aria-current="page">{name}</span>
            </nav>
            <h1 id="service-hero-heading" className="heading-1 lp-hero-heading lp-hero-in mt-4" style={{ animationDelay: '60ms' }}>
              {sentence(c.heroTitle)} <Accent>{midSentence(c.heroSubtitle)}</Accent>
            </h1>
            <p className="body-3 lp-hero-in mt-6 text-lp-muted-fg" style={{ animationDelay: '120ms' }}>
              {copy(c.heroDescription)}
            </p>
            <div className="lp-hero-in mt-8" style={{ animationDelay: '180ms' }}>
              <CtaButton>{ctaLabel}</CtaButton>
            </div>
            <dl className="lp-hero-in mt-8 flex flex-wrap gap-x-8 gap-y-4" style={{ animationDelay: '240ms' }}>
              {c.heroStats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon aria-hidden="true" className="size-5 text-lp-primary" weight="bold" />
                  <div>
                    <dt className="caption-4 text-lp-muted-fg">{sentence(label)}</dt>
                    <dd className="title-4 lp-num">{copy(value)}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
          <div className="lp-hero-in relative aspect-square overflow-hidden rounded-3xl bg-lp-muted" style={{ animationDelay: '200ms' }}>
            <Image
              src={c.heroImage}
              alt={`${name} at MechHub`}
              fill
              priority
              sizes="(min-width: 1200px) 544px, (min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── Capabilities ── */}
      <section aria-labelledby="capabilities-heading" className="bg-lp-muted px-4 py-16 md:py-24">
        <div className="mx-auto max-w-[1200px]">
          <SectionHeader id="capabilities-heading" kicker={sentence(c.heroBadge)} title="What we can do" />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {c.capabilities.map((cap, i) => (
              <Reveal as="article" key={cap.title} delay={i * 80} className="rounded-2xl border border-lp-border bg-lp-bg p-6">
                <cap.icon aria-hidden="true" className="size-6 text-lp-primary" weight="duotone" />
                <h3 className="heading-6 mt-6">{sentence(cap.title)}</h3>
                <p className="body-6 mt-2 text-lp-muted-fg">{copy(cap.desc)}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl bg-lp-ink p-6 text-lp-ink-fg md:flex-row md:items-center">
            <p className="body-6 max-w-[680px] text-lp-ink-fg/80">{copy(c.expertCta)}</p>
            <CtaButton href="/contact" variant="inverted">
              Talk to an engineer
            </CtaButton>
          </Reveal>
        </div>
      </section>

      {/* ── Materials ── */}
      <section aria-labelledby="materials-heading" className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-[1200px]">
          <SectionHeader
            id="materials-heading"
            kicker="Materials"
            title="Materials in stock"
            lead="Every material below is stocked and ready to run. Grades, thicknesses and finishes come straight from our inventory system."
          />
          <Reveal className="mt-12">
            <DataTable table={c.materialsTable()} />
          </Reveal>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section aria-labelledby="pricing-heading" className="bg-lp-muted px-4 py-16 md:py-24">
        <div className="mx-auto max-w-[1200px]">
          <SectionHeader
            id="pricing-heading"
            kicker="Pricing"
            title="Know what you pay"
            lead={
              c.instantPricing
                ? 'Upload your file and get an instant price. Here is what goes into it.'
                : 'This service is quoted by our engineers. Here is what drives the price.'
            }
          />

          <ol className="mt-12 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {c.costDrivers.map((d, i) => (
              <Reveal as="li" key={d} delay={(i % 3) * 60} className="flex items-center gap-3 rounded-xl border border-lp-border bg-lp-bg px-4 py-3">
                <span className="caption-3 lp-num text-lp-primary">{String(i + 1).padStart(2, '0')}</span>
                <span className="body-6">{copy(d)}</span>
              </Reveal>
            ))}
          </ol>

          <Reveal className="mt-12 space-y-8">
            <h3 className="heading-6">Example prices</h3>
            <DataTable table={c.exampleTable()} />
            {c.exampleTable2 && <DataTable table={c.exampleTable2()} />}
          </Reveal>

          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            <Reveal className="rounded-2xl border border-lp-border bg-lp-bg p-6">
              <h3 className="heading-6">Order minimum</h3>
              <p className="body-6 mt-2 text-lp-muted-fg">
                {c.orderMinimumInr !== null ? (
                  <>
                    You can order a single part. The minimum order value is{' '}
                    <span className="body-4 lp-num text-lp-fg">₹{c.orderMinimumInr.toLocaleString('en-IN')}</span> per
                    line item, and rush orders multiply it. Volume pricing lowers the cost per part automatically.
                  </>
                ) : (
                  'This operation is bundled with your cutting or machining order, so there is no separate minimum.'
                )}
              </p>
            </Reveal>
            <Reveal delay={80} className="space-y-4">
              <h3 className="heading-6">Turnaround</h3>
              <DataTable table={c.turnaroundTable()} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Design guidelines ── */}
      <section aria-labelledby="dfm-heading" className="bg-lp-ink px-4 py-16 text-lp-ink-fg md:py-24">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeader
              inverted
              id="dfm-heading"
              kicker="Design guidelines"
              title={`Design for ${sentence(c.dfmTitle).toLowerCase()}`}
              lead={copy(c.dfmIntro)}
            />
            <ul className="mt-8 space-y-2">
              {c.dfmRules.map((rule, i) => (
                <Reveal as="li" key={rule.id} delay={i * 80} className="flex gap-4 rounded-2xl border border-lp-ink-fg/10 p-4">
                  <span className="title-3 lp-num flex size-8 shrink-0 items-center justify-center rounded-full bg-lp-ink-fg/10 text-lp-ink-fg">
                    {rule.id}
                  </span>
                  <div>
                    <h3 className="title-3">{sentence(rule.title)}</h3>
                    <p className="body-6 mt-1 text-lp-ink-fg/70">{copy(rule.desc)}</p>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
          <Reveal className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Image
              src={c.dfmImage}
              alt={`A part designed for ${sentence(c.dfmTitle).toLowerCase()}`}
              fill
              sizes="(min-width: 1200px) 576px, (min-width: 1024px) 48vw, 100vw"
              className="object-cover"
            />
          </Reveal>
        </div>
      </section>

      {/* ── Process ── */}
      <section aria-labelledby="process-heading" className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-[1200px]">
          <SectionHeader id="process-heading" kicker="How it works" title={sentence(`${c.processTitle} ${c.processSubtitle}`)} />
          <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {c.processSteps.map((item, idx) => (
              <Reveal as="li" key={item.step} delay={idx * 80} className="rounded-2xl border border-lp-border bg-lp-card p-6">
                <div className="flex items-center justify-between">
                  <span className="caption-3 lp-num text-lp-primary">Step {Number(item.step)}</span>
                  <item.icon aria-hidden="true" className="size-5 text-lp-muted-fg" />
                </div>
                <h3 className="heading-6 mt-6">{sentence(item.title)}</h3>
                <p className="body-6 mt-2 text-lp-muted-fg">{copy(item.description)}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <TaglineReveal lines={[`${name}, priced before you order.`, 'Made by vetted MechMasters and delivered across India.']} />

      {/* ── FAQ ── */}
      {c.faq && c.faq.length > 0 && (
        <section aria-labelledby="service-faq-heading" className="px-4 py-16 md:py-24">
          <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[1fr_1.4fr]">
            <SectionHeader id="service-faq-heading" kicker="FAQ" title="Technical questions" />
            <Reveal className="divide-y divide-lp-border border-y border-lp-border">
              {c.faq.map((item) => (
                <details key={item.q} className="lp-faq">
                  <summary className="title-2 flex cursor-pointer items-center justify-between gap-4 rounded py-4 transition-colors duration-300 ease-lp hover:text-lp-primary">
                    {copy(item.q)}
                    <Plus aria-hidden="true" className="lp-faq-icon size-4 shrink-0" weight="bold" />
                  </summary>
                  <p className="lp-faq-body body-6 max-w-[560px] pb-4 text-lp-muted-fg">{copy(item.a)}</p>
                </details>
              ))}
            </Reveal>
          </div>
        </section>
      )}

      <FinalCTA heading={copy(c.footerHeading)} cta={ctaLabel} badges={c.footerBadges.map(sentence)} />

      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
    </V2Shell>
  );
}
