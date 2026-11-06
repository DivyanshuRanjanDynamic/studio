import Link from 'next/link';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { FAQ } from './faq';
import { Accent, Reveal, SectionHeader } from './primitives';

/** Objection handling: plain question and answer pairs (also emitted as FAQPage schema). */
export function FAQSection() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-24 px-4 py-16 md:py-24">
      <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[1fr_1.4fr]">
        <SectionHeader
          id="faq-heading"
          kicker="FAQ"
          title={<>Questions before your <Accent>first order</Accent></>}
          lead={
            <>
              Something else on your mind?{' '}
              <Link href="/contact" className="text-lp-primary underline underline-offset-4 hover:opacity-80">
                Talk to an engineer
              </Link>
              .
            </>
          }
        />

        <Reveal className="divide-y divide-lp-border border-y border-lp-border">
          {FAQ.map((item) => (
            <details key={item.q} className="lp-faq group">
              <summary className="title-2 flex cursor-pointer items-center justify-between gap-4 rounded py-4 transition-colors duration-300 ease-lp hover:text-lp-primary">
                {item.q}
                <Plus aria-hidden="true" className="lp-faq-icon size-4 shrink-0" weight="bold" />
              </summary>
              <div className="lp-faq-body pb-4">
                <p className="body-6 max-w-[560px] text-lp-muted-fg">{item.a}</p>
                {item.link && (
                  <Link
                    href={item.link.href}
                    className="button-sm mt-2 inline-block text-lp-primary underline underline-offset-4 hover:opacity-80"
                  >
                    {item.link.label}
                  </Link>
                )}
              </div>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
