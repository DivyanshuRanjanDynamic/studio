import type { ReactNode } from 'react';
import { quoteShowcase } from '@/lib/services/service-facts';
import { Accent, CtaButton, Reveal, SectionHeader } from './primitives';
import { DeliveryScene, QuoteScene, UploadScene } from './scenes';

/** How it works: three steps, each shown with a mockup of the screen it happens on. */
export function HowItWorks() {
  const showcase = quoteShowcase();
  const steps: { title: string; body: string; scene: ReactNode }[] = [
    {
      title: 'Upload your design',
      body: 'Drop a STEP file into the NDA protected portal, then pick the process, material and thickness.',
      scene: <UploadScene />,
    },
    {
      title: 'Get an instant quote',
      body: 'The price updates as you choose, and drops per part as the quantity grows. The prices shown are live output from our quote engine.',
      scene: <QuoteScene showcase={showcase} />,
    },
    {
      title: 'Receive your parts',
      body: 'A vetted MechMaster makes them under NDA. Track every stage until they reach your door, in 72 hours on average.',
      scene: <DeliveryScene />,
    },
  ];

  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-24 px-4 py-16 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionHeader
            id="how-heading"
            kicker="How it works"
            title={
              <>
                Custom manufacturing <br className="hidden md:block" />
                made <Accent>easy</Accent>
              </>
            }
          />
          <Reveal className="md:pb-2">
            <CtaButton>Upload your design</CtaButton>
          </Reveal>
        </div>

        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 80} className="flex flex-col rounded-2xl border border-lp-border bg-lp-card p-1">
              <div className="relative">
                {step.scene}
                <span className="lp-mono absolute left-3 top-3 z-20 rounded bg-lp-bg px-2 py-1 text-lp-primary">Step 0{i + 1}</span>
              </div>
              <div className="p-4 md:p-6">
                <h3 className="heading-6">{step.title}</h3>
                <p className="body-6 mt-2 text-lp-muted-fg">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
        <p className="caption-5 mt-4 text-lp-muted-fg">
          Example quote: {showcase.part} in {showcase.material}, standard turnaround, price per part excluding GST. A single
          part carries the order minimum.
        </p>
      </div>
    </section>
  );
}
