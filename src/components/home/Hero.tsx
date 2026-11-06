import { Accent, CtaButton } from './primitives';
import { HeroParts } from './HeroParts';
import { WatchDemo } from './WatchDemo';

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden pb-12 pt-24 md:pb-16">
      <div className="mx-auto mt-8 max-w-[960px] px-4 text-center md:mt-12">
        <h1 id="hero-heading" className="heading-display lp-hero-heading lp-hero-in">
          Custom <Accent>CNC</Accent> parts, made <br className="hidden sm:block" />
          without chasing vendors
        </h1>
      </div>

      <div className="mt-2 md:mt-1">
        <HeroParts />
      </div>

      <div className="mx-auto mt-2 grid max-w-[1200px] grid-cols-2 items-end gap-x-4 gap-y-8 px-4 md:-mt-4 md:grid-cols-[1fr_auto_1fr]">
        <p className="lp-mono lp-hero-in order-2 text-lp-muted-fg md:order-1" style={{ animationDelay: '500ms' }}>
          72 hour average
          <br />
          turnaround across India
        </p>

        <div
          className="lp-hero-in order-1 col-span-2 flex flex-col items-center text-center md:order-2 md:col-span-1"
          style={{ animationDelay: '400ms' }}
        >
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <CtaButton>Upload your design</CtaButton>
            <WatchDemo />
          </div>
        </div>

        <p className="lp-mono lp-hero-in order-3 text-right text-lp-muted-fg" style={{ animationDelay: '500ms' }}>
          NDA on every file
          <br />
          No minimum quantity
        </p>
      </div>
    </section>
  );
}
