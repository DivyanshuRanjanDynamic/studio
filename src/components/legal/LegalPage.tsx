import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, EnvelopeSimple, MapPin, Phone } from '@phosphor-icons/react/dist/ssr';
import { V2Shell } from '@/components/V2Shell';
import { Reveal, Tag } from '@/components/home/primitives';
import { LEGAL } from '@/lib/legal';
import { cn } from '@/utils';

export type LegalSection = { id: string; title: string; body: ReactNode };

const POLICIES = [
  { href: '/privacy-policy', label: 'Privacy policy' },
  { href: '/terms-of-service', label: 'Terms of service' },
  { href: '/refund-policy', label: 'Refund policy' },
  { href: '/nda-policy', label: 'NDA policy' },
];

/** Shared layout for the four policy pages: summary, table of contents, numbered sections, contact. */
export function LegalPage({
  path,
  title,
  intro,
  summary,
  sections,
}: {
  path: string;
  title: ReactNode;
  intro: string;
  summary: string[];
  sections: LegalSection[];
}) {
  const toc = (
    <ol className="space-y-1">
      {sections.map((s, i) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            className="body-6 flex gap-3 rounded py-1 text-lp-muted-fg transition-colors duration-300 ease-lp hover:text-lp-primary"
          >
            <span className="lp-mono w-6 pt-0.5 text-lp-primary">{String(i + 1).padStart(2, '0')}</span>
            {s.title}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <V2Shell>
      <section aria-labelledby="legal-heading" className="px-4 pb-12 pt-8 md:pt-16">
        <div className="mx-auto max-w-[1200px]">
          <div className="lp-hero-in max-w-[680px]">
            <Tag>Legal</Tag>
            <h1 id="legal-heading" className="heading-1 lp-hero-heading mt-4">
              {title}
            </h1>
            <p className="body-3 mt-6 text-lp-muted-fg">{intro}</p>
            <p className="lp-mono mt-6 flex flex-wrap gap-x-6 gap-y-1 text-lp-muted-fg">
              <span>Effective {LEGAL.effective}</span>
              <span>Last updated {LEGAL.updated}</span>
            </p>
          </div>

          <Reveal className="lp-blueprint lp-marks mt-12 rounded-2xl p-6 text-lp-primary-fg md:p-8">
            <h2 className="lp-mono opacity-80">In short</h2>
            <ul className="mt-4 grid gap-x-8 gap-y-3 md:grid-cols-2">
              {summary.map((point) => (
                <li key={point} className="body-5 flex gap-3">
                  <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-lp-primary-fg" />
                  {point}
                </li>
              ))}
            </ul>
            <p className="caption-2 mt-6 text-lp-primary-fg/70">
              This summary is for convenience. The full text below is what applies.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="px-4 pb-16 md:pb-24">
        <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[280px_1fr] lg:gap-16">
          <aside aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
            <details className="lp-faq rounded-2xl border border-lp-border p-4 lg:hidden">
              <summary className="title-4 flex cursor-pointer items-center justify-between">On this page</summary>
              <div className="lp-faq-body mt-4">{toc}</div>
            </details>
            <div className="hidden lg:block">
              <p className="lp-mono text-lp-muted-fg">On this page</p>
              <div className="mt-4">{toc}</div>
            </div>
          </aside>

          <article className="min-w-0">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className={cn('scroll-mt-24', i > 0 && 'mt-12 border-t border-lp-border pt-12')}>
                <h2 id={`${s.id}-title`} className="heading-5 flex items-baseline gap-4">
                  <span className="lp-mono text-lp-primary">{String(i + 1).padStart(2, '0')}</span>
                  {s.title}
                </h2>
                <div className="lp-legal mt-4">{s.body}</div>
              </section>
            ))}

            <section aria-labelledby="legal-contact" className="mt-12 rounded-2xl border border-lp-border bg-lp-card p-6 md:p-8">
              <h2 id="legal-contact" className="heading-6">
                Questions about this policy?
              </h2>
              <p className="body-6 mt-2 text-lp-muted-fg">Write to us and we will get back to you.</p>
              <ul className="mt-6 grid gap-4 sm:grid-cols-3">
                <li className="flex items-start gap-3">
                  <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-lp-primary" />
                  <span className="body-6">
                    <span className="title-4 block">{LEGAL.entity}</span>
                    <span className="text-lp-muted-fg">{LEGAL.address}</span>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <EnvelopeSimple aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-lp-primary" />
                  <a href={`mailto:${LEGAL.email}`} className="body-5 rounded hover:text-lp-primary">
                    {LEGAL.email}
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Phone aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-lp-primary" />
                  <a href={`tel:${LEGAL.phone.replace(/\s/g, '')}`} className="body-5 rounded hover:text-lp-primary">
                    {LEGAL.phone}
                  </a>
                </li>
              </ul>
            </section>

            <nav aria-label="Other policies" className="mt-8">
              <p className="lp-mono text-lp-muted-fg">Other policies</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-3">
                {POLICIES.filter((p) => p.href !== path).map((p) => (
                  <li key={p.href}>
                    <Link
                      href={p.href}
                      className="lp-press group flex items-center justify-between rounded-xl border border-lp-border px-4 py-3 hover:border-lp-primary/40 hover:bg-lp-muted"
                    >
                      <span className="title-4">{p.label}</span>
                      <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-300 ease-lp group-hover:translate-x-1" weight="bold" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </article>
        </div>
      </div>
    </V2Shell>
  );
}
